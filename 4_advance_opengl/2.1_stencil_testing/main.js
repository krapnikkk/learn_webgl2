let cameraPos = glMatrix.vec3.fromValues(0.0, 0.0, 3.0);
let camera = new Camera(cameraPos);

const SCR_WIDTH = 800;
const SCR_HEIGHT = 600;

let deltaTime = 0.0;	// time between current frame and last frame
let lastFrame = 0.0;
let isFirstMouse = true;
let lastX = SCR_WIDTH / 2, lastY = SCR_HEIGHT / 2;

// mat

async function main() {
    let stats = new Stats();
    document.body.appendChild(stats.dom);

    const gl = document.getElementById("canvas").getContext("webgl2",{stencil:true});
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LESS);
    // stencil
    gl.enable(gl.STENCIL_TEST);
    gl.stencilFunc(gl.EQUAL,1,0xFF);
    gl.stencilOp(gl.KEEP, gl.KEEP, gl.REPLACE);

    let shader = new Shader(gl, "shader.vs", "shader.fs");
    await shader.initialize();

    let colorShader = new Shader(gl, "shader.vs", "color.fs");
    await colorShader.initialize();

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

    let planeVertices = new Float32Array([
        // positions          // texture Coords (note we set these higher than 1 (together with GL_REPEAT as texture wrapping mode). this will cause the floor texture to repeat)
        5.0, -0.5, 5.0, 2.0, 0.0,
        -5.0, -0.5, 5.0, 0.0, 0.0,
        -5.0, -0.5, -5.0, 0.0, 2.0,

        5.0, -0.5, 5.0, 2.0, 0.0,
        -5.0, -0.5, -5.0, 0.0, 2.0,
        5.0, -0.5, -5.0, 2.0, 2.0
    ])


    let positionLoc = 0, texCoordLoc = 1;

    let cubeVAO = gl.createVertexArray();
    let cubeVBO = gl.createBuffer();

    gl.bindVertexArray(cubeVAO);
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeVBO);
    gl.bufferData(gl.ARRAY_BUFFER, cubeVertices, gl.STATIC_DRAW);
    gl.vertexAttribPointer(positionLoc, 3, gl.FLOAT, false, 5 * cubeVertices.BYTES_PER_ELEMENT, 0);
    gl.enableVertexAttribArray(positionLoc);
    gl.vertexAttribPointer(texCoordLoc, 2, gl.FLOAT, false, 5 * cubeVertices.BYTES_PER_ELEMENT, 3 * cubeVertices.BYTES_PER_ELEMENT);
    gl.enableVertexAttribArray(texCoordLoc);
    gl.bindVertexArray(null);

    let planeVAO = gl.createVertexArray();
    let planeVBO = gl.createBuffer();

    gl.bindVertexArray(planeVAO);
    gl.bindBuffer(gl.ARRAY_BUFFER, planeVBO);
    gl.bufferData(gl.ARRAY_BUFFER, planeVertices, gl.STATIC_DRAW);
    gl.vertexAttribPointer(positionLoc, 3, gl.FLOAT, false, 5 * planeVertices.BYTES_PER_ELEMENT, 0);
    gl.enableVertexAttribArray(positionLoc);
    gl.vertexAttribPointer(texCoordLoc, 2, gl.FLOAT, false, 5 * planeVertices.BYTES_PER_ELEMENT, 3 * planeVertices.BYTES_PER_ELEMENT);
    gl.enableVertexAttribArray(texCoordLoc);
    gl.bindVertexArray(null);

    let cubeTexture = await loadTexture(gl, "../../resources/textures/marble.jpg");
    let floorTexture = await loadTexture(gl, "../../resources/textures/metal.png");

    shader.use();
    gl.uniform1i(gl.getUniformLocation(shader.ID, "texture1"), 0);


    function render(time) {
        let currentFrame = Math.round(time) / 1000;
        deltaTime = Math.floor(currentFrame * 1000 - lastFrame * 1000) / 1000;
        lastFrame = currentFrame;

        gl.clearColor(0.1, 0.1, 0.1, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);

        colorShader.use();

        let model = glMatrix.mat4.identity(glMatrix.mat4.create());
        let view = camera.getViewMatrix();
        let projection = glMatrix.mat4.identity(glMatrix.mat4.create());
        glMatrix.mat4.perspective(projection, glMatrix.glMatrix.toRadian(camera.zoom), gl.drawingBufferWidth / gl.drawingBufferHeight, 0.1, 100)
        colorShader.setMat4("view", view);
        colorShader.setMat4("projection", projection);

        shader.use();
        shader.setMat4("view", view);
        shader.setMat4("projection", projection);

        gl.stencilMask(0x00);// 每一位在写入模板缓冲时都会变成0（禁用写入）

        // floor
        gl.bindVertexArray(planeVAO);
        gl.bindTexture(gl.TEXTURE_2D, floorTexture);
        shader.setMat4("model", glMatrix.mat4.identity(glMatrix.mat4.create()));
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        gl.bindVertexArray(null);

        //绘制物体之前，将模板函数设置为gl.ALWAYS
        gl.stencilFunc(gl.ALWAYS, 1, 0xFF); // 所有片段都应该更新模板缓冲
        gl.stencilMask(0xFF); // 每一位写入模板缓冲时都保持原样

        // cubes
        gl.bindVertexArray(cubeVAO);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, cubeTexture);
        glMatrix.mat4.translate(model, model, glMatrix.vec3.fromValues(-1.0, 0.0, -1.0));
        shader.setMat4("model", model);
        gl.drawArrays(gl.TRIANGLES, 0, 36);

        model = glMatrix.mat4.identity(glMatrix.mat4.create());
        glMatrix.mat4.translate(model, model, glMatrix.vec3.fromValues(2.0, 0.0, 0.0));
        shader.setMat4("model", model);
        gl.drawArrays(gl.TRIANGLES, 0, 36);
        
        gl.stencilFunc(gl.NOTEQUAL, 1, 0xFF); // 保证只绘制箱子之外的部分
        gl.stencilMask(0x00);// 每一位在写入模板缓冲时都会变成0（禁用写入）
        gl.disable(gl.DEPTH_TEST); // 关闭深度测试，让边框被绘制
        colorShader.use();
        let scale = 1.1;

        // outline
        gl.bindVertexArray(cubeVAO);
        gl.bindTexture(gl.TEXTURE_2D, cubeTexture);

        model = glMatrix.mat4.identity(glMatrix.mat4.create());
        glMatrix.mat4.translate(model, model, glMatrix.vec3.fromValues(-1.0, 0.0, -1.0));
        glMatrix.mat4.scale(model, model, glMatrix.vec3.fromValues(scale, scale, scale));
        colorShader.setMat4("model", model);
        gl.drawArrays(gl.TRIANGLES, 0, 36);

        model = glMatrix.mat4.identity(glMatrix.mat4.create());
        glMatrix.mat4.translate(model, model, glMatrix.vec3.fromValues(2.0, 0.0, 0.0));
        glMatrix.mat4.scale(model, model, glMatrix.vec3.fromValues(scale, scale, scale));
        colorShader.setMat4("model", model);
        gl.drawArrays(gl.TRIANGLES, 0, 36);
        gl.bindVertexArray(null);

        gl.stencilMask(0xFF);// 每一位写入模板缓冲时都保持原样
        gl.stencilFunc(gl.ALWAYS, 0, 0xFF);
        gl.enable(gl.DEPTH_TEST);

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

