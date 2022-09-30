#version 300 es
precision mediump float;
out vec4 FragColor;

in vec2 TexCoords;

uniform sampler2D texture1;
uniform float alpha;

void main()
{    
    vec4 texColor = texture(texture1, TexCoords);
    if(texColor.a < alpha)
        discard;
    FragColor = texColor;
}