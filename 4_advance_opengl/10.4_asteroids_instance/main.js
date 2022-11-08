let cameraPos = glMatrix.vec3.fromValues(0.0, 0.0, 55.0);
let camera = new Camera(cameraPos);

const SCR_WIDTH = 800;
const SCR_HEIGHT = 600;

let deltaTime = 0.0;	// time between current frame and last frame
let lastFrame = 0.0;
let isFirstMouse = true;
let lastX = SCR_WIDTH / 2, lastY = SCR_HEIGHT / 2;

let rock = {
    amount: 1000,
    radius: 50.0,
    offset: 2.5
}
let modelMatrices = [];


function updateModel(options) {
    let { offset, radius, amount } = options;
    let len = modelMatrices.length;
    // if (len > amount) {
    //     modelMatrices.splice(amount, len - amount); // todo
    //     return;
    // }
    for (let i = 0; i < amount; i++) {
        // if (modelMatrices[i]) {
        //     continue;
        // }
        let model = glMatrix.mat4.identity(glMatrix.mat4.create());
        // 1. translation: displace along circle with 'radius' in range [-offset, offset]
        let angle = i / amount * 360;
        let displacement = (rand() % (2 * offset * 100)) / 100 - offset;
        let x = Math.sin(angle) * radius + displacement;
        displacement = (rand() % (2 * offset * 100)) / 100 - offset;
        let y = displacement * 0.4; // keep height of asteroid field smaller compared to width of x and z
        displacement = (rand() % (2 * offset * 100)) / 100 - offset;
        let z = Math.cos(angle) * radius + displacement;
        glMatrix.mat4.translate(model, model, glMatrix.vec3.fromValues(x, y, z));

        // 2. scale: Scale between 0.05 and 0.25f
        let scale = (rand() % 20) / 100.0 + 0.05;
        glMatrix.mat4.scale(model, model, glMatrix.mat4.fromValues(scale, scale, scale));

        // 3. rotation: add random rotation around a (semi)randomly picked rotation axis vector
        let rotAngle = rand() % 360;
        glMatrix.mat4.rotate(model, model, rotAngle, glMatrix.vec3.fromValues(0.4, 0.6, 0.8));

        // 4. now add to list of matrices
        // modelMatrices[i] = model;
        modelMatrices = modelMatrices.concat([...model]);
    }



}

function updateMatrix(gl, model) {
    let buffer = new Float32Array(modelMatrices);
    let vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, buffer, gl.STATIC_DRAW);

    for (let i = 0; i < model.meshes.length; i++) {
        let VAO = model.meshes[i].VAO;
        gl.bindVertexArray(VAO);
        // set attribute pointers for matrix (4 times vec4)
        gl.enableVertexAttribArray(3);
        gl.vertexAttribPointer(3, 4, gl.FLOAT, false, 16 * buffer.BYTES_PER_ELEMENT, 0);
        gl.enableVertexAttribArray(4);
        gl.vertexAttribPointer(4, 4, gl.FLOAT, false, 16 * buffer.BYTES_PER_ELEMENT, 4 * buffer.BYTES_PER_ELEMENT);
        gl.enableVertexAttribArray(5);
        gl.vertexAttribPointer(5, 4, gl.FLOAT, false, 16 * buffer.BYTES_PER_ELEMENT, 8 * buffer.BYTES_PER_ELEMENT);
        gl.enableVertexAttribArray(6);
        gl.vertexAttribPointer(6, 4, gl.FLOAT, false, 16 * buffer.BYTES_PER_ELEMENT, 12 * buffer.BYTES_PER_ELEMENT);

        gl.vertexAttribDivisor(3, 1);
        gl.vertexAttribDivisor(4, 1);
        gl.vertexAttribDivisor(5, 1);
        gl.vertexAttribDivisor(6, 1);

        gl.bindVertexArray(null);
    }
}


function rand() {
    return Math.ceil(Math.random() * 32767);
}

async function main() {
    let stats = new Stats();
    document.body.appendChild(stats.dom);

    const gl = document.getElementById("canvas").getContext("webgl2");
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    gl.enable(gl.DEPTH_TEST);

    let rockShader = new Shader(gl, "rock.vs", "rock.fs");
    await rockShader.initialize();

    let planetShader = new Shader(gl, "planet.vs", "planet.fs");
    await planetShader.initialize();

    let rockModel = new Model(gl, '../../resources/objects/rock');
    await rockModel.loadModel(['rock.mtl', 'rock.obj'])

    let planetModel = new Model(gl, '../../resources/objects/planet');
    await planetModel.loadModel(['planet.mtl', 'planet.obj']);

    let projection = glMatrix.mat4.create();
    updateModel(rock);
    updateMatrix(gl, rockModel);
    addGUI();

    function render(time) {
        let currentFrame = Math.round(time) / 1000;
        deltaTime = Math.floor(currentFrame * 1000 - lastFrame * 1000) / 1000;
        lastFrame = currentFrame;

        gl.clearColor(0.1, 0.1, 0.1, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);


        // configure transformation matrices
        glMatrix.mat4.perspective(projection, glMatrix.glMatrix.toRadian(45), gl.drawingBufferWidth / gl.drawingBufferHeight, 0.1, 1000)
        let view = camera.getViewMatrix();

        rockShader.use();
        rockShader.setMat4("projection", projection);
        rockShader.setMat4("view", view);

        planetShader.use();
        planetShader.setMat4("projection", projection);
        planetShader.setMat4("view", view);

        // draw planet
        let model = glMatrix.mat4.identity(glMatrix.mat4.create());
        glMatrix.mat4.translate(model, model, glMatrix.vec3.fromValues(0.0, -3.0, 0.0));
        glMatrix.mat4.scale(model, model, glMatrix.mat4.fromValues(4, 4, 4));
        planetShader.setMat4("model", model);
        planetModel.draw(planetShader);

        // draw meteorites
        rockShader.use();
        rockShader.setInt("texture_diffuse1", 0);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, rockModel.textures_loaded[0].id); // note: we also made the textures_loaded vector public (instead of private) from the model class.
        for (let i = 0; i < rockModel.meshes.length; i++) {
            gl.bindVertexArray(rockModel.meshes[i].VAO);
            gl.drawElementsInstanced(gl.TRIANGLES, rockModel.meshes[i].indices.length, gl.UNSIGNED_BYTE, 0, rock.amount);
            gl.bindVertexArray(null);
        }

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

    function addGUI() {
        const GUI = new dat.GUI({ name: "instance" });

        let rockFolder = GUI.addFolder("rock");

        rockFolder.add(rock, "amount", 1000, 50000, 1000).onChange(() => {
            updateModel(rock)
        })
        rockFolder.add(rock, "offset", 1, 25, 1)
        rockFolder.add(rock, "radius", 25, 150, 5)
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



