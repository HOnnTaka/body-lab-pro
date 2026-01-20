# 体态实验室 (Body Lab)

基于 WebGL 的 3D 人体参数化模拟器，支持微信小程序、H5 和 App 多端运行。

## 项目概述

体态实验室是一个创新的 3D 人体建模应用，通过三级调节模式让用户能够精确控制虚拟人体的各项参数，实现从简单到专业的全方位体态调节体验。
模型太大没上传，但是有预览↓
[预览](https://static-mp-3f56fc6a-bbec-4426-a407-1bcc974e221a.next.bspapp.com/#/)

### 技术栈

- **框架**: UniApp + Vue 3
- **3D 引擎**: Three.js + three-platformize
- **构建工具**: Vite
- **UI 组件**: 自定义组件库
- **微信小程序使用**: 云存储
- 

### 核心技术

- **3D 渲染**: WebGL + Three.js
- **模型格式**: glTF 2.0 (.glb)
- **变形技术**: BlendShapes/ShapeKeys

## 快速开始

### 环境要求

- Node.js >= 16
- pnpm (推荐) 或 npm

### 安装依赖

```bash
pnpm install
```

### 开发运行

#### H5 开发

```bash
pnpm run dev:h5
```

#### 微信小程序开发

```bash
pnpm run dev:mp-weixin
```

#### App 开发

```bash
pnpm run dev:app
```

### 构建发布

#### H5 构建

```bash
pnpm run build:h5
```

#### 微信小程序构建

```bash
pnpm run build:mp-weixin
```
