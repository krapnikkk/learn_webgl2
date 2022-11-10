#version 300 es
precision mediump float;
out vec4 FragColor;

in vec2 TexCoords;

uniform int type;
uniform sampler2D screenTexture;

vec3 convolution(int type) {
    const float offset = 1.0 / 300.0;
    vec2 offsets[9] = vec2[](vec2(-offset, offset), // 左上
    vec2(0.0f, offset), // 正上
    vec2(offset, offset), // 右上
    vec2(-offset, 0.0f),   // 左
    vec2(0.0f, 0.0f),   // 中
    vec2(offset, 0.0f),   // 右
    vec2(-offset, -offset), // 左下
    vec2(0.0f, -offset), // 正下
    vec2(offset, -offset)  // 右下
    );
    float kernel[9];
    if(type == 1) {
        kernel = float[](-1.0, -1.0, -1.0, -1.0, 9.0, -1.0, -1.0, -1.0, -1.0);
    } else if(type == 2) {
        kernel = float[](1.0 / 16.0, 2.0 / 16.0, 1.0 / 16.0, 2.0 / 16.0, 4.0 / 16.0, 2.0 / 16.0, 1.0 / 16.0, 2.0 / 16.0, 1.0 / 16.0);
    } else if(type == 3) {
        kernel = float[](1.0, 1.0, 1.0, 1.0, -8.0, 1.0, 1.0, 1.0, 1.0);
    }

    vec3 sampleTex[9];
    for(int i = 0; i < 9; i++) {
        sampleTex[i] = vec3(texture(screenTexture, TexCoords.st + offsets[i]));
    }
    vec3 col = vec3(0.0);
    for(int i = 0; i < 9; i++) col += sampleTex[i] * kernel[i];
    return col;
}

void main() {
    vec3 col;
    if(type == 0) {
        col = texture(screenTexture, TexCoords).rgb;
    } else if(type == 1) {
        float average = 0.2126 * FragColor.r + 0.7152 * FragColor.g + 0.0722 * FragColor.b;
        col = vec3(average);
    } else if(type == 2) {
        col = vec3(1.0 - texture(screenTexture, TexCoords));
    } else if(type == 3) {
        col = convolution(1);
    } else if(type == 4) {
        col = convolution(2);
    } else if(type == 5) {
        col = convolution(3);
    }
    FragColor = vec4(col, 1.0);
}