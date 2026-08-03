const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const listPath = path.join(__dirname, 'list.json');
const templatePath = path.join(__dirname, 'course-readme-template.md');
const template = fs.readFileSync(templatePath, 'utf8');
const { list } = JSON.parse(fs.readFileSync(listPath, 'utf8'));

const sourceBase = {
  gettingStarted: 'https://learnopengl.com/Getting-started/',
  lighting: 'https://learnopengl.com/Lighting/',
  model: 'https://learnopengl.com/Model-Loading/',
  advancedOpenGL: 'https://learnopengl.com/Advanced-OpenGL/',
  advancedLighting: 'https://learnopengl.com/Advanced-Lighting/',
  pbr: 'https://learnopengl.com/PBR/',
};

const topics = [
  topic('hello_window', 'Hello Window', `${sourceBase.gettingStarted}Hello-Window`, [
    '创建 canvas 的 WebGL2 context，确认浏览器能进入渲染流程。',
    '设置 viewport、清屏颜色和基础 render loop。',
    '把 LearnOpenGL 的 GLFW/GLAD 初始化步骤改写成浏览器原生 WebGL2 初始化。',
  ], [
    '取得 `<canvas>` 并调用 `getContext("webgl2")`。',
    '调用 `gl.viewport` 定义裁剪到屏幕的输出区域。',
    '在渲染循环里调用 `gl.clearColor` 和 `gl.clear` 显示背景色。',
  ], [
    '`canvas` 尺寸变化时要同步 viewport，否则画面会被拉伸或裁剪。',
    'WebGL2 context 获取失败时，后续所有 GL 调用都会失败。',
    'OpenGL 桌面版的窗口/上下文库逻辑，在 WebGL2 中由浏览器和 canvas 承担。',
  ]),
  topic('hello_triangle', 'Hello Triangle', `${sourceBase.gettingStarted}Hello-Triangle`, [
    '理解图形管线中顶点输入、vertex shader、fragment shader 和 draw call 的最小闭环。',
    '用 VBO/VAO 把顶点数据传给 GPU。',
    '练习 indexed drawing 时引入 EBO，避免重复顶点。',
  ], [
    '定义三角形顶点数组，并上传到 `ARRAY_BUFFER`。',
    '创建并链接 shader program，指定顶点属性布局。',
    '使用 `gl.drawArrays` 或 `gl.drawElements` 提交绘制。',
  ], [
    'VAO 记录的是顶点属性状态，绑定顺序错了会导致属性为空。',
    'EBO 绑定会被 VAO 记录，初始化后不要在错误的 VAO 上覆盖。',
    'WebGL2 的 GLSL 需要 `#version 300 es` 和精度声明。',
  ]),
  topic('shaders', 'Shaders', `${sourceBase.gettingStarted}Shaders`, [
    '把固定数据和 GPU 程序分开，理解 vertex/fragment shader 的职责。',
    '使用 uniform 从 JavaScript 向 shader 传递每帧变化的数据。',
    '通过 varying/out-in 插值把顶点颜色或纹理坐标传到 fragment shader。',
  ], [
    '编译 vertex shader 和 fragment shader，再链接为 shader program。',
    '通过 `gl.getUniformLocation` 和 `gl.uniform*` 更新 uniform。',
    '把顶点属性从 `layout(location=...) in` 传到片元阶段。',
  ], [
    'uniform 只有在 program 正在使用时设置才会作用到该 program。',
    '属性 location、stride、offset 任一不匹配都会让颜色或坐标异常。',
    'shader 编译失败时先看 info log，不要只看画面黑屏。',
  ]),
  topic('textures', 'Textures', `${sourceBase.gettingStarted}Textures`, [
    '学习纹理坐标、采样器和纹理单元的关系。',
    '配置 wrap、filter 和 mipmap，让图片能稳定采样。',
    '把多张纹理混合到同一个 fragment shader 输出。',
  ], [
    '加载图片后上传到 `TEXTURE_2D`。',
    '设置 `TEXTURE_WRAP_*`、`TEXTURE_MIN_FILTER` 和 `TEXTURE_MAG_FILTER`。',
    '激活纹理单元并把 sampler uniform 指向对应单元。',
  ], [
    '非 2 次幂纹理使用 mipmap 和 repeat 时要注意 WebGL 限制。',
    '图片 Y 轴方向和纹理坐标不一致时需要 `UNPACK_FLIP_Y_WEBGL`。',
    'sampler uniform 存的是纹理单元编号，不是 texture object。',
  ]),
  topic('transformations', 'Transformations', `${sourceBase.gettingStarted}Transformations`, [
    '使用矩阵表达平移、旋转、缩放等变换。',
    '理解矩阵乘法顺序会改变最终空间变换结果。',
    '用 glMatrix 在 JavaScript 中构造 model transform。',
  ], [
    '创建 model 矩阵并依次应用 translate/rotate/scale。',
    '把矩阵通过 uniform 传入 vertex shader。',
    '在 shader 中用矩阵变换顶点位置。',
  ], [
    '矩阵乘法不满足交换律，变换顺序不能随意调换。',
    '角度和弧度不要混用，glMatrix 旋转函数通常使用弧度。',
    '每帧复用矩阵时要先重置，避免变换累积到不可控。',
  ]),
  topic('coordinate_systems', 'Coordinate Systems', `${sourceBase.gettingStarted}Coordinate-Systems`, [
    '建立 model、view、projection 三个空间变换的基本框架。',
    '开启 depth test，让 3D 物体按深度正确遮挡。',
    '使用 perspective projection 获得近大远小的相机效果。',
  ], [
    '为每个物体设置 model 矩阵。',
    '用 view 矩阵表示相机位置和朝向。',
    '用 projection 矩阵把 view space 投影到 clip space。',
  ], [
    '忘记开启 `DEPTH_TEST` 会让后画的物体覆盖先画的物体。',
    'near/far plane 设置不合理会降低深度精度。',
    'projection 的 aspect 应和 canvas 宽高比一致。',
  ]),
  topic('camera', 'Camera', `${sourceBase.gettingStarted}Camera`, [
    '把 view matrix 抽象为可移动相机。',
    '用键盘、鼠标和滚轮控制位置、朝向和 FOV。',
    '引入 deltaTime，让移动速度不依赖帧率。',
  ], [
    '根据 camera position、front、up 计算 view 矩阵。',
    '处理键盘输入移动相机位置。',
    '处理鼠标偏移更新 yaw/pitch，滚轮更新 zoom/FOV。',
  ], [
    'pitch 需要限制范围，避免视线翻转。',
    '移动速度要乘 deltaTime，否则高刷新率设备移动更快。',
    '鼠标初始位置需要单独处理，避免第一帧大幅跳动。',
  ]),
  topic('color', 'Colors', `${sourceBase.lighting}Colors`, [
    '理解物体颜色和光源颜色如何共同决定最终颜色。',
    '用一个小立方体可视化 light source。',
    '为后续 Phong/Blinn-Phong 光照模型做铺垫。',
  ], [
    '渲染受光物体并传入 object color 和 light color。',
    '用单独 shader 渲染 light cube。',
    '在 fragment shader 中组合物体颜色和光颜色。',
  ], [
    '光源可视化立方体只是调试表现，不等于真实发光体积。',
    '颜色计算应保持在线性空间，后续 gamma 章节会专门处理。',
    '物体 shader 和 light shader 的 uniform 不要混用。',
  ]),
  topic('basic_lighting', 'Basic Lighting', `${sourceBase.lighting}Basic-Lighting`, [
    '实现 ambient、diffuse、specular 三部分基础光照。',
    '理解法线、光线方向、观察方向对最终亮度的影响。',
    '练习 normal matrix，处理非等比缩放下的法线变换。',
  ], [
    '把顶点位置和法线传入 fragment shader。',
    '用法线和光方向点乘计算 diffuse。',
    '用观察方向和反射方向计算 specular。',
  ], [
    '法线需要归一化，插值后尤其不能直接使用。',
    '非等比缩放时，法线应使用 normal matrix 变换。',
    '光照方向的正负要统一，否则亮面会出现在背面。',
  ]),
  topic('materials', 'Materials', `${sourceBase.lighting}Materials`, [
    '把物体材质参数和光源参数拆开管理。',
    '使用 ambient/diffuse/specular/shininess 控制表面表现。',
    '为后续贴图材质做结构准备。',
  ], [
    '在 shader 中定义 material 和 light 相关 uniform。',
    '分别计算环境光、漫反射和高光。',
    '通过 shininess 控制高光范围。',
  ], [
    'shininess 越高，高光越集中，不是越亮。',
    '材质和光源的 specular 强度都会影响最终高光。',
    'uniform 名称和结构字段要完全匹配。',
  ]),
  topic('lighting_maps', 'Lighting maps', `${sourceBase.lighting}Lighting-maps`, [
    '用纹理替代固定材质颜色，让同一模型表面拥有不同材质响应。',
    '引入 diffuse map 和 specular map。',
    '理解 sampler2D 作为 material 字段时的使用方式。',
  ], [
    '加载 diffuse/specular 纹理并绑定到不同纹理单元。',
    '在 fragment shader 中按纹理坐标采样。',
    '用采样结果参与 diffuse 和 specular 光照计算。',
  ], [
    'specular map 的黑色区域应抑制高光，不是让区域变黑。',
    '不同贴图要绑定到不同纹理单元，并设置对应 sampler。',
    '贴图路径或图片加载失败时，材质会退化为黑色或默认颜色。',
  ]),
  topic('light_caster', 'Light casters', `${sourceBase.lighting}Light-casters`, [
    '实现 directional light、point light 和 spot light。',
    '理解点光源衰减和聚光灯 cutoff 的作用。',
    '练习把不同光源类型封装成独立计算函数。',
  ], [
    'directional light 使用固定方向，不关心光源位置。',
    'point light 根据片段到光源距离计算 attenuation。',
    'spot light 使用光线方向和 cutoff 判断锥形范围。',
  ], [
    'cutoff 通常传入 cosine 值，不能直接和角度比较。',
    '点光源衰减参数过大时，场景会整体偏暗。',
    'soft spotlight 需要 inner/outer cutoff 做平滑过渡。',
  ]),
  topic('multiple_lights', 'Multiple lights', `${sourceBase.lighting}Multiple-lights`, [
    '在同一场景中叠加多种光源贡献。',
    '把 directional、point、spot light 的计算拆成函数。',
    '理解多光源只是多个光照结果相加，不改变基础材质模型。',
  ], [
    '计算一个 directional light 作为基础光。',
    '循环计算多个 point lights。',
    '计算 spotlight 并把所有光照结果累加。',
  ], [
    '多光源容易过曝，颜色强度需要控制。',
    '数组 uniform 的字段名必须和 shader 结构完全一致。',
    '循环数量要和 shader 中的常量保持一致。',
  ]),
  topic('model_loading', 'Model', `${sourceBase.model}Model`, [
    '把复杂模型拆成 mesh、material、texture 等可渲染数据。',
    '复用前面章节的 shader、贴图和光照知识渲染模型。',
    '在 WebGL2 中加载外部模型资源并转换为 GPU buffer。',
  ], [
    '加载模型文件和关联纹理资源。',
    '为每个 mesh 创建 VAO/VBO/EBO。',
    '遍历模型中的 mesh 并逐个 draw。',
  ], [
    '模型路径、材质路径和贴图路径通常是相对关系，移动资源时容易断。',
    '不同模型的顶点属性布局可能不一致，上传前要确认数据结构。',
    '贴图缓存能避免重复上传，但缓存键必须使用稳定路径。',
  ]),
  topic('depth_testing', 'Depth testing', `${sourceBase.advancedOpenGL}Depth-testing`, [
    '理解 depth buffer 如何解决 3D 遮挡。',
    '练习 depth function、深度可视化和 z-fighting 现象。',
    '观察 near/far plane 和深度精度的关系。',
  ], [
    '启用 `gl.DEPTH_TEST`。',
    '每帧同时清理 color buffer 和 depth buffer。',
    '通过 `gl.depthFunc` 或 shader 可视化观察深度结果。',
  ], [
    '忘记清理 depth buffer 会保留上一帧的遮挡信息。',
    '共面或距离过近的面会产生 z-fighting。',
    'near plane 过小会显著浪费深度精度。',
  ]),
  topic('stencil_testing', 'Stencil testing', `${sourceBase.advancedOpenGL}Stencil-testing`, [
    '使用 stencil buffer 标记已经绘制过的片段。',
    '通过二次绘制实现模型描边等效果。',
    '理解 stencil func、stencil op 和 stencil mask 的关系。',
  ], [
    '绘制正常模型时写入 stencil 值。',
    '关闭 stencil 写入并绘制放大后的模型外壳。',
    '只在 stencil 不等于指定值的位置绘制描边。',
  ], [
    'stencil buffer 通常来自 depth-stencil renderbuffer 或默认 framebuffer。',
    '绘制描边时要正确开关 depth test/stencil mask。',
    '不同 pass 的 stencil state 必须显式恢复。',
  ]),
  topic('blending', 'Blending', `${sourceBase.advancedOpenGL}Blending`, [
    '处理带 alpha 的片段丢弃和半透明混合。',
    '理解 blending equation 和 source/destination factor。',
    '学习透明物体需要从远到近排序。',
  ], [
    'discard 用于完全透明的片段，例如草叶纹理。',
    '启用 `gl.BLEND` 并配置 `gl.blendFunc`。',
    '渲染透明物体前按相机距离排序。',
  ], [
    '半透明物体通常不能只依赖 depth buffer，顺序会影响结果。',
    'discard 会产生硬边，不能替代半透明混合。',
    '透明物体排序要按每帧相机位置更新。',
  ]),
  topic('face_culling', 'Face culling', `${sourceBase.advancedOpenGL}Face-culling`, [
    '根据三角形 winding 判断正面和背面。',
    '剔除不可见背面，减少 fragment 处理。',
    '理解模型资源的顶点顺序会影响 culling 结果。',
  ], [
    '启用 `gl.CULL_FACE`。',
    '用 `gl.cullFace` 选择剔除 front/back。',
    '用 `gl.frontFace` 指定 CCW 或 CW 为正面。',
  ], [
    '模型 winding 不一致时，开启 culling 会让部分面消失。',
    '透明物体和双面材质通常不适合直接背面剔除。',
    '导入模型前后坐标系变化可能改变 winding。',
  ]),
  topic('framebuffers', 'Framebuffers', `${sourceBase.advancedOpenGL}Framebuffers`, [
    '把场景先渲染到离屏 framebuffer，再作为纹理绘制到屏幕。',
    '学习 color attachment、renderbuffer 和 framebuffer completeness。',
    '为后续后处理、HDR、Bloom 等效果打基础。',
  ], [
    '创建 FBO 并挂载颜色纹理。',
    '挂载 depth/stencil renderbuffer 供 3D 场景测试使用。',
    '第二个 pass 绘制屏幕四边形并采样离屏颜色纹理。',
  ], [
    'FBO 尺寸和 canvas 尺寸不一致时，采样结果会拉伸或模糊。',
    '渲染到屏幕前必须重新绑定默认 framebuffer。',
    '修改 attachment 后应检查 framebuffer completeness。',
  ]),
  topic('cubemaps', 'Cubemaps', `${sourceBase.advancedOpenGL}Cubemaps`, [
    '使用 cubemap texture 表达六个方向的环境。',
    '渲染 skybox，并用环境贴图实现反射和折射。',
    '扩展到动态环境映射时，学习从场景生成 cubemap。',
  ], [
    '加载六张图片到 `TEXTURE_CUBE_MAP`。',
    '用方向向量采样 cubemap。',
    '渲染 skybox 时移除 view matrix 的平移部分。',
  ], [
    '六个面的顺序或方向错了会出现接缝和翻转。',
    'skybox 通常最后绘制，并使用特殊 depth func。',
    '动态 cubemap 成本高，需要为六个方向各渲染一次场景。',
  ]),
  topic('advanced_glsl', 'Advanced GLSL', `${sourceBase.advancedOpenGL}Advanced-GLSL`, [
    '使用 uniform buffer object 在多个 shader 间共享数据。',
    '理解 uniform block、binding point 和 buffer range 的关系。',
    '减少重复设置 view/projection 等全局矩阵的样板代码。',
  ], [
    '在 shader 中声明同名 uniform block。',
    '创建 UBO 并绑定到指定 binding point。',
    '用 `bufferSubData` 更新矩阵内容。',
  ], [
    'uniform block layout 要匹配 std140 对齐规则。',
    'shader block index 和 binding point 是两层概念，不能混淆。',
    '更新部分 buffer 时 offset 必须按字节计算。',
  ]),
  topic('instancing', 'Instancing', `${sourceBase.advancedOpenGL}Instancing`, [
    '用一次 draw call 绘制多个相同 mesh 的实例。',
    '比较 `gl_InstanceID` 和 per-instance attribute 两种传参方式。',
    '在小行星场景中降低大量重复模型的提交成本。',
  ], [
    '准备每个实例的位置、旋转、缩放或 model matrix。',
    '通过 `gl_InstanceID` 索引数组，或用 divisor 读取实例属性。',
    '调用 `drawArraysInstanced` 或 `drawElementsInstanced`。',
  ], [
    '实例属性需要设置 divisor，否则每个顶点都会前进一次。',
    '单个 uniform 数组容量有限，大量实例应使用实例属性或纹理数据。',
    '实例化减少 draw call，但不会减少片元填充成本。',
  ]),
  topic('anti_aliasing', 'Anti Aliasing', `${sourceBase.advancedOpenGL}Anti-Aliasing`, [
    '理解 MSAA 如何减少几何边缘锯齿。',
    '学习默认 framebuffer MSAA、离屏 MSAA framebuffer 和 resolve。',
    '在后处理场景中把抗锯齿结果转换为可采样纹理。',
  ], [
    '创建 multisample renderbuffer 或 multisample texture。',
    '把场景渲染到 MSAA framebuffer。',
    '通过 blit/resolve 得到普通 2D texture，再进入后处理 pass。',
  ], [
    'MSAA 主要处理几何边缘，不会自动平滑 shader 内部高频纹理。',
    '多采样 attachment 不能像普通 `sampler2D` 一样直接采样。',
    'resolve 后再做后处理，顺序不要反过来。',
  ]),
  topic('advanced_lighting', 'Advanced Lighting', `${sourceBase.advancedLighting}Advanced-Lighting`, [
    '比较 Phong 和 Blinn-Phong 高光模型。',
    '理解半程向量如何改善低 shininess 时的高光断层。',
    '为后续 HDR、Bloom 和延迟渲染保留更稳定的光照基础。',
  ], [
    '计算 light direction 和 view direction。',
    'Phong 使用 reflection vector 计算 specular。',
    'Blinn-Phong 使用 halfway vector 计算 specular。',
  ], [
    'Blinn-Phong 的 shininess 数值不能和 Phong 直接等价。',
    '观察方向和光方向都要归一化。',
    '切换模型时只改 specular 项，diffuse/ambient 不应跟着改变。',
  ]),
  topic('gamma_correction', 'Gamma Correction', `${sourceBase.advancedLighting}Gamma-Correction`, [
    '区分线性空间计算和 sRGB 显示空间输出。',
    '保证光照计算在线性空间中进行。',
    '在最终输出前做 gamma correction，或使用 sRGB texture format 让采样自动解码。',
  ], [
    '加载颜色贴图时根据需要使用 sRGB 内部格式。',
    '在 shader 中完成线性光照计算。',
    '最终颜色输出前执行 `pow(color, vec3(1.0 / 2.2))`。',
  ], [
    '不能对 normal map、height map、roughness 等非颜色数据做 sRGB 解码。',
    '同一张颜色贴图不要手动和硬件各 gamma 一次。',
    'WebGL2 中 sRGB 纹理格式和 mipmap 支持要按实际格式处理。',
  ]),
  topic('shadow_mapping', 'Shadow Mapping', `${sourceBase.advancedLighting}Shadows/Shadow-Mapping`, [
    '用光源视角渲染 depth map，再在相机视角判断片段是否被遮挡。',
    '理解 light space transform、shadow bias 和 PCF。',
    '观察阴影贴图分辨率和投影范围对质量的影响。',
  ], [
    '第一 pass 从光源视角渲染深度纹理。',
    '第二 pass 把片段位置变换到 light space。',
    '比较当前深度和 depth map 中的深度，决定 shadow factor。',
  ], [
    'bias 太小会产生 shadow acne，太大会产生 peter panning。',
    'light projection 范围过大时阴影精度会下降。',
    '采样 shadow map 前要做透视除法和坐标映射。',
  ]),
  topic('normal_mapping', 'Normal Mapping', `${sourceBase.advancedLighting}Normal-Mapping`, [
    '使用 normal map 在不增加几何细节的情况下改变表面法线。',
    '理解 tangent space 和 TBN matrix。',
    '让同一个平面或低模表面呈现更丰富的光照细节。',
  ], [
    '为顶点提供 tangent/bitangent/normal。',
    '在 shader 中构建 TBN 矩阵。',
    '把 normal map 采样值从 `[0, 1]` 映射到 `[-1, 1]` 后参与光照。',
  ], [
    'normal map 是方向数据，不应做 gamma correction。',
    'TBN 基向量需要归一化并保持同一空间。',
    'UV 镜像或切线方向不一致会导致法线细节翻转。',
  ]),
  topic('parallax_mapping', 'Parallax Mapping', `${sourceBase.advancedLighting}Parallax-Mapping`, [
    '用 height map 根据观察方向偏移纹理坐标，模拟表面深度。',
    '理解基础 parallax 和 steep parallax 的采样差异。',
    '在不增加几何体复杂度的情况下增强凹凸层次。',
  ], [
    '把 view direction 转换到 tangent space。',
    '根据 height value 偏移纹理坐标。',
    'steep parallax 通过多层采样寻找更接近的交点。',
  ], [
    'height scale 过大会导致纹理游离和边缘破裂。',
    '偏移后的 UV 超出范围时需要丢弃或限制。',
    '观察角越斜，parallax artifact 越明显。',
  ]),
  topic('hdr', 'HDR', `${sourceBase.advancedLighting}HDR`, [
    '使用浮点 framebuffer 保存超过 `1.0` 的亮度。',
    '通过 tone mapping 把 HDR 颜色压回显示器可见范围。',
    '使用 exposure 参数控制场景明暗。',
  ], [
    '创建 `RGBA16F` 等浮点颜色附件。',
    '把场景渲染到 HDR framebuffer。',
    '屏幕 pass 中执行 tone mapping 和 gamma correction。',
  ], [
    'HDR buffer 不等于最终显示颜色，必须经过 tone mapping。',
    '浮点颜色附件需要检查 WebGL 扩展支持。',
    'exposure 过高会整体发白，过低会丢失暗部。',
  ]),
  topic('bloom', 'Bloom', `${sourceBase.advancedLighting}Bloom`, [
    'Bloom 用后处理让高亮区域产生光晕和亮部溢出。',
    '它通常与 HDR 搭配，但不是 HDR 本身。',
    '当前页面把正常场景和高亮区域分离，高亮区域模糊后叠回 HDR 场景，再 tone mapping 到屏幕。',
  ], [
    'HDR pass 使用两个颜色附件同时输出完整场景和亮部纹理。',
    'bright pass 用亮度阈值筛出超过 `1.0` 的片段。',
    'ping-pong blur 在横向和纵向之间交替模糊亮部纹理。',
    '最终 pass 先合成 `scene + bloomBlur`，再 tone mapping 和 gamma correction。',
  ], [
    '忘记 `drawBuffers` 会只写第一个 attachment，亮区纹理为空。',
    '先 tone mapping 再叠 Bloom 会丢失 HDR 亮度关系。',
    'Blur 纹理要使用 `CLAMP_TO_EDGE`，否则边缘会出现串色。',
  ]),
  topic('deferred_shading', 'Deferred Shading', `${sourceBase.advancedLighting}Deferred-Shading`, [
    '把几何信息先写入 G-buffer，再统一执行光照计算。',
    '理解 geometry pass 和 lighting pass 的职责分离。',
    '在多光源场景中减少重复执行复杂材质计算的成本。',
  ], [
    'geometry pass 输出 position、normal、albedo/specular 等 G-buffer。',
    'lighting pass 读取 G-buffer 并遍历光源计算最终颜色。',
  ], [
    'G-buffer 占用显存高，格式选择要克制。',
    '透明物体不适合直接放进普通 deferred pass。',
    'lighting pass 中的坐标空间必须和 G-buffer 写入时一致。',
  ]),
  topic('ssao', 'SSAO', `${sourceBase.advancedLighting}SSAO`, [
    '在屏幕空间估算环境遮蔽，让角落和接触区域更暗。',
    '使用采样 kernel 和随机 noise texture 降低规律性 artifact。',
    '把 SSAO 结果模糊后参与最终 lighting pass。',
  ], [
    '从 G-buffer 读取 view-space position 和 normal。',
    '围绕当前片段生成半球采样点并投影回屏幕。',
    '统计被遮挡采样比例，得到 occlusion texture。',
    '对 occlusion texture 做 blur，再用于光照合成。',
  ], [
    '采样半径过大会产生脏污感，过小则效果不明显。',
    'noise texture 太小或未旋转采样会产生条纹。',
    'SSAO 是屏幕空间效果，屏幕外物体不会参与遮蔽。',
  ]),
  topic('pbr_lighting', 'Lighting', `${sourceBase.pbr}Lighting`, [
    '实现基于 Cook-Torrance BRDF 的直接光照 PBR。',
    '理解 albedo、metallic、roughness、ao 对材质外观的影响。',
    '用能量守恒和 Fresnel 让金属/非金属材质表现更稳定。',
  ], [
    '为每个片段计算 NDF、geometry 和 Fresnel 项。',
    '按 metallic 拆分 diffuse 和 specular 贡献。',
    '遍历光源累加 radiance，并做 tone mapping/gamma correction。',
  ], [
    'PBR 参数应在线性空间中计算，albedo 颜色输入要注意 gamma。',
    'roughness 不能为 0，否则高光会过于尖锐并带来数值问题。',
    '金属材质通常没有 diffuse 项，非金属才保留明显漫反射。',
  ]),
];

