#version 300 es
precision mediump float;
out vec4 FragColor;

in vec3 Normal;
in vec3 FragPos;
in vec2 TexCoords;

uniform sampler2D texture_diffuse1;
uniform sampler2D texture_reflection1;
uniform sampler2D texture_specular1;
uniform sampler2D texture_normal1;
uniform sampler2D texture_ambient1;

uniform vec3 cameraPos;

struct Material {
    samplerCube environment;
};
uniform Material material;

void main() {

    vec3 viewDir = normalize(cameraPos - FragPos);
    vec3 normal = normalize(Normal);

    vec3 R = reflect(-viewDir, normal);
    // reflection
    vec3 reflectMap = vec3(texture(texture_reflection1, TexCoords));
    vec3 reflection = vec3(texture(material.environment, R)) * reflectMap;

    // diffuse
    float diff = max(normalize(dot(normal, viewDir)), 0.0f);
    vec3 diffuse = diff * vec3(texture(texture_diffuse1, TexCoords));

    // normal
    vec4 normalMap = texture(texture_normal1,TexCoords);

    // specular
    vec3 specular = vec3(texture(texture_specular1, TexCoords));
    FragColor = vec4(diffuse + reflection + specular, 1.0f);
}
