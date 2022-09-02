#version 300 es
precision mediump float;
out vec4 FragColor;

in vec3 LightingColor;
uniform vec3 objectColor;

void main() {
    FragColor = vec4(LightingColor * objectColor, 1.0);
}