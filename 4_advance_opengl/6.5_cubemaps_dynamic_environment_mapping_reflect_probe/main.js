let cameraPos = glMatrix.vec3.fromValues(0.0, 0.0, -6.0);
let camera = new Camera(cameraPos, glMatrix.vec3.fromValues(0.0, 1.0, 0.0), 90.0, 0.0);
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

    environmentShader.use();
    environmentShader.setInt("skybox", 0);

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

    let modelShader = new Shader(gl, "model.vs", "model.fs");
    await modelShader.initialize();

    let modelObj = new Model(gl, '../../resources/objects/planet');
    await modelObj.loadModel(['planet.obj', 'planet.mtl'])

    let x = (modelObj.minX + modelObj.maxX) / 2.0;
    let y = (modelObj.minY + modelObj.maxY) / 2.0;
    let z = (modelObj.minZ + modelObj.maxZ) / 2.0;
    let insideCameraPos = glMatrix.vec3.fromValues(x, y, z);
    let probe = new ReflectProbe(gl, 1024, insideCameraPos);

    function drawScene(view, projection, cameraPos, reflectProbe) {
        gl.enable(gl.DEPTH_TEST);
        gl.clearColor(0.1, 0.1, 0.1, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);


        cubemapsShader.use();
        model = glMatrix.mat4.identity(glMatrix.mat4.create());
        glMatrix.mat4.translate(model, model, glMatrix.vec3.fromValues(-2, 0, 0));
        cubemapsShader.setMat4("model", model);
        cubemapsShader.setMat4("view", view);
        cubemapsShader.setMat4("projection", projection);
        cubemapsShader.setVec3("cameraPos", cameraPos); // 传入相机的位置
        cubemapsShader.setInt("skybox", 0);
        // cubes
        gl.bindVertexArray(cubeVAO);
        gl.activeTexture(gl.TEXTURE0);
        //gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubemapTexture);
        gl.bindTexture(gl.TEXTURE_2D, cubeTexture);// 使用动态环境映射纹理 (这里纹理不包含二次反射，自己不会再别人的反射上)
        gl.drawArrays(gl.TRIANGLES, 0, 36);
        gl.bindVertexArray(null);

        if (reflectProbe) {
            // 渲染模型
            environmentShader.use();

            model = glMatrix.mat4.identity(glMatrix.mat4.create());
            glMatrix.mat4.scale(model, model, glMatrix.vec3.fromValues(0.2, 0.2, 0.2));
            environmentShader.setMat4("model", model);
            environmentShader.setMat4("view", view);
            environmentShader.setMat4("projection", projection);

            environmentShader.setVec3("cameraPos", cameraPos); // 传入相机的位置
            environmentShader.setInt("skybox", 0); 

            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_CUBE_MAP, reflectProbe);
            modelObj.draw(environmentShader);
        }

        // 最后渲染天空盒
        gl.depthFunc(gl.LEQUAL);  // change depth function so depth test passes when values are equal to depth buffer's content
        skyboxShader.use();
        // 没有 model
        view[12] = view[13] = view[14] = 0.0;
        skyboxShader.setMat4("view", view);// 天空盒把view矩阵的位移去掉
        skyboxShader.setMat4("projection", projection);
        skyboxShader.setInt("skybox", 0);
        // skybox cube
        gl.bindVertexArray(skyboxVAO);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubemapTexture);
        gl.drawArrays(gl.TRIANGLES, 0, 36);
        gl.bindVertexArray(null);
        gl.depthFunc(gl.LESS); // set depth function back to default

    }

    function render(time) {
        let currentFrame = Math.round(time) / 1000;
        deltaTime = Math.floor(currentFrame * 1000 - lastFrame * 1000) / 1000;
        lastFrame = currentFrame;

        probe.drawSceneToCubemap(drawScene);

        let newCubemapTexture = probe.getReflectProbeTexture();

        let projection = glMatrix.mat4.identity(glMatrix.mat4.create());
        glMatrix.mat4.perspective(projection, glMatrix.glMatrix.toRadian(camera.zoom), gl.drawingBufferWidth / gl.drawingBufferHeight, 0.1, 1000)

        let view = camera.getViewMatrix();
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, SCR_WIDTH, SCR_HEIGHT);
        drawScene(view, projection, camera.position, newCubemapTexture);

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


