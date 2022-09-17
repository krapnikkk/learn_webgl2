const Vertex = {
    Position: 3,
    Normal: 3,
    TexCoords: 2,
    Tangent: 3,
    Bitangent: 3,
    m_BoneIDs: 4,
    m_Weights: 4
}

class Mesh {
    constructor(gl, vertices, indices, textures) {
        this.gl = gl;
        this.vertices = new Float32Array(vertices);
        this.indices = indices.length > 256 ? new Uint16Array(indices) : new Uint8Array(indices);
        this.textures = textures;

        this.setupMesh();
    }

    setupMesh() {
        this.VAO = this.gl.createVertexArray();
        this.vbo = this.gl.createBuffer();
        this.ebo = this.gl.createBuffer();

        this.gl.bindVertexArray(this.VAO);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vbo);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, this.vertices, this.gl.STATIC_DRAW);

        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.ebo);
        this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, this.indices, this.gl.STATIC_DRAW);

        // vertex Positions
        this.gl.vertexAttribPointer(0, Vertex.Position, this.gl.FLOAT, this.gl.FALSE, 14 * this.vertices.BYTES_PER_ELEMENT, 0);
        this.gl.enableVertexAttribArray(0);

        // vertex normals
        this.gl.vertexAttribPointer(1, Vertex.Normal, this.gl.FLOAT, this.gl.FALSE, 14 * this.vertices.BYTES_PER_ELEMENT, 3 * this.vertices.BYTES_PER_ELEMENT);
        this.gl.enableVertexAttribArray(1);
        // vertex texture coords
        this.gl.vertexAttribPointer(2, Vertex.TexCoords, this.gl.FLOAT, this.gl.FALSE, 14 * this.vertices.BYTES_PER_ELEMENT, 6 * this.vertices.BYTES_PER_ELEMENT);
        this.gl.enableVertexAttribArray(2);
        // vertex tangent
        this.gl.enableVertexAttribArray(3);
        this.gl.vertexAttribPointer(3, Vertex.Tangent, this.gl.FLOAT, this.gl.FALSE, 14* this.vertices.BYTES_PER_ELEMENT, 8 * this.vertices.BYTES_PER_ELEMENT);
        // vertex bitangent
        this.gl.enableVertexAttribArray(4);
        this.gl.vertexAttribPointer(4, Vertex.Bitangent, this.gl.FLOAT, this.gl.FALSE, 14* this.vertices.BYTES_PER_ELEMENT, 11 * this.vertices.BYTES_PER_ELEMENT);
        // ids
        // this.gl.enableVertexAttribArray(5);
        // this.gl.vertexAttribIPointer(5, Vertex.m_BoneIDs, this.gl.UNSIGNED_BYTE, 22* this.vertices.BYTES_PER_ELEMENT, 14 * this.vertices.BYTES_PER_ELEMENT);

        // weights
        // this.gl.enableVertexAttribArray(6);
        // this.gl.vertexAttribPointer(6, Vertex.m_Weights, this.gl.FLOAT, this.gl.FALSE, 22* this.vertices.BYTES_PER_ELEMENT, 18 * this.vertices.BYTES_PER_ELEMENT);
        this.gl.bindVertexArray(null);
    }

    draw(shader) {
        // bind appropriate textures
        let diffuseNr = 1;
        let specularNr = 1;
        let normalNr = 1;
        let heightNr = 1;

        for (let i = 0; i < this.textures.length; i++) {
            this.gl.activeTexture(this.gl.TEXTURE0 + i); // active proper texture unit before binding
            // retrieve texture number (the N in diffuse_textureN)
            let number;
            let name = this.textures[i].type;
            if (name == "texture_diffuse")
                number = diffuseNr++;
            else if (name == "texture_specular")
                number = specularNr++;// transfer unsigned int to string
            else if (name == "texture_normal")
                number = normalNr++;// transfer unsigned int to string
            else if (name == "texture_height")
                number = heightNr++;// transfer unsigned int to string

            // now set the sampler to the correct texture unit
            this.gl.uniform1i(this.gl.getUniformLocation(shader.ID, `${name}${number}`), i);
            // and finally bind the texture
            this.gl.bindTexture(this.gl.TEXTURE_2D, this.textures[i].id);
        }

        // draw mesh
        this.gl.bindVertexArray(this.VAO);
        this.gl.drawElements(this.gl.TRIANGLES, this.indices.length, this.indices.length > 256 ? this.gl.UNSIGNED_SHORT : this.gl.UNSIGNED_BYTE, 0);
        this.gl.bindVertexArray(null);

        // always good practice to set everything back to defaults once configured.
        this.gl.activeTexture(this.gl.TEXTURE0);
    }
}