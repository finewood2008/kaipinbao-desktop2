
# 产品设计模块优化计划

## 目标概述

优化产品设计模块的三个核心问题：
1. **营销图片生成**：参考产品定义设定，完成一张显示一张，增大图片尺寸，配上营销文案
2. **视频生成**：参考产品定义场景，并正确显示生成后的视频
3. **数据传递**：确保 PRD 数据（场景、功能、风格等）正确传递到生成引擎

---

## 一、营销图片生成优化

### 1.1 逐张实时显示（流式渲染）

**当前问题**：图片批量生成后一起显示，用户等待时间长

**解决方案**：改为每完成一张立即显示，而不是等所有图片生成完毕

**修改文件**：`src/components/MarketingImageGallery.tsx`

```text
原逻辑：
for (type in selectedTypes) → 生成 → 收集到 newImages[]
循环结束后 → onImagesChange([...images, ...newImages])

新逻辑：
for (type in selectedTypes) {
  生成完成 → 立即 onImagesChange([...images, newImage])
  UI 即时更新显示新图片
}
```

### 1.2 增大图片尺寸

**当前布局**：`grid-cols-2 md:grid-cols-3 lg:grid-cols-4`，图片较小

**新布局**：`grid-cols-1 md:grid-cols-2`，每张图片更大，配合营销文案

### 1.3 添加营销文案

**修改内容**：
- Edge Function 返回时同时生成文案（利用 AI 生成）
- 数据库表 `generated_images` 新增 `marketing_copy` 字段
- UI 在图片下方展示营销文案

**数据库更改**：
```sql
ALTER TABLE generated_images 
ADD COLUMN marketing_copy TEXT;
```

### 1.4 传递 PRD 数据到图片生成

**当前问题**：`MarketingImageGallery` 只接收 `prdSummary`，缺少详细场景信息

**优化**：传递完整 `prdData` 到 `generate-image` Edge Function，包括：
- `usageScenarios`：使用场景
- `targetAudience`：目标用户
- `coreFeatures`：核心功能
- `designStyle`：设计风格

---

## 二、视频生成优化

### 2.1 传递 PRD 场景到视频生成

**当前状态**：`VideoGenerationSection` 接收 `usageScenarios`，但需要更完整的场景描述

**优化**：
- 从 `prdData` 中提取使用场景 (`usageScenario`) 和其他相关设定
- 将场景信息融入视频生成 prompt

**修改文件**：
- `src/components/VisualGenerationPhase.tsx`：传递完整场景数据
- `src/components/VideoGenerationSection.tsx`：使用场景数据构建 prompt
- `supabase/functions/generate-video/index.ts`：接收并应用 PRD 数据

### 2.2 正确显示生成的视频

**当前问题**：
1. Edge Function 目前是模拟实现，没有实际生成视频
2. 视频状态停留在 `pending` 无法正确显示

**解决方案**：
1. 使用 Lovable AI Gateway 的视频生成能力（如果支持）
2. 如果暂不支持，则：
   - 显示清晰的状态提示
   - 完善 UI 以正确处理各种状态
   - 当视频 URL 存在时正确渲染 `<video>` 元素

**UI 优化**：
- 视频预览区域放大
- 添加视频播放控件
- 显示生成进度和状态

---

## 三、技术实现细节

### 3.1 MarketingImageGallery 改造

```tsx
// 新的 props 接口
interface MarketingImageGalleryProps {
  // ...现有 props
  prdData?: {
    usageScenario?: string;
    targetAudience?: string;
    coreFeatures?: string[];
    designStyle?: string;
    selectedDirection?: string;
  };
}

// 逐张生成逻辑
const generateMarketingImages = async () => {
  for (const type of selectedTypes) {
    const response = await fetch(...);
    const data = await response.json();
    
    // 立即保存并更新 UI
    const { data: savedImage } = await supabase
      .from("generated_images")
      .insert({...})
      .select()
      .single();
    
    // 每张图片完成后立即更新
    onImagesChange((prev) => [...prev, savedImage]);
  }
};
```

### 3.2 图片卡片新布局（含营销文案）

```text
┌─────────────────────────────────────────────┐
│  [营销图片 - 更大尺寸 aspect-[16/10]]        │
│                                             │
│                                             │
├─────────────────────────────────────────────┤
│  类型标签: 场景图                            │
│                                             │
│  营销文案:                                   │
│  "在户外探险中，xxx产品为您提供可靠保障..."    │
│                                             │
│  [重新生成] [下载] [删除]                    │
└─────────────────────────────────────────────┘
```

### 3.3 Edge Function 增强

**generate-image/index.ts**：
```typescript
// 新增参数
const { 
  prompt, 
  projectId, 
  imageType, 
  phase,
  parentImageId,
  parentImageUrl,
  prdData  // 新增：完整 PRD 数据
} = await req.json();

// 生成营销文案
const marketingCopy = await generateMarketingCopy(imageType, prdData);

// 返回结果包含文案
return { imageUrl, description, prompt, imageType, phase, marketingCopy };
```

### 3.4 VideoGenerationSection 优化

**接收完整 PRD 数据**：
```tsx
interface VideoGenerationSectionProps {
  // ...现有 props
  prdData?: {
    usageScenario?: string;
    usageScenarios?: string[];
    targetAudience?: string;
    coreFeatures?: string[];
    designStyle?: string;
  };
}
```

**UI 改进**：
- 视频预览区域从 `w-40` 放大到 `w-full max-w-md`
- 添加 `<video>` 控件的正确样式
- 处理视频加载失败情况

---

## 四、数据库修改

```sql
-- 为营销图片添加文案字段
ALTER TABLE generated_images 
ADD COLUMN IF NOT EXISTS marketing_copy TEXT;
```

---

## 五、修改文件清单

| 文件 | 操作 | 修改内容 |
|------|------|----------|
| `src/components/MarketingImageGallery.tsx` | 修改 | 逐张显示、放大图片、显示营销文案 |
| `src/components/VideoGenerationSection.tsx` | 修改 | 接收完整 PRD 数据、优化视频显示 |
| `src/components/VisualGenerationPhase.tsx` | 修改 | 传递完整 prdData 到子组件 |
| `supabase/functions/generate-image/index.ts` | 修改 | 接收 PRD 数据、生成营销文案 |
| `supabase/functions/generate-video/index.ts` | 修改 | 接收 PRD 场景数据用于视频生成 |
| 数据库迁移 | 新增 | 添加 `marketing_copy` 字段 |

---

## 六、用户体验流程

```text
1. 用户进入产品设计阶段
2. 选择要生成的营销图片类型
3. 点击"批量生成"按钮
4. 每张图片生成完成后：
   - 立即显示在界面上（无需等待全部完成）
   - 显示更大的图片
   - 图片下方显示 AI 生成的营销文案
5. 视频生成：
   - 场景选择基于 PRD 中定义的使用场景
   - 生成过程显示进度
   - 完成后正确播放视频
```

---

## 七、技术注意事项

1. **并发控制**：图片生成改为串行处理，确保逐张显示的顺序
2. **状态管理**：使用回调函数更新父组件状态，确保 UI 同步
3. **错误处理**：单张图片失败不影响其他图片生成
4. **视频 API 限制**：Lovable AI Gateway 目前可能不支持视频生成，需要优雅降级处理
