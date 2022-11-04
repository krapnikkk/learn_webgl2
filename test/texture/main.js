async function main() {
    const gl = document.getElementById("canvas").getContext("webgl2");
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    let shader = new Shader(gl, "shader.vs", "shader.fs");
    await shader.initialize();

    let vertices = new Float32Array([
        // positions          // colors           // texture coords
        0.5, 0.5, 0.0, 1.0, 0.0, 0.0, 1.0, 1.0,-1.0,  1.0, -1.0, // top right
        0.5, -0.5, 0.0, 0.0, 1.0, 0.0, 1.0, 0.0,-1.0, -1.0, -1.0, // bottom right
        -0.5, -0.5, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, -1.0, -1.0, // bottom left
        -0.5, 0.5, 0.0, 1.0, 1.0, 0.0, 0.0, 1.0,1.0, -1.0, -1.0,  // top left 
    ]);
    

    let indices = new Uint8Array([
        0, 1, 3, // first triangle
        1, 2, 3  // second triangle
    ]);

    let positionLoc = 0, colorLoc = 1, texCoordLoc = 2,cubeTexCoordLoc = 3;

    let vao = gl.createVertexArray();
    let vbo = gl.createBuffer();
    let ebo = gl.createBuffer();

    gl.bindVertexArray(vao);

    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ebo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

    gl.vertexAttribPointer(positionLoc, 3, gl.FLOAT, false, 11 * vertices.BYTES_PER_ELEMENT, 0);
    gl.enableVertexAttribArray(positionLoc);

    gl.vertexAttribPointer(colorLoc, 3, gl.FLOAT, false, 11 * vertices.BYTES_PER_ELEMENT, 3 * vertices.BYTES_PER_ELEMENT);
    gl.enableVertexAttribArray(colorLoc);

    gl.vertexAttribPointer(texCoordLoc, 2, gl.FLOAT, false, 11 * vertices.BYTES_PER_ELEMENT, 6 * vertices.BYTES_PER_ELEMENT);
    gl.enableVertexAttribArray(texCoordLoc);

    gl.vertexAttribPointer(cubeTexCoordLoc, 3, gl.FLOAT, false, 11 * vertices.BYTES_PER_ELEMENT, 8 * vertices.BYTES_PER_ELEMENT);
    gl.enableVertexAttribArray(cubeTexCoordLoc);
    gl.bindVertexArray(null);




    let cubeTexture = await loadTexture(gl, "../../resources/textures/container.jpg");


    let faces = [
        "../../resources/skybox/right.jpg",
        "../../resources/skybox/left.jpg",
        "../../resources/skybox/top.jpg",
        "../../resources/skybox/bottom.jpg",
        "../../resources/skybox/front.jpg",
        "../../resources/skybox/back.jpg"
    ];
    let cubemapTexture = await loadCubemap(gl, faces);

    shader.use();
    // warn: Two textures of different types can't use the same sampler location.
    shader.setInt("uMainTex", 0);
    shader.setInt("skybox", 0);

    function render() {

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, cubeTexture);

        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubemapTexture);


        gl.clearColor(0.2, 0.3, 0.3, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        shader.use();

        gl.bindVertexArray(vao);
        gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_BYTE, 0);
        gl.bindVertexArray(null);

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

async function loadCubemap(gl, urls) {
    return new Promise(async (resolve, reject) => {
        let texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
        for (let i = 0; i < urls.length; i++) {
            let url = urls[i];
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
                gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, 0, format, width, height, 0, format, gl.UNSIGNED_BYTE, data);

            } else {
                reject()
                console.warn("Texture failed to load at path: " + url);
            }
        }
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        resolve(texture);
    })
}
