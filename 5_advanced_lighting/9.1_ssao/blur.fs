#version 300 es
precision mediump float;
out float FragColor;

in vec2 TexCoords;

uniform sampler2D ssaoInput;
uniform bool blur;

void main() {
    if(blur) {
        vec2 texelSize = 1.0f / vec2(textureSize(ssaoInput, 0));
        float result = 0.0f;
        for(int x = -2; x < 2; ++x) {
            for(int y = -2; y < 2; ++y) {
                vec2 offset = vec2(float(x), float(y)) * texelSize;
                result += texture(ssaoInput, TexCoords + offset).r;
            }
        }
        FragColor = result / (4.0f * 4.0f);
    } else {
        FragColor = texture(ssaoInput, TexCoords).r;
    }
}