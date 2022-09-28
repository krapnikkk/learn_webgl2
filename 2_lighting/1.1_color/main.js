async function main() {
    const gl = document.getElementById("canvas").getContext("webgl2");
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);

    gl.enable(gl.DEPTH_TEST);

    let colorShader = new Shader(gl, "color.vs", "color.fs");
    await colorShader.initialize();

    let cubeShader = new Shader(gl, "cube.vs", "cube.fs");
    await cubeShader.initialize();

    let cameraPos = glMatrix.vec3.fromValues(0.0, 0.0, 3.0);
    let camera = new Camera(cameraPos);

    // timing
    let deltaTime = 0.0;	// time between current frame and last frame
    let lastFrame = 0.0;
    let isFirstMouse = true;
    let lastX = gl.drawingBufferWidth / 2, lastY = gl.drawingBufferHeight / 2;
    let lightPos = glMatrix.vec3.fromValues(1.2, 1.0, 2.0);

    document.onkeydown = (e) => {
        camera.onKeydown(e.code, deltaTime);
        // camera.position[1] = 0;
    }

    canvas.onmousemove = (e) => {
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

    let vertices = new Float32Array([
        -0.5, -0.5, -0.5,
        0.5, -0.5, -0.5,
        0.5, 0.5, -0.5,
        0.5, 0.5, -0.5,
        -0.5, 0.5, -0.5,
        -0.5, -0.5, -0.5,

        -0.5, -0.5, 0.5,
        0.5, -0.5, 0.5,
        0.5, 0.5, 0.5,
        0.5, 0.5, 0.5,
        -0.5, 0.5, 0.5,
        -0.5, -0.5, 0.5,

        -0.5, 0.5, 0.5,
        -0.5, 0.5, -0.5,
        -0.5, -0.5, -0.5,
        -0.5, -0.5, -0.5,
        -0.5, -0.5, 0.5,
        -0.5, 0.5, 0.5,

        0.5, 0.5, 0.5,
        0.5, 0.5, -0.5,
        0.5, -0.5, -0.5,
        0.5, -0.5, -0.5,
        0.5, -0.5, 0.5,
        0.5, 0.5, 0.5,

        -0.5, -0.5, -0.5,
        0.5, -0.5, -0.5,
        0.5, -0.5, 0.5,
        0.5, -0.5, 0.5,
        -0.5, -0.5, 0.5,
        -0.5, -0.5, -0.5,

        -0.5, 0.5, -0.5,
        0.5, 0.5, -0.5,
        0.5, 0.5, 0.5,
        0.5, 0.5, 0.5,
        -0.5, 0.5, 0.5,
        -0.5, 0.5, -0.5
    ]);

    let positionLoc = 0;

    let cubeVao = gl.createVertexArray();
    let vbo = gl.createBuffer();

    gl.bindVertexArray(cubeVao);

    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    gl.vertexAttribPointer(positionLoc, 3, gl.FLOAT, false, 3 * vertices.BYTES_PER_ELEMENT, 0);
    gl.enableVertexAttribArray(positionLoc);

    // for colorShader
    let colorVao = gl.createVertexArray();
    gl.bindVertexArray(colorVao);
    // we only need to bind to the VBO (to link it with glVertexAttribPointer), no need to fill it; the VBO's data already contains all we need (it's already bound, but we do it again for educational purposes)
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);

    gl.vertexAttribPointer(positionLoc, 3, gl.FLOAT, false, 3 * vertices.BYTES_PER_ELEMENT, 0);
    gl.enableVertexAttribArray(positionLoc);


    let projection = glMatrix.mat4.create();

    function render(time) {
        let currentFrame = Math.round(time) / 1000;
        deltaTime = Math.floor(currentFrame * 1000 - lastFrame * 1000) / 1000;
        lastFrame = currentFrame;
        
        gl.clearColor(0.1, 0.1, 0.1, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);

        colorShader.use();
        colorShader.setVec3("objectColor",glMatrix.vec3.fromValues(1.0,0.5,0.3));
        colorShader.setVec3("lightColor",glMatrix.vec3.fromValues(1.0,1.0,1.0));
        
        glMatrix.mat4.perspective(projection, glMatrix.glMatrix.toRadian(camera.zoom), gl.drawingBufferWidth / gl.drawingBufferHeight, 0.1, 100)
        let view = camera.getViewMatrix();
        let model = glMatrix.mat4.identity(glMatrix.mat4.create());
        
        colorShader.setMat4("projection",projection);
        colorShader.setMat4("view",view);
        colorShader.setMat4("model",model);
        
        gl.bindVertexArray(colorVao);
        gl.drawArrays(gl.TRIANGLES, 0, 36);

        cubeShader.use();
        cubeShader.setMat4("projection",projection);
        cubeShader.setMat4("view",view);
        model = glMatrix.mat4.identity(model);
        glMatrix.mat4.translate(model,model,lightPos);
        glMatrix.mat4.scale(model, model, glMatrix.vec3.fromValues(0.2, 0.2, 0.2));
        cubeShader.setMat4("model", model);

        gl.bindVertexArray(cubeVao);
        gl.drawArrays(gl.TRIANGLES, 0, 36);

        requestAnimationFrame(render);
    }

    requestAnimationFrame(render);
}

async function loadImage(url) {
    return new Promise((resolve, reject) => {
        let image = new Image();
        image.src = url;
        image.onload = () => {
            resolve(image);
        }
        image.onerror = (err) => {
            reject(err);
            throw new Error(err);
        }

    })
}
