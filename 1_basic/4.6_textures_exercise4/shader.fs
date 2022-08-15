#version 300 es
precision mediump float;
out vec4 FragColor;

in vec2 TexCoord;
in vec3 outColor;
uniform sampler2D texture1;
uniform sampler2D texture2;

uniform float mixValue;

void main()
{
    FragColor = mix(texture(texture1,TexCoord),texture(texture2,TexCoord),mixValue);
}