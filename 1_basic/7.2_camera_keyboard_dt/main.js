async function main() {
    const gl = document.getElementById("canvas").getContext("webgl2");
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    gl.enable(gl.DEPTH_TEST);

    let shader = new Shader(gl, "shader.vs", "shader.fs");
    await shader.initialize();

    let cameraPos = glMatrix.vec3.fromValues(0.0, 0.0, 3.0);
    let cameraFront = glMatrix.vec3.fromValues(0.0, 0.0, -1.0);
    let cameraUp = glMatrix.vec3.fromValues(0.0, 1.0, 0.0);

    // timing
    let deltaTime = 0.0;	// time between current frame and last frame
    let lastFrame = 0.0;

    document.onkeydown = (e) => {
        let cameraSpeed = 2.5 * deltaTime;
        // cameraSpeed = 0.5
        if (e.code == "ArrowUp") {
            glMatrix.vec3.multiply(cameraFront, cameraFront, glMatrix.vec3.fromValues(cameraSpeed,cameraSpeed,cameraSpeed));
            glMatrix.vec3.add(cameraPos, cameraPos, cameraFront);
        } else if (e.code == "ArrowDown") {
            glMatrix.vec3.multiply(cameraFront, cameraFront, glMatrix.vec3.fromValues(cameraSpeed,cameraSpeed,cameraSpeed));
            glMatrix.vec3.subtract(cameraPos, cameraPos, cameraFront);
        } else if (e.code == "ArrowLeft") {
            let crossCamera = glMatrix.vec3.cross(cameraFront, cameraFront, cameraUp);
            glMatrix.vec3.normalize(crossCamera, crossCamera);
            glMatrix.vec3.multiply(crossCamera, crossCamera, glMatrix.vec3.fromValues(cameraSpeed,cameraSpeed,cameraSpeed));
            glMatrix.vec3.subtract(cameraPos, cameraPos, crossCamera);
        } else if (e.code == "ArrowRight") {
            let crossCamera = glMatrix.vec3.cross(cameraFront, cameraFront, cameraUp);
            glMatrix.vec3.normalize(crossCamera, crossCamera);
            glMatrix.vec3.multiply(crossCamera, crossCamera, glMatrix.vec3.fromValues(cameraSpeed,cameraSpeed,cameraSpeed));
            glMatrix.vec3.add(cameraPos, cameraPos, crossCamera);
        }
    }

    let vertices = new Float32Array([
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

    let cubePositions = [
        glMatrix.vec3.fromValues(0.0, 0.0, 0.0),
        glMatrix.vec3.fromValues(2.0, 5.0, -15.0),
        glMatrix.vec3.fromValues(-1.5, -2.2, -2.5),
        glMatrix.vec3.fromValues(-3.8, -2.0, -12.3),
        glMatrix.vec3.fromValues(2.4, -0.4, -3.5),
        glMatrix.vec3.fromValues(-1.7, 3.0, -7.5),
        glMatrix.vec3.fromValues(1.3, -2.0, -2.5),
        glMatrix.vec3.fromValues(1.5, 2.0, -2.5),
        glMatrix.vec3.fromValues(1.5, 0.2, -1.5),
        glMatrix.vec3.fromValues(-1.3, 1.0, -1.5)
    ]

    let positionLoc = 0, texCoordLoc = 1;

    let vao = gl.createVertexArray();
    let vbo = gl.createBuffer();

    gl.bindVertexArray(vao);

    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    gl.vertexAttribPointer(positionLoc, 3, gl.FLOAT, gl.FALSE, 5 * vertices.BYTES_PER_ELEMENT, 0);
    gl.enableVertexAttribArray(positionLoc);

    gl.vertexAttribPointer(texCoordLoc, 2, gl.FLOAT, gl.FALSE, 5 * vertices.BYTES_PER_ELEMENT, 3 * vertices.BYTES_PER_ELEMENT);
    gl.enableVertexAttribArray(texCoordLoc);

    let texture1 = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture1);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);


    let img1 = await loadImage("../../resources/textures/container.jpg");

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img1);
    gl.generateMipmap(gl.TEXTURE_2D);


    let texture2 = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture2);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.MIRRORED_REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.MIRRORED_REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

    let img2 = await loadImage("../../resources/textures/awesomeface.png");
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img2);
    gl.generateMipmap(gl.TEXTURE_2D);

    shader.use();
    gl.uniform1i(gl.getUniformLocation(shader.ID, "texture1"), 0);
    shader.setInt("texture2", 1);

    let projectionLoc = gl.getUniformLocation(shader.ID, "projection");
    let modelLoc = gl.getUniformLocation(shader.ID, "model");
    let viewLoc = gl.getUniformLocation(shader.ID, "view");
    shader.use();
    
    let projection = glMatrix.mat4.create();
    glMatrix.mat4.perspective(projection, glMatrix.glMatrix.toRadian(45), gl.canvas.width / gl.canvas.height, 0.1, 100)
    gl.uniformMatrix4fv(projectionLoc, false, projection);
    
    function render(time) {
        let currentFrame = Math.round(time) / 1000;
        deltaTime = Math.floor(currentFrame * 1000 - lastFrame * 1000)/1000;
        lastFrame = currentFrame;
        gl.clearColor(0.2, 0.3, 0.3, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture1);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, texture2);
        gl.bindVertexArray(vao);

        let view = glMatrix.mat4.create();
        let radius = 10.0;

        let cameraTarget = glMatrix.vec3.create();
        glMatrix.vec3.add(cameraTarget, cameraPos, cameraFront)
        glMatrix.mat4.lookAt(view, cameraPos, cameraTarget, cameraUp);

        gl.uniformMatrix4fv(viewLoc, false, view);

        for (let i = 0; i < cubePositions.length; i++) {
            let model = glMatrix.mat4.create();
            glMatrix.mat4.translate(model, model, cubePositions[i]);
            let angle = 20 * i;
            if (i % 2 == 0) {
                angle = time / 1000 * 25;
            }
            glMatrix.mat4.rotate(model, model, glMatrix.glMatrix.toRadian(angle), glMatrix.vec3.fromValues(1.0, 0.3, 0.5));
            gl.uniformMatrix4fv(modelLoc, false, model);
            gl.drawArrays(gl.TRIANGLES, 0, 36);
        }

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
