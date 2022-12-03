#version 300 es
precision mediump float;
out vec4 FragColor;

struct PointLight {
    vec3 position;

    vec3 ambient;
    vec3 diffuse;
    vec3 specular;

    float constant;
    float linear;
    float quadratic;
};

in mat3 TBN;
in vec2 TexCoords;
in vec3 FragPos;
in vec3 ViewPos;

uniform sampler2D texture_diffuse1;
uniform sampler2D texture_specular1;
uniform sampler2D texture_normal1;
uniform sampler2D texture_reflection1;

uniform float shininess;
#define NR_POINT_LIGHTS 2
uniform PointLight pointLights[NR_POINT_LIGHTS];
vec3 CalcPointLight(PointLight light, vec3 normal, float shininess, sampler2D sampler_diffuse, sampler2D sampler_specular, sampler2D texture_reflection1);

void main() {

    vec3 result;

    //normal
    vec3 normal = texture(texture_normal1, TexCoords).rgb;
    vec3 norm = normalize(normal * 2.0 - 1.0);

    //pointLight
    for(int i = 0; i < NR_POINT_LIGHTS; i++) result += CalcPointLight(pointLights[i], norm, shininess, texture_diffuse1, texture_specular1, texture_reflection1);

    FragColor = vec4(result, 1.0);
}

vec3 CalcPointLight(PointLight light, vec3 normal, float shininess, sampler2D sampler_diffuse, sampler2D sampler_specular, sampler2D sampler_ambient) {

    vec3 TangentViewPos = TBN * ViewPos;
    vec3 TangentFragPos = TBN * FragPos;
    vec3 TangentLightPos = TBN * light.position;
    vec3 viewDir = normalize(TangentViewPos - TangentFragPos);
    vec3 lightDir = normalize(TangentLightPos - TangentFragPos);

    //ambient
    vec3 ambient = light.ambient * vec3(texture(sampler_ambient, TexCoords));

    // diffuse
    float diff = max(dot(normal, lightDir), 0.0);
    vec3 diffuse = light.diffuse * (diff * vec3(texture(sampler_diffuse, TexCoords)));

    // specular
    vec3 halfwayDir = normalize(lightDir + viewDir);
    float spec = pow(max(dot(viewDir, halfwayDir), 0.0), shininess);
    vec3 specular = spec * light.specular * texture(sampler_specular, TexCoords).rgb;

    // attenuation
    float distance = length(light.position - FragPos);
    float attenuation = 1.0 / (light.constant + light.linear * distance + light.quadratic * (distance * distance));
    ambient *= attenuation;
    diffuse *= attenuation;
    specular *= attenuation;

    return (ambient + diffuse + specular);
}