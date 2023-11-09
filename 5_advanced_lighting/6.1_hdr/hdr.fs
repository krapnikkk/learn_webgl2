#version 300 es
precision mediump float;
out vec4 FragColor;

in vec2 TexCoords;

uniform sampler2D hdrBuffer;
uniform bool hdr;
uniform float exposure;

void main()
{             
    const float gamma = 2.2;

    vec3 hdrColor = texture(hdrBuffer, TexCoords).rgb;
    if(hdr)
    {
		// (简单的色调映射算法)Reinhard 色调映射，它涉及将整个 HDR 颜色值划分为(dividing  to) LDR 颜色值
		// Reinhard 色调映射算法将所有亮度值均匀地平衡到 LDR 上( evenly balances out all brightness values onto LDR)
        vec3 result ;
		if (gl_FragCoord.x < 400.0)
		{
			// 我们可以正确地看到存储在浮点帧缓冲区中的整个 HDR 值范围
			// 这个曲线经过原点0 有点类似lnx 并且在+无限接近1

			// 也可以在上一个pass最后使用tone mapping,  而不需要任何浮点帧缓冲区
			// 但是, 随着场景变得越来越复杂，会经常发现, 需要将中间 HDR 结果存储为浮点缓冲区
			result = hdrColor / (hdrColor + vec3(1.0));
		}
		else 
		{
			// 色调映射的另一个有趣用途是允许使用曝光参数
			// 如果我们有一个具有昼夜循环的场景，
			// 那么在白天使用较低的曝光度和在夜间使用较高的曝光度是有意义的，
			// 类似于人眼的适应方式
			//
			// 相对简单的曝光色调映射算法:
			//      exposure 默认为1.0 
			//      允许我们更精确地指定我们是否希望更多地关注 HDR 颜色值的黑暗或明亮区域
			//      在高曝光值的情况下，隧道的较暗区域会显示出更多的细节
			//      低曝光在很大程度上消除了黑暗区域的细节，但让我们能够在场景的明亮区域看到更多细节
			//
			// 高动态范围渲染的好处：
			//     通过更改曝光级别，我们可以看到场景的许多细节，
			//     否则这些细节会因低动态范围(LDR)渲染而丢失
			//     在高光和黑暗区域不会丢失任何细节，因为它们可以通过色调映射来恢复
			// 
			//     --- hhl:就是渲染过程是HDR的(相当于真实的场景)，
			//               最后调节曝光(真实的相机)就可以关注暗还是亮区域的细节
			// 更多算法:
			//		自动曝光调整(Automatic Exposure Adjustment)或者叫人眼适应(Eye Adaptation)技术
			//			能够检测前一帧场景的亮度并且缓慢调整曝光参数
			//         模仿人眼使得场景在黑暗区域逐渐变亮或者在明亮区域逐渐变暗
			//     一些色调映射算法偏爱某些颜色/强度
			//     一些算法同时显示低曝光和高曝光颜色，以创建更多色彩和细节的图像
			result = vec3(1.0) - exp(-hdrColor * exposure);
		}
	 
        //  伽马校正过滤器   
        result = pow(result, vec3(1.0 / gamma));
        FragColor = vec4(result, 1.0);
    }
    else
    {
		/* 由于 2D 四边形的输出直接渲染到默认帧缓冲区，
		    所有片段着色器的输出值最终仍将被限制在 0.0 和 1.0 之间，
		    即使我们在浮点颜色纹理中有多个值超过 1.0。

			当我们直接将 HDR 值写入 LDR 输出缓冲区时，
			就好像我们一开始就没有启用 HDR。 
			我们需要做的是在不丢失任何细节的情况下将所有浮点颜色值转换为 0.0 - 1.0 范围。 
			我们需要应用一个称为色调映射的过程。
		*/   
		if (gl_FragCoord.x < 400.0)
		{
			vec3 result = pow(hdrColor, vec3(1.0 / gamma));
			FragColor = vec4(result, 1.0);
		}
		else 
		{
			FragColor = vec4(hdrColor, 1.0);
		}
    }
}