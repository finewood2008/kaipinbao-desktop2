
# 产品造型更换时重置营销素材的实现方案

## 需求理解

当用户在产品设计阶段**更换选定的产品造型**时，所有基于该造型生成的营销图片和视频都需要被重置并重新加载，因为这些素材是配套生成的。

## 当前架构分析

| 组件 | 职责 |
|------|------|
| `VisualGenerationPhase.tsx` | 管理两个阶段的切换和状态 |
| `ProductDesignGallery.tsx` | 产品造型的生成和选择 |
| `MarketingImageGallery.tsx` | 营销图片的生成和展示 |
| `VideoGenerationSection.tsx` | 视频的生成和展示 |
| `Project.tsx` | 顶层状态管理，持有 `productImages`、`marketingImages`、`videos` |

**数据关联**：
- `generated_images` 表有 `parent_image_id` 字段，关联父产品图片
- `generated_videos` 表也有 `parent_image_id` 字段

## 实现方案

### 1. 修改 VisualGenerationPhase.tsx

当用户选择新的产品造型时，需要检测是否是**更换造型**（而非首次选择），如果是更换：

- 清除前端状态中与旧造型关联的营销图片和视频
- 调用父组件提供的清除回调
- 可选：从数据库删除旧素材

```text
┌─────────────────────────────────────────────────────────────┐
│                    产品造型更换流程                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   用户点击"选择此造型"                                       │
│            │                                                 │
│            ▼                                                 │
│   ┌─────────────────────┐                                   │
│   │ 检测是否已有选定造型  │                                   │
│   └─────────────────────┘                                   │
│            │                                                 │
│     ┌──────┴──────┐                                         │
│     │             │                                         │
│     ▼             ▼                                         │
│  [首次选择]    [更换造型]                                    │
│     │             │                                         │
│     │             ▼                                         │
│     │    ┌────────────────────┐                             │
│     │    │ 删除旧的营销图片    │                             │
│     │    │ 删除旧的视频        │                             │
│     │    │ 清空前端状态        │                             │
│     │    └────────────────────┘                             │
│     │             │                                         │
│     └──────┬──────┘                                         │
│            ▼                                                 │
│   ┌─────────────────────┐                                   │
│   │ 设置新的选定造型     │                                   │
│   │ 显示阶段过渡提示     │                                   │
│   └─────────────────────┘                                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 2. 修改 ProductDesignGallery.tsx

增强 `handleSelectImage` 函数，添加回调通知父组件需要重置素材：

- 新增 `onDesignChange` prop，当选择新造型时调用
- 传递旧的选定图片 ID，以便父组件知道需要清除哪些关联素材

### 3. 修改 Project.tsx

在顶层添加重置逻辑：

- 新增 `handleProductDesignChange` 函数
- 当收到造型更换通知时，删除数据库中关联的营销图片和视频
- 清空前端状态

## 详细技术实现

### 步骤一：ProductDesignGallery 增加回调

```tsx
// ProductDesignGallery.tsx
interface ProductDesignGalleryProps {
  // ...existing props
  onDesignChange?: (oldImageId: string | null, newImageId: string) => void;
}

const handleSelectImage = async (image: GeneratedImage) => {
  // 找到当前已选择的造型
  const currentSelected = images.find(img => img.is_selected);
  
  // 如果已有选择且不是同一个，通知父组件
  if (currentSelected && currentSelected.id !== image.id) {
    onDesignChange?.(currentSelected.id, image.id);
  }
  
  // ...existing selection logic
};
```

### 步骤二：VisualGenerationPhase 处理造型更换

```tsx
// VisualGenerationPhase.tsx
const handleDesignChange = async (oldImageId: string | null, newImageId: string) => {
  if (oldImageId) {
    // 删除数据库中与旧造型关联的营销图片
    await supabase
      .from("generated_images")
      .delete()
      .eq("parent_image_id", oldImageId);
    
    // 删除数据库中与旧造型关联的视频
    await supabase
      .from("generated_videos")
      .delete()
      .eq("parent_image_id", oldImageId);
    
    // 清空前端状态
    onMarketingImagesChange([]);
    onVideosChange([]);
    
    // 重置图片类型选择
    setSelectedImageTypes([]);
    
    toast.info("已清除旧造型的营销素材，请重新生成");
  }
};
```

### 步骤三：返回 Phase 1 时的处理

当用户在 Phase 2 点击"更换造型"返回 Phase 1 时，如果选择了新造型，也需要触发重置逻辑。

## 用户体验优化

1. **确认对话框**：在用户更换造型时，显示确认提示："更换产品造型将清除已生成的 X 张营销图片和 Y 个视频，确定继续？"

2. **清除动画**：使用 Framer Motion 添加平滑的淡出动画

3. **Toast 通知**：通知用户素材已重置

## 涉及文件修改

| 文件 | 修改内容 |
|------|----------|
| `src/components/ProductDesignGallery.tsx` | 添加 `onDesignChange` prop 和更换检测逻辑 |
| `src/components/VisualGenerationPhase.tsx` | 添加 `handleDesignChange` 处理函数，传递给子组件 |
| `src/pages/Project.tsx` | 无需修改，状态通过现有回调更新 |

## 边界情况处理

1. **首次选择造型**：不触发重置，直接进入 Phase 2
2. **选择相同造型**：不触发重置
3. **删除操作失败**：捕获错误并显示提示，前端状态仍然清空
4. **用户取消更换**：在确认对话框中取消，不做任何操作
