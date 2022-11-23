let cameraPos = glMatrix.vec3.fromValues(0.0, 0.0, 3.0);
let camera = new Camera(cameraPos);
const SCR_WIDTH = 800;
const SCR_HEIGHT = 600;
const SHADOW_WIDTH = 1024, SHADOW_HEIGHT = 1024;

let deltaTime = 0.0;	// time between current frame and last frame
let lastFrame = 0.0;
let isFirstMouse = true;
let lastX = SCR_WIDTH / 2, lastY = SCR_HEIGHT / 2;


async function main() {
    let stats = new Stats();
    document.body.appendChild(stats.dom);

    const gl = document.getElementById("canvas").getContext("webgl2");
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    gl.enable(gl.DEPTH_TEST);

    let shader = new Shader(gl, "shadow_mapping_depth.vs", "shadow_mapping_depth.fs");
    await shader.initialize();

    let debugDepthShader = new Shader(gl, "debug_quad.vs", "debug_quad_depth.fs");
    await debugDepthShader.initialize();

    let planeVertices = new Float32Array([
        // positions            // normals         // texcoords
        25.0, -0.5, 25.0, 0.0, 1.0, 0.0, 25.0, 0.0,
        -25.0, -0.5, 25.0, 0.0, 1.0, 0.0, 0.0, 0.0,
        -25.0, -0.5, -25.0, 0.0, 1.0, 0.0, 0.0, 25.0,

        25.0, -0.5, 25.0, 0.0, 1.0, 0.0, 25.0, 0.0,
        -25.0, -0.5, -25.0, 0.0, 1.0, 0.0, 0.0, 25.0,
        25.0, -0.5, -25.0, 0.0, 1.0, 0.0, 25.0, 25.0
    ])

    let positionLoc = 0, normalLoc = 1, texCoordLoc = 2;
    let planeVAO = gl.createVertexArray();
    let planeVBO = gl.createBuffer();
    gl.bindVertexArray(planeVAO);
    gl.bindBuffer(gl.ARRAY_BUFFER, planeVBO);
    gl.bufferData(gl.ARRAY_BUFFER, planeVertices, gl.STATIC_DRAW);
    gl.vertexAttribPointer(positionLoc, 3, gl.FLOAT, false, 8 * planeVertices.BYTES_PER_ELEMENT, 0);
    gl.enableVertexAttribArray(positionLoc);
    gl.vertexAttribPointer(normalLoc, 3, gl.FLOAT, false, 8 * planeVertices.BYTES_PER_ELEMENT, 3 * planeVertices.BYTES_PER_ELEMENT);
    gl.enableVertexAttribArray(normalLoc);
    gl.vertexAttribPointer(texCoordLoc, 2, gl.FLOAT, false, 8 * planeVertices.BYTES_PER_ELEMENT, 6 * planeVertices.BYTES_PER_ELEMENT);
    gl.enableVertexAttribArray(texCoordLoc);
    gl.bindVertexArray(null);

    let floorTexture = await loadTexture(gl, "../../resources/textures/wood.png");

    let depthMapFBO = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, depthMapFBO);
    // create a color attachment texture
    let depthMap = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, depthMap);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, SHADOW_WIDTH, SHADOW_HEIGHT, 0, gl.RGB, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, depthMap, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);


    debugDepthShader.use();
    debugDepthShader.setInt("depthMap", 0);
    let lightPos = glMatrix.vec3.fromValues(2, 4, -1);


    function render(time) {
        let currentFrame = Math.round(time) / 1000;
        deltaTime = Math.floor(currentFrame * 1000 - lastFrame * 1000) / 1000;
        lastFrame = currentFrame;

        gl.clearColor(0.1, 0.1, 0.1, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);


        // 1. render depth of scene to texture (from light's perspective)
        // --------------------------------------------------------------
        let lightProjection = glMatrix.mat4.identity(glMatrix.mat4.create()),
            lightView = glMatrix.mat4.identity(glMatrix.mat4.create()),
            lightSpaceMatrix = glMatrix.mat4.identity(glMatrix.mat4.create());
        let near_plane = 1.0, far_plane = 7.5;
        glMatrix.mat4.ortho(lightProjection, -10.0, 10.0, -10.0, 10.0, near_plane, far_plane);
        glMatrix.mat4.lookAt(lightView, lightPos, glMatrix.vec3.fromValues(0, 0, 0), glMatrix.vec3.fromValues(0.0, 1.0, 0.0));
        glMatrix.mat4.mul(lightSpaceMatrix, lightProjection, lightView);
        // render scene from light's point of view
        shader.use();
        shader.setMat4("lightSpaceMatrix", lightSpaceMatrix);

        gl.viewport(0, 0, SHADOW_WIDTH, SHADOW_HEIGHT);
        gl.bindFramebuffer(gl.FRAMEBUFFER, depthMapFBO);
        gl.clear(gl.DEPTH_BUFFER_BIT);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, floorTexture);
        renderScene(shader);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        // reset viewport
        gl.viewport(0, 0, SCR_WIDTH, SCR_HEIGHT);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // render Depth map to quad for visual debugging
        // ---------------------------------------------
        debugDepthShader.use();
        debugDepthShader.setFloat("near_plane", near_plane);
        debugDepthShader.setFloat("far_plane", far_plane);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, depthMap);
        renderQuad();

        stats.update();
        requestAnimationFrame(render);
    }

    requestAnimationFrame(render);

    // renders the 3D scene
    // --------------------
    function renderScene(shader) {
        // floor
        let model = glMatrix.mat4.identity(glMatrix.mat4.create());
        shader.setMat4("model", model);
        gl.bindVertexArray(planeVAO);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        // cubes
        model = glMatrix.mat4.identity(glMatrix.mat4.create());
        glMatrix.mat4.translate(model, model, glMatrix.vec3.fromValues(0.0, 1.5, 0.0));
        glMatrix.mat4.scale(model,model, glMatrix.vec3.fromValues(0.5, 0.5, 0.5));
        shader.setMat4("model", model);
        renderCube();
        model = glMatrix.mat4.identity(glMatrix.mat4.create());
        glMatrix.mat4.translate(model, model, glMatrix.vec3.fromValues(2.0, 0.0, 1.0));
        glMatrix.mat4.scale(model,model, glMatrix.vec3.fromValues(0.5, 0.5, 0.5));
        shader.setMat4("model", model);
        renderCube();
        model = glMatrix.mat4.identity(glMatrix.mat4.create());
        glMatrix.mat4.translate(model, model, glMatrix.vec3.fromValues(-1.0, 0.0, 2.0));
        glMatrix.mat4.rotate(model, model, glMatrix.glMatrix.toRadian(60.0), glMatrix.vec3.normalize(glMatrix.vec3.create(), glMatrix.vec3.fromValues(1.0, 0.0, 1.0)));
        glMatrix.mat4.scale(model, model, glMatrix.vec3.fromValues(0.25, 0.25, 0.25));
        shader.setMat4("model", model);
        renderCube();
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
                - 1.0, -1.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, // bottom-left
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

