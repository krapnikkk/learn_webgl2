

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

function ourLerp(start, end, t) {
    return start + (end - start) * t;
}

async function main() {
    let stats = new Stats();
    document.body.appendChild(stats.dom);

    const gl = document.getElementById("canvas").getContext("webgl2", {
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
    let geometryPassShader = new Shader(gl, "geometry.vs", "geometry.fs");
    await geometryPassShader.initialize();
    let lightingPassShader = new Shader(gl, "vertex.vs", "lighting.fs");
    await lightingPassShader.initialize();
    let SSAOShader = new Shader(gl, "vertex.vs", "ssao.fs");
    await SSAOShader.initialize();
    let BlurShader = new Shader(gl, "vertex.vs", "blur.fs");
    await BlurShader.initialize();

    let obj = new Model(gl, '../../resources/objects/nanosuit');
    await obj.loadScene("scene.json")

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
    const gAlbedo = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, gAlbedo);

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, SCR_WIDTH, SCR_HEIGHT, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT2, gl.TEXTURE_2D, gAlbedo, 0);

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

    // also create framebuffer to hold SSAO processing stage 
    const SSAOFBO = gl.createFramebuffer(), blurFBO = gl.createFramebuffer();
    // SSAO color buffer
    gl.bindFramebuffer(gl.FRAMEBUFFER, SSAOFBO);
    const ssaoColorBuffer = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, ssaoColorBuffer);

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, SCR_WIDTH, SCR_HEIGHT, 0, gl.RGBA, gl.FLOAT, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, ssaoColorBuffer, 0);

    // and blur stage
    gl.bindFramebuffer(gl.FRAMEBUFFER, blurFBO);
    const ssaoBlurColorBuffer = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, ssaoColorBuffer);

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, SCR_WIDTH, SCR_HEIGHT, 0, gl.RGBA, gl.FLOAT, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, ssaoBlurColorBuffer, 0);

    bufferStatus = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    if (bufferStatus != gl.FRAMEBUFFER_COMPLETE) {
        console.log("Framebuffer not complete!");
    }

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    // generate sample kernel
    let ssaoKernel = [];
    for (let i = 0; i < 64; ++i) {
        let sample = glMatrix.vec3.fromValues(Math.random() * 2.0 - 1.0, Math.random() * 2.0 - 1.0, Math.random());
        glMatrix.vec3.normalize(sample, sample);
        let rnd = Math.random();
        glMatrix.vec3.multiply(sample,sample,glMatrix.vec3.fromValues(rnd,rnd,rnd))
        let scale = i / 64.0;

        // scale samples s.t. they're more aligned to center of kernel
        scale = ourLerp(0.1, 1.0, scale * scale);
        glMatrix.vec3.multiply(sample,sample,glMatrix.vec3.fromValues(scale,scale,scale))
        // sample *= scale;
        debugger
        ssaoKernel.push(sample);
    }

    // generate noise texture
    // ----------------------
    let ssaoNoise = [];
    for (let i = 0; i < 16; i++) {
        let noise = glMatrix.vec3.fromValues(Math.random() * 2.0 - 1.0, Math.random() * 2.0 - 1.0, 0.0); // rotate around z-axis (in tangent space)
        ssaoNoise.push(noise);
    }
    let noiseTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, noiseTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, 4, 4, 0, gl.RGBA, gl.FLOAT, ssaoNoise);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    // Lighting info
    const lightPos = glMatrix.vec3.fromValues(2.0, 4.0, -2.0), lightColor = glMatrix.vec3.fromValues(0.2, 0.2, 0.7);

    lightingPassShader.use();
    lightingPassShader.setInt("gPosition", 0);
    lightingPassShader.setInt("gNormal", 1);
    lightingPassShader.setInt("gAlbedo", 2);
    lightingPassShader.setInt("ssao", 3);
    SSAOShader.use();
    SSAOShader.setInt("gPosition", 0);
    SSAOShader.setInt("gNormal", 1);
    SSAOShader.setInt("texNoise", 2);
    BlurShader.use();
    BlurShader.setInt("ssaoInput", 0);


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

        geometryPassShader.use();
        geometryPassShader.setMat4("projection", projection);
        geometryPassShader.setMat4("view", view);
        // room cube
        model = glMatrix.mat4.identity(glMatrix.mat4.create());
        glMatrix.mat4.translate(model, model, glMatrix.vec3.fromValues(0.0, 7.0, 0.0));
        glMatrix.mat4.scale(model, model, glMatrix.vec3.fromValues(7.5, 7.5, 7.5));
        geometryPassShader.setMat4("model", model);
        geometryPassShader.setInt("invertedNormals", 1); // invert normals as we're inside the cube
        renderCube();
        geometryPassShader.setInt("invertedNormals", 0);

        // model on the floor
        model = glMatrix.mat4.identity(glMatrix.mat4.create());
        glMatrix.mat4.translate(model, model, glMatrix.vec3.fromValues(0.0, 0.5, 0.0));
        glMatrix.mat4.rotate(model, model, glMatrix.glMatrix.toRadian(-90), glMatrix.vec3.fromValues(1.0, 0.0, 0.0));
        glMatrix.mat4.scale(model, model, glMatrix.vec3.fromValues(1.0, 1.0, 1.0));
        geometryPassShader.setMat4("model", model);
        obj.draw(geometryPassShader);

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        // 2. generate SSAO texture
        gl.bindFramebuffer(gl.FRAMEBUFFER, SSAOFBO);
        gl.clear(gl.COLOR_BUFFER_BIT);
        SSAOShader.use();
        for (let i = 0; i < 64; i++) {
            SSAOShader.setVec3("samples[" + i + "]", ssaoKernel[i]);
        }
        SSAOShader.setMat4("projection", projection);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, gPosition);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, gNormal);
        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, noiseTexture);
        renderQuad();
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        // 3. blur SSAO texture to remove noise
        gl.bindFramebuffer(gl.FRAMEBUFFER, blurFBO);
        gl.clear(gl.COLOR_BUFFER_BIT);
        BlurShader.use();
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, ssaoColorBuffer);
        renderQuad();
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        // 4. lighting pass: traditional deferred Blinn-Phong lighting with added screen-space ambient occlusion
        // -----------------------------------------------------------------------------------------------------
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        lightingPassShader.use();
        let lightPosView = glMatrix.vec4.fromValues(...lightPos, 1.0);
        glMatrix.vec3.multiply(lightPosView, lightPosView, view);

        debugger
        lightingPassShader.setVec3("light.Position", lightPosView);
        lightingPassShader.setVec3("light.Color", lightColor);

        // Update attenuation parameters
        let linear = 0.09;
        let quadratic = 0.032;
        lightingPassShader.setFloat("light.Linear", linear);
        lightingPassShader.setFloat("light.Quadratic", quadratic);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, gPosition);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, gNormal);
        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, gAlbedo);
        gl.activeTexture(gl.TEXTURE3);
        gl.bindTexture(gl.TEXTURE_2D, blurFBO);
        renderQuad();

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

