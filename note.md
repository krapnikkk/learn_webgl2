
- It is undefined behaviour to have a used but unbound uniform buffer.
// gl.bindBufferRange(gl.UNIFORM_BUFFER, 0, uboMatrices, 0, blockSize);

- It is undefined behaviour to use a uniform buffer that is too small.
gl.bindBufferRange(gl.UNIFORM_BUFFER, 0, uboMatrices, 0, 16);

