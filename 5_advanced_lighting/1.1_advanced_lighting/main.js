let cameraPos = glMatrix.vec3.fromValues(0.0, 0.0, 3.0);
let camera = new Camera(cameraPos);

const SCR_WIDTH = 800;
const SCR_HEIGHT = 600;

let deltaTime = 0.0;	// time between current frame and last frame
let lastFrame = 0.0;
let isFirstMouse = true;
let lastX = SCR_WIDTH / 2, lastY = SCR_HEIGHT / 2;

// settings
var light = {
    blinn: false,
    justSpecularTerm: false,
    lowShininess:false
};

async function main() {
    let stats = new Stats();
    document.body.appendChild(stats.dom);

    const gl = document.getElementById("canvas").getContext("webgl2");
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    gl.enable(gl.DEPTH_TEST);
    addGUI();

    let shader = new Shader(gl, "shader.vs", "shader.fs");
    await shader.initialize();

    let planeVertices = new Float32Array([
        // positions            // normals         // texcoords
        10.0, -0.5, 10.0, 0.0, 1.0, 0.0, 10.0, 0.0,
        -10.0, -0.5, 10.0, 0.0, 1.0, 0.0, 0.0, 0.0,
        -10.0, -0.5, -10.0, 0.0, 1.0, 0.0, 0.0, 10.0,

        10.0, -0.5, 10.0, 0.0, 1.0, 0.0, 10.0, 0.0,
        -10.0, -0.5, -10.0, 0.0, 1.0, 0.0, 0.0, 10.0,
        10.0, -0.5, -10.0, 0.0, 1.0, 0.0, 10.0, 10.0
    ])


    let positionLoc = 0, normalLoc = 1, texCoordLoc = 2;

    let planeVAO = gl.createVertexArray();
    let planeVBO = gl.createBuffer();
    gl.bindVertexArray(planeVAO);
    gl.bindBuffer(gl.ARRAY_BUFFER, planeVBO);
    gl.bufferData(gl.ARRAY_BUFFER, planeVertices, gl.STATIC_DRAW);
    gl.vertexAttribPointer(positionLoc, 3, gl.FLOAT, false, 8 * planeVertices.BYTES_PER_ELEMENT, 0);
    gl.enableVertexAttribArray(positionLoc);
    gl.vertexAttribPointer(normalLoc, 3, gl.FLOAT, false, 8 * planeVertices.BYTES_PER_ELEMENT, 3 * planeVertices.BYTES_PER_ELEMENT);
    gl.enableVertexAttribArray(normalLoc);
    gl.vertexAttribPointer(texCoordLoc, 2, gl.FLOAT, false, 8 * planeVertices.BYTES_PER_ELEMENT, 6 * planeVertices.BYTES_PER_ELEMENT);
    gl.enableVertexAttribArray(texCoordLoc);
    gl.bindVertexArray(null);

    let floorTexture = await loadTexture(gl, "../../resources/textures/wood.png");

    shader.use();
    shader.setInt("floorTexture", 0);

    let lightPos = glMatrix.vec3.fromValues(0,0,0);

    function render(time) {
        let currentFrame = Math.round(time) / 1000;
        deltaTime = Math.floor(currentFrame * 1000 - lastFrame * 1000) / 1000;
        lastFrame = currentFrame;

        gl.clearColor(0.1, 0.1, 0.1, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        shader.use();

        let view = camera.getViewMatrix();
        let projection = glMatrix.mat4.identity(glMatrix.mat4.create());
        glMatrix.mat4.perspective(projection, glMatrix.glMatrix.toRadian(camera.zoom), gl.drawingBufferWidth / gl.drawingBufferHeight, 0.1, 100)
        shader.setMat4("view", view);
        shader.setMat4("projection", projection);

        // light
        
        shader.setVec3("viewPos", camera.position);
        shader.setVec3("lightPos", lightPos);
        shader.setBool("blinn", light.blinn); 
		shader.setBool("justSpecularTerm", light.justSpecularTerm);
		shader.setBool("lowShininess", light.lowShininess);

        // floor
        gl.bindVertexArray(planeVAO);
        gl.bindTexture(gl.TEXTURE_2D, floorTexture);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        gl.bindVertexArray(null);

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
        const GUI = new dat.GUI({ name: "light" });


        GUI.add(light, "blinn").name("blinn").onChange((val) => {
            light.blinn = val;
        });
        GUI.add(light, "justSpecularTerm").name("justSpecularTerm").onChange((val) => {
            light.justSpecularTerm = val;
        });
        GUI.add(light, "lowShininess").name("lowShininess").onChange((val) => {
            light.lowShininess = val;
        });
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