function topic(key, sourceTitle, sourceUrl, goals, steps, pitfalls) {
  return { key, sourceTitle, sourceUrl, goals, steps, pitfalls };
}

function pickTopic(section, slug) {
  if (section === '1_basic') {
    if (slug.includes('hello_window')) return byKey('hello_window');
    if (slug.includes('hello_triangle')) return byKey('hello_triangle');
    if (slug.includes('shaders')) return byKey('shaders');
    if (slug.includes('textures')) return byKey('textures');
    if (slug.includes('transformations')) return byKey('transformations');
    if (slug.includes('coordinate_systems')) return byKey('coordinate_systems');
    if (slug.includes('camera')) return byKey('camera');
  }
  if (section === '2_lighting') {
    if (slug.includes('color')) return byKey('color');
    if (slug.includes('basic_lighting')) return byKey('basic_lighting');
    if (slug.includes('materials')) return byKey('materials');
    if (slug.includes('lighting_maps')) return byKey('lighting_maps');
    if (slug.includes('light_caster')) return byKey('light_caster');
    if (slug.includes('multiple_lights')) return byKey('multiple_lights');
  }
  if (section === '3_model') return byKey('model_loading');
  if (section === '4_advance_opengl') {
    if (slug.includes('depth_testing') || slug.includes('z_fighting')) return byKey('depth_testing');
    if (slug.includes('stencil_testing')) return byKey('stencil_testing');
    if (slug.includes('blending')) return byKey('blending');
    if (slug.includes('face_culling')) return byKey('face_culling');
    if (slug.includes('framebuffers')) return byKey('framebuffers');
    if (slug.includes('cubemaps')) return byKey('cubemaps');
    if (slug.includes('advanced_glsl')) return byKey('advanced_glsl');
    if (slug.includes('instancing') || slug.includes('asteroids')) return byKey('instancing');
    if (slug.includes('anti_aliasing')) return byKey('anti_aliasing');
  }
  if (section === '5_advanced_lighting') {
    if (slug.includes('advanced_lighting')) return byKey('advanced_lighting');
    if (slug.includes('gamma_correction')) return byKey('gamma_correction');
    if (slug.includes('shadow_mapping')) return byKey('shadow_mapping');
    if (slug.includes('normal_mapping')) return byKey('normal_mapping');
    if (slug.includes('parallax_mapping')) return byKey('parallax_mapping');
    if (slug.includes('deferred_shading')) return byKey('deferred_shading');
    if (slug.includes('hdr')) return byKey('hdr');
    if (slug.includes('bloom')) return byKey('bloom');
    if (slug.includes('ssao')) return byKey('ssao');
  }
  if (section === '6.pbr' || section === '6_pbr') return byKey('pbr_lighting');
  return byKey('hello_window');
}

