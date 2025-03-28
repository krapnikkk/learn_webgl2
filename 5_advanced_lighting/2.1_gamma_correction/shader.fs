#version 300 es
precision mediump float;
out vec4 FragColor;

in vec3 FragPos;
in vec3 Normal;
in vec2 TexCoords;

uniform sampler2D floorTexture;

uniform vec3 lightPositions[4];
uniform vec3 lightColors[4];
uniform vec3 viewPos;
uniform bool gamma;
uniform bool quadratic;

vec3 BlinnPhong(vec3 normal, vec3 fragPos, vec3 lightPos, vec3 lightColor) {
    // diffuse
    vec3 lightDir = normalize(lightPos - fragPos);
    float diff = max(dot(lightDir, normal), 0.0);
    vec3 diffuse = diff * lightColor;

    // specular
    vec3 viewDir = normalize(viewPos - fragPos);
    //vec3 reflectDir = reflect(-lightDir, normal);
    float spec = 0.0;
    float shininess = 64.0;
    vec3 halfwayDir = normalize(lightDir + viewDir);
    spec = pow(max(dot(normal, halfwayDir), 0.0), shininess);
    vec3 specular = spec * lightColor;  

    // simple attenuation
    //float max_distance = 1.5;
    float distance = length(lightPos - fragPos); 
	// 使用伽马纠正时候 使用二次函数, 否则使用双曲线(使加上显示伽马后接近物理)
    float attenuation = 1.0 / (quadratic ? distance * distance : distance);

    diffuse *= attenuation;
    specular *= attenuation;

    return diffuse + specular;
}

void main() {
    vec3 color = texture(floorTexture, TexCoords).rgb;
    

    vec3 lighting = vec3(0.0);
    for(int i = 0; i < 4; ++i) lighting += BlinnPhong(normalize(Normal), FragPos, lightPositions[i], lightColors[i]);
    color *= lighting;

    if(gamma)
        color = pow(color, vec3((1.0 / 2.2))); // 监视器Gamma的倒数

    FragColor = vec4(color, 1.0);
}