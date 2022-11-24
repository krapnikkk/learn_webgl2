
- It is undefined behaviour to have a used but unbound uniform buffer.
// gl.bindBufferRange(gl.UNIFORM_BUFFER, 0, uboMatrices, 0, blockSize);

- It is undefined behaviour to use a uniform buffer that is too small.
gl.bindBufferRange(gl.UNIFORM_BUFFER, 0, uboMatrices, 0, 16);

- Stride must be a multiple of the passed in datatype.
gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 2, 0);

invalid internalformat
gl.texImage2D(gl.TEXTURE_2D, 0, gl.DEPTH_COMPONENT, SHADOW_WIDTH, SHADOW_HEIGHT, 0, gl.DEPTH_COMPONENT, gl.UNSIGNED_INT, null);
    

