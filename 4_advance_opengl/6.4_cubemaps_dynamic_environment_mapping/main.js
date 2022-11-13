let cameraPos = glMatrix.vec3.fromValues(0.0, 4.0, 0.0);
let camera = new Camera(cameraPos);


const SCR_WIDTH = 800;
const SCR_HEIGHT = 600;

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

    let cubeVertices = new Float32Array([
        // positions          // normals
        -0.5, -0.5, -0.5, 0.0, 0.0, -1.0,
        0.5, -0.5, -0.5, 0.0, 0.0, -1.0,
        0.5, 0.5, -0.5, 0.0, 0.0, -1.0,
        0.5, 0.5, -0.5, 0.0, 0.0, -1.0,
        -0.5, 0.5, -0.5, 0.0, 0.0, -1.0,
        -0.5, -0.5, -0.5, 0.0, 0.0, -1.0,

        -0.5, -0.5, 0.5, 0.0, 0.0, 1.0,
        0.5, -0.5, 0.5, 0.0, 0.0, 1.0,
        0.5, 0.5, 0.5, 0.0, 0.0, 1.0,
        0.5, 0.5, 0.5, 0.0, 0.0, 1.0,
        -0.5, 0.5, 0.5, 0.0, 0.0, 1.0,
        -0.5, -0.5, 0.5, 0.0, 0.0, 1.0,

        -0.5, 0.5, 0.5, -1.0, 0.0, 0.0,
        -0.5, 0.5, -0.5, -1.0, 0.0, 0.0,
        -0.5, -0.5, -0.5, -1.0, 0.0, 0.0,
        -0.5, -0.5, -0.5, -1.0, 0.0, 0.0,
        -0.5, -0.5, 0.5, -1.0, 0.0, 0.0,
        -0.5, 0.5, 0.5, -1.0, 0.0, 0.0,

        0.5, 0.5, 0.5, 1.0, 0.0, 0.0,
        0.5, 0.5, -0.5, 1.0, 0.0, 0.0,
        0.5, -0.5, -0.5, 1.0, 0.0, 0.0,
        0.5, -0.5, -0.5, 1.0, 0.0, 0.0,
        0.5, -0.5, 0.5, 1.0, 0.0, 0.0,
        0.5, 0.5, 0.5, 1.0, 0.0, 0.0,

        -0.5, -0.5, -0.5, 0.0, -1.0, 0.0,
        0.5, -0.5, -0.5, 0.0, -1.0, 0.0,
        0.5, -0.5, 0.5, 0.0, -1.0, 0.0,
        0.5, -0.5, 0.5, 0.0, -1.0, 0.0,
        -0.5, -0.5, 0.5, 0.0, -1.0, 0.0,
        -0.5, -0.5, -0.5, 0.0, -1.0, 0.0,

        -0.5, 0.5, -0.5, 0.0, 1.0, 0.0,
        0.5, 0.5, -0.5, 0.0, 1.0, 0.0,
        0.5, 0.5, 0.5, 0.0, 1.0, 0.0,
        0.5, 0.5, 0.5, 0.0, 1.0, 0.0,
        -0.5, 0.5, 0.5, 0.0, 1.0, 0.0,
        -0.5, 0.5, -0.5, 0.0, 1.0, 0.0
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

    let positionLoc = 0, normalLoc = 1;

    let cubeVAO = gl.createVertexArray();
    let cubeVBO = gl.createBuffer();

    let cubeTexture = await loadTexture(gl, "../../resources/textures/container.jpg");
    cubemapsShader.use();
    cubemapsShader.setInt("texture1",0)

    gl.bindVertexArray(cubeVAO);
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeVBO);
    gl.bufferData(gl.ARRAY_BUFFER, cubeVertices, gl.STATIC_DRAW);
    gl.vertexAttribPointer(positionLoc, 3, gl.FLOAT, false, 6 * cubeVertices.BYTES_PER_ELEMENT, 0);
    gl.enableVertexAttribArray(positionLoc);
    gl.vertexAttribPointer(normalLoc, 3, gl.FLOAT, false, 6 * cubeVertices.BYTES_PER_ELEMENT, 3 * cubeVertices.BYTES_PER_ELEMENT);
    gl.enableVertexAttribArray(normalLoc);
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

    let modelShader = new Shader(gl, "model.vs", "model.fs");
    await modelShader.initialize();

    modelShader.use();
    modelShader.setInt("skybox", 0);

    let modelObj = new Model(gl, '../../resources/objects/planet');
    await modelObj.loadModel(['planet.mtl', 'planet.obj'])

    /*创建一个天空盒，并将其6个面的纹理附加到6个帧缓冲*/
    let framebufferTex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, framebufferTex);

    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    for (let i = 0; i < 6; i++)    //对cubeMap每一个面分配内存
        gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, 0, gl.RGBA, 2048, 2048, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

    // let framebuffer = [];
    // for (let i = 0; i < 6; i++) {
    let framebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, framebufferTex, 0);

    let rbo = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, rbo);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH24_STENCIL8, 2048, 2048);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_STENCIL_ATTACHMENT, gl.RENDERBUFFER, rbo);
    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) != gl.FRAMEBUFFER_COMPLETE)
        console.log("ERROR::FRAMEBUFFER:: Framebuffer is not complete!");
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);
    //     framebuffers.push(framebuffer);
    // }

    let insideCameraPos = glMatrix.vec3.create();
    insideCameraPos.x = (modelObj.minX + modelObj.maxX) / 2.0;
    insideCameraPos.y = (modelObj.minY + modelObj.maxY) / 2.0;
    insideCameraPos.z = (modelObj.minZ + modelObj.maxZ) / 2.0;
    debugger
    let cameraList = [
        new Camera(insideCameraPos, glMatrix.vec3.fromValues(0.0, -1.0, 0.0), 0.0, 0.0),
        new Camera(insideCameraPos, glMatrix.vec3.fromValues(0.0, -1.0, 0.0), -180.0, 0.0),
        new Camera(insideCameraPos, glMatrix.vec3.fromValues(0.0, -1.0, 0.0), -90.0, 90.0),
        new Camera(insideCameraPos, glMatrix.vec3.fromValues(0.0, -1.0, 0.0), -90.0, -90.0),
        new Camera(insideCameraPos, glMatrix.vec3.fromValues(0.0, -1.0, 0.0), 90.0, 0.0),
        new Camera(insideCameraPos, glMatrix.vec3.fromValues(0.0, -1.0, 0.0), -90.0, 0.0)
    ];

    function render(time) {
        let currentFrame = Math.round(time) / 1000;
        deltaTime = Math.floor(currentFrame * 1000 - lastFrame * 1000) / 1000;
        lastFrame = currentFrame;

        let model = glMatrix.mat4.identity(glMatrix.mat4.create());
        let view = camera.getViewMatrix();
        let projection = glMatrix.mat4.identity(glMatrix.mat4.create());

        for (let i = 0; i < 6; i++) {
            let curCamera = cameraListp[i];
            glMatrix.mat4.perspective(projection, glMatrix.glMatrix.toRadian(curCamera.zoom), gl.drawingBufferWidth / gl.drawingBufferHeight, 0.1, 100)
            view = curCamera.getViewMatrix();
            model = glMatrix.mat4.identity(glMatrix.mat4.create());

            cubemapsShader.use();

            glMatrix.mat4.translate(model, model, glMatrix.vec3.fromValues(0, 0, -10));
            glMatrix.mat4.rotate(model, model, time / 5000, glMatrix.vec3.fromValues(0.5, 1.0, 0.0));
            glMatrix.mat4.perspective(projection, glMatrix.glMatrix.toRadian(camera.zoom), gl.drawingBufferWidth / gl.drawingBufferHeight, 0.1, 100)

            cubemapsShader.setMat4("model", model);
            cubemapsShader.setMat4("view", view);
            cubemapsShader.setMat4("projection", projection);
            cubemapsShader.setVec3("cameraPos", camera.position);

            modelShader.use();
            model = glMatrix.mat4.identity(glMatrix.mat4.create());
            glMatrix.mat4.translate(model, model, glMatrix.vec3.fromValues(0, 0, -15));
            glMatrix.mat4.scale(model, model, glMatrix.vec3.fromValues(0.5, 0.5, 0.5));
            modelShader.setMat4("projection", projection);
            modelShader.setMat4("view", view);
            modelShader.setVec3("cameraPos", camera.position);
            modelShader.setMat4("model", model);

            skyboxShader.use();
            // remove translation from the view matrix
            view = camera.getViewMatrix();
            view[12] = view[13] = view[14] = 0.0;
            skyboxShader.setMat4("view", view);
            skyboxShader.setMat4("projection", projection);

            gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
            gl.drawBuffer(gl.COLOR_ATTACHMENT0 + i);

            gl.clearColor(0.0, 0.0, 0.0, 1.0);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            gl.enable(gl.DEPTH_TEST);

            // cubes
            gl.bindVertexArray(cubeVAO);
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubeTexture);
            gl.drawArrays(gl.TRIANGLES, 0, 36);
            gl.bindVertexArray(null);

            // model
            modelObj.draw(modelShader);
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubemapTexture);

            // sky box
            gl.depthFunc(gl.LEQUAL);
            gl.depthMask(gl.FALSE);
            gl.bindVertexArray(skyboxVAO);
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubemapTexture);
            gl.depthMask(gl.TRUE);
            gl.depthFunc(gl.LESS);
            gl.disable(gl.DEPTH_TEST);
        }

        // render final scene
        model = glMatrix.mat4.identity(glMatrix.mat4.create());
        view = camera.getViewMatrix();
        projection = glMatrix.mat4.identity(glMatrix.mat4.create());
        glMatrix.mat4.perspective(projection, glMatrix.glMatrix.toRadian(camera.zoom), gl.drawingBufferWidth / gl.drawingBufferHeight, 0.1, 100)


        texShader.use();
        texShader.setMat4("projection", glm:: value_ptr(projection));
        texShader.setMat4("view", glm:: value_ptr(view));
        texShader.setMat4("model", glm:: value_ptr(model));
        texShader.setVec3("viewPos", camera.Position.x, camera.Position.y, camera.Position.z);

        noTexShader.use();
        noTexShader.setMat4("projection", glm:: value_ptr(projection));
        noTexShader.setMat4("view", glm:: value_ptr(view));
        noTexShader.setMat4("model", glm:: value_ptr(model));
        noTexShader.setVec3("viewPos", camera.Position.x, camera.Position.y, camera.Position.z);

        skyboxShader.use();
        skyboxShader.setMat4("projection", glm:: value_ptr(projection));
        glm::mat4 skyboxView = glm:: mat4(glm:: mat3(camera.GetViewMatrix()));
        skyboxShader.setMat4("view", glm:: value_ptr(skyboxView));

        environmentShader.use();
        environmentShader.setMat4("projection", glm:: value_ptr(projection));
        environmentShader.setMat4("view", glm:: value_ptr(view));
        environmentShader.setMat4("model", glm:: value_ptr(model));
        environmentShader.setVec3("cameraPos", camera.Position.x, camera.Position.y, camera.Position.z);
        environmentShader.setInt("skybox", 0);

        glBindFramebuffer(GL_FRAMEBUFFER, 0);

        glClearColor(0.0f, 0.0f, 0.0f, 1.0f);
        glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);
        glEnable(GL_DEPTH_TEST);

        // draw box on the right
        texShader.use();
        model = glm:: mat4();
        model = glm:: scale(model, glm:: vec3(2.0f));
        model = glm:: translate(model, glm:: vec3(3.0f, 1.0f, 0.0f));
        texShader.setMat4("model", glm:: value_ptr(model));
        glBindVertexArray(VAO);
        glActiveTexture(GL_TEXTURE0);
        glBindTexture(GL_TEXTURE_2D, diffuseMap);
        glActiveTexture(GL_TEXTURE1);
        glBindTexture(GL_TEXTURE_2D, specularMap);
        glDrawArrays(GL_TRIANGLES, 0, 36);

        // draw bunny on the left
        noTexShader.use();
        model = glm:: mat4();
        model = glm:: translate(model, glm:: vec3(-5.0f, 0.0f, 0.0f));
        noTexShader.setMat4("model", glm:: value_ptr(model));
        glEnable(GL_CULL_FACE);
        glCullFace(GL_BACK);
        bunny.Draw(noTexShader);

        // draw the helicopter
        model = glm:: mat4();
		float y = 10 * sin(currentFrame);
		float z = 10 * cos(currentFrame);
        model = glm:: translate(model, glm:: vec3(0.0f, y, z));
        model = glm:: rotate(model, glm:: radians(-90.0f), glm:: vec3(0.0f, 1.0f, 0.0f));
        noTexShader.setMat4("model", glm:: value_ptr(model));
        plane.Draw(noTexShader);
        glDisable(GL_CULL_FACE);

        // dynamic environment mapped bunny
        glEnable(GL_CULL_FACE);
        environmentShader.use();
        model = glm:: mat4();
        environmentShader.setMat4("model", glm:: value_ptr(model));
        glActiveTexture(GL_TEXTURE0);
        glBindTexture(GL_TEXTURE_CUBE_MAP, cubeBuffer);
        bunny.Draw(environmentShader);
        glDisable(GL_CULL_FACE);

        // sky box
        glDepthFunc(GL_LEQUAL);
        glDepthMask(GL_FALSE);
        skyboxShader.use();
        glActiveTexture(GL_TEXTURE0);
        glBindTexture(GL_TEXTURE_CUBE_MAP, skybox.m_textureID);
        skybox.Draw(skyboxShader);
        glDepthMask(GL_TRUE);
        glDepthFunc(GL_LESS);
        glDisable(GL_DEPTH_TEST);

        // text rendering

        glDisable(GL_BLEND);

        gl.clearColor(0.1, 0.1, 0.1, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.bindVertexArray(skyboxVAO);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubemapTexture);


        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        cubemapsShader.use();

        glMatrix.mat4.translate(model, model, glMatrix.vec3.fromValues(0, 0, -10));
        glMatrix.mat4.rotate(model, model, time / 5000, glMatrix.vec3.fromValues(0.5, 1.0, 0.0));
        glMatrix.mat4.perspective(projection, glMatrix.glMatrix.toRadian(camera.zoom), gl.drawingBufferWidth / gl.drawingBufferHeight, 0.1, 100)

        cubemapsShader.setMat4("model", model);
        cubemapsShader.setMat4("view", view);
        cubemapsShader.setMat4("projection", projection);
        cubemapsShader.setVec3("cameraPos", camera.position);

        // cubes
        gl.bindVertexArray(cubeVAO);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubeTexture);
        gl.drawArrays(gl.TRIANGLES, 0, 36);
        gl.bindVertexArray(null);

        // model
        modelShader.use();
        model = glMatrix.mat4.identity(glMatrix.mat4.create());
        glMatrix.mat4.translate(model, model, glMatrix.vec3.fromValues(0, 0, -15));
        glMatrix.mat4.scale(model, model, glMatrix.vec3.fromValues(0.5, 0.5, 0.5));
        modelShader.setMat4("projection", projection);
        modelShader.setMat4("view", view);
        modelShader.setVec3("cameraPos", camera.position);
        modelShader.setMat4("model", model);

        modelObj.draw(modelShader);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubemapTexture);

        // draw skybox as last
        gl.depthFunc(gl.LEQUAL);  // change depth function so depth test passes when values are equal to depth buffer's content
        skyboxShader.use();
        view = camera.getViewMatrix();
        view[12] = view[13] = view[14] = 0.0; // remove translation from the view matrix
        skyboxShader.setMat4("view", view);
        skyboxShader.setMat4("projection", projection);

        // skybox cube
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


