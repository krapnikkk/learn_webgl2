async function main() {
    let stats = new Stats();
    document.body.appendChild(stats.dom);

    const gl = document.getElementById("canvas").getContext("webgl2");
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);

    gl.enable(gl.DEPTH_TEST);

    let lightingShader = new Shader(gl, "light.vs", "light.fs");
    await lightingShader.initialize();

    let cameraPos = glMatrix.vec3.fromValues(0, 0, 3);
    let camera = new Camera(cameraPos);

    addGUI(lightingShader);

    // timing
    let deltaTime = 0.0;	// time between current frame and last frame
    let lastFrame = 0.0;
    let isFirstMouse = true;
    let lastX = gl.drawingBufferWidth / 2, lastY = gl.drawingBufferHeight / 2;

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

    let diffuseMap = await loadTexture(gl, "../../resources/textures/container2.png");
    let specularMap = await loadTexture(gl, "../../resources/textures/container2_specular.png");
    lightingShader.use();
    lightingShader.setInt("material.diffuse", 0);
    lightingShader.setInt("material.specular", 1);

    let projection = glMatrix.mat4.create();

    function render(time) {
        let currentFrame = Math.round(time) / 1000;
        deltaTime = Math.floor(currentFrame * 1000 - lastFrame * 1000) / 1000;
        lastFrame = currentFrame;

        gl.clearColor(0.1, 0.1, 0.1, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        lightingShader.use();
        // lightingShader.setVec3("light.direction", glMatrix.vec3.fromValues(-0.2, -1, -0.3));
        lightingShader.setVec3("viewPos", camera.position);

        glMatrix.mat4.perspective(projection, glMatrix.glMatrix.toRadian(camera.zoom), gl.drawingBufferWidth / gl.drawingBufferHeight, 0.1, 100)
        let view = camera.getViewMatrix();
        lightingShader.setMat4("projection", projection);
        lightingShader.setMat4("view", view);

        let model = glMatrix.mat4.create();

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, diffuseMap);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, specularMap);

        gl.bindVertexArray(cubeVao);
        for (let i = 0; i < cubePositions.length; i++) {
            model = glMatrix.mat4.identity(model);
            glMatrix.mat4.translate(model, model, cubePositions[i]);
            glMatrix.mat4.rotate(model, model, 20 * i, glMatrix.vec3.fromValues(1, 0.3, 0.5));
            lightingShader.setMat4("model", model);
            gl.drawArrays(gl.TRIANGLES, 0, 36);
        }

        stats.update();
        requestAnimationFrame(render);
    }

    requestAnimationFrame(render);

    function addGUI(shader) {
        const materialGUI = new dat.GUI({ name: "material" });
        let materialSpecularFolder = materialGUI.addFolder("Specular");
        let specular = {
            shininess: 4
        }

        shader.use();
        shader.setFloat("material.shininess", Math.pow(2, specular.shininess));

        materialSpecularFolder.add(specular, "shininess", 1, 8, 1).onChange((shininess) => {
            shader.use();
            shader.setFloat("material.shininess", Math.pow(2, shininess));
        })

        const lightGUI = new dat.GUI({ name: "light" });
        let lightSpecularFolder = lightGUI.addFolder("Specular");
        let lightDiffuseFolder = lightGUI.addFolder("Diffuse");
        let lightAmbientFolder = lightGUI.addFolder("Ambient");
        let lightDirectionFolder = lightGUI.addFolder("Direction");
        let light = {
            specular: [1 * 255, 1 * 255, 1 * 255],
            diffuse: [0.5 * 255, 0.5 * 255, 0.5 * 255],
            ambient: [0.2 * 255, 0.2 * 255, 0.2 * 255],
            direction: {
                x: -0.2, y: -1, z: -0.3
            }
        }
        shader.setVec3("light.specular", glMatrix.vec3.clone(light.specular.map((c) => c / 255)));
        shader.setVec3("light.diffuse", glMatrix.vec3.clone(light.diffuse.map((c) => c / 255)));
        shader.setVec3("light.ambient", glMatrix.vec3.clone(light.ambient.map((c) => c / 255)));
        shader.setVec3("light.direction", glMatrix.vec3.clone(Object.values(light.direction)));
        lightSpecularFolder.addColor(light, "specular").onChange((val) => {
            shader.use();
            light.specular = val;
            shader.setVec3("light.specular", glMatrix.vec3.clone(light.specular.map((c) => c / 255)));
        })

        lightDiffuseFolder.addColor(light, "diffuse").onChange((val) => {
            shader.use();
            light.diffuse = val;
            shader.setVec3("light.diffuse", glMatrix.vec3.clone(light.diffuse.map((c) => c / 255)));
        })
        lightAmbientFolder.addColor(light, "ambient").onChange((val) => {
            shader.use();
            light.ambient = val;
            shader.setVec3("light.ambient", glMatrix.vec3.clone(light.ambient.map((c) => c / 255)));
        })
        lightDirectionFolder.add(light.direction,"x",-10,10,0.1).onChange((val) => {
            shader.use();
            light.direction.x = val;
            shader.setVec3("light.direction", glMatrix.vec3.clone(Object.values(light.direction)));
        })
        lightDirectionFolder.add(light.direction,"y",-10,10,0.1).onChange((val) => {
            shader.use();
            light.direction.y = val;
            shader.setVec3("light.direction", glMatrix.vec3.clone(Object.values(light.direction)));
        })
        lightDirectionFolder.add(light.direction,"z",-10,10,0.1).onChange((val) => {
            shader.use();
            light.direction.z = val;
            shader.setVec3("light.direction", glMatrix.vec3.clone(Object.values(light.direction)));
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
