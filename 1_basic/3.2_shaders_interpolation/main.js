
const vertexShaderSource = `#version 300 es
    layout (location = 0) in vec3 aPos;
    layout (location = 1) in vec3 aColor;

    out vec3 outColor;
    void main()
    {
        gl_Position = vec4(aPos,1.0);
        outColor = aColor;
    }
`;
const fragmentShaderSource = `#version 300 es
    precision mediump float;
    out vec4 FragColor;

    in vec3 outColor;
    void main()
    {
        FragColor = vec4(outColor,1.0f);
    }
`;

function main() {
    const gl = document.getElementById("canvas").getContext("webgl2");
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

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
        // positions         // colors
        0.5, -0.5, 0.0, 1.0, 0.0, 0.0,  // bottom right
        -0.5, -0.5, 0.0, 0.0, 1.0, 0.0,  // bottom left
        0.0, 0.5, 0.0, 0.0, 0.0, 1.0   // top 
    ]);

    let positionLoc = 0, colorLoc = 1;

    let vao = gl.createVertexArray();
    let vbo = gl.createBuffer();

    gl.bindVertexArray(vao);

    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    gl.vertexAttribPointer(0, 3, gl.FLOAT, gl.FALSE, 6 * vertices.BYTES_PER_ELEMENT, 0);
    gl.enableVertexAttribArray(positionLoc);

    gl.vertexAttribPointer(1, 3, gl.FLOAT, gl.FALSE, 6 * vertices.BYTES_PER_ELEMENT, 3 * vertices.BYTES_PER_ELEMENT);
    gl.enableVertexAttribArray(colorLoc);

    
    
    function render(time) {
        
        
        gl.clearColor(0.2, 0.3, 0.3, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        
        gl.useProgram(program);
        
        gl.bindVertexArray(vao);
        gl.drawArrays(gl.TRIANGLES, 0, 3);

        requestAnimationFrame(render);
    }

    requestAnimationFrame(render);
}
