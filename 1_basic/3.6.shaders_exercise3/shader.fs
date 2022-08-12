#version 300 es
precision mediump float;
out vec4 FragColor;

in vec3 outPosition;
void main()
{
    FragColor = vec4(outPosition,1.0f);
}