function byKey(key) {
  return topics.find((item) => item.key === key);
}

function titleFromSlug(slug) {
  const match = slug.match(/^(\d+(?:\.\d+)*)_(.+)$/);
  const number = match ? match[1] : '';
  const rest = match ? match[2] : slug;
  const title = rest
    .replace(/\[([^\]]+)\]/g, ' $1')
    .split('_')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  return number ? `${number} ${title}` : title;
}

function sectionTitle(section) {
  return {
    '1_basic': 'Getting Started',
    '2_lighting': 'Lighting',
    '3_model': 'Model Loading',
    '4_advance_opengl': 'Advanced OpenGL',
    '5_advanced_lighting': 'Advanced Lighting',
    '6.pbr': 'PBR',
    '6_pbr': 'PBR',
  }[section] || section;
}

function bulletList(items) {
  return items.map((item) => `- ${item}`).join('\n');
}

function numberedList(items) {
  return items.map((item, index) => `${index + 1}. ${item}`).join('\n');
}

function fileIndex(dir) {
  const files = fs.readdirSync(dir).sort();
  const entries = [];
  if (files.includes('index.html')) entries.push('`index.html`: 页面入口和依赖脚本。');
  if (files.includes('main.js')) entries.push('`main.js`: WebGL2 初始化、资源加载、渲染循环和本课核心 draw pass。');

  const shaderFiles = files.filter((file) => /\.(vs|fs|glsl)$/i.test(file));
  if (shaderFiles.length) {
    entries.push(`${shaderFiles.map((file) => `\`${file}\``).join(', ')}: 本课相关 shader。`);
  }

  const jsFiles = files.filter((file) => file.endsWith('.js') && file !== 'main.js');
  if (jsFiles.length) {
    entries.push(`${jsFiles.map((file) => `\`${file}\``).join(', ')}: 本课拆出的辅助脚本。`);
  }

  return bulletList(entries);
}

function observeFor(slug, topicInfo) {
  const items = [
    '运行页面后先看控制台是否有 shader 编译、资源加载或 WebGL state 报错。',
    '对照参考课文观察本页是否实现了同一阶段的视觉目标。',
  ];

  if (slug.includes('exercise')) {
    items.push('exercise 页面重点看相对基础版本改变了哪一个变量、输入或 shader 分支。');
  }
  if (slug.includes('bloom') || slug.includes('hdr') || slug.includes('gamma') || slug.includes('deferred') || slug.includes('ssao')) {
    items.push('有 GUI 参数时，优先调开关、曝光、阈值或半径，观察后处理前后的差异。');
  }
  if (topicInfo.key === 'camera') {
    items.push('移动相机时观察 deltaTime、鼠标方向和 FOV 是否符合预期。');
  }
  if (topicInfo.key === 'light_caster' || topicInfo.key === 'multiple_lights') {
    items.push('移动或切换光源时观察衰减、cutoff 和 specular 高光是否连续。');
  }
  return items;
}

function lessonTopic(section, slug) {
  const base = pickTopic(section, slug);
  const info = {
    ...base,
    goals: [...base.goals],
    steps: [...base.steps],
    pitfalls: [...base.pitfalls],
  };

  if (slug.includes('deferred_shading_bloom')) {
    info.goals.push('在 deferred lighting 之后串接 Bloom 后处理。');
    info.steps.push('Bloom 变体继续提取亮部、执行 blur，并在最终 pass 中叠回场景。');
    info.pitfalls.push('G-buffer、Bloom blur 和最终屏幕 pass 的纹理绑定顺序要保持清楚。');
  }

  if (slug.includes('deferred_shading_volumes')) {
    info.goals.push('使用光体积限制点光源实际影响的屏幕区域。');
    info.steps.push('volume 版本通过绘制光源包围体减少无效片元光照计算。');
    info.pitfalls.push('光体积半径过小会裁掉光照，过大则失去优化意义。');
  }

  return info;
}

function renderReadme(coursePath) {
  const parts = coursePath.replace(/\\/g, '/').replace(/^\.\//, '').split('/');
  const section = parts[0];
  const slug = parts[1];
  const dir = path.join(root, section, slug);
  const topicInfo = lessonTopic(section, slug);
  const title = `${titleFromSlug(slug)} (${sectionTitle(section)})`;

  const replacements = {
    title,
    sourceTitle: `LearnOpenGL - ${topicInfo.sourceTitle}`,
    sourceUrl: topicInfo.sourceUrl,
    goals: bulletList(topicInfo.goals),
    steps: numberedList(topicInfo.steps),
    files: fileIndex(dir),
    observe: bulletList(observeFor(slug, topicInfo)),
    pitfalls: bulletList(topicInfo.pitfalls),
  };

  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => replacements[key] || '');
}

const courseDirs = new Set(
  list
    .filter((item) => item.endsWith('/index.html'))
    .map((item) => item.replace(/^\.\//, '').replace(/\/index\.html$/, ''))
    .filter((item) => item.split('/').length === 2)
);

let written = 0;
for (const courseDir of Array.from(courseDirs).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))) {
  const readmePath = path.join(root, courseDir, 'readme.md');
  fs.writeFileSync(readmePath, renderReadme(courseDir), 'utf8');
  written += 1;
}

console.log(`Generated ${written} course readme files.`);
