#version 300 es
layout(location = 0) in vec2 aPos;
layout(location = 1) in vec3 aColor;

uniform vec2 offsets[100];

out vec3 fColor;

void main() {
    fColor = aColor;
    vec2 offset = offsets[gl_InstanceID];
    gl_Position = vec4(aPos + offset, 0.0, 1.0);
}