#version 300 es
layout (location = 0) in vec3 aPos;
layout (location = 1) in vec3 aNormal;
layout (location = 2) in vec2 aTexCoords;
layout (location = 3) in vec3 aTangent;
layout (location = 4) in vec3 aBitangent;


out vec3 FragPos;
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
    FragPos = vec3(model * vec4(aPos, 1.0));   
    TexCoords = aTexCoords;   
    
    vec3 T = normalize(mat3(model) * aTangent);
    vec3 B = normalize(mat3(model) * aBitangent);
    vec3 N = normalize(mat3(model) * aNormal);
    mat3 TBN = transpose(mat3(T, B, N));

	// 注意！ 这里的TBN没有正交化 ??  所以T和B都是沿着UV轴正方向, 但有可能不垂直
    TangentLightPos = TBN * lightPos;
    TangentViewPos  = TBN * viewPos;
    TangentFragPos  = TBN * FragPos;

	/*
	纹理坐标存在于切线空间中。 
	要调整这些坐标，我们还需要知道切线空间中的视图方向。

	视图方向定义为从表面到相机的向量，标准化。

	我们可以将矩阵传递给片段程序并在那里使用它，但这会变得昂贵。

	我们可以在顶点程序中确定这个向量，在那里对其进行转换，然后将其传递给片段程序。 
	如果我们将归一化推迟到插值之后，我们最终会得到正确的方向。
	
	这样, 只需要添加切线空间的视图方向作为"新的插值器varying, new interpolator"。
	*/    
    gl_Position = projection * view * model * vec4(aPos, 1.0);
}