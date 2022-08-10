
const vertexShaderSource = `#version 300 es
    layout (location = 0) in vec3 aPos;
    void main()
    {
        gl_Position = vec4(aPos.x,aPos.y,aPos.z,1.0);
    }
`;
const fragmentShaderSource = `#version 300 es
    precision mediump float;
    out vec4 FragColor;
    void main()
    {
        FragColor = vec4(1.0f,0.5f,0.2f,1.0f);
    }
`;

function main() {

    const gl = document.getElementById("canvas").getContext("webgl2");

    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, vertexShaderSource);
    gl.compileShader(vertexShader);
    let vertexStatus = gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS);
    if (!vertexStatus) {
        let info = gl.getShaderInfoLog(vertexShader);
        console.warn(info);
    }


    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, fragmentShaderSource);
    gl.compileShader(fragmentShader);
    let fragmentStatus = gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS);
    if (!fragmentStatus) {
        let info = gl.getShaderInfoLog(fragmentShader);
        console.warn(info);
    }

    let program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);

    gl.linkProgram(program);

    let linkStatus = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (!linkStatus) {
        let info = gl.getProgramInfoLog(program);
        console.warn(info);
    }

    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);

    let vertices = new Float32Array([
        0.5, 0.5, 0.0,  // top right
        0.5, -0.5, 0.0,  // bottom right
        -0.5, -0.5, 0.0,  // bottom left
        -0.5, 0.5, 0.0   // top left 
    ]);

    let indices = new Uint8Array([
        0, 1, 3,  // first Triangle
        1, 2, 3   // second Triangle
    ]);

    let layoutPosIdx = 0;

    let vao = gl.createVertexArray();
    let vbo = gl.createBuffer();
    let ebo = gl.createBuffer();

    gl.bindVertexArray(vao);

    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ebo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

    gl.vertexAttribPointer(layoutPosIdx, 3, gl.FLOAT, gl.FALSE, 3 * vertices.BYTES_PER_ELEMENT, 0);
    gl.enableVertexAttribArray(layoutPosIdx);

    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindVertexArray(null);


    function render(time) {
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

        gl.clearColor(0.2, 0.3, 0.3, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.useProgram(program);
        gl.bindVertexArray(vao);
        gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_BYTE, 0);
    }

    requestAnimationFrame(render);
}
