let cameraPos = glMatrix.vec3.fromValues(0.0, 4.0, 0.0);
let camera = new Camera(cameraPos);

const SCR_WIDTH = 800;
const SCR_HEIGHT = 600;

let deltaTime = 0.0;	// time between current frame and last frame
let lastFrame = 0.0;
let isFirstMouse = true;
let lastX = SCR_WIDTH / 2, lastY = SCR_HEIGHT / 2;

// material
let material = {
    shininess: 1
};

// pointLight
const NR_POINT_LIGHTS = 2;
let pointLight = {
    specular: [1 * 255, 1 * 255, 1 * 255],
    diffuse: [1 * 255, 1 * 255, 1 * 255],
    ambient: [0.2 * 255, 0.2 * 255, 0.2 * 255],
    distance: "65"
},
    distanceMap = {
        "7": { constant: 1, linear: 0.7, quadratic: 1.8 },
        "13": { constant: 1, linear: 0.35, quadratic: 0.44 },
        "20": { constant: 1, linear: 0.22, quadratic: 0.2 },
        "32": { constant: 1, linear: 0.14, quadratic: 0.07 },
        "50": { constant: 1, linear: 0.09, quadratic: 0.032 },
        "65": { constant: 1, linear: 0.07, quadratic: 0.017 },
        "100": { constant: 1, linear: 0.045, quadratic: 0.0075 }
    };

let pointLightPositions = [
    glMatrix.vec3.fromValues(0.7, 0.2, 2.0),
    glMatrix.vec3.fromValues(0.0, 0.0, -3.0)
];

async function main() {
    let stats = new Stats();
    document.body.appendChild(stats.dom);

    const gl = document.getElementById("canvas").getContext("webgl2",{stencil:true});
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LESS);
    // stencil
    gl.enable(gl.STENCIL_TEST);
    gl.stencilFunc(gl.EQUAL,1,0xFF);
    gl.stencilOp(gl.KEEP, gl.KEEP, gl.REPLACE);

    let modelShader = new Shader(gl, "model.vs", "model.fs");
    await modelShader.initialize();
    let colorShader = new Shader(gl, "color.vs", "color.fs");
    await colorShader.initialize();
    addGUI(modelShader);

    let obj = new Model(gl, '../../resources/objects/nanosuit');
    await obj.loadModel(['nanosuit.mtl', 'nanosuit.obj'])


    function render(time) {
        let currentFrame = Math.round(time) / 1000;
        deltaTime = Math.floor(currentFrame * 1000 - lastFrame * 1000) / 1000;
        lastFrame = currentFrame;

        gl.clearColor(0.1, 0.1, 0.1, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);

        modelShader.use();

        modelShader.setVec3("viewPos", camera.position);
        modelShader.setFloat("shininess", Math.pow(2, material.shininess));
        gl.stencilMask(0x00);// 禁用写入，不更新模板缓冲

        // pointLight 
        for (let i = 0; i < NR_POINT_LIGHTS; i++) {
            let { constant, linear, quadratic } = distanceMap[pointLight.distance];
            modelShader.setVec3(`pointLights[${i}].position`, pointLightPositions[i]);
            modelShader.setVec3(`pointLights[${i}].ambient`, glMatrix.vec3.clone(pointLight.ambient.map((c) => c / 255)));
            modelShader.setVec3(`pointLights[${i}].diffuse`, glMatrix.vec3.clone(pointLight.diffuse.map((c) => c / 255)));
            modelShader.setVec3(`pointLights[${i}].specular`, glMatrix.vec3.clone(pointLight.specular.map((c) => c / 255)));
            modelShader.setFloat(`pointLights[${i}].constant`, constant);
            modelShader.setFloat(`pointLights[${i}].linear`, linear);
            modelShader.setFloat(`pointLights[${i}].quadratic`, quadratic);
        }

        let projection = glMatrix.mat4.identity(glMatrix.mat4.create());
        glMatrix.mat4.perspective(projection, glMatrix.glMatrix.toRadian(camera.zoom), gl.drawingBufferWidth / gl.drawingBufferHeight, 0.1, 100)
        let view = camera.getViewMatrix();
        let model = glMatrix.mat4.identity(glMatrix.mat4.create());
        glMatrix.mat4.translate(model, model, glMatrix.vec3.fromValues(0, 0, -10));
        glMatrix.mat4.scale(model, model, glMatrix.vec3.fromValues(0.5, 0.5, 0.5));
        glMatrix.mat4.rotate(model, model, currentFrame, glMatrix.vec3.fromValues(0.0, 1.0, 0.0));

        modelShader.setMat4("projection", projection);
        modelShader.setMat4("view", view);
        modelShader.setMat4("model", model);

        gl.stencilFunc(gl.ALWAYS, 1, 0xFF); // 所有片段都应该更新模板缓冲
        gl.stencilMask(0xFF); // 每一位写入模板缓冲时都保持原样

        obj.draw(modelShader);


        gl.stencilFunc(gl.NOTEQUAL, 1, 0xFF);
        gl.stencilMask(0x00);// 禁用写入，不更新模板缓冲，使用之前的数据进行对比
        gl.disable(gl.DEPTH_TEST); // 关闭深度测试，让边框被绘制

        colorShader.use();
        colorShader.setMat4("projection", projection);
        colorShader.setMat4("view", view);
        model = glMatrix.mat4.identity(glMatrix.mat4.create());
        
        glMatrix.mat4.translate(model, model, glMatrix.vec3.fromValues(0, 0, -10));
        glMatrix.mat4.scale(model, model, glMatrix.vec3.fromValues(0.5, 0.5, 0.5));
        glMatrix.mat4.rotate(model, model, currentFrame, glMatrix.vec3.fromValues(0.0, 1.0, 0.0));
        
        colorShader.setMat4("model", model);
        obj.draw(colorShader);

        gl.stencilMask(0xFF);// 每一位写入模板缓冲时都保持原样
        gl.stencilFunc(gl.ALWAYS, 0, 0xFF);
        gl.enable(gl.DEPTH_TEST);

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

    function addGUI() {
        const materialGUI = new dat.GUI({ name: "material" });
        let materialSpecularFolder = materialGUI.addFolder("Material");
        materialSpecularFolder.add(material, "shininess", 1, 8, 1)
        
        const pointLightGUI = new dat.GUI({ name: "pointLight" });
        let pointLightSpecularFolder = pointLightGUI.addFolder("Specular");
        let pointLightDiffuseFolder = pointLightGUI.addFolder("Diffuse");
        let pointlightAmbientFolder = pointLightGUI.addFolder("Ambient");
        let pointLightDistanceFolder = pointLightGUI.addFolder("cover distance");
        pointLightSpecularFolder.addColor(pointLight, "specular")
        pointLightDiffuseFolder.addColor(pointLight, "diffuse")
        pointlightAmbientFolder.addColor(pointLight, "ambient")
        pointLightDistanceFolder.add(pointLight, "distance", Object.keys(distanceMap));
    }
}
