#version 300 es
precision mediump float;
out vec4 FragColor;

in vec3 Normal;
in vec3 FragPos;

uniform float ambientStrength;
uniform vec3 objectColor;
uniform vec3 lightColor;
uniform vec3 lightPos;
uniform bool enableDiffuse;
uniform bool halfLambert;

void main() {
    //ambient
    vec3 ambient = ambientStrength * lightColor;

    // diffuse
    vec3 norm = normalize(Normal);
    vec3 lightDir = normalize(lightPos - FragPos);
    float diff = max(dot(norm,lightDir),0.0) * 0.5 + 0.5;
    if(halfLambert) diff = diff * 0.5 + 0.5; // [0,1]->[0.5,1]
    vec3 diffuse = diff * lightColor;

    vec3 result = enableDiffuse ? (ambient + diffuse) * objectColor : ambient * objectColor;
    FragColor = vec4(result, 1.0);

}