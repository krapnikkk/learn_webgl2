const textureTypeMap = {
    aiTextureType_DIFFUSE: 1,
    aiTextureType_SPECULAR: 2,
    aiTextureType_AMBIENT: 3,
    aiTextureType_HEIGHT: 5,
    aiTextureType_NORMALS: 6
}
class Model {
    meshes = [];
    textures_loaded = [];
    constructor(gl, directory, gamma = false) {
        this.gl = gl;
        this.gammaCorrection = gamma;
        this.directory = directory;
        this.minX = Number.MAX_SAFE_INTEGER;
        this.minY = Number.MAX_SAFE_INTEGER;
        this.minZ = Number.MAX_SAFE_INTEGER;
        this.maxX = Number.MIN_SAFE_INTEGER;
        this.maxY = Number.MIN_SAFE_INTEGER;
        this.maxZ = Number.MIN_SAFE_INTEGER;
    }

    draw(shader) {
        for (let i = 0; i < this.meshes.length; i++)
            this.meshes[i].draw(shader);
    }

    async loadModel(files, format = 'assjson') {
        return new Promise((res, rej) => {
            assimpjs().then((ajs) => {
                // fetch the files to import
                Promise.all(files.map((file) => fetch(`${this.directory}/${file}`))).then((responses) => {
                    return Promise.all(responses.map((res) => res.arrayBuffer()));
                }).then(async (arrayBuffers) => {
                    // create new file list object, and add the files
                    let fileList = new ajs.FileList();
                    for (let i = 0; i < files.length; i++) {
                        fileList.AddFile(files[i], new Uint8Array(arrayBuffers[i]));
                    }

                    // convert file list to assimp json
                    let result = ajs.ConvertFileList(fileList, format);
                    // let result = ajs.ConvertFileList(fileList, 'assjson');

                    // check if the conversion succeeded
                    if (!result.IsSuccess() || result.FileCount() == 0) {
                        console.log(result.GetErrorCode());
                        rej(result.GetErrorCode())
                    }

                    // get the result file, and convert to string
                    let resultFile = result.GetFile(0);
                    let scene = JSON.parse(new TextDecoder().decode(resultFile.GetContent()));
                    console.log(scene);
                    debugger
                    await this.processNode(scene.rootnode, scene);
                    res();
                });
            });
        })
    }

    loadScene(url) {
        return new Promise((res, rej) => {
            fetch(`${this.directory}/${url}`).then((res) => {
                return res.json();
            }).then(scene => {
                this.processNode(scene.rootnode, scene).then(() => {
                    res();
                })
            })
        })
    }

    async processNode(node, scene) {
        let numMeshes = node.meshes ? node.meshes.length : 0;
        for (let i = 0; i < numMeshes; i++) {
            let mesh = scene.meshes[node.meshes[i]];
            this.meshes.push(await this.processMesh(mesh, scene));
        }

        let numChilren = node.children ? node.children.length : 0;
        for (let i = 0; i < numChilren; i++) {
            await this.processNode(node.children[i], scene);
        }
    }

