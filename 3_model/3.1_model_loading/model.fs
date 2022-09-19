#version 300 es
precision mediump float;
out vec4 FragColor;

in vec2 TexCoords;

uniform sampler2D texture_diffuse1;
uniform sampler2D texture_specular1;
uniform sampler2D texture_normal1;
// uniform sampler2D texture_ambient1;

void main()
{    
    vec4 texture_diffuse = texture(texture_diffuse1, TexCoords);
    FragColor = texture_diffuse;
    // vec4 texture_specular = texture(texture_specular1, TexCoords);
    // vec4 texture_normal1 = texture(texture_normal1, TexCoords);
    // vec4 texture_ambient = texture(texture_ambient1, TexCoords);
    // FragColor = texture_diffuse + texture_specular + texture_normal1;
}