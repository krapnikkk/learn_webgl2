#version 300 es
layout(location = 0) in vec3 aPos;
layout(location = 1) in vec3 aNormal;

uniform mat4 projection;
uniform mat4 model;
uniform mat4 view;
uniform bool useGPU;
uniform mat4 invertMatrix;

out vec3 FragPos;
out vec3 Normal;
void main() {
    FragPos = vec3(model * vec4(aPos, 1.0));
    mat4 invertMat4 = useGPU ? inverse(model) : invertMatrix;
    Normal =  mat3(transpose(invertMat4)) * aNormal;
    gl_Position = projection * view * vec4(FragPos, 1.0);
}