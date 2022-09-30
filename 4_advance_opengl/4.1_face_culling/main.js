async function main() {
    const gl = document.getElementById("canvas").getContext("webgl2");
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);
    gl.frontFace(gl.CW);

    let shader = new Shader(gl, "shader.vs", "shader.fs");
    await shader.initialize();

    let vertices = new Float32Array([
        // Back face
        -0.5, -0.5, -0.5, 0.0, 0.0, // Bottom-left
        0.5, 0.5, -0.5, 1.0, 1.0, // top-right
        0.5, -0.5, -0.5, 1.0, 0.0, // bottom-right         
        0.5, 0.5, -0.5, 1.0, 1.0, // top-right
        -0.5, -0.5, -0.5, 0.0, 0.0, // bottom-left
        -0.5, 0.5, -0.5, 0.0, 1.0, // top-left
        // Front face
        -0.5, -0.5, 0.5, 0.0, 0.0, // bottom-left
        0.5, -0.5, 0.5, 1.0, 0.0, // bottom-right
        0.5, 0.5, 0.5, 1.0, 1.0, // top-right
        0.5, 0.5, 0.5, 1.0, 1.0, // top-right
        -0.5, 0.5, 0.5, 0.0, 1.0, // top-left
        -0.5, -0.5, 0.5, 0.0, 0.0, // bottom-left
        // Left face
        -0.5, 0.5, 0.5, 1.0, 0.0, // top-right
        -0.5, 0.5, -0.5, 1.0, 1.0, // top-left
        -0.5, -0.5, -0.5, 0.0, 1.0, // bottom-left
        -0.5, -0.5, -0.5, 0.0, 1.0, // bottom-left
        -0.5, -0.5, 0.5, 0.0, 0.0, // bottom-right
        -0.5, 0.5, 0.5, 1.0, 0.0, // top-right
        // Right face
        0.5, 0.5, 0.5, 1.0, 0.0, // top-left
        0.5, -0.5, -0.5, 0.0, 1.0, // bottom-right
        0.5, 0.5, -0.5, 1.0, 1.0, // top-right         
        0.5, -0.5, -0.5, 0.0, 1.0, // bottom-right
        0.5, 0.5, 0.5, 1.0, 0.0, // top-left
        0.5, -0.5, 0.5, 0.0, 0.0, // bottom-left     
        // Bottom face
        -0.5, -0.5, -0.5, 0.0, 1.0, // top-right
        0.5, -0.5, -0.5, 1.0, 1.0, // top-left
        0.5, -0.5, 0.5, 1.0, 0.0, // bottom-left
        0.5, -0.5, 0.5, 1.0, 0.0, // bottom-left
        -0.5, -0.5, 0.5, 0.0, 0.0, // bottom-right
        -0.5, -0.5, -0.5, 0.0, 1.0, // top-right
        // Top face
        -0.5, 0.5, -0.5, 0.0, 1.0, // top-left
        0.5, 0.5, 0.5, 1.0, 0.0, // bottom-right
        0.5, 0.5, -0.5, 1.0, 1.0, // top-right     
        0.5, 0.5, 0.5, 1.0, 0.0, // bottom-right
        -0.5, 0.5, -0.5, 0.0, 1.0, // top-left
        -0.5, 0.5, 0.5, 0.0, 0.0  // bottom-left   
    ]);

    let positionLoc = 0, texCoordLoc = 1;

    let vao = gl.createVertexArray();
    let vbo = gl.createBuffer();

    gl.bindVertexArray(vao);

    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    gl.vertexAttribPointer(positionLoc, 3, gl.FLOAT, false, 5 * vertices.BYTES_PER_ELEMENT, 0);
    gl.enableVertexAttribArray(positionLoc);

    gl.vertexAttribPointer(texCoordLoc, 2, gl.FLOAT, false, 5 * vertices.BYTES_PER_ELEMENT, 3 * vertices.BYTES_PER_ELEMENT);
    gl.enableVertexAttribArray(texCoordLoc);

    let texture = await loadTexture(gl, "../../resources/textures/UV_Grid_Lrg.jpg");


    shader.use();
    gl.uniform1i(gl.getUniformLocation(shader.ID, "texture1"), 0);

    let projectionLoc = gl.getUniformLocation(shader.ID, "projection");
    let modelLoc = gl.getUniformLocation(shader.ID, "model");
    let viewLoc = gl.getUniformLocation(shader.ID, "view");
    shader.use();

    function render(time) {
        gl.clearColor(0.2, 0.3, 0.3, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.bindVertexArray(vao);

        let model = glMatrix.mat4.identity(glMatrix.mat4.create());
        let view = glMatrix.mat4.create();
        let projection = glMatrix.mat4.create();
        glMatrix.mat4.rotate(model, model, time / 1000, glMatrix.vec3.fromValues(0.5, 1.0, 0.0));
        glMatrix.mat4.translate(view, view, glMatrix.vec3.fromValues(0.0, 0.0, -3.0));
        glMatrix.mat4.perspective(projection, glMatrix.glMatrix.toRadian(45), gl.canvas.width / gl.canvas.height, 0.1, 100)

        gl.uniformMatrix4fv(modelLoc, false, model);
        gl.uniformMatrix4fv(viewLoc, false, view);
        gl.uniformMatrix4fv(projectionLoc, false, projection);

        gl.drawArrays(gl.TRIANGLES, 0, 36);

        requestAnimationFrame(render);
    }

    requestAnimationFrame(render);
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
