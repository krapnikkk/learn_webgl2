async function main() {
    let stats = new Stats();
    document.body.appendChild(stats.dom);

    const gl = document.getElementById("canvas").getContext("webgl2");
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);

    gl.enable(gl.DEPTH_TEST);

    let lightingShader = new Shader(gl, "light.vs", "light.fs");
    await lightingShader.initialize();


    let cubeShader = new Shader(gl, "cube.vs", "cube.fs");
    await cubeShader.initialize();

    let cameraPos = glMatrix.vec3.fromValues(0.0, 0.0, 3.0);
    let camera = new Camera(cameraPos);

    const gui = new dat.GUI({ name: "lighting" });
    addGUI(lightingShader);

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
        if(moveLock){
            moveLock = false;
        }else{
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

    let vertices = new Float32Array([
        // positions          // normals           // texture coords
        -0.5, -0.5, -0.5, 0.0, 0.0, -1.0, 0.0, 0.0,
        0.5, -0.5, -0.5, 0.0, 0.0, -1.0, 1.0, 0.0,
        0.5, 0.5, -0.5, 0.0, 0.0, -1.0, 1.0, 1.0,
        0.5, 0.5, -0.5, 0.0, 0.0, -1.0, 1.0, 1.0,
        -0.5, 0.5, -0.5, 0.0, 0.0, -1.0, 0.0, 1.0,
        -0.5, -0.5, -0.5, 0.0, 0.0, -1.0, 0.0, 0.0,

        -0.5, -0.5, 0.5, 0.0, 0.0, 1.0, 0.0, 0.0,
        0.5, -0.5, 0.5, 0.0, 0.0, 1.0, 1.0, 0.0,
        0.5, 0.5, 0.5, 0.0, 0.0, 1.0, 1.0, 1.0,
        0.5, 0.5, 0.5, 0.0, 0.0, 1.0, 1.0, 1.0,
        -0.5, 0.5, 0.5, 0.0, 0.0, 1.0, 0.0, 1.0,
        -0.5, -0.5, 0.5, 0.0, 0.0, 1.0, 0.0, 0.0,

        -0.5, 0.5, 0.5, -1.0, 0.0, 0.0, 1.0, 0.0,
        -0.5, 0.5, -0.5, -1.0, 0.0, 0.0, 1.0, 1.0,
        -0.5, -0.5, -0.5, -1.0, 0.0, 0.0, 0.0, 1.0,
        -0.5, -0.5, -0.5, -1.0, 0.0, 0.0, 0.0, 1.0,
        -0.5, -0.5, 0.5, -1.0, 0.0, 0.0, 0.0, 0.0,
        -0.5, 0.5, 0.5, -1.0, 0.0, 0.0, 1.0, 0.0,

        0.5, 0.5, 0.5, 1.0, 0.0, 0.0, 1.0, 0.0,
        0.5, 0.5, -0.5, 1.0, 0.0, 0.0, 1.0, 1.0,
        0.5, -0.5, -0.5, 1.0, 0.0, 0.0, 0.0, 1.0,
        0.5, -0.5, -0.5, 1.0, 0.0, 0.0, 0.0, 1.0,
        0.5, -0.5, 0.5, 1.0, 0.0, 0.0, 0.0, 0.0,
        0.5, 0.5, 0.5, 1.0, 0.0, 0.0, 1.0, 0.0,

        -0.5, -0.5, -0.5, 0.0, -1.0, 0.0, 0.0, 1.0,
        0.5, -0.5, -0.5, 0.0, -1.0, 0.0, 1.0, 1.0,
        0.5, -0.5, 0.5, 0.0, -1.0, 0.0, 1.0, 0.0,
        0.5, -0.5, 0.5, 0.0, -1.0, 0.0, 1.0, 0.0,
        -0.5, -0.5, 0.5, 0.0, -1.0, 0.0, 0.0, 0.0,
        -0.5, -0.5, -0.5, 0.0, -1.0, 0.0, 0.0, 1.0,

        -0.5, 0.5, -0.5, 0.0, 1.0, 0.0, 0.0, 1.0,
        0.5, 0.5, -0.5, 0.0, 1.0, 0.0, 1.0, 1.0,
        0.5, 0.5, 0.5, 0.0, 1.0, 0.0, 1.0, 0.0,
        0.5, 0.5, 0.5, 0.0, 1.0, 0.0, 1.0, 0.0,
        -0.5, 0.5, 0.5, 0.0, 1.0, 0.0, 0.0, 0.0,
        -0.5, 0.5, -0.5, 0.0, 1.0, 0.0, 0.0, 1.0
    ]);

    let positionLoc = 0, normalLoc = 1, texCoords = 2;

    let cubeVao = gl.createVertexArray();
    let vbo = gl.createBuffer();

    gl.bindVertexArray(cubeVao);

    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    gl.vertexAttribPointer(positionLoc, 3, gl.FLOAT, false, 8 * vertices.BYTES_PER_ELEMENT, 0);
    gl.enableVertexAttribArray(positionLoc);
    gl.vertexAttribPointer(normalLoc, 3, gl.FLOAT, false, 8 * vertices.BYTES_PER_ELEMENT, 3 * vertices.BYTES_PER_ELEMENT);
    gl.enableVertexAttribArray(normalLoc);
    gl.vertexAttribPointer(texCoords, 2, gl.FLOAT, false, 8 * vertices.BYTES_PER_ELEMENT, 6 * vertices.BYTES_PER_ELEMENT);
    gl.enableVertexAttribArray(texCoords);


    let lightCubeVao = gl.createVertexArray();
    gl.bindVertexArray(lightCubeVao);
    // we only need to bind to the VBO (to link it with glVertexAttribPointer), no need to fill it; the VBO's data already contains all we need (it's already bound, but we do it again for educational purposes)
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);

    gl.vertexAttribPointer(positionLoc, 3, gl.FLOAT, false, 8 * vertices.BYTES_PER_ELEMENT, 0);
    gl.enableVertexAttribArray(positionLoc);

    let diffuseMap = await loadTexture(gl, "../../resources/textures/container2.png");
    lightingShader.use();
    // lightingShader.setInt("material.diffuse",0); // gl.TEXTURE0

    let projection = glMatrix.mat4.create();

    function render(time) {
        let currentFrame = Math.round(time) / 1000;
        deltaTime = Math.floor(currentFrame * 1000 - lastFrame * 1000) / 1000;
        lastFrame = currentFrame;

        gl.clearColor(0.1, 0.1, 0.1, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        let x = 1.0 + Math.sin(currentFrame) * 2.0, y = Math.sin(currentFrame / 2);
        glMatrix.vec3.set(lightPos, x, y, lightPos[2]);

        lightingShader.use();
        lightingShader.setVec3("light.position", lightPos);
        lightingShader.setVec3("viewPos", camera.position);

        lightingShader.setVec3("light.ambient", glMatrix.vec3.fromValues(0.2, 0.2, 0.2));
        lightingShader.setVec3("light.diffuse", glMatrix.vec3.fromValues(0.5, 0.5, 0.5));
        lightingShader.setVec3("light.specular", glMatrix.vec3.fromValues(1.0, 1.0, 1.0));


        lightingShader.setVec3("material.specular", glMatrix.vec3.fromValues(0.5, 0.5, 0.5));

        glMatrix.mat4.perspective(projection, glMatrix.glMatrix.toRadian(camera.zoom), gl.drawingBufferWidth / gl.drawingBufferHeight, 0.1, 100)
        let view = camera.getViewMatrix();
        lightingShader.setMat4("projection", projection);
        lightingShader.setMat4("view", view);

        let model = glMatrix.mat4.identity(glMatrix.mat4.create());
        lightingShader.setMat4("model", model);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, diffuseMap);

        gl.bindVertexArray(cubeVao);
        gl.drawArrays(gl.TRIANGLES, 0, 36);

        cubeShader.use();
        cubeShader.setMat4("projection", projection);
        cubeShader.setMat4("view", view);

        model = glMatrix.mat4.identity(model);
        glMatrix.mat4.translate(model, model, lightPos);
        glMatrix.mat4.scale(model, model, glMatrix.vec3.fromValues(0.2, 0.2, 0.2));
        cubeShader.setMat4("model", model);
        // lightCube
        gl.bindVertexArray(lightCubeVao);
        gl.drawArrays(gl.TRIANGLES, 0, 36);

        stats.update();
        requestAnimationFrame(render);
    }

    requestAnimationFrame(render);

    function addGUI(shader) {
        let specularFolder = gui.addFolder("Specular");
        let specular = {
            shininess: 8
        }
        
        shader.use();
        shader.setFloat("material.shininess", Math.pow(2,specular.shininess));

        specularFolder.add(specular, "shininess", 1, 8,1).onChange((shininess) => {
            shader.use();
            shader.setFloat("material.shininess", Math.pow(2, shininess));
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



async function loadTexture(gl, url) {
    let img = await loadImage(url);

    let texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
    gl.generateMipmap(gl.TEXTURE_2D);


    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
    return texture
}
