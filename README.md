# 体态实验室 (Body Lab)

基于 WebGL 的 3D 人体参数化模拟器，支持微信小程序、H5 和 App 多端运行。

## 项目概述

体态实验室是一个创新的 3D 人体建模应用，通过三级调节模式让用户能够精确控制虚拟人体的各项参数，实现从简单到专业的全方位体态调节体验。

### 核心特性

- **三级调节模式**: 简易/普通/高级，满足不同用户需求
- **实时 3D 渲染**: 基于 Three.js 的高性能 WebGL 渲染
- **BlendShapes 技术**: 精确的人体变形控制
- **多端支持**: UniApp 框架，一次开发多端运行
- **云端同步**: UniCloud 后端，数据实时同步

## 技术架构

### 前端技术栈
- **框架**: UniApp + Vue 3
- **3D 引擎**: Three.js + three-platformize
- **构建工具**: Vite
- **UI 组件**: 自定义组件库

### 后端技术栈
- **云服务**: UniCloud
- **数据库**: 云数据库 (JSON)
- **存储**: 云存储
- **函数**: 云函数

### 核心技术
- **3D 渲染**: WebGL + Three.js
- **模型格式**: glTF 2.0 (.glb)
- **压缩算法**: Draco 几何压缩
- **变形技术**: BlendShapes/ShapeKeys

## 功能模式

### 简易模式 (Simple)
**目标用户**: 小白用户  
**交互方式**: 2-3 个宏观滑块
- 体脂率 (同时影响腹部、面部、腿部、手臂)
- 肌肉量 (同时影响胸部、手臂、腿部、背部)
- 身高比例 (同时影响腿长、躯干、脖子)

### 普通模式 (Normal)
**目标用户**: 健身/身材关注者  
**交互方式**: 8-10 个部位滑块
- 肩宽、胸围、腰围、臀围
- 腿长、臂长、脖子粗细、头部大小

### 高级模式 (Advanced)
**目标用户**: 专业/极致玩家  
**交互方式**: 30+ 个精细滑块
- 上半身: 斜方肌、三角肌、二头肌、三头肌、胸大肌、背阔肌
- 核心: 腹肌、腹斜肌、下背部
- 下半身: 臀大肌、股四头肌、腘绳肌、小腿肚
- 细节: 脖子宽度、手腕粗细、脚踝粗细

## 项目结构

```
src/
├── components/           # 组件库
│   └── BodyLab/         # 体态实验室组件
│       ├── BodyViewer.vue      # 3D 视图组件
│       ├── ControlPanel.vue    # 控制面板组件
│       └── SliderControl.vue   # 滑块控制组件
├── pages/               # 页面
│   ├── index/          # 首页
│   └── lab/            # 实验室主页面
├── static/             # 静态资源
│   ├── models/         # 3D 模型文件
│   ├── textures/       # 贴图资源
│   └── draco/          # Draco 解码器
├── utils/              # 工具函数
│   ├── bodyLabConfig.js    # 配置文件
│   ├── bodyLabUtils.js     # 工具函数
│   └── demoModel.js        # 演示模型
└── uni.scss            # 全局样式
```

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

## 3D 模型要求

### 基础规格
- **格式**: glTF 2.0 (.glb)
- **面数**: 15,000 - 20,000 三角面
- **文件大小**: < 2MB (Draco 压缩)
- **坐标系**: Y-up 右手坐标系

### BlendShapes 要求
模型必须包含以下变形通道：

#### 基础变形 (简易模式)
- `belly_fat`, `face_fat`, `leg_fat`, `arm_fat`
- `chest_muscle`, `arm_muscle`, `leg_muscle`, `back_muscle`
- `leg_length`, `torso_length`, `neck_length`

#### 部位变形 (普通模式)
- `shoulder_width`, `chest_size`, `waist_size`, `hip_size`
- `arm_length`, `neck_thickness`, `head_size`

#### 精细变形 (高级模式)
- 肌肉群: `trapezius`, `deltoid`, `biceps`, `triceps`, `pectoralis`, `latissimus`
- 核心: `abs`, `obliques`, `lower_back`
- 下肢: `glutes`, `quadriceps`, `hamstrings`, `calves`
- 细节: `neck_width`, `wrist_size`, `ankle_size`

详细的模型制作要求请参考 [模型规范文档](src/static/models/README.md)。

## 演示模式

项目内置了演示模式，在没有真实 3D 模型时可以使用程序生成的简单人体模型进行功能测试。

演示模型特性：
- 基础几何体组合的人体形状
- 完整的 BlendShapes 模拟
- 实时变形效果
- 所有控制模式支持

## 性能优化

### 模型优化
- Draco 几何压缩 (70-80% 压缩率)
- 纹理压缩 (DXT/ETC 格式)
- LOD 多细节层次
- 面数控制 (< 20K 三角面)

### 渲染优化
- 自适应质量调节
- 视锥体裁剪
- 阴影贴图优化
- 帧率控制

### 平台适配
- 微信小程序: 1K 纹理，65K 顶点限制
- H5: 2K 纹理，131K 顶点限制  
- App: 4K 纹理，262K 顶点限制

## 开发计划

### 阶段一: MVP (当前)
- [x] 基础 3D 场景搭建
- [x] 演示模型和 BlendShapes
- [x] 三级控制模式
- [x] 本地数据保存
- [ ] 真实人体模型集成

### 阶段二: 功能完善
- [ ] UniCloud 后端集成
- [ ] 用户系统
- [ ] 预设分享功能
- [ ] 截图和导出

### 阶段三: 高级功能
- [ ] 捏脸系统
- [ ] 服装系统
- [ ] 动画系统
- [ ] AR 预览

## 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 联系我们

- 项目主页: [GitHub Repository]
- 问题反馈: [Issues]
- 技术交流: [Discussions]

---

**体态实验室** - 让每个人都能拥有理想的虚拟形象 ✨