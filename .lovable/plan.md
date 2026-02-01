
# 视觉生成阶段重构计划

## 项目概览

将视觉生成阶段拆分为两个明确的板块：
1. **板块一：产品造型设计** - 基于PRD生成产品造型，用户选择确认后进入第二板块
2. **板块二：营销素材生成** - 基于选定造型生成各类营销图片和视频

---

## 第一部分：数据库架构调整

### 1.1 扩展 `generated_images` 表

新增字段区分图片类型：

| 字段名 | 类型 | 描述 |
|--------|------|------|
| `image_type` | `text` | 图片类型: `product` (产品造型), `scene` (场景图), `structure` (结构图), `exploded` (爆炸图), `usage` (使用图), `lifestyle` (生活方式图) |
| `phase` | `integer` | 所属板块: 1 (造型设计), 2 (营销素材) |
| `parent_image_id` | `uuid` | 关联的选定产品图ID (仅板块二) |

### 1.2 新建 `generated_videos` 表

| 字段名 | 类型 | 描述 |
|--------|------|------|
| `id` | `uuid` | 主键 |
| `project_id` | `uuid` | 关联项目 |
| `video_url` | `text` | 视频URL |
| `prompt` | `text` | 生成提示词 |
| `scene_description` | `text` | 场景描述 |
| `duration_seconds` | `integer` | 视频时长 (默认6秒) |
| `status` | `text` | 状态: `pending`, `processing`, `completed`, `failed` |
| `created_at` | `timestamp` | 创建时间 |

---

## 第二部分：前端组件重构

### 2.1 创建阶段二子板块管理器

**新建 `src/components/VisualGenerationPhase.tsx`**

```text
VisualGenerationPhase
├── PhaseIndicator (板块1/板块2指示器)
├── Phase 1: ProductDesignPhase
│   ├── ProductDesignGallery (产品造型画廊)
│   └── ConfirmDesignButton (确认选择)
└── Phase 2: MarketingAssetsPhase
    ├── ImageTypeSelector (图片类型选择器)
    ├── MarketingImageGallery (营销图片画廊)
    └── VideoGenerationSection (视频生成区)
```

### 2.2 图片类型选择器组件

**新建 `src/components/ImageTypeSelector.tsx`**

可选图片类型（用户可多选）：

| 类型ID | 显示名称 | 描述 |
|--------|----------|------|
| `scene` | 场景图 | 产品在使用环境中的展示 |
| `structure` | 结构图 | 展示产品内部结构 |
| `exploded` | 爆炸图 | 零部件分解展示 |
| `usage` | 使用图 | 用户使用产品的场景 |
| `lifestyle` | 生活方式图 | 融入生活场景的品牌形象 |
| `detail` | 细节特写 | 产品细节放大展示 |
| `comparison` | 对比图 | 与竞品或问题场景对比 |
| `custom` | 自定义 | 用户输入自定义描述 |

### 2.3 视频生成组件

**新建 `src/components/VideoGenerationSection.tsx`**

功能：
- 基于PRD中的使用场景定义生成视频
- 支持自定义场景描述
- 调用Google Veo 2 API生成6秒视频
- 显示生成进度和预览

### 2.4 更新 ImageGallery 组件

**修改 `src/components/ImageGallery.tsx`**

- 重命名为 `ProductDesignGallery.tsx` 专注板块一
- 选择产品后显示动画过渡到板块二

### 2.5 营销图片画廊组件

**新建 `src/components/MarketingImageGallery.tsx`**

- 按图片类型分组展示
- 支持批量生成
- 每种类型可独立重新生成

---

## 第三部分：后端 Edge Function

### 3.1 更新图片生成函数

**修改 `supabase/functions/generate-image/index.ts`**

新增参数：
- `imageType`: 图片类型
- `phase`: 板块 (1 或 2)
- `parentImageId`: 选定产品图ID (板块二必需)

根据不同类型应用不同的Prompt工程：

```text
产品造型 (product): 纯净白底产品渲染
场景图 (scene): 产品在自然环境中
结构图 (structure): 工程透视图展示内部
爆炸图 (exploded): 零部件分解
使用图 (usage): 用户与产品互动
生活方式图 (lifestyle): 融入生活场景
```

