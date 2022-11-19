#version 300 es
precision mediump float;
out vec4 FragColor;

in vec3 FragPos;
in vec3 Normal;
in vec2 TexCoords;

uniform sampler2D floorTexture;
uniform sampler2D floorTextureGammaCorrected;

uniform vec3 lightPositions[4];
uniform vec3 lightColors[4];
uniform vec3 viewPos;
uniform bool gamma;
uniform bool dotLightAttenuation;

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
    float attenuation = 1.0 / (dotLightAttenuation ? distance * distance : distance);

	/*
	  总结:
	  1. 双曲线比使用二次函数变体在不用gamma校正的时候看起来更真实
	      二次函数变体 + 不使用伽马纠正 + 上屏(显示gamma=2.2) = (1.0/distance^2)^2.2 = 明暗更锐利
		  双曲线 + 伽马纠正(0.45) + 上屏(显示gamma=2.2) = 1.0/distance = 整体变亮, 并不符合'物理的与距离平方成反比''
		  正确的:
		  二次函数变体 + 使用伽马纠正 + 上屏(显示gamma=2.2) = 二次函数变体    符合物理
		  双曲线 + 不使用伽马纠正+ 上屏(显示gamma=2.2) = (1.0/distance)^2.2 接近物理
	  2. 点光源的光照衰减---常数项Kc、一次项Kl和二次项Kq
	      float attenuation = 1.0 / (light.constant + light.linear * distance + 
                light.quadratic * (distance * distance));
		
		  常数项通常保持为1.0，它的主要作用是保证分母永远不会比1小，否则的话在某些距离上它反而会增加强度，这肯定不是我们想要的效果。
		  一次项会与距离值相乘，以线性的方式减少强度
		  二次项会与距离的平方相乘，让光源以二次递减的方式减少强度。
		  二次项在距离比较小的时候影响会比一次项小很多，
		  但当距离值比较大的时候它就会比一次项更大了。
		  由于二次项的存在，光线会在大部分时候以线性的方式衰退，直到距离变得足够大，
		  让二次项超过一次项，光的强度会以更快的速度下降。
		  (自己理解:二次项其作用的时候,会使下降速度比一次项要大,但是两者最后都会贴近0)
		  一次项Kl为了覆盖更远的距离通常都很小，二次项Kq甚至更小
	*/

    diffuse *= attenuation;
    specular *= attenuation;

    return diffuse + specular;
}

void main() {
    vec3 color;
    if(gamma) {
        color = texture(floorTextureGammaCorrected, TexCoords).rgb;
    } else {
        color = texture(floorTexture, TexCoords).rgb;
    }

    vec3 lighting = vec3(0.0);
    for(int i = 0; i < 4; ++i) lighting += BlinnPhong(normalize(Normal), FragPos, lightPositions[i], lightColors[i]);
    color *= lighting;

    if(gamma)
        color = pow(color, vec3(1.0 / 2.2)); // 监视器Gamma的倒数

    FragColor = vec4(color, 1.0);
}