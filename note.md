# pbr

## hdr
hdr 设置[float texture 不可渲染](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/texImage2D)
### [webgl1](https://registry.khronos.org/webgl/extensions/OES_texture_float/)
```
    gl.getExtension('OES_texture_float')
    gl.getExtension('OES_texture_float_linear');// filter为linear
```
### [webgl2](https://registry.khronos.org/webgl/extensions/EXT_color_buffer_float/)
```
    gl.getExtension('EXT_color_buffer_float');
    gl.getExtension('EXT_color_buffer_half_float');// RGB16F
```


## exposure（曝光）
As we said before HDR images have a lot more information in both the lower and the higher range of pixel brightness values. 
That allows us to change the exposure just like in a real camera.
```
    ...
    gl_FragColor.rgb = texture2D(uEnvMap, envMapEquirect(reflectionWorld)).rgb;

    gl_FragColor.rgb *= uExposure;

    if (uCorrectGamma) {
        gl_FragColor.rgb = toGamma(gl_FragColor.rgb);
    }
    ...
```

## webgl2（opengl es3.0)
First off, rendering to floating point requires an extension in WebGL2, EXT_color_buffer_float.

You can see in the table [here](https://webgl2fundamentals.org/webgl/lessons/webgl-data-textures.html) copied from the [spec section 3.8.3.2](https://www.khronos.org/registry/OpenGL/specs/es/3.0/es_spec_3.0.pdf) that floating point textures are not renderable in WebGL2 by default.

glTexImage2D internal format,format,type [combinations](https://www.khronos.org/registry/OpenGL-Refpages/es3.0/html/glTexImage2D.xhtml)

From [stackoverflow](https://stackoverflow.com/questions/45571488/webgl-2-readpixels-on-framebuffers-with-float-textures)

Example renderable(can be attach to a framebuffer)
```
    gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, 0, gl.RGBA32F, 512, 512, 0, gl.RGBA, gl.FLOAT, null)
```
Depth texture is avaliable,while webgl1 need WEBGL_depth_texture extension.

"The problem with this is that depthBuffer cannot be used as a texture. RenderBuffers do not provide a mechanism for reading back the values written into them, and as such while WebGL would utilize the buffer to correctly depth-test the scene the information stored within was effectively "lost"."
[toji link](https://blog.tojicode.com/2012/07/using-webgldepthtexture.html)

## pbr work flow
使用cmft生成radiance.dds时，须将mipmap调到最大(`log2(size)`)，否则生成的数据会有空数据，造成报错
`texImage2D: ArrayBufferView not big enough for request.`

生成radiance格式为cubemap, dds rgba32

iiradiance格式可为faces list, hdr rgbe，尺寸可以小一点,实时filter iiradiance别忘记设置为小尺寸，例如32x32，否则会有性能问题，出现webgl context lost。

DistributionGGX里的最后除以的max(denom, 0.001)最好直接改成denom，这样才有锐利（sharp）的点光源效果

## deferred shading
使用blitFramebuffer从framebuffer中copy深度到屏幕framebuffer时，需要depth internal format匹配
屏幕的时DEPTH24_STENCIL8
[stackoverflow](https://stackoverflow.com/questions/9914046/opengl-how-to-use-depthbuffer-from-framebuffer-as-usual-depth-buffer)

## skeletal animation
gltf格式有定义动画的json，内容是float32array的bin数据文件，能直接被copy到gpu，其他是图片，能加快解析速度
[引擎无关的gltf-loader](https://github.com/shrekshao/minimal-gltf-loader)
使用WebAssembly能提升性能，[参考](https://github.com/sessamekesh/wasm-3d-animation-demo)