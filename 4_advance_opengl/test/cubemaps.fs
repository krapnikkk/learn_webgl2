#version 300 es
precision mediump float;
out vec4 FragColor;

in vec2 TexCoords;
highp vec3 CubeTexCoords;

uniform sampler2D texture1;
uniform samplerCube skybox;

void main()
{    
    CubeTexCoords = vec3(1.0);
    vec4 skyboxTetxure = texture(skybox, CubeTexCoords);
    FragColor = texture(texture1, TexCoords);
}