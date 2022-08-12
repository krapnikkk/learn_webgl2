#version 300 es
layout (location = 0) in vec3 aPos;
layout (location = 1) in vec3 aColor;

out vec3 outColor;

uniform float xOffset;
void main()
{
    gl_Position = vec4(aPos.x + xOffset,aPos.y,aPos.z,1.0);
    outColor = aColor;
}