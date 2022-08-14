async function main() {
    const gl = document.getElementById("canvas").getContext("webgl2");
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    let shader = new Shader(gl, "shader.vs", "shader.fs");
    await shader.initialize();

    let vertices = new Float32Array([
        // positions          // colors           // texture coords
        0.5, 0.5, 0.0, 1.0, 0.0, 0.0, 0.55, 0.55, // top right
        0.5, -0.5, 0.0, 0.0, 1.0, 0.0, 0.55, 0.45, // bottom right
        -0.5, -0.5, 0.0, 0.0, 0.0, 1.0, 0.45, 0.45, // bottom left
        -0.5, 0.5, 0.0, 1.0, 1.0, 0.0, 0.45, 0.55  // top left 
    ]);

    let indices = new Uint8Array([
        0, 1, 3, // first triangle
        1, 2, 3  // second triangle
    ]);

    let positionLoc = 0, colorLoc = 1, texCoordLoc = 2;

    let vao = gl.createVertexArray();
    let vbo = gl.createBuffer();
    let ebo = gl.createBuffer();

    gl.bindVertexArray(vao);

    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ebo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

    gl.vertexAttribPointer(positionLoc, 3, gl.FLOAT, gl.FALSE, 8 * vertices.BYTES_PER_ELEMENT, 0);
    gl.enableVertexAttribArray(positionLoc);

    gl.vertexAttribPointer(colorLoc, 3, gl.FLOAT, gl.FALSE, 8 * vertices.BYTES_PER_ELEMENT, 3 * vertices.BYTES_PER_ELEMENT);
    gl.enableVertexAttribArray(colorLoc);

    gl.vertexAttribPointer(texCoordLoc, 2, gl.FLOAT, gl.FALSE, 8 * vertices.BYTES_PER_ELEMENT, 6 * vertices.BYTES_PER_ELEMENT);
    gl.enableVertexAttribArray(texCoordLoc);

    let texture1 = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture1);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);


    let img1 = await loadImage("../../resources/textures/container.jpg");

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img1);
    gl.generateMipmap(gl.TEXTURE_2D);


    let texture2 = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture2);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);

    let img2 = await loadImage("../../resources/textures/awesomeface.png");
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img2);
    gl.generateMipmap(gl.TEXTURE_2D);

    shader.use();
    gl.uniform1i(gl.getUniformLocation(shader.ID, "texture1"), 0);
    shader.setInt("texture2", 1);

    // gl.bindTexture(gl.TEXTURE_2D, texture1);
    // gl.bindTexture(gl.TEXTURE_2D, texture2);

    function render(time) {


        gl.clearColor(0.2, 0.3, 0.3, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture1); 
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, texture2);
        shader.use();

        gl.bindVertexArray(vao);
        gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_BYTE, 0);

        requestAnimationFrame(render);
    }

    requestAnimationFrame(render);
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
