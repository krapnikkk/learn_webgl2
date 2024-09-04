## color space
### linear(rgb)
- RGB 是一种基于三原色的线性颜色空间，通常用于计算机图形学和图像处理。
- RGB 空间的颜色值是线性的，没有经过Gamma校正。
- RGB 空间的色域比sRGB更广阔，但需要额外的颜色管理。

### srgb[Gamma:1/2.2]
- sRGB 是一种非线性的颜色空间，模拟了人眼对色彩的感知特性。
- 它的色域相对较小，但在大多数显示设备和图像编辑软件中被广泛使用。
- sRGB 空间的颜色值经过Gamma校正，更接近人眼的感知。

### CRT(已废弃)[Gamma:2.2]
- CRT 颜色空间的色域相对较窄，小于现代显示设备所能表现的范围。
- 这是由于 CRT 显示器的物理特性所限，无法完全覆盖当前显示设备的色彩表现能力。

### 色彩空间的意义
- 对人眼色彩感知的建模
    - sRGB 空间是根据人眼对色彩的非线性感知特性设计的。
    - 它使用Gamma校正模拟了人眼的视觉特性，更接近日常使用的颜色表现。

- 对计算机图形学和图像处理的建模
    - linear 空间是一种完全线性的色彩空间，更适合于图形处理和渲染计算。
    - 线性空间可以更好地支持物理光照模型、色彩叠加等图形学操作。

- 显示设备的特性
    - 色彩管理是指将人类感知的颜色转换为计算机可以理解的颜色值。
    - 色彩管理的目的是确保颜色的一致性和可重复性，以满足各种显示器、打印机和图像处理软件的要求。

### WebGL2色彩空间特性
- 纹理：支持sRGB纹理格式(如:SRGB8_ALPHA8)。当使用这种sRGB纹理时，WebGL2会自动对纹理进行从sRGB到线性空间的转换。([texImage2D format](https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/texImage2D))
- 帧缓冲：默认帧缓冲颜色格式也是sRGB空间，当渲染结果写入帧缓冲时，WebGL2会自动将线性颜色值转换为sRGB格式。
- 着色器：着色器默认使用线性RGB颜色空间进行计算和处理，但在着色器的输出阶段，WebGL2会自动将线性颜色转换为sRGB格式。
- 颜色混合操作：基于sRGB空间进行

### WebGL1色彩空间
webgl1默认使用线性色彩空间，需要开启扩展EXT_sRGB，它为纹理和帧缓冲区对象添加了sRGB支持。


### note
- 为了节省存储空间, 并且根据人眼对暗的敏感, 拍照保存的图片, 都会保存成SRGB
- diffuse纹理，这种为物体上色的纹理几乎都是在sRGB空间中的,specular贴图和法线贴图几乎都在线性空间中	
- gamma校正使你可以在线性空间中进行操作。因为线性空间更符合物理世界，大多数物理公式现在都可以获得较好效果，比如真实的光的衰减。你的光照越真实，使用gamma校正获得漂亮的效果就越容易。这也正是为什么当引进gamma校正时，建议只去调整光照参数的原因。

# 光照模型
## 传统光照模型
### Lambert光照

## pbr物理渲染
### hdr
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