### 3.2 创建视频生成函数

**新建 `supabase/functions/generate-video/index.ts`**

使用 Lovable AI Gateway 调用 Google Veo 2 模型：
- 端点: `https://ai.gateway.lovable.dev/v1/video/generate`
- 模型: `google/veo-2`
- 输入: 产品图片 + 场景描述
- 输出: 6秒MP4视频

注意：由于视频生成是异步长时操作：
1. 创建任务记录，状态设为 `pending`
2. 返回任务ID给前端
3. 前端轮询状态直到完成

---

## 第四部分：用户交互流程

### 4.1 板块一：产品造型设计

```text
用户进入视觉生成阶段
        |
        v
[显示板块指示器: 板块1 ● — ○ 板块2]
        |
        v
"基于PRD生成产品造型" 按钮
        |
        v
生成多个产品造型方案
        |
        v
用户浏览、反馈、重新生成
        |
        v
用户选择一个方案 ✓
        |
        v
[动画过渡] "您已选定产品造型，准备生成营销素材？"
        |
        v
确认按钮 → 进入板块二
```

### 4.2 板块二：营销素材生成

```text
显示选定的产品造型（固定在顶部）
        |
        v
[图片类型选择器] (多选)
☑ 场景图  ☑ 使用图  ☐ 结构图  ☐ 爆炸图...
        |
        v
"生成选中类型的图片" 按钮
        |
        v
按类型分组展示生成结果
        |
        v
[视频生成区域]
"基于使用场景生成6秒产品视频"
        |
        v
选择/自定义场景 → 生成视频
        |
        v
所有素材完成 → 显示"进入落地页阶段"
```

---

## 第五部分：技术实现细节

### 5.1 文件变更列表

| 文件路径 | 操作 | 描述 |
|---------|------|------|
| `src/components/ImageGallery.tsx` | 重命名 | 改为 `ProductDesignGallery.tsx` |
| `src/components/VisualGenerationPhase.tsx` | 新建 | 视觉阶段主组件 |
| `src/components/ImageTypeSelector.tsx` | 新建 | 图片类型多选器 |
| `src/components/MarketingImageGallery.tsx` | 新建 | 营销图片画廊 |
| `src/components/VideoGenerationSection.tsx` | 新建 | 视频生成组件 |
| `src/pages/Project.tsx` | 修改 | 集成新的视觉阶段组件 |
| `supabase/functions/generate-image/index.ts` | 修改 | 支持多类型图片生成 |
| `supabase/functions/generate-video/index.ts` | 新建 | 视频生成Edge Function |
| `supabase/config.toml` | 修改 | 注册视频生成函数 |
| 数据库迁移 | 新建 | 添加新字段和新表 |

### 5.2 Prompt工程模板

**产品造型 (Phase 1)**
```text
专业产品渲染图，纯白背景，商业级品质...
```

**场景图 (Phase 2)**
```text
产品自然地放置在 [场景] 环境中，
柔和的自然光，生活化的氛围...
```

**结构图**
```text
工程透视图，展示产品内部结构，
半透明外壳，标注关键组件...
```

**爆炸图**
```text
产品零部件分解图，所有组件沿中轴线展开，
清晰的空间层次，每个部件可辨识...
```

**使用图**
```text
用户正在使用产品的场景，
自然的姿势，专注的表情...
```

### 5.3 视频生成参数

```text
模型: google/veo-2
时长: 6秒
分辨率: 720p
帧率: 24fps
风格: 产品展示/使用场景
```

---

## 第六部分：预估工作量

| 模块 | 复杂度 | 描述 |
|------|--------|------|
| 数据库迁移 | 轻量 | 添加字段和新表 |
| VisualGenerationPhase | 中等 | 板块切换逻辑 |
| ImageTypeSelector | 轻量 | 多选UI组件 |
| ProductDesignGallery | 轻量 | 重构现有组件 |
| MarketingImageGallery | 中等 | 分类展示逻辑 |
| VideoGenerationSection | 较重 | 异步任务处理 |
| generate-image 更新 | 中等 | Prompt工程 |
| generate-video 新建 | 较重 | Veo API集成 |
| Project.tsx 集成 | 中等 | 状态管理 |
