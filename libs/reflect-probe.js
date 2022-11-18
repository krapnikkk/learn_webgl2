const s_Fronts = [
    glMatrix.vec3.fromValues(1.0, 0.0, 0.0),
    glMatrix.vec3.fromValues(-1.0, 0.0, 0.0),
    glMatrix.vec3.fromValues(0.0, 1.0, 0.0),
    glMatrix.vec3.fromValues(0.0, -1.0, 0.0),
    glMatrix.vec3.fromValues(0.0, 0.0, 1.0),
    glMatrix.vec3.fromValues(0.0, 0.0, -1.0)
];
const s_Ups = [
    glMatrix.vec3.fromValues(0.0, -1.0, 0.0), // right
    glMatrix.vec3.fromValues(0.0, -1.0, 0.0), // left
    glMatrix.vec3.fromValues(0.0, 0.0, 1.0),  // bottom
    glMatrix.vec3.fromValues(0.0, 0.0, -1.0), // top
    glMatrix.vec3.fromValues(0.0, -1.0, 0.0), // back
    glMatrix.vec3.fromValues(0.0, -1.0, 0.0) // front
];
class ReflectProbe {
    constructor(gl, textureSize, position) {
        this.gl = gl;
        this.fboSize = textureSize;

        this.framebuffers = [];
        this.probeCubeRboId = 0;
        this.probeCamera = new Camera(position);
        this.init();
    }

    init() {
        this.framebufferTex = this.gl.createTexture();
        this.gl.bindTexture(this.gl.TEXTURE_CUBE_MAP, this.framebufferTex);
        for (let i = 0; i < 6; i++) {
            this.gl.texImage2D(this.gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, 0, this.gl.RGB, this.fboSize, this.fboSize, 0, this.gl.RGB, this.gl.UNSIGNED_BYTE, null);
        }
        this.gl.texParameteri(this.gl.TEXTURE_CUBE_MAP, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
        this.gl.texParameteri(this.gl.TEXTURE_CUBE_MAP, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
        this.gl.texParameteri(this.gl.TEXTURE_CUBE_MAP, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_CUBE_MAP, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_CUBE_MAP, this.gl.TEXTURE_WRAP_R, this.gl.CLAMP_TO_EDGE);
        this.gl.bindTexture(this.gl.TEXTURE_CUBE_MAP, null);

        let rbo = this.gl.createRenderbuffer();
        this.gl.bindRenderbuffer(this.gl.RENDERBUFFER, rbo);
        this.gl.renderbufferStorage(this.gl.RENDERBUFFER, this.gl.DEPTH24_STENCIL8, this.fboSize, this.fboSize);
        this.gl.bindRenderbuffer(this.gl.RENDERBUFFER, null);

        for (let i = 0; i < 6; i++) {
            let framebuffer = this.gl.createFramebuffer();
            this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, framebuffer);
            this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, this.framebufferTex, 0);

            this.gl.framebufferRenderbuffer(this.gl.FRAMEBUFFER, this.gl.DEPTH_STENCIL_ATTACHMENT, this.gl.RENDERBUFFER, rbo);
            if (this.gl.checkFramebufferStatus(this.gl.FRAMEBUFFER) != this.gl.FRAMEBUFFER_COMPLETE)
                console.log("ERROR::FRAMEBUFFER:: Framebuffer is not complete!");
            this.framebuffers.push(framebuffer);
        }

        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);
    }

    drawSceneToCubemap(drawSceneFunc) {

        this.gl.viewport(0, 0, this.fboSize, this.fboSize);

        let radio = this.fboSize / this.fboSize; // == 1.0
        let fov = 90;    // 90.0度
        let projection = glMatrix.mat4.identity(glMatrix.mat4.create());
        glMatrix.mat4.perspective(projection, glMatrix.glMatrix.toRadian(fov), radio, 0.1, 100)





        for (let i = 0; i < 6; i++) {
            this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.framebuffers[i]);
            this.gl.clearColor(0, 0, 0, 0);
            this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT); // 不用加载 原来颜色附件数据从fbo到tile buffer

            this.probeCamera.front = s_Fronts[i];
            this.probeCamera.up = s_Ups[i];

            let view = this.probeCamera.getViewMatrix();
            drawSceneFunc(view, projection, this.probeCamera.position, 0);

        }

        this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, null);

    }

    getReflectProbeTexture() {
        return this.framebufferTex;
    }
}