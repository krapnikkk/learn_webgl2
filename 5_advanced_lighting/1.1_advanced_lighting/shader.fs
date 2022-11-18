#version 300 es
precision mediump float;
out vec4 FragColor;


in vec3 FragPos;
in vec3 Normal;
in vec2 TexCoords;


uniform sampler2D floorTexture;
uniform vec3 lightPos;
uniform vec3 viewPos;
uniform bool blinn;
uniform bool justSpecularTerm;
uniform bool lowShininess ; 

void main()
{           
    vec3 color = texture(floorTexture, TexCoords).rgb;
    // ambient
    vec3 ambient = 0.05 * color;
    // diffuse
    vec3 lightDir = normalize(lightPos - FragPos);
    vec3 normal = normalize(Normal);
    float diff = max(dot(lightDir, normal), 0.0);
    vec3 diffuse = diff * color;
    // specular
    vec3 viewDir = normalize(viewPos - FragPos);
    vec3 reflectDir = reflect(-lightDir, normal);
    float spec = 0.0;
    if(blinn)
    {
        vec3 halfwayDir = normalize(lightDir + viewDir); 
		
		/*
		   笔记:
		   1. max(dot,0) -- 约束点乘(Clamped Dot Product)
		   2. specular shininess exponent 高光光泽度系数 底的情况下,高光面越大
		   3. 漫反射项, 超过90度(光线和法线)，被截断为0，是正常;
		   4. 高光反射, 超过90度(反射光线和视线)，不能直接为0, 特别是高光面比较大(shininess比较小,比如1.0 0.5)
		   5. Blinn 改成半向量角, 除法光线在表面下方, 否则 半向量角和法线 夹角都会在0到90度
		   6. Blinn的 半向量角和法线 夹角 比Phong的要小, 所以需要要达到同样的效果, shinness指数要是原来是4倍
		*/

	 
        spec = pow(max(dot(normal, halfwayDir), 0.0), lowShininess?1.0:32.0);
    }
    else
    {
        vec3 reflectDir = reflect(-lightDir, normal);
        spec = pow(max(dot(viewDir, reflectDir), 0.0),  lowShininess?1.0:8.0);
    }
    vec3 specular = vec3(0.3) * spec; // assuming bright white light color

	if (justSpecularTerm)
	{
		FragColor = vec4(specular, 1.0);
	}
	else 
	{
		FragColor = vec4(ambient + diffuse + specular, 1.0);
	}
    
}