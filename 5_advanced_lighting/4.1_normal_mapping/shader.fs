#version 300 es
precision mediump float;
out vec4 FragColor;
in vec2 TexCoords;
in vec3 TangentLightPos;
in vec3 TangentViewPos;
in vec3 TangentFragPos;
in vec3 Normal;
in vec3 ViewPos;
in vec3 LightPos;
in vec3 FragPos;

uniform sampler2D diffuseMap;
uniform sampler2D normalMap;

uniform bool normalMapping;

void main() {           
     // obtain normal from normal map in range [0,1]
    vec3 normal = texture(normalMap, TexCoords).rgb;
    // transform normal vector to range [-1,1]
    // normal = normalize(normal * 2.0 - 1.0);  // this normal is in tangent space

    vec3 norm;
    if(normalMapping) {
        norm = normalize(normal * 2.0f - 1.0f);
    } else {
        norm = normalize(Normal);
    }
    // get diffuse color
    vec3 color = texture(diffuseMap, TexCoords).rgb;
    // ambient
    vec3 ambient = 0.1f * color;
    // diffuse
    vec3 lightDir;
    if(normalMapping) {
        lightDir = normalize(TangentLightPos - TangentFragPos);
    } else {
        lightDir = normalize(LightPos - FragPos);
    }
    float diff = max(dot(lightDir, norm), 0.0f);
    vec3 diffuse = diff * color;
    
    // specular
    vec3 viewDir;
    if(normalMapping) {
        viewDir = normalize(TangentViewPos - TangentFragPos);
    } else {
        viewDir = normalize(ViewPos - FragPos);
    }
    vec3 halfwayDir = normalize(lightDir + viewDir);
    float spec = pow(max(dot(norm, halfwayDir), 0.0f), 32.0f);

    vec3 specular = vec3(0.2f) * spec;
    FragColor = vec4(ambient + diffuse + specular, 1.0f);
}