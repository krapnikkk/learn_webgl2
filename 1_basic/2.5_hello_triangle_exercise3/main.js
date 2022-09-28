
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

const fragmentShaderSource2 = `#version 300 es
    precision mediump float;
    out vec4 FragColor;
    void main()
    {
        FragColor = vec4(1.0f, 1.0f, 0.0f, 1.0f);
    }
`;

function main() {

    const gl = document.getElementById("canvas").getContext("webgl2");

    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, vertexShaderSource);
    gl.compileShader(vertexShader);

    const fragmentShaderOrange = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShaderOrange, fragmentShaderSource);
    gl.compileShader(fragmentShaderOrange);

    const fragmentShaderYellow = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShaderYellow, fragmentShaderSource2);
    gl.compileShader(fragmentShaderYellow);

    let programOrange = gl.createProgram();
    gl.attachShader(programOrange, vertexShader);
    gl.attachShader(programOrange, fragmentShaderOrange);

    gl.linkProgram(programOrange);

    let programYellow = gl.createProgram();
    gl.attachShader(programYellow, vertexShader);
    gl.attachShader(programYellow, fragmentShaderYellow);

    gl.linkProgram(programYellow);

    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShaderOrange);
    gl.deleteShader(fragmentShaderYellow);

    let triangles = [
        new Float32Array([
            // first triangle
            -0.9, -0.5, 0.0,  // left 
            -0.0, -0.5, 0.0,  // right
            -0.45, 0.5, 0.0,  // top 
        ]),
        new Float32Array([
            // second triangle
            0.0, -0.5, 0.0,  // left
            0.9, -0.5, 0.0,  // right
            0.45, 0.5, 0.0   // top 
        ])
    ];

    let layoutPosIdx = 0;
    let vaos = [];

    for (let i = 0; i < triangles.length; i++) {
        let vao = gl.createVertexArray();
        let vbo = gl.createBuffer();
        vaos.push(vao);


        gl.bindVertexArray(vao);

        gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
        gl.bufferData(gl.ARRAY_BUFFER, triangles[i], gl.STATIC_DRAW);

        gl.vertexAttribPointer(layoutPosIdx, 3, gl.FLOAT, false, 3 * triangles[i].BYTES_PER_ELEMENT, 0);
        gl.enableVertexAttribArray(layoutPosIdx);

        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindVertexArray(null);
    }


    function render(time) {
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

        gl.clearColor(0.2, 0.3, 0.3, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.useProgram(programOrange);

        gl.bindVertexArray(vaos[0]);
        gl.drawArrays(gl.TRIANGLES, 0, 3);

        gl.useProgram(programYellow);

        gl.bindVertexArray(vaos[1]);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

    requestAnimationFrame(render);
}

