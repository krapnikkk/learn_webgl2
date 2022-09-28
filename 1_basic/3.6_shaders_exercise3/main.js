async function main() {
    const gl = document.getElementById("canvas").getContext("webgl2");
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    let shader = new Shader(gl, "shader.vs", "shader.fs");
    await shader.initialize();

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

    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 6 * vertices.BYTES_PER_ELEMENT, 0);
    gl.enableVertexAttribArray(positionLoc);

    gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 6 * vertices.BYTES_PER_ELEMENT, 3 * vertices.BYTES_PER_ELEMENT);
    gl.enableVertexAttribArray(colorLoc);



    function render(time) {


        gl.clearColor(0.2, 0.3, 0.3, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        shader.use();

        gl.bindVertexArray(vao);
        gl.drawArrays(gl.TRIANGLES, 0, 3);

        requestAnimationFrame(render);
    }

    requestAnimationFrame(render);
}
