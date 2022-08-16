class Shader {
    constructor(gl, vertexPath, fragmentPath) {
        this.gl = gl;
        this.vertexPath = vertexPath;
        this.fragmentPath = fragmentPath;
    }

    async initialize(){
        let vertex = await this.loadFile(this.vertexPath);
        let fragment = await this.loadFile(this.fragmentPath);
        let vertexShader = this.createShader(vertex, this.gl.VERTEX_SHADER);
        let fragmentShader = this.createShader(fragment, this.gl.FRAGMENT_SHADER);
        this.createProgram(vertexShader, fragmentShader);
    }

    use() {
        if (this.ID) {
            this.gl.useProgram(this.ID);
        }
    }

    loadFile(url) {
        return new Promise((resolve, reject) => {
            fetch(url).then((res) => res.text()).then((text) => {
                resolve(text);
            }).catch((e) => {
                reject(e);
                throw new Error(`${file} NOT FOUND!`);
            })
        })

    }

    createShader(source, type) {
        let shader = this.gl.createShader(type);
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);
        this.checkCompileErrors(shader, type);
        return shader;
    }

    createProgram(vertexShader, fragmentShader) {
        this.ID = this.gl.createProgram();
        this.gl.attachShader(this.ID, vertexShader);
        this.gl.attachShader(this.ID, fragmentShader);
        this.gl.linkProgram(this.ID);
        this.checkCompileErrors(this.ID, "PROGRAM");
        this.gl.deleteShader(vertexShader);
        this.gl.deleteShader(fragmentShader);
    }

    setBool(name, value) {
        this.gl.uniform1i(this.gl.getUniformLocation(this.ID, name), value);
    }

    setInt(name, value) {
        this.gl.uniform1i(this.gl.getUniformLocation(this.ID, name), value);
    }

    setFloat(name, value) {
        this.gl.uniform1f(this.gl.getUniformLocation(this.ID, name), value);
    }

    checkCompileErrors(shader, type) {
        let info;
        if (type != "PROGRAM") {
            let status = this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS);
            if (!status) {
                info = this.gl.getShaderInfoLog(shader);
            }
        } else {
            let linkStatus = this.gl.getProgramParameter(shader, this.gl.LINK_STATUS);
            if (!linkStatus) {
                info = this.gl.getProgramInfoLog(shader);
            }
        }
        if (info) {
            throw new Error(`ERROR::SHADER_COMPILATION_ERROR of type: ${type}\n${info}`);
        }
    }
}