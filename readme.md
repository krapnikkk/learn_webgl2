# learn webgl2

基于 [LearnOpenGL](https://learnopengl.com/) 的 WebGL2 学习项目，把原教程中的 OpenGL/C++ 示例按章节重写为可在浏览器运行的 WebGL2 页面。

当前项目按 LearnOpenGL 的课程结构组织，`tools/list.json` 收录 94 个课程/练习页面，覆盖 Getting Started、Lighting、Model Loading、Advanced OpenGL、Advanced Lighting 和 PBR 等内容。每个课程目录通常包含 `index.html`、`main.js`、shader 文件以及对应的 `readme.md` 课程笔记。

在线预览: [learn_webgl2](https://krapnikkk.github.io/learn_webgl2/index.html)

## 项目特点

- 纯前端静态页面，不依赖打包工具即可运行。
- `package.json` 只提供课程清单生成命令，不需要安装运行时依赖。
- 使用 WebGL2、GLSL ES 3.00、glMatrix、Stats、dat.GUI 等本地库。
- 根目录 `index.html` 读取 `tools/list.json`，生成左侧课程目录并通过 iframe 打开页面。
- `tools/generate-course-readmes.js` 可按统一模板批量生成课程笔记。

## 目录结构

- `1_basic`: 入门、shader、纹理、变换、坐标系统、相机。
- `2_lighting`: 基础光照、材质、光照贴图、投光物、多光源。
- `3_model`: 模型加载相关示例。
- `4_advance_opengl`: 深度测试、模板测试、混合、帧缓冲、立方体贴图、实例化、抗锯齿等。
- `5_advanced_lighting`: Blinn-Phong、Gamma Correction、Shadow Mapping、Normal/Parallax Mapping、HDR、Bloom、Deferred Shading、SSAO。
- `6_pbr`: PBR 直接光照示例。
- `libs`: 项目使用的浏览器端工具库。
- `resources`: 模型、纹理等课程资源。
- `tools`: 课程清单和课程笔记生成脚本。

## 本地运行

由于首页会通过 `fetch` 读取 `tools/list.json`，建议在项目根目录启动静态服务器后访问：

```powershell
python -m http.server 5501
```

然后打开:

```text
http://127.0.0.1:5501/index.html
```

也可以直接使用 VS Code Live Server。

## 更新课程清单

新增、删除或移动课程页面后，运行：

```powershell
npm run build
```

该命令会重新扫描课程目录并生成 `tools/list.json`。

## 说明

这是 LearnOpenGL 的 WebGL2 移植学习项目，不是 LearnOpenGL 官方仓库。课程概念尽量对齐原教程，实现细节会按浏览器和 WebGL2 API 做对应调整。
