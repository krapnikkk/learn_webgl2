#version 300 es
precision mediump float;
out vec4 FragColor;

in vec2 TexCoords;

uniform sampler2D gPosition;
uniform sampler2D gNormal;
uniform sampler2D gAlbedoSpec;

struct Light {
    vec3 Position;
    vec3 Color;

    float Linear;
    float Quadratic;
    float Radius;
};
const int NR_LIGHTS = 32;
uniform Light lights[NR_LIGHTS];
uniform vec3 viewPos;

uniform bool debug;

void main() {             
    // retrieve data from gbuffer
    vec3 FragPos = texture(gPosition, TexCoords).rgb;
    vec3 Normal = texture(gNormal, TexCoords).rgb;
    vec3 Diffuse = texture(gAlbedoSpec, TexCoords).rgb;
    float Specular = texture(gAlbedoSpec, TexCoords).a;

	// #if 0 
    if(debug && abs(Normal.x) < 1e-6f && abs(Normal.y) < 1e-6f && abs(Normal.z) < 1e-6f) {
        discard;
    }
	// #endif 

    // then calculate lighting as usual
    vec3 lighting = Diffuse * 0.1f; // hard-coded ambient component
    vec3 viewDir = normalize(viewPos - FragPos);
    for(int i = 0; i < NR_LIGHTS; ++i) {

        // calculate distance between light source and current fragment
        float distance = length(lights[i].Position - FragPos);
        if(distance < lights[i].Radius) {
			/*
				光体积:
					只有在光体积半径内(暗的亮度阈值是5/256),才计算光照

				实际不可行:
					GPU 和 GLSL 在优化循环和分支方面非常糟糕。
					原因是 GPU 上的着色器执行是高度并行的，
					并且大多数架构都要求对于大量线程，它们需要运行完全相同的着色器代码以使其高效。
					这通常意味着运行着色器会执行 if 语句的所有分支，
					以确保着色器运行对于该组线程是相同的，
					从而使我们之前的半径检查优化完全无用；
					我们仍然会计算所有光源的光照！
			*/

        // diffuse
            vec3 lightDir = normalize(lights[i].Position - FragPos);
            vec3 diffuse = max(dot(Normal, lightDir), 0.0f) * Diffuse * lights[i].Color;
        // specular
            vec3 halfwayDir = normalize(lightDir + viewDir);
            float spec = pow(max(dot(Normal, halfwayDir), 0.0f), 16.0f);
            vec3 specular = lights[i].Color * spec * Specular;
        // attenuation
            float distance = length(lights[i].Position - FragPos);
            float attenuation = 1.0f / (1.0f + lights[i].Linear * distance + lights[i].Quadratic * distance * distance);
            diffuse *= attenuation;
            specular *= attenuation;
            lighting += diffuse + specular;

        }
    }
    FragColor = vec4(lighting, 1.0f);
}