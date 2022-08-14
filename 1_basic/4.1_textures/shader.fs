#version 300 es
precision mediump float;
out vec4 FragColor;

in vec2 TexCoord;
in vec3 outColor;
uniform sampler2D uMainTex;
void main()
{
    FragColor = texture(uMainTex,TexCoord) * vec4(outColor, 1.0);
}