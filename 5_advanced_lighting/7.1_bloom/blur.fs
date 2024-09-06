#version 300 es
precision mediump float;
out vec4 FragColor;

in vec2 TexCoords;

uniform sampler2D image;

// 以一个32×32的模糊kernel为例，我们必须对每个fragment从一个纹理中采样1024次
// 高斯方程有个非常巧妙的特性，它允许我们把二维方程分解为两个更小的方程：一个描述水平权重，另一个描述垂直权重
// 首先用水平权重在整个纹理上进行水平模糊，然后在经改变的纹理上进行垂直模糊
// 并且 水平权重和垂直权重一样 另外还镜像 -- 高斯卷积核9x9, 只要 5个参数即可
// 两步高斯模糊  32×32的模糊kernel 只需要 32+32次采样
uniform bool horizontal;
uniform float weight[5];
// uniform float weight[5] = float[] (0.2270270270, 0.1945945946, 0.1216216216, 0.0540540541, 0.0162162162);

void main()
{             
     ivec2 tex_offset = ivec2(1.0) / textureSize(image, 0); // gets size of single texel

     vec3 result = texture(image, TexCoords).rgb * weight[0];

     if(horizontal)
     {
         for(int i = 1; i < 5; ++i)
         {
            result += texture(image,  TexCoords + vec2(tex_offset.x * i, 0.0)).rgb * weight[i];
            result += texture(image,  TexCoords  - vec2(tex_offset.x * i, 0.0)).rgb * weight[i];
         }
     }
     else
     {
         for(int i = 1; i < 5; ++i)
         {
             result += texture(image,  TexCoords  + vec2( 0.0,  tex_offset.y * i)).rgb * weight[i];
             result += texture(image,  TexCoords  - vec2 ( 0.0,  tex_offset.y * i)).rgb * weight[i];
         }
     }
     FragColor = vec4(result, 1.0);
}