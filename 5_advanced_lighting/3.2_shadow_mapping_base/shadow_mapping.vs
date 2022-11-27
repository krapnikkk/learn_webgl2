#version 300 es

layout(location = 0) in vec3 aPos;
layout(location = 1) in vec3 aNormal;
layout(location = 2) in vec2 aTexCoords;

out vec2 TexCoords;
vec3 FragPos; //世界空间  ps计算 blinn-phong的视线和光线方向 
vec3 Normal;  //世界空间  ps计算 Blinn-phong 

vec4 FragPosLightSpace; //光源的齐次空间 采集阴影图 

uniform mat4 projection;
uniform mat4 view;
uniform mat4 model;
uniform mat4 lightSpaceMatrix;

void main() {
    FragPos = vec3(model * vec4(aPos, 1.0));
    Normal = transpose(inverse(mat3(model))) * aNormal;
    TexCoords = aTexCoords;
	// 注意这个没有做透视除法
    FragPosLightSpace = lightSpaceMatrix * vec4(FragPos, 1.0);
    gl_Position = projection * view * model * vec4(aPos, 1.0);
}