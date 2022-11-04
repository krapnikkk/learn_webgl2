#version 300 es
precision mediump float;
out vec4 FragColor;

in vec2 TexCoord;
in highp vec3 TexCoords;

in vec3 outColor;
uniform sampler2D uMainTex;
uniform samplerCube skybox;
void main()
{
    FragColor = texture(uMainTex,TexCoord) * vec4(outColor, 1.0) +texture(skybox, TexCoords);
}