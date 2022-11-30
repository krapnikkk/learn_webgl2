#version 300 es
layout (location = 0) in vec3 position;
layout (location = 1) in vec3 normal;
layout (location = 2) in vec2 texCoords;
layout (location = 3) in vec3 tangent;
layout (location = 4) in vec3 bitangent;

out vec3 FragPos;
out vec3 Normal;
out vec3 ViewPos;
out vec3 LightPos;
out vec2 TexCoords;
out vec3 TangentLightPos;
out vec3 TangentViewPos;
out vec3 TangentFragPos;

uniform mat4 projection;
uniform mat4 view;
uniform mat4 model;

uniform vec3 lightPos;
uniform vec3 viewPos;

void main()
{
    gl_Position = projection * view * model * vec4(position, 1.0f);
    FragPos = vec3(model * vec4(position, 1.0));   
    TexCoords = texCoords;
    
    mat3 normalMatrix = transpose(inverse(mat3(model)));
    vec3 T = normalize(normalMatrix * tangent);
    vec3 B = normalize(normalMatrix * bitangent);
    vec3 N = normalize(normalMatrix * normal);    
    Normal = normal;
    ViewPos = viewPos;
    LightPos = viewPos;
    
    mat3 TBN = transpose(mat3(T, B, N));  
    TangentLightPos = TBN * lightPos;
    TangentViewPos  = TBN * viewPos;
    TangentFragPos  = TBN * FragPos;
}