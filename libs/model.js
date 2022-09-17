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

    }

    draw(shader) {
        for (let i = 0; i < this.meshes.length; i++)
            this.meshes[i].draw(shader);
    }

    async loadModel(files) {
        return new Promise((res, rej) => {
            assimpjs().then((ajs) => {
                // fetch the files to import
                Promise.all(files.map((file) => fetch(file))).then((responses) => {
                    return Promise.all(responses.map((res) => res.arrayBuffer()));
                }).then(async (arrayBuffers) => {
                    // create new file list object, and add the files
                    let fileList = new ajs.FileList();
                    for (let i = 0; i < files.length; i++) {
                        fileList.AddFile(files[i], new Uint8Array(arrayBuffers[i]));
                    }

                    // convert file list to assimp json
                    let result = ajs.ConvertFileList(fileList, 'assjson');

                    // check if the conversion succeeded
                    if (!result.IsSuccess() || result.FileCount() == 0) {
                        console.log(result.GetErrorCode());
                        rej(result.GetErrorCode())
                    }

                    // get the result file, and convert to string
                    let resultFile = result.GetFile(0);
                    let scene = JSON.parse(new TextDecoder().decode(resultFile.GetContent()));
                    console.log(scene);
                    await this.processNode(scene.rootnode, scene);
                    res();
                });
            });
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
            vertices.push(mesh.vertices[i * 3], mesh.vertices[i * 3 + 1], mesh.vertices[i * 3 + 2])
            if (mesh.normals.length > 0) {
                vertices.push(mesh.normals[i * 3], mesh.normals[i * 3 + 1], mesh.normals[i * 3 + 2])
            } else {
                vertices.push(0, 0, 0)
            }
            if (mesh.texturecoords[0]) {
                vertices.push(mesh.texturecoords[0][i * 2], mesh.texturecoords[0][i * 2 + 1])
                mesh.tangents ? vertices.push(mesh.tangents[i * 3], mesh.tangents[i * 3 + 1], mesh.tangents[i * 3 + 2]) : vertices.push(0, 0, 0);
                mesh.bitangent ? vertices.push(mesh.bitangent[i * 3], mesh.bitangent[i * 3 + 1], mesh.bitangent[i * 3 + 2]) : vertices.push(0, 0, 0);
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
        // let specularMaps = await this.loadMaterialTextures(material, textureTypeMap.aiTextureType_SPECULAR, "texture_specular");
        // textures = textures.concat(specularMaps);
        // 3. normal maps
        // let normalMaps = await this.loadMaterialTextures(material, textureTypeMap.aiTextureType_HEIGHT, "texture_normal");
        // textures = textures.concat(normalMaps);
        // 4. height maps
        // let heightMaps = await this.loadMaterialTextures(material, textureTypeMap.aiTextureType_AMBIENT, "texture_ambient");
        // textures = textures.concat(heightMaps);

        // return a mesh object created from the extracted mesh data
        return new Mesh(this.gl, vertices, indices, textures);
    }

    async loadMaterialTextures(mat, type, typeName) {
        let textures = [];
        let cnt = this.getTextureCount(mat, type);
        for (let i = 0; i < cnt; i++) {
            let str = this.getTexture(mat, type, i);
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

        let data = await this.loadImage(filename);
        let { width, height } = data,
            nrComponents = 4;
        if (data) {
            let format;
            if (nrComponents == 1)
                format = this.gl.RED;
            else if (nrComponents == 3)
                format = this.gl.RGB;
            else if (nrComponents == 4)
                format = this.gl.RGBA;

            this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, true);
            this.gl.bindTexture(this.gl.TEXTURE_2D, textureID);
            // this.gl.texImage2D(this.gl.TEXTURE_2D, 0, format, width, height, 0, format, this.gl.UNSIGNED_BYTE, data);
            this.gl.texImage2D(this.gl.TEXTURE_2D, 0, format, format, this.gl.UNSIGNED_BYTE, data);
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

    async loadImage(url) {
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
}