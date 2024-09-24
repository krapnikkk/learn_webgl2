

const SCR_WIDTH = 800;
const SCR_HEIGHT = 600;

let deltaTime = 0.0;	// time between current frame and last frame
let lastFrame = 0.0;
let isFirstMouse = true;
let lastX = SCR_WIDTH / 2, lastY = SCR_HEIGHT / 2;

let lightVolumes = {
    "debug": false,
    "radius": 2.0,
};

async function main() {
    let stats = new Stats();
    document.body.appendChild(stats.dom);

    const gl = document.getElementById("canvas").getContext("webgl2",{
        antialias: false
    });
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    gl.enable(gl.DEPTH_TEST);

    let cameraPos = glMatrix.vec3.fromValues(0.0, 2.0, 10.0);
    // let up = glMatrix.vec3.fromValues(0, 1, 0)
    let camera = new Camera(cameraPos);
    let cameraController = new CameraController(gl, camera);

    // build and compile shaders
    // -------------------------
    let shaderGeometryPass = new Shader(gl, "g_buffer.vs", "g_buffer.fs");
    await shaderGeometryPass.initialize();
    let shaderLightingPass = new Shader(gl, "deferred_shading.vs", "deferred_shading.fs");
    await shaderLightingPass.initialize();
    let shaderLightBox = new Shader(gl, "deferred_light_box.vs", "deferred_light_box.fs");
    await shaderLightBox.initialize();

    let obj = new Model(gl, '../../resources/objects/nanosuit');
    await obj.loadScene("scene.json")

    let objectPositions = [
        glMatrix.vec3.fromValues(-3.0, -0.5, -3.0),
        glMatrix.vec3.fromValues(0.0, -0.5, -3.0),
        glMatrix.vec3.fromValues(3.0, -0.5, -3.0),
        glMatrix.vec3.fromValues(-3.0, -0.5, 0.0),
        glMatrix.vec3.fromValues(0.0, -0.5, 0.0),
        glMatrix.vec3.fromValues(3.0, -0.5, 0.0),
        glMatrix.vec3.fromValues(-3.0, -0.5, 3.0),
        glMatrix.vec3.fromValues(0.0, -0.5, 3.0),
        glMatrix.vec3.fromValues(3.0, -0.5, 3.0)
    ]

    const gBuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, gBuffer);
    gl.getExtension("EXT_color_buffer_half_float");

    // position color buffer
    const gPosition = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, gPosition);

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, SCR_WIDTH, SCR_HEIGHT, 0, gl.RGBA, gl.FLOAT, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, gPosition, 0);

    // normal color buffer
    const gNormal = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, gNormal);

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, SCR_WIDTH, SCR_HEIGHT, 0, gl.RGBA, gl.FLOAT, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT1, gl.TEXTURE_2D, gNormal, 0);

    // color + specular color buffer
    const gAlbedoSpec = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, gAlbedoSpec);

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, SCR_WIDTH, SCR_HEIGHT, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT2, gl.TEXTURE_2D, gAlbedoSpec, 0);

    // tell OpenGL which color attachments we'll use (of this framebuffer) for rendering 
    let attachments = [
        gl.COLOR_ATTACHMENT0,
        gl.COLOR_ATTACHMENT1,
        gl.COLOR_ATTACHMENT2,
    ];

    gl.drawBuffers(attachments);

    // Create depth buffer (renderbuffer)
    const rboDepth = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, rboDepth);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH24_STENCIL8, SCR_WIDTH, SCR_HEIGHT);

    // Attach buffers
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, rboDepth);

    let bufferStatus = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    if (bufferStatus != gl.FRAMEBUFFER_COMPLETE) {
        console.log("Framebuffer not complete!");
    }

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    // Lighting info
    const lightPositions = [], lightColors = [];
    for (let i = 0; i < 32; i++) {
        let xPos = Math.random() * 6.0 - 3.0;
        let yPos = Math.random() * 6.0 - 4.0;
        let zPos = Math.random() * 6.0 - 3.0;
        lightPositions.push(glMatrix.vec3.fromValues(xPos, yPos, zPos));
        let rColor = Math.random()* 10 + 0.5;
        let gColor = Math.random()* 10 + 0.5;
        let bColor = Math.random()* 10 + 0.5;
        lightColors.push(glMatrix.vec3.fromValues(rColor, gColor, bColor));
    }

    shaderLightingPass.use();
    shaderLightingPass.setInt("gPosition", 0);
    shaderLightingPass.setInt("gNormal", 1);
    shaderLightingPass.setInt("gAlbedoSpec", 2);

    let projection = glMatrix.mat4.identity(glMatrix.mat4.create());
    glMatrix.mat4.perspective(projection, glMatrix.glMatrix.toRadian(camera.zoom), gl.drawingBufferWidth / gl.drawingBufferHeight, 0.1, 100)
    function render(time) {
        let currentFrame = Math.round(time) / 1000;
        deltaTime = Math.floor(currentFrame * 1000 - lastFrame * 1000) / 1000;
        lastFrame = currentFrame;
        cameraController.update();

        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // 1. geometry pass: render scene's geometry/color data into gbuffer
        gl.bindFramebuffer(gl.FRAMEBUFFER, gBuffer);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        let model = glMatrix.mat4.identity(glMatrix.mat4.create());
        let view = camera.getViewMatrix();

        shaderGeometryPass.use();
        shaderGeometryPass.setMat4("projection", projection);
        shaderGeometryPass.setMat4("view", view);

        for (let i = 0; i < objectPositions.length; i++) {
            model = glMatrix.mat4.identity(glMatrix.mat4.create());
            glMatrix.mat4.translate(model, model, objectPositions[i]);
            glMatrix.mat4.scale(model, model, glMatrix.vec3.fromValues(0.25, 0.25, 0.25));
            shaderGeometryPass.setMat4("model", model);
            obj.draw(shaderGeometryPass);
        }
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        // 2. lighting pass: calculate lighting by iterating over a screen filled quad pixel-by-pixel using the gbuffer's content.
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        shaderLightingPass.use();
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, gPosition);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, gNormal);
        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, gAlbedoSpec);

        
        for (let i = 0; i < lightPositions.length; i++) {
            shaderLightingPass.setVec3(`lights[${i}].Position`, lightPositions[i]);
            shaderLightingPass.setVec3(`lights[${i}].Color`, lightColors[i]);
            // update attenuation parameters and calculate radius
            /* 如果我们计算场景中每个光源的贡献，而不管它们与片段的距离如何。
			    这些光源中有很大一部分永远不会到达片段，那么会浪费所有这些光照计算

			    light volumes光体积: 
					背后的想法是计算光源的半径或体积，即其光线能够到达碎片的区域。
					由于大多数光源使用某种形式的衰减，
					我们可以使用它来计算它们的光能够到达的最大距离或半径。
					然后，我们只在片段位于这些光体积中的一个或多个内时才进行昂贵的光照计算。
					这可以为我们节省大量的计算，
					因为我们现在只计算必要的光照。

					诀窍主要是弄清楚光源的光体积的大小或半径 
					--- 点光源衰减函数  Attenuation = 1 / (Kc + Kl * d + Kq * d^2)

					--- Attenuation 不可能为0 因为Kc=1  --改为 求解接近 0.0 但仍被认为是暗的亮度值

					--- 8 位帧缓冲区,每个组件最大强度为256, 所以可以考虑 这个暗的亮度值为 5/256 计算半径
					     5/256 = Imax / Attenuation , Imax是光源颜色

					--- 点光源衰减函数, 在其可见范围内大多是暗的。
					     如果我们将其限制为比 5/256 更暗的亮度，则光体积(light volume)会变得太大，因此效果会降低。 
						 只要用户看不到光源在其体积边界处突然中断，我们就可以了。
						 较高的亮度阈值会导致较小的 光体积(light volume)，从而提高效率，
						 但会产生明显的伪影artifacts ，其中照明似乎在体积的边界处中断。
	
				可上线的方案是：
					将执行 FS 的像素数限制为仅我们真正感兴趣的像素数
					a. 不画quad，而是以光源为中心缩放一个球体, 并开启背面剔除(避免计算两次光照)
					    使用具有少量多边形的非常粗糙的球体模型，并简单地以光源为中心进行渲染
					b. 通过计算从光的角度覆盖该球体的最小边界四边形来更进一步。
					    渲染这个四边形甚至更轻，因为只有两个三角形。
			*/ 
            // const constant = 1.0;
            const constant = 1.0;
            const linear = 0.7;
            const quadratic = 1.8;
            shaderLightingPass.setFloat(`lights[${i}].Linear`, linear);
            shaderLightingPass.setFloat(`lights[${i}].Quadratic`, quadratic);
            if(lightVolumes.debug){
                shaderLightingPass.setFloat(`lights[${i}].Radius`, lightVolumes.radius);
            }else{
                const maxBrightness = Math.max(Math.max(lightColors[i][0], lightColors[i][1]), lightColors[i][2]);
                let radius = (-linear + Math.sqrt(linear * linear - 4 * quadratic * (constant - (256.0 / 5.0) * maxBrightness))) / (2.0 * quadratic);
                shaderLightingPass.setFloat(`lights[${i}].Radius`, radius);
            }

        }
        shaderLightingPass.setVec3("viewPos", camera.position);
        // finally render quad
        renderQuad();

        gl.clear(gl.DEPTH_BUFFER_BIT);

        // 2.5. copy content of geometry's depth buffer to default framebuffer's depth buffer
        // ----------------------------------------------------------------------------------
        gl.bindFramebuffer(gl.READ_FRAMEBUFFER, gBuffer);
        gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null); // write to default framebuffer
        // blit to default framebuffer. Note that this may or may not work as the internal formats of both the FBO and default framebuffer have to match.
        // the internal formats are implementation defined. This works on all of my systems, but if it doesn't on yours you'll likely have to write to the 		
        // depth buffer in another shader stage (or somehow see to match the default framebuffer's internal format with the FBO's internal format).
        gl.blitFramebuffer(0, 0, SCR_WIDTH, SCR_HEIGHT, 0, 0, SCR_WIDTH, SCR_HEIGHT, gl.DEPTH_BUFFER_BIT, gl.NEAREST);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        // 3. render lights on top of scene
        // --------------------------------
        shaderLightBox.use();
        shaderLightBox.setMat4("projection", projection);
        shaderLightBox.setMat4("view", view);
        for (let i = 0; i < lightPositions.length; i++)
        {
            model = glMatrix.mat4.identity(glMatrix.mat4.create());
            glMatrix.mat4.translate(model, model, lightPositions[i]);
            glMatrix.mat4.scale(model, model, glMatrix.vec3.fromValues(0.125, 0.125, 0.125));
            shaderLightBox.setMat4("model", model);
            shaderLightBox.setVec3("lightColor", lightColors[i]);
            renderCube();
        }

        stats.update();
        requestAnimationFrame(render);
    }

    requestAnimationFrame(render);
    addGUI();
    function addGUI() {
        const GUI = new dat.GUI({ name: "lightVolumes" });
        const folder = GUI.addFolder('Settings');
        folder.add(lightVolumes, "debug").name("debug");
        folder.add(lightVolumes, "radius", 1.0, 10.0).name("radius");
    }

    // renderQuad() renders a 1x1 XY quad in NDC
    // -----------------------------------------
    let quadVAO, quadVBO;
    function renderQuad() {
        if (!quadVAO) {
            let quadVertices = new Float32Array([
                // positions        // texture Coords
                - 1.0, 1.0, 0.0, 0.0, 1.0,
                -1.0, -1.0, 0.0, 0.0, 0.0,
                1.0, 1.0, 0.0, 1.0, 1.0,
                1.0, -1.0, 0.0, 1.0, 0.0,
            ]);
            // setup plane VAO
            quadVAO = gl.createVertexArray();
            quadVBO = gl.createBuffer();
            gl.bindVertexArray(quadVAO);
            gl.bindBuffer(gl.ARRAY_BUFFER, quadVBO);
            gl.bufferData(gl.ARRAY_BUFFER, quadVertices, gl.STATIC_DRAW);
            gl.enableVertexAttribArray(0);
            gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 5 * quadVertices.BYTES_PER_ELEMENT, 0);
            gl.enableVertexAttribArray(1);
            gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 5 * quadVertices.BYTES_PER_ELEMENT, 3 * quadVertices.BYTES_PER_ELEMENT);
        }
        gl.bindVertexArray(quadVAO);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        gl.bindVertexArray(null);
    }

    // renderCube() renders a 1x1 3D cube in NDC.
    // -------------------------------------------------
    let cubeVAO, cubeVBO;
    function renderCube() {
        // initialize (if necessary)
        if (!cubeVAO) {
            let vertices = new Float32Array([
                // back face
                -1.0, -1.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, // bottom-left
                1.0, 1.0, -1.0, 0.0, 0.0, -1.0, 1.0, 1.0, // top-right
                1.0, -1.0, -1.0, 0.0, 0.0, -1.0, 1.0, 0.0, // bottom-right         
                1.0, 1.0, -1.0, 0.0, 0.0, -1.0, 1.0, 1.0, // top-right
                -1.0, -1.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, // bottom-left
                -1.0, 1.0, -1.0, 0.0, 0.0, -1.0, 0.0, 1.0, // top-left
                // front face
                -1.0, -1.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, // bottom-left
                1.0, -1.0, 1.0, 0.0, 0.0, 1.0, 1.0, 0.0, // bottom-right
                1.0, 1.0, 1.0, 0.0, 0.0, 1.0, 1.0, 1.0, // top-right
                1.0, 1.0, 1.0, 0.0, 0.0, 1.0, 1.0, 1.0, // top-right
                -1.0, 1.0, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0, // top-left
                -1.0, -1.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, // bottom-left
                // left face
                -1.0, 1.0, 1.0, -1.0, 0.0, 0.0, 1.0, 0.0, // top-right
                -1.0, 1.0, -1.0, -1.0, 0.0, 0.0, 1.0, 1.0, // top-left
                -1.0, -1.0, -1.0, -1.0, 0.0, 0.0, 0.0, 1.0, // bottom-left
                -1.0, -1.0, -1.0, -1.0, 0.0, 0.0, 0.0, 1.0, // bottom-left
                -1.0, -1.0, 1.0, -1.0, 0.0, 0.0, 0.0, 0.0, // bottom-right
                -1.0, 1.0, 1.0, -1.0, 0.0, 0.0, 1.0, 0.0, // top-right
                // right face
                1.0, 1.0, 1.0, 1.0, 0.0, 0.0, 1.0, 0.0, // top-left
                1.0, -1.0, -1.0, 1.0, 0.0, 0.0, 0.0, 1.0, // bottom-right
                1.0, 1.0, -1.0, 1.0, 0.0, 0.0, 1.0, 1.0, // top-right         
                1.0, -1.0, -1.0, 1.0, 0.0, 0.0, 0.0, 1.0, // bottom-right
                1.0, 1.0, 1.0, 1.0, 0.0, 0.0, 1.0, 0.0, // top-left
                1.0, -1.0, 1.0, 1.0, 0.0, 0.0, 0.0, 0.0, // bottom-left     
                // bottom face
                -1.0, -1.0, -1.0, 0.0, -1.0, 0.0, 0.0, 1.0, // top-right
                1.0, -1.0, -1.0, 0.0, -1.0, 0.0, 1.0, 1.0, // top-left
                1.0, -1.0, 1.0, 0.0, -1.0, 0.0, 1.0, 0.0, // bottom-left
                1.0, -1.0, 1.0, 0.0, -1.0, 0.0, 1.0, 0.0, // bottom-left
                -1.0, -1.0, 1.0, 0.0, -1.0, 0.0, 0.0, 0.0, // bottom-right
                -1.0, -1.0, -1.0, 0.0, -1.0, 0.0, 0.0, 1.0, // top-right
                // top face
                -1.0, 1.0, -1.0, 0.0, 1.0, 0.0, 0.0, 1.0, // top-left
                1.0, 1.0, 1.0, 0.0, 1.0, 0.0, 1.0, 0.0, // bottom-right
                1.0, 1.0, -1.0, 0.0, 1.0, 0.0, 1.0, 1.0, // top-right     
                1.0, 1.0, 1.0, 0.0, 1.0, 0.0, 1.0, 0.0, // bottom-right
                -1.0, 1.0, -1.0, 0.0, 1.0, 0.0, 0.0, 1.0, // top-left
                -1.0, 1.0, 1.0, 0.0, 1.0, 0.0, 0.0, 0.0  // bottom-left        
            ]);
            cubeVAO = gl.createVertexArray();
            cubeVBO = gl.createBuffer();
            // fill buffer
            gl.bindBuffer(gl.ARRAY_BUFFER, cubeVBO);
            gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
            // link vertex attributes
            gl.bindVertexArray(cubeVAO);
            gl.enableVertexAttribArray(0);
            gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 8 * vertices.BYTES_PER_ELEMENT, 0);
            gl.enableVertexAttribArray(1);
            gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 8 * vertices.BYTES_PER_ELEMENT, 3 * vertices.BYTES_PER_ELEMENT);
            gl.enableVertexAttribArray(2);
            gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 8 * vertices.BYTES_PER_ELEMENT, 6 * vertices.BYTES_PER_ELEMENT);
            gl.bindBuffer(gl.ARRAY_BUFFER, null);
            gl.bindVertexArray(null);
        }
        // render Cube
        gl.bindVertexArray(cubeVAO);
        gl.drawArrays(gl.TRIANGLES, 0, 36);
        gl.bindVertexArray(null);
    }


    // let moveLock = true;
    document.onkeydown = (e) => {
        camera.onKeydown(e.code, deltaTime);
    }

}

async function loadTexture(gl, url, gammaCorrection = false) {
    return new Promise(async (resolve, reject) => {
        let image = await IJS.Image.load(url);
        let { width, height, data, channels } = image;
        if (data) {
            let format;
            if (channels == 1)
                format = gl.RED;
            else if (channels == 3)
                format = gl.RGB;
            else if (channels == 4)
                format = gl.RGBA;
            let texture = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, format, width, height, 0, format, gl.UNSIGNED_BYTE, data);
            gl.generateMipmap(gl.TEXTURE_2D);


            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
            resolve(texture);
        } else {
            reject()
            console.warn("Texture failed to load at path: " + url);
        }

    })
}

