let cameraPos = glMatrix.vec3.fromValues(0.0, 0.0, 5.0);
let up =  glMatrix.vec3.fromValues(0, 1, 0)
let camera = new Camera(cameraPos,up,90);
const SCR_WIDTH = 800;
const SCR_HEIGHT = 600;

let deltaTime = 0.0;	// time between current frame and last frame
let lastFrame = 0.0;
let isFirstMouse = true;
let lastX = SCR_WIDTH / 2, lastY = SCR_HEIGHT / 2;

let hdr = {
    "enable": true,
    "exposure": 0.1,
    "debug":false
};

async function main() {
    let stats = new Stats();
    document.body.appendChild(stats.dom);

    const gl = document.getElementById("canvas").getContext("webgl2", { "antialias": true });
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    gl.enable(gl.DEPTH_TEST);

    // lighting
    let shader = new Shader(gl, "lighting.vs", "lighting.fs");
    await shader.initialize();

    let hdrShader = new Shader(gl, "hdr.vs", "hdr.fs");
    await hdrShader.initialize();

    let woodTexture = await loadTexture(gl, "../../resources/textures/wood.png");

    // Create hdrFBO
    const hdrFBO = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, hdrFBO);

    // Create color buffer

    const colorBuffer = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, colorBuffer);

    // see:https://developer.mozilla.org/en-US/docs/Web/API/EXT_color_buffer_half_float
    gl.getExtension("EXT_color_buffer_half_float");
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, SCR_WIDTH, SCR_HEIGHT, 0, gl.RGBA, gl.FLOAT, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    // gl.generateMipmap(gl.TEXTURE_2D);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, colorBuffer, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, hdrFBO);

    // Create depth buffer (renderbuffer)
    const rboDepth = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, rboDepth);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, SCR_WIDTH, SCR_HEIGHT);

    // Attach buffers
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, rboDepth);

    let bufferStatus = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    if (bufferStatus != gl.FRAMEBUFFER_COMPLETE) {
        console.log("Framebuffer not complete!");
    }

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);
    gl.bindTexture(gl.TEXTURE_2D, null);



    // Lighting info
    // -------------
    // Positions
    const lightPositions = [
        glMatrix.vec3.fromValues(0.0, 0.0, 49.5), // back light
        glMatrix.vec3.fromValues(-1.4, -1.9, 9.0),
        glMatrix.vec3.fromValues(0.0, -1.8, 4.0),
        glMatrix.vec3.fromValues(0.8, -1.7, 6.0)
    ];

    // Colors
    const lightColors = [
        glMatrix.vec3.fromValues(200.0, 200.0, 200.0),
        glMatrix.vec3.fromValues(0.1, 0.0, 0.0),
        glMatrix.vec3.fromValues(0.0, 0.0, 0.2),
        glMatrix.vec3.fromValues(0.0, 0.1, 0.0)
    ];

    shader.use();
    shader.setInt("diffuseTexture", 0);
    hdrShader.use();
    hdrShader.setInt("hdrBuffer", 0);

    function render(time) {
        let currentFrame = Math.round(time) / 1000;
        deltaTime = Math.floor(currentFrame * 1000 - lastFrame * 1000) / 1000;
        lastFrame = currentFrame;

        gl.clearColor(0.1, 0.1, 0.1, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.bindFramebuffer(gl.FRAMEBUFFER, hdrFBO);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        let view = camera.getViewMatrix();
        let projection = glMatrix.mat4.identity(glMatrix.mat4.create());
        glMatrix.mat4.perspective(projection, glMatrix.glMatrix.toRadian(camera.zoom), gl.drawingBufferWidth / gl.drawingBufferHeight, 0.1, 100)

        let model = glMatrix.mat4.identity(glMatrix.mat4.create());
        glMatrix.mat4.translate(model, model, glMatrix.vec3.fromValues(0.0, 0.0, 25.0))
        glMatrix.mat4.scale(model, model, glMatrix.vec3.fromValues(2.5, 2.5, 27.5));

        shader.use();
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, woodTexture);

        for (let i = 0; i < lightPositions.length; i++) {
            shader.setVec3(`lights[${i}].Position`, lightPositions[i]);
            shader.setVec3(`lights[${i}].Color`, lightColors[i]);
        }
        
        // render tunnel
        shader.setVec3("viewPos", camera.position);
        shader.setMat4("projection", projection);
        shader.setMat4("view", view);
        shader.setMat4("model", model);

        shader.setInt("inverse_normals", true);

        renderCube();

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        hdrShader.use();

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, colorBuffer);
        hdrShader.setBool("hdr", hdr.enable);
        hdrShader.setFloat("exposure", hdr.exposure);
        hdrShader.setBool("debug", hdr.debug);
        renderQuad();

        stats.update();
        requestAnimationFrame(render);
    }

    requestAnimationFrame(render);
    addGUI();
    function addGUI() {
        const GUI = new dat.GUI({ name: "HeightMap" });

        GUI.add(hdr, "enable").name("hdr");
        GUI.add(hdr, "exposure", 0.1, 50.0).name("exposure");
        GUI.add(hdr, "debug").name("debug");
    }

    // renderQuad() renders a 1x1 XY quad in NDC
    // -----------------------------------------
    let quadVAO = gl.createVertexArray();
    let quadVBO = gl.createBuffer();
    function renderQuad() {
        if (quadVAO) {
            let quadVertices = new Float32Array([
                // positions        // texture Coords
                - 1.0, 1.0, 0.0, 0.0, 1.0,
                -1.0, -1.0, 0.0, 0.0, 0.0,
                1.0, 1.0, 0.0, 1.0, 1.0,
                1.0, -1.0, 0.0, 1.0, 0.0,
            ]);
            // setup plane VAO
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
    let cubeVAO = gl.createVertexArray();
    let cubeVBO = gl.createBuffer();
    function renderCube() {
        // initialize (if necessary)
        if (cubeVAO) {
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


    let moveLock = true;
    document.onkeydown = (e) => {
        camera.onKeydown(e.code, deltaTime);

        if (e.code == "Escape") {
            moveLock = true;
        }
    }

    canvas.onclick = (e) => {
        if (moveLock) {
            moveLock = false;
        } else {
            moveLock = true;
        }
        isFirstMouse = true;
    }

    canvas.onmousemove = (e) => {
        if (moveLock) {
            return;
        }
        let { clientX, clientY } = e;
        if (isFirstMouse) {
            lastX = clientX;
            lastY = clientY;
            isFirstMouse = false;
        }
        let offsetX = clientX - lastX;
        let offsetY = lastY - clientY;

        lastX = clientX;
        lastY = clientY;

        camera.onMousemove(offsetX, offsetY);
    }

    canvas.onwheel = (e) => {
        camera.onMouseScroll(e.deltaY / 100);
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

