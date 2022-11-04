let cameraPos = glMatrix.vec3.fromValues(0.0, 0.0, 3.0);
let camera = new Camera(cameraPos);

const SCR_WIDTH = 800;
const SCR_HEIGHT = 600;

let deltaTime = 0.0;	// time between current frame and last frame
let lastFrame = 0.0;
let isFirstMouse = true;
let lastX = SCR_WIDTH / 2, lastY = SCR_HEIGHT / 2;

let translations = [];
let offset = 0.1;
for (let y = -10; y < 10; y += 2) {
    for (let x = -10; x < 10; x += 2) {
        translations.push(x / 10.0 + offset, y / 10.0 + offset);
    }
}

async function main() {
    let stats = new Stats();
    document.body.appendChild(stats.dom);

    const gl = document.getElementById("canvas").getContext("webgl2");
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    gl.enable(gl.DEPTH_TEST);

    let shader = new Shader(gl, "shader.vs", "shader.fs");
    await shader.initialize();

    let quadVertices = new Float32Array([
        // positions     // colors
        -0.05, 0.05, 1.0, 0.0, 0.0,
        0.05, -0.05, 0.0, 1.0, 0.0,
        -0.05, -0.05, 0.0, 0.0, 1.0,

        -0.05, 0.05, 1.0, 0.0, 0.0,
        0.05, -0.05, 0.0, 1.0, 0.0,
        0.05, 0.05, 0.0, 1.0, 1.0
    ]);

    let positionLoc = 0, colorLoc = 1, offsetLoc = 2;

    let quadVAO = gl.createVertexArray();
    let quadVBO = gl.createBuffer();

    gl.bindVertexArray(quadVAO);
    gl.bindBuffer(gl.ARRAY_BUFFER, quadVBO);
    gl.bufferData(gl.ARRAY_BUFFER, quadVertices, gl.STATIC_DRAW);
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 5 * quadVertices.BYTES_PER_ELEMENT, 0);
    gl.enableVertexAttribArray(positionLoc);
    gl.vertexAttribPointer(colorLoc, 3, gl.FLOAT, false, 5 * quadVertices.BYTES_PER_ELEMENT, 2 * quadVertices.BYTES_PER_ELEMENT);
    gl.enableVertexAttribArray(colorLoc);

    // also set instance data
    let instanceVBO = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, instanceVBO); // this attribute comes from a different vertex buffer
    translations = new Float32Array(translations)
    gl.bufferData(gl.ARRAY_BUFFER, translations, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(offsetLoc);
    gl.vertexAttribPointer(offsetLoc, 2, gl.FLOAT, false, 0, 0);
    gl.vertexAttribDivisor(offsetLoc, 1); // tell OpenGL this is an instanced vertex attribute.
    gl.bindVertexArray(null);

    function render(time) {
        let currentFrame = Math.round(time) / 1000;
        deltaTime = Math.floor(currentFrame * 1000 - lastFrame * 1000) / 1000;
        lastFrame = currentFrame;

        gl.clearColor(0.1, 0.1, 0.1, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);


        shader.use();
        gl.bindVertexArray(quadVAO);
        gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, 100);
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



