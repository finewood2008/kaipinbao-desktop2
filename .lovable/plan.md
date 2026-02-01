

# 开品宝 UI/UX 重构与 AI 模型升级计划

## 项目概览

本计划将对开品宝平台进行全面的 UI/UX 重新设计，增强阶段过渡动画，优化视觉生成体验，并升级 AI 模型配置以使用 Google Nano Banana Pro 进行图像生成。

---

## 第一部分：UI/UX 整体美化

### 1.1 增强现有设计系统

**更新 `tailwind.config.ts` 和 `src/index.css`：**
- 添加更丰富的动画关键帧（弹跳、滑入、脉冲闪烁等）
- 引入微交互动画样式
- 优化玻璃拟态效果的层次感

**新增动画效果：**
- `bounce-in`：用于重要元素的入场
- `slide-in-from-bottom`：阶段切换卡片入场
- `glow-pulse`：用于引导用户注意力
- `confetti`：确认选择时的庆祝动效

### 1.2 重构阶段指示器 (StageIndicator)

**更新 `src/components/StageIndicator.tsx`：**
- 增加阶段完成时的动画反馈
- 添加可点击进入已解锁阶段的功能
- 增强视觉层次和颜色区分

---

## 第二部分：阶段过渡动画与手动确认机制

### 2.1 新增阶段过渡提示组件

**创建 `src/components/StageTransitionPrompt.tsx`：**
- 当 AI 判断可以进入下一阶段时显示
- 包含动画引导提示
- 需要用户手动点击确认才能进入下一阶段
- 使用 Framer Motion 实现流畅的入场/出场动画

**组件特性：**
- 渐变背景卡片
- 脉冲动画的 CTA 按钮
- 阶段图标的放大动画

### 2.2 更新项目页面逻辑

**修改 `src/pages/Project.tsx`：**
- 添加 `showTransitionPrompt` 状态控制
- 在对话中检测阶段完成的信号
- 显示过渡提示动画，等待用户确认
- 确认后播放过渡动画，切换到下一阶段

---

## 第三部分：视觉生成阶段增强

### 3.1 产品大图预览功能

**创建 `src/components/ImageLightbox.tsx`：**
- 全屏模态查看产品图
- 支持缩放和平移
- 左右滑动切换多张图片
- 键盘快捷键支持（ESC关闭，箭头切换）

### 3.2 产品选择增强

**更新 `src/components/ImageGallery.tsx`：**
- 放大图片预览尺寸（从正方形改为更大的展示区域）
- 选中产品时播放确认动画
- 添加明确的"选择此产品"按钮
- 选择后显示动画提示进入下一阶段
- 集成 Lightbox 组件

**选择流程优化：**
1. 用户点击图片 -> 打开大图预览
2. 在大图预览中点击"选择此设计" -> 触发选中动画
3. 返回列表视图，显示已选中状态
4. 显示"进入下一阶段"的动画提示按钮

### 3.3 更新图像生成模型

**修改 `supabase/functions/generate-image/index.ts`：**
- 将模型从 `gemini-2.0-flash-exp-image-generation` 更换为 `google/gemini-3-pro-image-preview`（Nano Banana Pro）
- 调整 API 调用格式以适配新模型

---

## 第四部分：营销落地页 AI 生成

### 4.1 创建落地页生成 Edge Function

**创建 `supabase/functions/generate-landing-page/index.ts`：**
- 接收 PRD 数据和目标市场信息
- 调用 Gemini 2.5 Flash 分析产品定位和市场特点
- 生成落地页设计思路（结构、文案、配色建议）
- 调用 Nano Banana Pro 生成营销图片（场景图、使用图、多角度图）
- 返回完整的落地页数据结构

**生成内容包含：**
- Hero 区域设计（主图 + 标题 + 副标题）
- 痛点解决方案对比
- 产品特性展示（带场景图）
- 用户见证/信任背书
- CTA 区域
- 所有营销图片均由 AI 生成

### 4.2 更新落地页构建器

**修改 `src/components/LandingPageBuilder.tsx`：**
- 集成 AI 生成流程
- 显示生成进度（分步骤：分析中 -> 设计中 -> 生成图片中）
- 预览 AI 生成的落地页
- 支持重新生成指定部分

### 4.3 增强落地页预览

**创建 `src/components/LandingPagePreview.tsx`：**
- 专业的落地页预览组件
- 响应式设计预览
- 实时编辑能力

---

## 第五部分：技术实现细节

### 5.1 文件变更列表

| 文件路径 | 操作 | 描述 |
|---------|------|------|
| `src/index.css` | 修改 | 添加新动画和样式 |
| `tailwind.config.ts` | 修改 | 扩展动画配置 |
| `src/components/StageIndicator.tsx` | 修改 | 增强阶段指示器 |
| `src/components/StageTransitionPrompt.tsx` | 新建 | 阶段过渡提示组件 |
| `src/components/ImageLightbox.tsx` | 新建 | 图片大图预览 |
| `src/components/ImageGallery.tsx` | 修改 | 增强图片展示和选择 |
| `src/components/LandingPageBuilder.tsx` | 修改 | 集成 AI 生成 |
| `src/components/LandingPagePreview.tsx` | 新建 | 落地页预览组件 |
| `src/pages/Project.tsx` | 修改 | 集成过渡动画和新流程 |
| `supabase/functions/generate-image/index.ts` | 修改 | 更换为 Nano Banana Pro 模型 |
| `supabase/functions/generate-landing-page/index.ts` | 新建 | 落地页 AI 生成服务 |
| `supabase/config.toml` | 修改 | 注册新的 Edge Function |

### 5.2 图像生成模型配置

```text
当前模型: gemini-2.0-flash-exp-image-generation
目标模型: google/gemini-3-pro-image-preview (Nano Banana Pro)

API 端点保持不变，需调整:
- model 参数
- 响应解析逻辑（如有差异）
```

### 5.3 落地页生成流程

```text
用户触发生成
     |
     v
[1] 调用 Gemini 2.5 Flash
    - 分析 PRD 数据
    - 确定目标市场特点
    - 生成落地页设计思路
     |
     v
[2] 调用 Nano Banana Pro (并行)
    - 生成 Hero 主图
    - 生成场景使用图
    - 生成产品多角度图
     |
     v
[3] 组合生成结果
    - 整合文案与图片
    - 返回完整落地页数据
     |
     v
[4] 前端渲染预览
    - 展示生成的落地页
    - 允许发布或重新生成
```

---

## 第六部分：用户体验流程

### 完整用户旅程

1. **阶段一 (PRD 细化)**
   - 用户与 AI 对话
   - AI 完成信息收集后，显示动画提示
   - 用户点击"进入视觉生成阶段"

2. **阶段二 (视觉生成)**
   - 生成产品图片
   - 用户点击图片查看大图
   - 选择满意的设计方案
   - 显示确认动画和"进入落地页阶段"提示

3. **阶段三 (落地页生成)**
   - 点击"AI 生成落地页"
   - 显示生成进度
   - 预览 AI 生成的完整落地页
   - 发布或重新生成

---

## 预估工作量

- 动画系统增强：中等
- 阶段过渡组件：轻量
- 图片预览组件：中等
- ImageGallery 增强：中等
- 落地页生成 Edge Function：较重
- 落地页构建器更新：中等
- 项目页面集成：中等

