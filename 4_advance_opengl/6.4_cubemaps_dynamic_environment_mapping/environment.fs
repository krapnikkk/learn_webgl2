#version 300 es
precision mediump float;
out vec4 FragColor;

in vec3 Normal;
in vec3 FragPos;

uniform vec3 cameraPos;

uniform samplerCube skybox;

void main() {
    vec3 viewDir = normalize(cameraPos - FragPos);
    vec3 normal = normalize(Normal);
    vec3 R = reflect(-viewDir, normal);
    
    FragColor = texture(skybox, R);
}
