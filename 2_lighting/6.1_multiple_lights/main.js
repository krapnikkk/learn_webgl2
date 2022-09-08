async function main() {
    let stats = new Stats();
    document.body.appendChild(stats.dom);

    const gl = document.getElementById("canvas").getContext("webgl2");
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);

    gl.enable(gl.DEPTH_TEST);

    let lightShader = new Shader(gl, "light.vs", "light.fs");
    await lightShader.initialize();


    let lightCubeShader = new Shader(gl, "cube.vs", "cube.fs"); // light source
    await lightCubeShader.initialize();

    let cameraPos = glMatrix.vec3.fromValues(0, 0, 3);
    let camera = new Camera(cameraPos);

    // timing
    let deltaTime = 0.0;	// time between current frame and last frame
    let lastFrame = 0.0;
    let isFirstMouse = true;
    let lastX = gl.drawingBufferWidth / 2, lastY = gl.drawingBufferHeight / 2;
    let lightPos = glMatrix.vec3.fromValues(1.2, 1.0, 2.0);
    // dirLightDir 
    let dirLight = {
        specular: [1 * 255, 1 * 255, 1 * 255],
        diffuse: [0.5 * 255, 0.5 * 255, 0.5 * 255],
        ambient: [0.2 * 255, 0.2 * 255, 0.2 * 255],
        direction: glMatrix.vec3.fromValues(0, 0, -1)
    };
    // material
    let material = {
        shininess: 4
    };

    // pointLight
    const NR_POINT_LIGHTS = 4;
    let pointLight = {
        specular: [1 * 255, 1 * 255, 1 * 255],
        diffuse: [0.5 * 255, 0.5 * 255, 0.5 * 255],
        ambient: [0.2 * 255, 0.2 * 255, 0.2 * 255],
        distance: "50"
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

    // spotLight
    let spotLight = {
        specular: [1 * 255, 1 * 255, 1 * 255],
        diffuse: [0.5 * 255, 0.5 * 255, 0.5 * 255],
        ambient: [0.2 * 255, 0.2 * 255, 0.2 * 255],
        distance: "50",
        direction: glMatrix.vec3.fromValues(0, 0, -1),
        position: glMatrix.vec3.fromValues(0.0, 0.0, 2.0),
        cutOff: 12.5,
        outerCutOff: 15
    };

    addGUI(lightShader);

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
    ];

    let pointLightPositions = [
        glMatrix.vec3.fromValues(0.7, 0.2, 2.0),
        glMatrix.vec3.fromValues(2.3, -3.3, -4.0),
        glMatrix.vec3.fromValues(-4.0, 2.0, -12.0),
        glMatrix.vec3.fromValues(0.0, 0.0, -3.0)
    ];

    let positionLoc = 0, normalLoc = 1, texCoords = 2;

    let cubeVao = gl.createVertexArray();
    let vbo = gl.createBuffer();

    gl.bindVertexArray(cubeVao);

    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    gl.vertexAttribPointer(positionLoc, 3, gl.FLOAT, gl.FALSE, 8 * vertices.BYTES_PER_ELEMENT, 0);
    gl.enableVertexAttribArray(positionLoc);
    gl.vertexAttribPointer(normalLoc, 3, gl.FLOAT, gl.FALSE, 8 * vertices.BYTES_PER_ELEMENT, 3 * vertices.BYTES_PER_ELEMENT);
    gl.enableVertexAttribArray(normalLoc);
    gl.vertexAttribPointer(texCoords, 2, gl.FLOAT, gl.FALSE, 8 * vertices.BYTES_PER_ELEMENT, 6 * vertices.BYTES_PER_ELEMENT);
    gl.enableVertexAttribArray(texCoords);

    let lightCubeVao = gl.createVertexArray();
    gl.bindVertexArray(lightCubeVao);

    gl.vertexAttribPointer(positionLoc, 3, gl.FLOAT, gl.FALSE, 8 * vertices.BYTES_PER_ELEMENT, 0);
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
        lightShader.setVec3("viewPos", camera.position);
        lightShader.setFloat("material.shininess", Math.pow(2, material.shininess));

        // dirLight
        // lightShader.setVec3("light.position", lightPos);
        lightShader.setVec3("dirLight.direction", dirLight.direction);
        lightShader.setVec3("dirLight.specular", glMatrix.vec3.clone(dirLight.specular.map((c) => c / 255)));
        lightShader.setVec3("dirLight.diffuse", glMatrix.vec3.clone(dirLight.diffuse.map((c) => c / 255)));
        lightShader.setVec3("dirLight.ambient", glMatrix.vec3.clone(dirLight.ambient.map((c) => c / 255)));

        // pointLight 
        for (let i = 0; i < NR_POINT_LIGHTS; i++) {
            let { constant, linear, quadratic } = distanceMap[pointLight.distance];
            lightShader.setVec3(`pointLights[${i}].position`, pointLightPositions[i]);
            lightShader.setVec3(`pointLights[${i}].ambient`, glMatrix.vec3.clone(pointLight.ambient.map((c) => c / 255)));
            lightShader.setVec3(`pointLights[${i}].diffuse`, glMatrix.vec3.clone(pointLight.diffuse.map((c) => c / 255)));
            lightShader.setVec3(`pointLights[${i}].specular`, glMatrix.vec3.clone(pointLight.specular.map((c) => c / 255)));
            lightShader.setFloat(`pointLights[${i}].constant`, constant);
            lightShader.setFloat(`pointLights[${i}].linear`, linear);
            lightShader.setFloat(`pointLights[${i}].quadratic`, quadratic);
        }

        // spotLight
        let { constant, linear, quadratic } = distanceMap[spotLight.distance];
        lightShader.setVec3("spotLight.direction", spotLight.direction);
        lightShader.setVec3("spotLight.position", spotLight.position);
        lightShader.setVec3("spotLight.specular", glMatrix.vec3.clone(spotLight.specular.map((c) => c / 255)));
        lightShader.setVec3("spotLight.diffuse", glMatrix.vec3.clone(spotLight.diffuse.map((c) => c / 255)));
        lightShader.setVec3("spotLight.ambient", glMatrix.vec3.clone(spotLight.ambient.map((c) => c / 255)));
        lightShader.setFloat(`spotLight.constant`, constant);
        lightShader.setFloat(`spotLight.linear`, linear);
        lightShader.setFloat(`spotLight.quadratic`, quadratic);


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

        lightCubeShader.use();
        lightCubeShader.setMat4("projection", projection);
        lightCubeShader.setMat4("view", view);

        gl.bindVertexArray(lightCubeVao);
        for (let i = 0; i < NR_POINT_LIGHTS; i++) {
            model = glMatrix.mat4.identity(model);
            glMatrix.mat4.translate(model, model, pointLightPositions[i]);
            glMatrix.mat4.scale(model, model, glMatrix.mat4.fromValues(0.2, 0.2, 0.2));
            lightCubeShader.setMat4("model", model);
            gl.drawArrays(gl.TRIANGLES, 0, 36);
        }

        stats.update();
        requestAnimationFrame(render);
    }

    requestAnimationFrame(render);

    function addGUI() {
        const materialGUI = new dat.GUI({ name: "material" });
        let materialSpecularFolder = materialGUI.addFolder("Material");
        materialSpecularFolder.add(material, "shininess", 1, 8, 1)

        const dirLightGUI = new dat.GUI({ name: "dirLight" });
        let dirLightSpecularFolder = dirLightGUI.addFolder("Specular");
        let dirLightDiffuseFolder = dirLightGUI.addFolder("Diffuse");
        let dirlightAmbientFolder = dirLightGUI.addFolder("Ambient");
        let dirLightDirFolder = dirLightGUI.addFolder("direction");
        dirLightSpecularFolder.addColor(dirLight, "specular")
        dirLightDiffuseFolder.addColor(dirLight, "diffuse")
        dirlightAmbientFolder.addColor(dirLight, "ambient")

        dirLightDirFolder.add(dirLight.direction, 0, -10, 10, 0.1);
        dirLightDirFolder.add(dirLight.direction, 1, -10, 10, 0.1);
        dirLightDirFolder.add(dirLight.direction, 2, -10, 10, 0.1);

        const pointLightGUI = new dat.GUI({ name: "pointLight" });
        let pointLightSpecularFolder = pointLightGUI.addFolder("Specular");
        let pointLightDiffuseFolder = pointLightGUI.addFolder("Diffuse");
        let pointlightAmbientFolder = pointLightGUI.addFolder("Ambient");
        let pointLightDistanceFolder = pointLightGUI.addFolder("cover distance");
        pointLightSpecularFolder.addColor(pointLight, "specular")
        pointLightDiffuseFolder.addColor(pointLight, "diffuse")
        pointlightAmbientFolder.addColor(pointLight, "ambient")
        pointLightDistanceFolder.add(pointLight, "distance", Object.keys(distanceMap));

        const spotLightGUI = new dat.GUI({ name: "spotLight" });
        let spotLightSpecularFolder = spotLightGUI.addFolder("Specular");
        let spotLightDiffuseFolder = spotLightGUI.addFolder("Diffuse");
        let spotlightAmbientFolder = spotLightGUI.addFolder("Ambient");
        let spotLightDistanceFolder = spotLightGUI.addFolder("cover distance");
        let spotLightDirFolder = spotLightGUI.addFolder("spotLight direction");
        let spotLightPositionFolder = spotLightGUI.addFolder("spotLight position");
        let spotLightcutOffFolder = spotLightGUI.addFolder("cutOff");

        spotLightSpecularFolder.addColor(spotLight, "specular")
        spotLightDiffuseFolder.addColor(spotLight, "diffuse")
        spotlightAmbientFolder.addColor(spotLight, "ambient")

        spotLightDistanceFolder.add(spotLight, "distance", Object.keys(distanceMap));
        spotLightcutOffFolder.add(spotLight, "cutOff", 0, 360, 1)
        spotLightcutOffFolder.add(spotLight, "outerCutOff", 0, 360, 1)

        spotLightDirFolder.add(spotLight.direction, 0, -10, 10, 0.1);
        spotLightDirFolder.add(spotLight.direction, 1, -10, 10, 0.1);
        spotLightDirFolder.add(spotLight.direction, 2, -10, 10, 0.1);

        spotLightPositionFolder.add(spotLight.position, 0, -10, 10, 0.1);
        spotLightPositionFolder.add(spotLight.position, 1, -10, 10, 0.1);
        spotLightPositionFolder.add(spotLight.position, 2, -10, 10, 0.1);

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
