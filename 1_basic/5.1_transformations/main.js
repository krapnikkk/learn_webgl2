async function main() {
    const gl = document.getElementById("canvas").getContext("webgl2");
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    let shader = new Shader(gl, "shader.vs", "shader.fs");
    await shader.initialize();

    let vertices = new Float32Array([
        // positions          // texture coords
        0.5, 0.5, 0.0, 1.0, 1.0, // top right
        0.5, -0.5, 0.0, 1.0, 0.0, // bottom right
        -0.5, -0.5, 0.0, 0.0, 0.0, // bottom left
        -0.5, 0.5, 0.0, 0.0, 1.0  // top left 
    ]);

    let indices = new Uint8Array([
        0, 1, 3, // first triangle
        1, 2, 3  // second triangle
    ]);

    let positionLoc = 0, texCoordLoc = 1;

    let vao = gl.createVertexArray();
    let vbo = gl.createBuffer();
    let ebo = gl.createBuffer();

    gl.bindVertexArray(vao);

    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ebo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

    gl.vertexAttribPointer(positionLoc, 3, gl.FLOAT, false, 5 * vertices.BYTES_PER_ELEMENT, 0);
    gl.enableVertexAttribArray(positionLoc);

    gl.vertexAttribPointer(texCoordLoc, 2, gl.FLOAT, false, 5 * vertices.BYTES_PER_ELEMENT, 3 * vertices.BYTES_PER_ELEMENT);
    gl.enableVertexAttribArray(texCoordLoc);

    let texture1 = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture1);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);


    let img1 = await loadImage("../../resources/textures/container.jpg");

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img1);
    gl.generateMipmap(gl.TEXTURE_2D);


    let texture2 = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture2);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.MIRRORED_REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.MIRRORED_REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

    let img2 = await loadImage("../../resources/textures/awesomeface.png");
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img2);
    gl.generateMipmap(gl.TEXTURE_2D);

    shader.use();
    gl.uniform1i(gl.getUniformLocation(shader.ID, "texture1"), 0);
    shader.setInt("texture2", 1);

    // gl.bindTexture(gl.TEXTURE_2D, texture1);
    // gl.bindTexture(gl.TEXTURE_2D, texture2);

    let transformLoc = gl.getUniformLocation(shader.ID, "transform");

    function render(time) {


        gl.clearColor(0.2, 0.3, 0.3, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture1); 
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, texture2);

        let transform = glMatrix.mat4.create();
        glMatrix.mat4.translate(transform, transform, glMatrix.vec3.fromValues(0.5, -0.5, 0.0));
        glMatrix.mat4.rotate(transform, transform, time / 1000, glMatrix.vec3.fromValues(0.0, -0.0, 1.0));

        shader.use();
        gl.uniformMatrix4fv(transformLoc,false,transform);

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
