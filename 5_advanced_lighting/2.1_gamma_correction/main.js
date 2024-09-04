let cameraPos = glMatrix.vec3.fromValues(0.0, 0.0, 3.0);
let camera = new Camera(cameraPos);

const SCR_WIDTH = 800;
const SCR_HEIGHT = 600;

let deltaTime = 0.0;	// time between current frame and last frame
let lastFrame = 0.0;
let isFirstMouse = true;
let lastX = SCR_WIDTH / 2, lastY = SCR_HEIGHT / 2;

// settings
var gammaCorrection = {
    gammaEnabled: false,
    quadratic:false,

};

async function main() {
    let stats = new Stats();
    document.body.appendChild(stats.dom);

    const gl = document.getElementById("canvas").getContext("webgl2");
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    gl.enable(gl.DEPTH_TEST);
    addGUI(gl);

    let shader = new Shader(gl, "shader.vs", "shader.fs");
    await shader.initialize();

    let planeVertices = new Float32Array([
        // positions            // normals         // texcoords
        10.0, -0.5, 10.0, 0.0, 1.0, 0.0, 10.0, 0.0,
        -10.0, -0.5, 10.0, 0.0, 1.0, 0.0, 0.0, 0.0,
        -10.0, -0.5, -10.0, 0.0, 1.0, 0.0, 0.0, 10.0,

        10.0, -0.5, 10.0, 0.0, 1.0, 0.0, 10.0, 0.0,
        -10.0, -0.5, -10.0, 0.0, 1.0, 0.0, 0.0, 10.0,
        10.0, -0.5, -10.0, 0.0, 1.0, 0.0, 10.0, 10.0
    ])


    let positionLoc = 0, normalLoc = 1, texCoordLoc = 2;

    let planeVAO = gl.createVertexArray();
    let planeVBO = gl.createBuffer();
    gl.bindVertexArray(planeVAO);
    gl.bindBuffer(gl.ARRAY_BUFFER, planeVBO);
    gl.bufferData(gl.ARRAY_BUFFER, planeVertices, gl.STATIC_DRAW);
    gl.vertexAttribPointer(positionLoc, 3, gl.FLOAT, false, 8 * planeVertices.BYTES_PER_ELEMENT, 0);
    gl.enableVertexAttribArray(positionLoc);
    gl.vertexAttribPointer(normalLoc, 3, gl.FLOAT, false, 8 * planeVertices.BYTES_PER_ELEMENT, 3 * planeVertices.BYTES_PER_ELEMENT);
    gl.enableVertexAttribArray(normalLoc);
    gl.vertexAttribPointer(texCoordLoc, 2, gl.FLOAT, false, 8 * planeVertices.BYTES_PER_ELEMENT, 6 * planeVertices.BYTES_PER_ELEMENT);
    gl.enableVertexAttribArray(texCoordLoc);
    gl.bindVertexArray(null);

    let floorTexture = await loadTexture(gl, "../../resources/textures/wood.png",true);

    let lightColors = [
        ...glMatrix.vec3.fromValues(0.25, 0.25, 0.25),
        ...glMatrix.vec3.fromValues(0.5, 0.5, 0.5),
        ...glMatrix.vec3.fromValues(0.75, 0.75, 0.75),
        ...glMatrix.vec3.fromValues(1.0, 1.0, 1.0),
    ];
    let lightPositions = [
        ...glMatrix.vec3.fromValues(-3.0, 0.0, 0.0),
        ...glMatrix.vec3.fromValues(-1.0, 0.0, 0.0),
        ...glMatrix.vec3.fromValues(1.0, 0.0, 0.0),
        ...glMatrix.vec3.fromValues(3.0, 0.0, 0.0)
    ];
    
    shader.use();
    shader.setInt("floorTexture", 0);


    function render(time) {
        let currentFrame = Math.round(time) / 1000;
        deltaTime = Math.floor(currentFrame * 1000 - lastFrame * 1000) / 1000;
        lastFrame = currentFrame;

        gl.clearColor(0.1, 0.1, 0.1, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        shader.use();

        let view = camera.getViewMatrix();
        let projection = glMatrix.mat4.identity(glMatrix.mat4.create());
        glMatrix.mat4.perspective(projection, glMatrix.glMatrix.toRadian(camera.zoom), gl.drawingBufferWidth / gl.drawingBufferHeight, 0.1, 100)
        shader.setMat4("view", view);
        shader.setMat4("projection", projection);

        // light
        shader.setVec3("lightPositions", [].concat(...lightPositions));
        shader.setVec3("lightColors", [].concat(...lightColors));
        shader.setVec3("viewPos", camera.position);
        shader.setInt("gamma", gammaCorrection.gammaEnabled);
        shader.setInt("quadratic", gammaCorrection.quadratic);
        

        // floor
        gl.bindVertexArray(planeVAO);
        
        gl.bindTexture(gl.TEXTURE_2D, floorTexture);
        
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        gl.bindTexture(gl.TEXTURE_2D, null);
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

    function addGUI(gl) {
        const GUI = new dat.GUI({ name: "gammaCorrection" });
        GUI.add(gammaCorrection, "gammaEnabled").name("gammaCorrection");
        GUI.add(gammaCorrection, "quadratic").name("quadratic")

    }
}

async function loadTexture(gl, url, gammaCorrection = false) {
    return new Promise(async (resolve, reject) => {
        let image = await IJS.Image.load(url);
        let { width, height, data, channels } = image;
        if (data) {
            /* 
                笔记
                1. 为了节省存储空间, 并且根据人眼对暗的敏感, 拍照保存的图片, 都会保存成SRGB
                1. 伽马纠正的内部纹理格式是 GL_SRGB，但数据格式还是GL_RGB
                2. apha通道不做伽马纠正 但是带有alpha通道的的话 要用 GL_SRGB_ALPHA
                3. 不是所有纹理都是在sRGB空间
                    diffuse纹理，这种为物体上色的纹理几乎都是在sRGB空间中的
                    specular贴图和法线贴图几乎都在线性空间中	
            */
            let format, internalFormat;
            let img = new Image();
            img.src = url;
            img.onload = () => {
                if (channels == 1)
                    format = internalFormat = gl.RED;
                else if (channels == 3) {
                    internalFormat = gl.RGB;
                    format = gl.RGB;
                } else if (channels == 4) {
                    internalFormat = gl.RGBA;
                    format = gl.RGBA;
                }
                let texture = gl.createTexture();
                gl.bindTexture(gl.TEXTURE_2D, texture);
                gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, format, gl.UNSIGNED_BYTE, img);
                gl.generateMipmap(gl.TEXTURE_2D)

                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);

                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
                resolve(texture);
            }

        } else {
            reject()
            console.warn("Texture failed to load at path: " + url);
        }

    })
}

