const SCR_WIDTH = 800;
const SCR_HEIGHT = 600;

let deltaTime = 0.0;
let lastFrame = 0.0;
let isFirstMouse = true;
let lastX = SCR_WIDTH / 2;
let lastY = SCR_HEIGHT / 2;

let camera = new Camera(glMatrix.vec3.fromValues(0.0, 0.0, 23.0));

async function main() {
    let stats = new Stats();
    document.body.appendChild(stats.dom);

    const canvas = document.getElementById("canvas");
    const gl = canvas.getContext("webgl2", {
        antialias: true
    });
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.enable(gl.DEPTH_TEST);

    let shader = new Shader(gl, "pbr.vs", "pbr.fs");
    await shader.initialize();

    shader.use();
    shader.setVec3("albedo", glMatrix.vec3.fromValues(0.5, 0.0, 0.0));
    shader.setFloat("ao", 1.0);

    const lightPositions = [
        glMatrix.vec3.fromValues(-10.0, 10.0, 10.0),
        glMatrix.vec3.fromValues(10.0, 10.0, 10.0),
        glMatrix.vec3.fromValues(-10.0, -10.0, 10.0),
        glMatrix.vec3.fromValues(10.0, -10.0, 10.0),
    ];
    const lightColors = [
        glMatrix.vec3.fromValues(300.0, 300.0, 300.0),
        glMatrix.vec3.fromValues(300.0, 300.0, 300.0),
        glMatrix.vec3.fromValues(300.0, 300.0, 300.0),
        glMatrix.vec3.fromValues(300.0, 300.0, 300.0),
    ];
    const nrRows = 7;
    const nrColumns = 7;
    const spacing = 2.5;

    function render(time) {
        let currentFrame = Math.round(time) / 1000;
        deltaTime = Math.floor(currentFrame * 1000 - lastFrame * 1000) / 1000;
        lastFrame = currentFrame;

        gl.clearColor(0.1, 0.1, 0.1, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        shader.use();
        let view = camera.getViewMatrix();
        let projection = glMatrix.mat4.create();
        glMatrix.mat4.perspective(projection, glMatrix.glMatrix.toRadian(camera.zoom), gl.drawingBufferWidth / gl.drawingBufferHeight, 0.1, 100.0);
        shader.setMat4("view", view);
        shader.setMat4("projection", projection);
        shader.setVec3("camPos", camera.position);

        for (let i = 0; i < lightPositions.length; i++) {
            shader.setVec3(`lightPositions[${i}]`, lightPositions[i]);
            shader.setVec3(`lightColors[${i}]`, lightColors[i]);
        }

        for (let row = 0; row < nrRows; row++) {
            shader.setFloat("metallic", row / nrRows);
            for (let col = 0; col < nrColumns; col++) {
                shader.setFloat("roughness", Math.min(Math.max(col / nrColumns, 0.05), 1.0));
                let model = glMatrix.mat4.create();
                glMatrix.mat4.translate(model, model, glMatrix.vec3.fromValues(
                    (col - (nrColumns - 1) / 2) * spacing,
                    (row - (nrRows - 1) / 2) * spacing,
                    0.0
                ));
                shader.setMat4("model", model);
                renderSphere(gl);
            }
        }

        for (let i = 0; i < lightPositions.length; i++) {
            let model = glMatrix.mat4.create();
            glMatrix.mat4.translate(model, model, lightPositions[i]);
            glMatrix.mat4.scale(model, model, glMatrix.vec3.fromValues(0.5, 0.5, 0.5));
            shader.setMat4("model", model);
            renderSphere(gl);
        }

        stats.update();
        requestAnimationFrame(render);
    }

    requestAnimationFrame(render);

    let moveLock = true;
    document.onkeydown = (e) => camera.onKeydown(e.code, deltaTime);

    canvas.onclick = () => {
        moveLock = !moveLock;
        isFirstMouse = true;
    };

    canvas.onmousemove = (e) => {
        if (moveLock) return;
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
    };

    canvas.onwheel = (e) => camera.onMouseScroll(e.deltaY / 100);
}

let sphereVAO = null;
let sphereIndexCount = 0;

function renderSphere(gl) {
    if (!sphereVAO) {
        const xSegments = 64;
        const ySegments = 64;
        const data = [];
        const indices = [];

        for (let x = 0; x <= xSegments; x++) {
            for (let y = 0; y <= ySegments; y++) {
                const xSegment = x / xSegments;
                const ySegment = y / ySegments;
                const xPos = Math.cos(xSegment * 2.0 * Math.PI) * Math.sin(ySegment * Math.PI);
                const yPos = Math.cos(ySegment * Math.PI);
                const zPos = Math.sin(xSegment * 2.0 * Math.PI) * Math.sin(ySegment * Math.PI);

                data.push(xPos, yPos, zPos, xPos, yPos, zPos, xSegment, ySegment);
            }
        }

        let oddRow = false;
        for (let y = 0; y < ySegments; y++) {
            if (!oddRow) {
                for (let x = 0; x <= xSegments; x++) {
                    indices.push(y * (xSegments + 1) + x);
                    indices.push((y + 1) * (xSegments + 1) + x);
                }
            } else {
                for (let x = xSegments; x >= 0; x--) {
                    indices.push((y + 1) * (xSegments + 1) + x);
                    indices.push(y * (xSegments + 1) + x);
                }
            }
            oddRow = !oddRow;
        }

        sphereIndexCount = indices.length;
        sphereVAO = gl.createVertexArray();
        const vbo = gl.createBuffer();
        const ebo = gl.createBuffer();

        gl.bindVertexArray(sphereVAO);
        gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ebo);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

        const stride = 8 * Float32Array.BYTES_PER_ELEMENT;
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, stride, 0);
        gl.enableVertexAttribArray(1);
        gl.vertexAttribPointer(1, 3, gl.FLOAT, false, stride, 3 * Float32Array.BYTES_PER_ELEMENT);
        gl.enableVertexAttribArray(2);
        gl.vertexAttribPointer(2, 2, gl.FLOAT, false, stride, 6 * Float32Array.BYTES_PER_ELEMENT);
        gl.bindVertexArray(null);
    }

    gl.bindVertexArray(sphereVAO);
    gl.drawElements(gl.TRIANGLE_STRIP, sphereIndexCount, gl.UNSIGNED_SHORT, 0);
    gl.bindVertexArray(null);
}