    async processMesh(mesh, scene) {
        let vertices = [];
        let indices = [];
        let textures = [];
        for (let i = 0; i < mesh.vertices.length / 3; i++) {
            let x = mesh.vertices[i * 3], y = mesh.vertices[i * 3 + 1], z = mesh.vertices[i * 3 + 2];
            vertices.push(x, y, z);
            if (x < this.minX) this.minX = x;
            if (x >= this.maxX) this.maxX = x;
            if (y < this.minY) this.minY = y;
            if (y >= this.maxY) this.maxY = y;
            if (z < this.minZ) this.minZ = z;
            if (z >= this.maxZ) this.maxZ = z;
            if (mesh.normals.length > 0) {
                vertices.push(mesh.normals[i * 3], mesh.normals[i * 3 + 1], mesh.normals[i * 3 + 2])
            } else {
                vertices.push(0, 0, 0)
            }
            if (mesh.texturecoords && mesh.texturecoords[0]) {
                vertices.push(mesh.texturecoords[0][i * 2], mesh.texturecoords[0][i * 2 + 1])
                mesh.tangents ? vertices.push(mesh.tangents[i * 3], mesh.tangents[i * 3 + 1], mesh.tangents[i * 3 + 2]) : vertices.push(0, 0, 0);
                mesh.bitangents ? vertices.push(mesh.bitangents[i * 3], mesh.bitangents[i * 3 + 1], mesh.bitangents[i * 3 + 2]) : vertices.push(0, 0, 0);
            } else {
                vertices.push(0, 0);
                vertices.push(0, 0, 0);
                vertices.push(0, 0, 0);
            }
        }
        for (let i = 0; i < mesh.faces.length; i++) {
            let face = mesh.faces[i];
            for (let j = 0; j < face.length; j++) {
                indices.push(face[j]);
            }
        }
        let material = scene.materials[mesh.materialindex]['properties'];
        // 1. diffuse maps
        let diffuseMaps = await this.loadMaterialTextures(material, textureTypeMap.aiTextureType_DIFFUSE, "texture_diffuse");
        textures = textures.concat(diffuseMaps);
        // 2. specular maps
        let specularMaps = await this.loadMaterialTextures(material, textureTypeMap.aiTextureType_SPECULAR, "texture_specular");
        textures = textures.concat(specularMaps);
        // 3. normal maps
        let normalMaps = await this.loadMaterialTextures(material, textureTypeMap.aiTextureType_HEIGHT, "texture_normal");
        textures = textures.concat(normalMaps);
        // 4. height maps
        // let heightMaps = await this.loadMaterialTextures(material, textureTypeMap.aiTextureType_AMBIENT, "texture_ambient");
        // textures = textures.concat(heightMaps);
        // 5. reflection maps
        let reflectionMaps = await this.loadMaterialTextures(material, textureTypeMap.aiTextureType_AMBIENT, "texture_reflection");
        textures = textures.concat(reflectionMaps);

        // return a mesh object created from the extracted mesh data
        return new Mesh(this.gl, vertices, indices, textures);
    }

    async loadMaterialTextures(mat, type, typeName) {
        let textures = [];
        let cnt = this.getTextureCount(mat, type);
        for (let i = 0; i < cnt; i++) {
            let str = this.getTexture(mat, type, i);
            // console.log(str);
            //     // check if texture was loaded before and if so, continue to next iteration: skip loading a new texture
            let skip = false;
            for (let j = 0; j < this.textures_loaded.length; j++) {
                if (this.textures_loaded[j].path == str) {
                    textures.push(this.textures_loaded[j]);
                    skip = true; // a texture with the same filepath has already been loaded, continue to next one. (optimization)
                    break;
                }
            }
            if (!skip) {   // if texture hasn't been loaded already, load it
                let texture = {};
                texture.id = await this.textureFromFile(str, this.directory);
                texture.type = typeName;
                texture.path = str;
                textures.push(texture);
                this.textures_loaded.push(texture);  // store it as texture loaded for entire model, to ensure we won't unnecesery load duplicate textures.
            }
        }
        // console.log(textures)
        return textures;
    }

    getTextureCount(mats, type) {
        let idx = 0;
        for (let i = 0; i < mats.length; i++) {
            let mat = mats[i];
            if (mat.semantic == type && mat.key == '$tex.file') {
                idx++
            }
        }
        return idx;
    }

    getTexture(mats, type, cnt) {
        let idx = 0;
        let val = '';
        for (let i = 0; i < mats.length; i++) {
            let mat = mats[i];
            if (mat.semantic == type && mat.key == '$tex.file') {
                if (cnt == idx) {
                    val = mat.value;
                    break;
                }
                idx++
            }
        }
        return val;
    }

    async textureFromFile(path, directory, gamma = false) {
        let filename = directory + '/' + path;
        let textureID = this.gl.createTexture();

        let image = await IJS.Image.load(filename);
        let { width, height, data, channels } = image;
        if (data) {
            let format;
            if (channels == 1)
                format = this.gl.RED;
            else if (channels == 3)
                format = this.gl.RGB;
            else if (channels == 4)
                format = this.gl.RGBA;

            // this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, true);
            this.gl.bindTexture(this.gl.TEXTURE_2D, textureID);
            this.gl.texImage2D(this.gl.TEXTURE_2D, 0, format, width, height, 0, format, this.gl.UNSIGNED_BYTE, data);
            this.gl.generateMipmap(this.gl.TEXTURE_2D);

            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.REPEAT);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.REPEAT);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR_MIPMAP_LINEAR);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);

        }
        else {
            console.warn("Texture failed to load at path: " + path);
        }

        return textureID;
    }

}