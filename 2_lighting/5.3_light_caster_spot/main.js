async function main() {
    let stats = new Stats();
    document.body.appendChild(stats.dom);

    const gl = document.getElementById("canvas").getContext("webgl2");
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);

    gl.enable(gl.DEPTH_TEST);

    let lightShader = new Shader(gl, "light.vs", "light.fs");
    await lightShader.initialize();

    let cameraPos = glMatrix.vec3.fromValues(0, 0, 3);
    let camera = new Camera(cameraPos);
  
    // timing
    let deltaTime = 0.0;	// time between current frame and last frame
    let lastFrame = 0.0;
    let isFirstMouse = true;
    let lastX = gl.drawingBufferWidth / 2, lastY = gl.drawingBufferHeight / 2;
    let lightPos = glMatrix.vec3.fromValues(0.0, 0.0, 2.0);
    let direction = glMatrix.vec3.fromValues(0, 0, -1);

    addGUI(lightShader);

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

    gl.vertexAttribPointer(positionLoc, 3, gl.FLOAT, false, 8 * vertices.BYTES_PER_ELEMENT, 0);
    gl.enableVertexAttribArray(positionLoc);

    let diffuseMap = await loadTexture(gl, "../../resources/textures/container2.png");
    let specularMap = await loadTexture(gl, "../../resources/textures/container2_specular.png");
    lightShader.use();
    lightShader.setInt("material.diffuse", 0);
    lightShader.setInt("material.specular", 1);

    let projection = glMatrix.mat4.create();

    function render(time) {
        let currentFrame = Math.round(time) / 1000;
        deltaTime = Math.floor(currentFrame * 1000 - lastFrame * 1000) / 1000;
        lastFrame = currentFrame;

        gl.clearColor(0.1, 0.1, 0.1, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // let x = 1.0 + Math.sin(currentFrame) * 2.0, y = Math.cos(currentFrame) * 2.0;
        // glMatrix.vec3.set(lightPos, x, y, lightPos[2]);

        lightShader.use();
        lightShader.setVec3("light.position", lightPos);
        lightShader.setVec3("light.direction", direction);

        lightShader.setVec3("viewPos", camera.position);

        // lightShader.setVec3("light.position", camera.position);
        // lightShader.setVec3("light.direction", camera.front);
        lightShader.setFloat("light.cutOff", Math.cos(glMatrix.glMatrix.toRadian(12.5)));

        glMatrix.mat4.perspective(projection, glMatrix.glMatrix.toRadian(camera.zoom), gl.drawingBufferWidth / gl.drawingBufferHeight, 0.1, 100)
        let view = camera.getViewMatrix();
        lightShader.setMat4("projection", projection);
        lightShader.setMat4("view", view);

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
            lightShader.setMat4("model", model);
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
        let light = {
            specular: [1 * 255, 1 * 255, 1 * 255],
            diffuse: [0.5 * 255, 0.5 * 255, 0.5 * 255],
            ambient: [0.2 * 255, 0.2 * 255, 0.2 * 255]
        }
        shader.setVec3("light.specular", glMatrix.vec3.clone(light.specular.map((c) => c / 255)));
        shader.setVec3("light.diffuse", glMatrix.vec3.clone(light.diffuse.map((c) => c / 255)));
        shader.setVec3("light.ambient", glMatrix.vec3.clone(light.ambient.map((c) => c / 255)));
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

        let attenuationFolder = lightGUI.addFolder("cover distance");
        shader.setFloat("light.constant", 1);
        shader.setFloat("light.linear", 0.09);
        shader.setFloat("light.quadratic", 0.032);
        var attenuationMap =
        {
            distance: "32"
        },
            distanceMap = {
                "7": { constant: 1, linear: 0.7, quadratic: 1.8 },
                "13": { constant: 1, linear: 0.35, quadratic: 0.44 },
                "20": { constant: 1, linear: 0.22, quadratic: 0.2 },
                "32": { constant: 1, linear: 0.14, quadratic: 0.07 },
                "50": { constant: 1, linear: 0.09, quadratic: 0.032 },
                "65": { constant: 1, linear: 0.07, quadratic: 0.017 },
                "100": { constant: 1, linear: 0.045, quadratic: 0.0075 }
            };

        attenuationFolder.add(attenuationMap, 'distance', ["7", "13", "20", "32", "50", "65", "100"]).onChange((val) => {
            let { constant, linear, quadratic } = distanceMap[val];
            shader.use();
            shader.setFloat("light.constant", constant);
            shader.setFloat("light.linear", linear);
            shader.setFloat("light.quadratic", quadratic);
        })

        let lightPosFolder = lightGUI.addFolder("lightPos");
        lightPosFolder.add(lightPos,0,-10,10,0.1);
        lightPosFolder.add(lightPos,1,-10,10,0.1);
        lightPosFolder.add(lightPos,2,-10,10,0.1);

        let lightDirFolder = lightGUI.addFolder("direction");
        lightDirFolder.add(direction,0,-10,10,0.1);
        lightDirFolder.add(direction,1,-10,10,0.1);
        lightDirFolder.add(direction,2,-10,10,0.1);
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
