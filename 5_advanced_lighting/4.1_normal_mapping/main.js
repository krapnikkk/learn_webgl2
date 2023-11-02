let cameraPos = glMatrix.vec3.fromValues(0.0, 0.0, 3.0);
let camera = new Camera(cameraPos);
const SCR_WIDTH = 800;
const SCR_HEIGHT = 600;


let deltaTime = 0.0;	// time between current frame and last frame
let lastFrame = 0.0;
let isFirstMouse = true;
let lastX = SCR_WIDTH / 2, lastY = SCR_HEIGHT / 2;


async function main() {
    let stats = new Stats();
    document.body.appendChild(stats.dom);

    const gl = document.getElementById("canvas").getContext("webgl2");
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    gl.enable(gl.DEPTH_TEST);

    let shader = new Shader(gl, "shader.vs", "shader.fs");
    await shader.initialize();

    let diffuseMap = await loadTexture(gl, "../../resources/textures/brickwall.jpg");
    let normalMap = await loadTexture(gl, "../../resources/textures/brickwall_normal.jpg");


    shader.use();
    shader.setInt("diffuseMap", 0);
    shader.setInt("normalMap", 1);
    shader.setBool("normalMapping",true);

    let lightPos = glMatrix.vec3.fromValues(0.5, 1, 0.3);

    function render(time) {
        let currentFrame = Math.round(time) / 1000;
        deltaTime = Math.floor(currentFrame * 1000 - lastFrame * 1000) / 1000;
        lastFrame = currentFrame;

        gl.clearColor(0.1, 0.1, 0.1, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        let projection = glMatrix.mat4.identity(glMatrix.mat4.create());
        glMatrix.mat4.perspective(projection, glMatrix.glMatrix.toRadian(camera.zoom), gl.drawingBufferWidth / gl.drawingBufferHeight, 0.1, 100)
        let view = camera.getViewMatrix();
        let model = glMatrix.mat4.identity(glMatrix.mat4.create());
        let normalize = glMatrix.vec3.create();
        glMatrix.vec3.normalize(normalize, glMatrix.vec3.fromValues(1.0, 0.0, 1.0))
        glMatrix.mat4.rotate(model, model, glMatrix.glMatrix.toRadian(time / 1000 * -10), normalize);

        shader.use();
        shader.setMat4("projection", projection);
        shader.setMat4("view", view);
        shader.setMat4("model", model);

        shader.setVec3("viewPos", camera.position);
        shader.setVec3("lightPos", lightPos);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, diffuseMap);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, normalMap);
        renderQuad();

        model = glMatrix.mat4.identity(glMatrix.mat4.create());
        glMatrix.mat4.translate(model, model, lightPos);
        let sacleAmount = 0.1;
        glMatrix.mat4.scale(model, model, glMatrix.vec3.fromValues(sacleAmount, sacleAmount, sacleAmount));
        shader.setMat4("model", model);
        renderQuad();

        stats.update();
        requestAnimationFrame(render);
    }

    requestAnimationFrame(render);
    addGUI();
    function addGUI() {
        const GUI = new dat.GUI({ name: "normalMap" });

        let normalMap = {
            "enable": true,
        };
        GUI.add(normalMap, "enable").name("normalMap").onChange((val) => {
            shader.use();
            shader.setBool("normalMapping",val);
        });

    }

    let quadVAO = gl.createVertexArray();
    let quadVBO = gl.createBuffer();
    function renderQuad() {
        if (quadVAO) {
            // positions
            let pos1 = glMatrix.vec3.fromValues(-1.0, 1.0, 0.0);	// 模型在XOY平面  就是竖着朝向镜头
            let pos2 = glMatrix.vec3.fromValues(-1.0, -1.0, 0.0);
            let pos3 = glMatrix.vec3.fromValues(1.0, -1.0, 0.0);
            let pos4 = glMatrix.vec3.fromValues(1.0, 1.0, 0.0);
            // texture coordinates
            let uv1 = glMatrix.vec2.fromValues(0.0, 1.0);				// 左下角的顶点 对应 纹理的原点(左下角)
            let uv2 = glMatrix.vec2.fromValues(0.0, 0.0);
            let uv3 = glMatrix.vec2.fromValues(1.0, 0.0);
            let uv4 = glMatrix.vec2.fromValues(1.0, 1.0);
            // normal vector
            let nm = glMatrix.vec3.fromValues(0.0, 0.0, 1.0);		// 模型坐标系下的法线 这里6个的顶点都一样

            // 每个表面都是一个三角形"平面"  
            // 三角形"平面" 可认为是切线和法线所在平面  TOB平面
            //
            // 法线贴图的切线和副切线与纹理坐标的两个方向对齐
            //
            // 在这个平面内,  该三角形纹理的方向(纹理坐标增长的方向), 跟T和B轴正方向一样

            // 拆解公式:
            // E = deltaU * T+ delatV * B
            //      = (U1 - U2) * T  +(V1 - V2)* B
            //      = (U1*T +V1*B) - (U2*T +V2*B) 
            //      = P1 - P2 
            //  P1 = (U1*T +V1*B)  = {T, B}(U1,V1)    ---U1和V1是个标量 (U1,V1)是纹理坐标系中的向量
            //  P2 = (U2*T +V2*B)                              ---T和B向量相当于在模型坐标系描述纹理坐标系的两个轴

            //  该公式描述的数学意义是，如何将一个点从uv空间映射到三维空间
            //  假设三角形中存在一点P，则向量OP=u（p）*T+v（p）*B，
            //  只要知道P点的uv坐标值，即可得到P点的三维坐标值
            //  也就是(U1,V1),(U2,V2)从纹理坐标系 转换到模型坐标系 
            //  现在相当于
            //      知道了 (U1,V1),(U2,V2),(U3,V3) 纹理坐标系中的位置, 
            //  同时也
            //       知道了模型坐标系中的位置P1 P2 P3 
            //  然后求T和B轴的坐标  
            // ?? 这样算出来的T和B轴是垂直的?? 讨论记录在 https://zhuanlan.zhihu.com/p/139593847

            // 
            //  注意(U,V)是二维坐标, 
            //      两个点所构成的方程组, 虽然有6个方程(6个参数) 
            //      但简单画图可以知道,  这两个点不能固定T轴和B轴在三维空间的位置(可以旋转起来)
            //      所以得到解析解,需要3个点   

            //  共享顶点 
            //		非共享情况: 
            //			只需为每个三角形计算一个切线/副切线，它们对于每个三角形上的顶点都是一样 
            //		共享情况:
            //			要注意的是大多数实现通常三角形和三角形之间都会共享顶点。
            //			!!! 这种情况下开发者通常将每个顶点的 ""法线和切线/副切线""等 ""顶点属性"" 平均化，
            //			以获得更加柔和的效果 (??这种情况?? 法线和切线都会做平均? 平均之后就不能相互垂直)
            //			!!! 这样切线就不一定跟法线垂直了, 需要做施密特正交化
            // 

            // calculate tangent/bitangent vectors of both triangles
            let tangent1 = glMatrix.vec3.create(),
                bitangent1 = glMatrix.vec3.create();  // 第一个三角形平面 
            let tangent2 = glMatrix.vec3.create(),
                bitangent2 = glMatrix.vec3.create();
            // triangle 1
            // ----------
            let edge1 = glMatrix.vec3.create(),
                edge2 = glMatrix.vec3.create(),
                deltaUV1 = glMatrix.vec3.create(),
                deltaUV2 = glMatrix.vec3.create();
            glMatrix.vec3.subtract(edge1, pos2, pos1);
            glMatrix.vec3.subtract(edge2, pos3, pos1);
            glMatrix.vec3.subtract(deltaUV1, uv2, uv1);
            glMatrix.vec3.subtract(deltaUV2, uv3, uv1);

            // 逆矩阵 = 1/行列式 * 伴随矩阵 
            let f = 1.0 / (deltaUV1[0] * deltaUV2[1] - deltaUV2[0] * deltaUV1[1]);

            tangent1[0] = f * (deltaUV2[1] * edge1[0] - deltaUV1[1] * edge2[0]);
            tangent1[1] = f * (deltaUV2[1] * edge1[1] - deltaUV1[1] * edge2[1]);
            tangent1[2] = f * (deltaUV2[1] * edge1[2] - deltaUV1[1] * edge2[2]);
            // tangent1 = glm::normalize(tangent1);
            // f*相当于一个标量乘上去了, 所以如果要normalize的话,也可以不用乘以f

            bitangent1[0] = f * (-deltaUV2[0] * edge1[0] + deltaUV1[0] * edge2[0]);
            bitangent1[1] = f * (-deltaUV2[0] * edge1[1] + deltaUV1[0] * edge2[1]);
            bitangent1[2] = f * (-deltaUV2[0] * edge1[2] + deltaUV1[0] * edge2[2]);
            // bitangent1 = glm::normalize(bitangent1);  

            // triangle 2
            // ----------
            glMatrix.vec3.subtract(edge1, pos3, pos1);
            glMatrix.vec3.subtract(edge2, pos4, pos1);
            glMatrix.vec3.subtract(deltaUV1, uv3, uv1);
            glMatrix.vec3.subtract(deltaUV2, uv4, uv1);

            f = 1.0 / (deltaUV1[0] * deltaUV2[1] - deltaUV2[0] * deltaUV1[1]);

            tangent2[0] = f * (deltaUV2[1] * edge1[0] - deltaUV1[1] * edge2[0]);
            tangent2[1] = f * (deltaUV2[1] * edge1[1] - deltaUV1[1] * edge2[1]);
            tangent2[2] = f * (deltaUV2[1] * edge1[2] - deltaUV1[1] * edge2[2]);


            bitangent2[0] = f * (-deltaUV2[0] * edge1[0] + deltaUV1[0] * edge2[0]);
            bitangent2[1] = f * (-deltaUV2[0] * edge1[1] + deltaUV1[0] * edge2[1]);
            bitangent2[2] = f * (-deltaUV2[0] * edge1[2] + deltaUV1[0] * edge2[2]);

            // 顶点坐标(模型坐标系), 法线, 纹理坐标, 切线, 副切线(模型坐标系)
            let quadVertices = new Float32Array([
                // positions            // normal         // texcoords  // tangent                          // bitangent
                pos1[0], pos1[1], pos1[2], nm[0], nm[1], nm[2], uv1[0], uv1[1], tangent1[0], tangent1[1], tangent1[2], bitangent1[0], bitangent1[1], bitangent1[2],
                pos2[0], pos2[1], pos2[2], nm[0], nm[1], nm[2], uv2[0], uv2[1], tangent1[0], tangent1[1], tangent1[2], bitangent1[0], bitangent1[1], bitangent1[2],
                pos3[0], pos3[1], pos3[2], nm[0], nm[1], nm[2], uv3[0], uv3[1], tangent1[0], tangent1[1], tangent1[2], bitangent1[0], bitangent1[1], bitangent1[2],
                // 两个三角形, 这里没有用共享顶点, 法线和切线没有做平均
                pos1[0], pos1[1], pos1[2], nm[0], nm[1], nm[2], uv1[0], uv1[1], tangent2[0], tangent2[1], tangent2[2], bitangent2[0], bitangent2[1], bitangent2[2],
                pos3[0], pos3[1], pos3[2], nm[0], nm[1], nm[2], uv3[0], uv3[1], tangent2[0], tangent2[1], tangent2[2], bitangent2[0], bitangent2[1], bitangent2[2],
                pos4[0], pos4[1], pos4[2], nm[0], nm[1], nm[2], uv4[0], uv4[1], tangent2[0], tangent2[1], tangent2[2], bitangent2[0], bitangent2[1], bitangent2[2]
            ]);
            // configure plane VAO
            gl.bindVertexArray(quadVAO);
            gl.bindBuffer(gl.ARRAY_BUFFER, quadVBO);
            gl.bufferData(gl.ARRAY_BUFFER, quadVertices, gl.STATIC_DRAW);
            gl.enableVertexAttribArray(0);
            gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 14 * quadVertices.BYTES_PER_ELEMENT, 0);
            gl.enableVertexAttribArray(1);
            gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 14 * quadVertices.BYTES_PER_ELEMENT, (3 * quadVertices.BYTES_PER_ELEMENT));
            gl.enableVertexAttribArray(2);
            gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 14 * quadVertices.BYTES_PER_ELEMENT, (6 * quadVertices.BYTES_PER_ELEMENT));
            gl.enableVertexAttribArray(3);
            gl.vertexAttribPointer(3, 3, gl.FLOAT, false, 14 * quadVertices.BYTES_PER_ELEMENT, (8 * quadVertices.BYTES_PER_ELEMENT));
            gl.enableVertexAttribArray(4);
            gl.vertexAttribPointer(4, 3, gl.FLOAT, false, 14 * quadVertices.BYTES_PER_ELEMENT, (11 * quadVertices.BYTES_PER_ELEMENT));
        }
        gl.bindVertexArray(quadVAO);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        gl.bindVertexArray(null);
    }


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
}

async function loadTexture(gl, url, gammaCorrection = false) {
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

