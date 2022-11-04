#version 300 es
layout(location = 0) in vec3 aPos;
layout(location = 1) in vec3 aColor;
layout(location = 2) in vec2 aTexCoord;
layout(location = 3) in vec3 aTexCoords;

out vec2 TexCoord;
out vec3 TexCoords;
out vec3 outColor;
void main() {
    gl_Position = vec4(aPos, 1.0);
    TexCoord = aTexCoord;
    TexCoords = aTexCoords;
    outColor = aColor;
}