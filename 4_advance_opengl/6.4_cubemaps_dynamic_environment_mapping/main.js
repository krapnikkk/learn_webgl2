let cameraPos = glMatrix.vec3.fromValues(0.0, 0.0, -6.0);
let camera = new Camera(cameraPos,glMatrix.vec3.fromValues(0.0, 1.0, 0.0), 90.0, 0.0);
let idx = 0;

const SCR_WIDTH = 800;
const SCR_HEIGHT = 800;

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

    let skyboxShader = new Shader(gl, "skybox.vs", "skybox.fs");
    await skyboxShader.initialize();

    let cubemapsShader = new Shader(gl, "cubemaps.vs", "cubemaps.fs");
    await cubemapsShader.initialize();

    let environmentShader = new Shader(gl, "environment.vs", "environment.fs");
    await environmentShader.initialize();

    let cubeVertices = new Float32Array([
        // positions          // texture Coords
        -0.5, -0.5, -0.5, 0.0, 0.0,
        0.5, -0.5, -0.5, 1.0, 0.0,
        0.5, 0.5, -0.5, 1.0, 1.0,
        0.5, 0.5, -0.5, 1.0, 1.0,
        -0.5, 0.5, -0.5, 0.0, 1.0,
        -0.5, -0.5, -0.5, 0.0, 0.0,

        -0.5, -0.5, 0.5, 0.0, 0.0,
        0.5, -0.5, 0.5, 1.0, 0.0,
        0.5, 0.5, 0.5, 1.0, 1.0,
        0.5, 0.5, 0.5, 1.0, 1.0,
        -0.5, 0.5, 0.5, 0.0, 1.0,
        -0.5, -0.5, 0.5, 0.0, 0.0,

        -0.5, 0.5, 0.5, 1.0, 0.0,
        -0.5, 0.5, -0.5, 1.0, 1.0,
        -0.5, -0.5, -0.5, 0.0, 1.0,
        -0.5, -0.5, -0.5, 0.0, 1.0,
        -0.5, -0.5, 0.5, 0.0, 0.0,
        -0.5, 0.5, 0.5, 1.0, 0.0,

        0.5, 0.5, 0.5, 1.0, 0.0,
        0.5, 0.5, -0.5, 1.0, 1.0,
        0.5, -0.5, -0.5, 0.0, 1.0,
        0.5, -0.5, -0.5, 0.0, 1.0,
        0.5, -0.5, 0.5, 0.0, 0.0,
        0.5, 0.5, 0.5, 1.0, 0.0,

        -0.5, -0.5, -0.5, 0.0, 1.0,
        0.5, -0.5, -0.5, 1.0, 1.0,
        0.5, -0.5, 0.5, 1.0, 0.0,
        0.5, -0.5, 0.5, 1.0, 0.0,
        -0.5, -0.5, 0.5, 0.0, 0.0,
        -0.5, -0.5, -0.5, 0.0, 1.0,

        -0.5, 0.5, -0.5, 0.0, 1.0,
        0.5, 0.5, -0.5, 1.0, 1.0,
        0.5, 0.5, 0.5, 1.0, 0.0,
        0.5, 0.5, 0.5, 1.0, 0.0,
        -0.5, 0.5, 0.5, 0.0, 0.0,
        -0.5, 0.5, -0.5, 0.0, 1.0
    ]);

    let skyboxVertices = new Float32Array([
        // positions          
        -1.0, 1.0, -1.0,
        -1.0, -1.0, -1.0,
        1.0, -1.0, -1.0,
        1.0, -1.0, -1.0,
        1.0, 1.0, -1.0,
        -1.0, 1.0, -1.0,

        -1.0, -1.0, 1.0,
        -1.0, -1.0, -1.0,
        -1.0, 1.0, -1.0,
        -1.0, 1.0, -1.0,
        -1.0, 1.0, 1.0,
        -1.0, -1.0, 1.0,

        1.0, -1.0, -1.0,
        1.0, -1.0, 1.0,
        1.0, 1.0, 1.0,
        1.0, 1.0, 1.0,
        1.0, 1.0, -1.0,
        1.0, -1.0, -1.0,

        -1.0, -1.0, 1.0,
        -1.0, 1.0, 1.0,
        1.0, 1.0, 1.0,
        1.0, 1.0, 1.0,
        1.0, -1.0, 1.0,
        -1.0, -1.0, 1.0,

        -1.0, 1.0, -1.0,
        1.0, 1.0, -1.0,
        1.0, 1.0, 1.0,
        1.0, 1.0, 1.0,
        -1.0, 1.0, 1.0,
        -1.0, 1.0, -1.0,

        -1.0, -1.0, -1.0,
        -1.0, -1.0, 1.0,
        1.0, -1.0, -1.0,
        1.0, -1.0, -1.0,
        -1.0, -1.0, 1.0,
        1.0, -1.0, 1.0
    ]);

    let positionLoc = 0, texCoordLoc = 1;

    let cubeVAO = gl.createVertexArray();
    let cubeVBO = gl.createBuffer();

    let cubeTexture = await loadTexture(gl, "../../resources/textures/container.jpg");
    cubemapsShader.use();
    cubemapsShader.setInt("texture1", 0);

    gl.bindVertexArray(cubeVAO);
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeVBO);
    gl.bufferData(gl.ARRAY_BUFFER, cubeVertices, gl.STATIC_DRAW);
    gl.vertexAttribPointer(positionLoc, 3, gl.FLOAT, false, 5 * cubeVertices.BYTES_PER_ELEMENT, 0);
    gl.enableVertexAttribArray(positionLoc);
    gl.vertexAttribPointer(texCoordLoc, 2, gl.FLOAT, false, 5 * cubeVertices.BYTES_PER_ELEMENT, 3 * cubeVertices.BYTES_PER_ELEMENT);
    gl.enableVertexAttribArray(texCoordLoc);
    gl.bindVertexArray(null);

    let skyboxVAO = gl.createVertexArray();
    let skyboxVBO = gl.createBuffer();

    gl.bindVertexArray(skyboxVAO);
    gl.bindBuffer(gl.ARRAY_BUFFER, skyboxVBO);
    gl.bufferData(gl.ARRAY_BUFFER, skyboxVertices, gl.STATIC_DRAW);
    gl.vertexAttribPointer(positionLoc, 3, gl.FLOAT, false, 3 * skyboxVertices.BYTES_PER_ELEMENT, 0);
    gl.enableVertexAttribArray(positionLoc);
    gl.bindVertexArray(null);

    skyboxShader.use();
    skyboxShader.setInt("skybox", 0);

    let faces = [
        "../../resources/skybox/right.jpg",
        "../../resources/skybox/left.jpg",
        "../../resources/skybox/top.jpg",
        "../../resources/skybox/bottom.jpg",
        "../../resources/skybox/front.jpg",
        "../../resources/skybox/back.jpg"
    ];
    let cubemapTexture = await loadCubemap(gl, faces);

    let modelObj = new Model(gl, '../../resources/objects/bunny');
    await modelObj.loadModel(['bunny.obj'])

    /*创建一个天空盒，并将其6个面的纹理附加到6个帧缓冲*/
    let framebufferTex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, framebufferTex);

    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    for (let i = 0; i < 6; i++)    //对cubeMap每一个面分配内存
        gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, 0, gl.RGBA, SCR_WIDTH, SCR_HEIGHT, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

    let framebuffers = [];
    for (let i = 0; i < 6; i++) {
        let framebuffer = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, framebufferTex, 0);

        let rbo = gl.createRenderbuffer();
        gl.bindRenderbuffer(gl.RENDERBUFFER, rbo);
        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH24_STENCIL8, SCR_WIDTH, SCR_HEIGHT);
        gl.bindRenderbuffer(gl.RENDERBUFFER, null);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_STENCIL_ATTACHMENT, gl.RENDERBUFFER, rbo);
        if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) != gl.FRAMEBUFFER_COMPLETE)
            console.log("ERROR::FRAMEBUFFER:: Framebuffer is not complete!");
    
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        framebuffers.push(framebuffer);
    }

    let x = (modelObj.minX + modelObj.maxX) / 2.0;
    let y = (modelObj.minY + modelObj.maxY) / 2.0;
    let z = (modelObj.minZ + modelObj.maxZ) / 2.0;
    let insideCameraPos = glMatrix.vec3.fromValues(x, y, z);
    let cameraList = [
        new Camera(insideCameraPos, glMatrix.vec3.fromValues(0.0, -1.0, 0.0), 0.0, 0.0),
        new Camera(insideCameraPos, glMatrix.vec3.fromValues(0.0, -1.0, 0.0), -180.0, 0.0),
        new Camera(insideCameraPos, glMatrix.vec3.fromValues(0.0, 1.0, 0.0), -90.0, 90.0),
        new Camera(insideCameraPos, glMatrix.vec3.fromValues(0.0, 1.0, 0.0), -90.0, -90.0),
        new Camera(insideCameraPos, glMatrix.vec3.fromValues(0.0, -1.0, 0.0), 90.0, 0.0),
        new Camera(insideCameraPos, glMatrix.vec3.fromValues(0.0, -1.0, 0.0), -90.0, 0.0)
    ];

    function render(time) {
        let currentFrame = Math.round(time) / 1000;
        deltaTime = Math.floor(currentFrame * 1000 - lastFrame * 1000) / 1000;
        lastFrame = currentFrame;

        let model;
        let view;
        let projection;

        for (let i = 0; i < 6; i++) {
            gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffers[i]);
            gl.clearColor(0.0, 0.0, 0.0, 1.0);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            let curCamera = cameraList[i];
            // camera = curCamera;
            view = curCamera.getViewMatrix();
            projection = glMatrix.mat4.identity(glMatrix.mat4.create());
            glMatrix.mat4.perspective(projection, glMatrix.glMatrix.toRadian(90), gl.drawingBufferWidth / gl.drawingBufferHeight, 0.1, 1000)
            model = glMatrix.mat4.identity(glMatrix.mat4.create());

            cubemapsShader.use();

            glMatrix.mat4.translate(model, model, glMatrix.vec3.fromValues(0, 3, -2));

            // cubes
            cubemapsShader.setMat4("model", model);
            cubemapsShader.setMat4("view", view);
            cubemapsShader.setMat4("projection", projection);

            gl.bindVertexArray(cubeVAO);
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, cubeTexture);
            gl.drawArrays(gl.TRIANGLES, 0, 36);
            gl.bindVertexArray(null);

            gl.depthFunc(gl.LEQUAL);
            skyboxShader.use();
            // remove translation from the view matrix
            view = curCamera.getViewMatrix();
            view[12] = view[13] = view[14] = 0.0;
            skyboxShader.setMat4("view", view);
            skyboxShader.setMat4("projection", projection);


            gl.bindVertexArray(skyboxVAO);
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubemapTexture);
            gl.drawArrays(gl.TRIANGLES, 0, 36);
            gl.bindVertexArray(null);
            gl.depthFunc(gl.LESS);
        }

        // render final scene
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.clearColor(0.1, 0.1, 0.1, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.enable(gl.DEPTH_TEST);

        model = glMatrix.mat4.identity(glMatrix.mat4.create());
        view = camera.getViewMatrix();
        projection = glMatrix.mat4.identity(glMatrix.mat4.create());

        // cube
        cubemapsShader.use();
        glMatrix.mat4.translate(model, model, glMatrix.vec3.fromValues(1, 1.5, -1.5));
        glMatrix.mat4.perspective(projection, glMatrix.glMatrix.toRadian(camera.zoom), gl.drawingBufferWidth / gl.drawingBufferHeight, 0.1, 100)

        cubemapsShader.setMat4("model", model);
        cubemapsShader.setMat4("view", view);
        cubemapsShader.setMat4("projection", projection);

        gl.bindVertexArray(cubeVAO);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, cubeTexture);
        gl.drawArrays(gl.TRIANGLES, 0, 36);
        gl.bindVertexArray(null);

        // dynamic environment mapped
        environmentShader.use();
        model = glMatrix.mat4.identity(glMatrix.mat4.create());
        environmentShader.setMat4("projection", projection);
        environmentShader.setMat4("view", view);
        environmentShader.setVec3("cameraPos", camera.position);
        environmentShader.setMat4("model", model);
        environmentShader.setInt("skybox", 0);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, framebufferTex);
        modelObj.draw(environmentShader);

        // draw skybox as last
        gl.depthFunc(gl.LEQUAL);  // change depth function so depth test passes when values are equal to depth buffer's content
        skyboxShader.use();
        view = camera.getViewMatrix();
        view[12] = view[13] = view[14] = 0.0;
        skyboxShader.setMat4("view", view);
        skyboxShader.setMat4("projection", projection);

        gl.bindVertexArray(skyboxVAO);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubemapTexture);
        gl.drawArrays(gl.TRIANGLES, 0, 36);
        gl.bindVertexArray(null);
        gl.depthFunc(gl.LESS); // set depth function back to default

        stats.update();
        requestAnimationFrame(render);
    }

    requestAnimationFrame(render);

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

async function loadTexture(gl, url) {
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

async function loadCubemap(gl, urls) {
    return new Promise(async (resolve, reject) => {
        let texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
        for (let i = 0; i < urls.length; i++) {
            let url = urls[i];
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
                gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, 0, format, width, height, 0, format, gl.UNSIGNED_BYTE, data);

            } else {
                reject()
                console.warn("Texture failed to load at path: " + url);
            }
        }
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        resolve(texture);
    })
}


