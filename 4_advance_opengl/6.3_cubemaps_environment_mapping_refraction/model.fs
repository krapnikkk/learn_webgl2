#version 300 es
precision mediump float;
out vec4 FragColor;

in vec3 Normal;
in vec3 FragPos;

uniform sampler2D texture_diffuse1;
uniform sampler2D texture_reflection1;
uniform sampler2D texture_specular1;
uniform sampler2D texture_normal1;
uniform sampler2D texture_ambient1;

uniform vec3 cameraPos;

uniform samplerCube skybox;
uniform float ratio;

void main() {
    // vec3 viewDir = normalize(cameraPos - FragPos);
    // vec3 normal = normalize(Normal);
    // vec3 R = reflect(-viewDir, normal);

    // float ratio = 1.00 / 1.52;
    vec3 I = normalize(FragPos - cameraPos);
    vec3 R = refract(I, normalize(Normal), ratio);
    
    FragColor = texture(skybox, R);
}
