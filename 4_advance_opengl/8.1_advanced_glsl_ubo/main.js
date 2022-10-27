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

    const gl = document.getElementById("canvas").getContext("webgl2");
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    gl.enable(gl.DEPTH_TEST);

    let redShader = new Shader(gl, "shader.vs", "red.fs");
    await redShader.initialize();
    let blueShader = new Shader(gl, "shader.vs", "blue.fs");
    await blueShader.initialize();
    let greenShader = new Shader(gl, "shader.vs", "green.fs");
    await greenShader.initialize();
    let yellowShader = new Shader(gl, "shader.vs", "yellow.fs");
    await yellowShader.initialize();

    let cubeVertices = new Float32Array([
        // positions          // texture Coords        
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

    let cubeVAO = gl.createVertexArray();
    let cubeVBO = gl.createBuffer();

    gl.bindVertexArray(cubeVAO);
    gl.bindBuffer(gl.ARRAY_BUFFER, cubeVBO);
    gl.bufferData(gl.ARRAY_BUFFER, cubeVertices, gl.STATIC_DRAW);
    gl.vertexAttribPointer(positionLoc, 3, gl.FLOAT, false, 3 * cubeVertices.BYTES_PER_ELEMENT, 0);
    gl.enableVertexAttribArray(positionLoc);
    gl.bindVertexArray(null);

    // first. We get the relevant block indices
    let uniformBlockIndexRed = gl.getUniformBlockIndex(redShader.ID, "Matrices");
    let uniformBlockIndexGreen = gl.getUniformBlockIndex(greenShader.ID, "Matrices");
    let uniformBlockIndexBlue = gl.getUniformBlockIndex(blueShader.ID, "Matrices");
    let uniformBlockIndexYellow = gl.getUniformBlockIndex(yellowShader.ID, "Matrices");
    // then we link each shader's uniform block to this uniform binding point
    gl.uniformBlockBinding(redShader.ID, uniformBlockIndexRed, 0);
    gl.uniformBlockBinding(greenShader.ID, uniformBlockIndexGreen, 0);
    gl.uniformBlockBinding(blueShader.ID, uniformBlockIndexBlue, 0);
    gl.uniformBlockBinding(yellowShader.ID, uniformBlockIndexYellow, 0);


    // Get the size of the Uniform Block in bytes
    const blockSize = gl.getActiveUniformBlockParameter(
        redShader.ID,
        uniformBlockIndexRed,
        gl.UNIFORM_BLOCK_DATA_SIZE
    );

    let uboMatrices = gl.createBuffer();
    gl.bindBuffer(gl.UNIFORM_BUFFER, uboMatrices);
    gl.bufferData(gl.UNIFORM_BUFFER, blockSize, gl.STATIC_DRAW);
    gl.bindBuffer(gl.UNIFORM_BUFFER, null);
    // define the range of the buffer that links to a uniform binding point
    gl.bindBufferRange(gl.UNIFORM_BUFFER, 0, uboMatrices, 0, blockSize);

    // Name of the member variables inside of our Uniform Block
    const uboVariableNames = ["projection", "view"];

    // Get the respective index of the member variables inside our Uniform Block
    const uboVariableIndices = gl.getUniformIndices(
        redShader.ID,
        uboVariableNames
    );

    // Get the offset of the member variables inside our Uniform Block in bytes
    const uboVariableOffsets = gl.getActiveUniforms(
        redShader.ID,
        uboVariableIndices,
        gl.UNIFORM_OFFSET
    );

    // Create an object to map each variable name to its respective index and offset
    const uboVariableInfo = {};
    uboVariableNames.forEach((name, index) => {
        uboVariableInfo[name] = {
            index: uboVariableIndices[index],
            offset: uboVariableOffsets[index],
        };
    });

    // store the projection matrix (we only do this once now) (note: we're not using zoom anymore by changing the FoV)
    let projection = glMatrix.mat4.identity(glMatrix.mat4.create());
    glMatrix.mat4.perspective(projection, glMatrix.glMatrix.toRadian(camera.zoom), gl.drawingBufferWidth / gl.drawingBufferHeight, 0.1, 100)

    gl.bindBuffer(gl.UNIFORM_BUFFER, uboMatrices);
    gl.bufferSubData(gl.UNIFORM_BUFFER, uboVariableInfo["projection"].offset, projection);
    gl.bindBuffer(gl.UNIFORM_BUFFER, null);

    function render(time) {
        let currentFrame = Math.round(time) / 1000;
        deltaTime = Math.floor(currentFrame * 1000 - lastFrame * 1000) / 1000;
        lastFrame = currentFrame;

        gl.clearColor(0.1, 0.1, 0.1, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);


        let view = camera.getViewMatrix();

        gl.bindBuffer(gl.UNIFORM_BUFFER, uboMatrices);
        gl.bufferSubData(gl.UNIFORM_BUFFER, uboVariableInfo["view"].offset, view, 0);
        gl.bindBuffer(gl.UNIFORM_BUFFER, null);


        // draw 4 cubes 
        // RED
        gl.bindVertexArray(cubeVAO);
        redShader.use();
        let model = glMatrix.mat4.identity(glMatrix.mat4.create());
        glMatrix.mat4.translate(model, model, glMatrix.vec3.fromValues(-0.75, 0.75, 0.0));// move top-left
        redShader.setMat4("model", model);
        gl.drawArrays(gl.TRIANGLES, 0, 36);
        // GREEN
        greenShader.use();
        model = glMatrix.mat4.identity(glMatrix.mat4.create());
        glMatrix.mat4.translate(model, model, glMatrix.vec3.fromValues(0.75, 0.75, 0.0)); // move top-right
        greenShader.setMat4("model", model);
        gl.drawArrays(gl.TRIANGLES, 0, 36);
        // YELLOW
        yellowShader.use();
        model = glMatrix.mat4.identity(glMatrix.mat4.create());
        glMatrix.mat4.translate(model, model, glMatrix.vec3.fromValues(-0.75, -0.75, 0.0)); // move bottom-left
        yellowShader.setMat4("model", model);
        gl.drawArrays(gl.TRIANGLES, 0, 36);
        // BLUE
        blueShader.use();
        model = glMatrix.mat4.identity(glMatrix.mat4.create());
        glMatrix.mat4.translate(model, model, glMatrix.vec3.fromValues(0.75, -0.75, 0.0)); // move bottom-right
        blueShader.setMat4("model", model);
        gl.drawArrays(gl.TRIANGLES, 0, 36);

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



