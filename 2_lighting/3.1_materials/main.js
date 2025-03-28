async function main() {
    let stats = new Stats();
    document.body.appendChild(stats.dom);

    const gl = document.getElementById("canvas").getContext("webgl2");
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);

    gl.enable(gl.DEPTH_TEST);

    let lightingShader = new Shader(gl, "light.vs", "light.fs");
    await lightingShader.initialize();
    lightingShader.use();
    lightingShader.setVec3("material.ambient", glMatrix.vec3.fromValues(1.0, 0.5, 0.31));
    lightingShader.setFloat("material.diffuse", glMatrix.vec3.fromValues(1.0, 0.5, 0.31));
    lightingShader.setFloat("material.specular", glMatrix.vec3.fromValues(0.5, 0.5, 0.5));
    lightingShader.setFloat("material.shininess", 32.0);

    let cubeShader = new Shader(gl, "cube.vs", "cube.fs");
    await cubeShader.initialize();

    let cameraPos = glMatrix.vec3.fromValues(0.0, 0.0, 3.0);
    let camera = new Camera(cameraPos);

    // const gui = new dat.GUI({ name: "lighting" });
    // addGUI(lightingShader);

    // timing
    let deltaTime = 0.0;	// time between current frame and last frame
    let lastFrame = 0.0;
    let isFirstMouse = true;
    let lastX = gl.drawingBufferWidth / 2, lastY = gl.drawingBufferHeight / 2;
    let lightPos = glMatrix.vec3.fromValues(1.2, 1.0, 2.0);

    let moveLock = true;
    document.onkeydown = (e) => {
        camera.onKeydown(e.code, deltaTime);

        if (e.code == "Escape") {
            moveLock = true;
        }
    }

    canvas.onclick = (e) => {
        moveLock = false;
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

    let vertices = new Float32Array([
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

    let positionLoc = 0, normalLoc = 1;

    let cubeVao = gl.createVertexArray();
    let vbo = gl.createBuffer();

    gl.bindVertexArray(cubeVao);

    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    gl.vertexAttribPointer(positionLoc, 3, gl.FLOAT, false, 6 * vertices.BYTES_PER_ELEMENT, 0);
    gl.enableVertexAttribArray(positionLoc);
    gl.vertexAttribPointer(normalLoc, 3, gl.FLOAT, false, 6 * vertices.BYTES_PER_ELEMENT, 3 * vertices.BYTES_PER_ELEMENT);
    gl.enableVertexAttribArray(normalLoc);

    
    let lightCubeVao = gl.createVertexArray();
    gl.bindVertexArray(lightCubeVao);
    // we only need to bind to the VBO (to link it with glVertexAttribPointer), no need to fill it; the VBO's data already contains all we need (it's already bound, but we do it again for educational purposes)
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);

    gl.vertexAttribPointer(positionLoc, 3, gl.FLOAT, false, 6 * vertices.BYTES_PER_ELEMENT, 0);
    gl.enableVertexAttribArray(positionLoc);


    let projection = glMatrix.mat4.create();

    function render(time) {
        let currentFrame = Math.round(time) / 1000;
        deltaTime = Math.floor(currentFrame * 1000 - lastFrame * 1000) / 1000;
        lastFrame = currentFrame;

        gl.clearColor(0.1, 0.1, 0.1, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        lightingShader.use();
        lightingShader.setVec3("light.position", lightPos);
        lightingShader.setVec3("viewPos", camera.position);

        let x = Math.sin(currentFrame * 2),
            y = Math.sin(currentFrame * 0.7),
            z = Math.sin(currentFrame * 1.3);
        let lightColor = glMatrix.vec3.fromValues(x, y, z);
        let diffuseColor = glMatrix.vec3.scale(glMatrix.vec3.create(), lightColor, 0.5);
        let ambientColor = glMatrix.vec3.scale(glMatrix.vec3.create(), diffuseColor, 0.2);
        lightingShader.setVec3("light.ambient", ambientColor);
        lightingShader.setVec3("light.diffuse", diffuseColor);
        lightingShader.setVec3("light.specular", glMatrix.vec3.fromValues(1.0, 1.0, 1.0));


        lightingShader.setVec3("material.ambient", glMatrix.vec3.fromValues(1.0, 0.5, 0.31));
        lightingShader.setVec3("material.diffuse", glMatrix.vec3.fromValues(1.0, 0.5, 0.31));
        lightingShader.setVec3("material.specular", glMatrix.vec3.fromValues(0.5, 0.5, 0.5));
        lightingShader.setFloat("material.shininess", 32);


        glMatrix.mat4.perspective(projection, glMatrix.glMatrix.toRadian(camera.zoom), gl.drawingBufferWidth / gl.drawingBufferHeight, 0.1, 100)
        let view = camera.getViewMatrix();
        lightingShader.setMat4("projection", projection);
        lightingShader.setMat4("view", view);

        let model = glMatrix.mat4.identity(glMatrix.mat4.create());
        lightingShader.setMat4("model", model);

        gl.bindVertexArray(cubeVao);
        gl.drawArrays(gl.TRIANGLES, 0, 36);

        cubeShader.use();
        cubeShader.setMat4("projection", projection);
        cubeShader.setMat4("view", view);

        model = glMatrix.mat4.identity(model);
        glMatrix.mat4.translate(model, model, lightPos);
        glMatrix.mat4.scale(model, model, glMatrix.vec3.fromValues(0.2, 0.2, 0.2));
        cubeShader.setMat4("model", model);

        gl.bindVertexArray(lightCubeVao);
        gl.drawArrays(gl.TRIANGLES, 0, 36);

        stats.update();
        requestAnimationFrame(render);
    }

    requestAnimationFrame(render);

    function addGUI(shader) {
        let ambientFolder = gui.addFolder("Ambient");
        let specularFolder = gui.addFolder("Specular");
        let ambient = {
            ambientStrength: 0.1
        },
            specular = {
                shininess: 2,
                specularStrength: 0.5
            }

        ambientFolder.add(ambient, "ambientStrength", 0, 1).onChange((ambientStrength) => {
            shader.use();
            shader.setFloat("ambientStrength", ambientStrength);
        })

        specularFolder.add(specular, "shininess", 1, 8).onChange((shininess) => {
            shader.use();
            shader.setFloat("shininess", Math.pow(2, shininess));
        })

        specularFolder.add(specular, "specularStrength", 0, 1).onChange((specularStrength) => {
            shader.use();
            shader.setFloat("specularStrength", specularStrength);
        })
    }
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
