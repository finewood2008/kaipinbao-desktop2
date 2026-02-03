
# 营销素材生成模块重构计划

## 问题诊断

通过代码分析，我发现以下核心问题：

### 1. 状态管理缺陷
- `MarketingImageGallery` 在生成新图片时使用 `onImagesChange([...images, savedImage])`，但 `images` 引用的是组件接收 props 时的值，而非最新状态
- 多张图片依次生成时，前面生成的图片会被后续的 `onImagesChange` 覆盖

### 2. 导航时数据丢失
- 从"营销素材"切换到"产品造型"再返回时，`VisualGenerationPhase` 的 `useEffect` 会重新评估状态
- `currentPhase` 状态在组件内部管理，切换 Tab 时不会保持

### 3. 并发生成竞态条件
- 逐个生成图片时，每次 `onImagesChange` 都使用闭包捕获的旧 `images` 数组
- 导致只有最后生成的图片被保留

---

## 重构方案

### 一、MarketingImageGallery.tsx - 修复状态更新

**问题**：循环生成时 `images` 闭包不更新

**解决**：使用回调函数式更新，确保每次都基于最新状态

```typescript
// 修改前：
onImagesChange([...images, savedImage as GeneratedImage]);

// 修改后：使用函数式回调
const updateWithNewImage = (newImage: GeneratedImage) => {
  // 获取当前最新的 images 状态
  onImagesChange(prevImages => [...prevImages, newImage]);
};
```

由于 `onImagesChange` 是 props 传入的 setter，我们需要在父组件修改数据流。

### 二、Project.tsx - 增强数据管理

**改动**：将 `setMarketingImages` 改为支持函数式更新的包装器

```typescript
// 新增包装函数
const handleMarketingImagesChange = (
  imagesOrUpdater: GeneratedImage[] | ((prev: GeneratedImage[]) => GeneratedImage[])
) => {
  if (typeof imagesOrUpdater === 'function') {
    setMarketingImages(imagesOrUpdater);
  } else {
    setMarketingImages(imagesOrUpdater);
  }
};
```

### 三、VisualGenerationPhase.tsx - 导航状态持久化

**问题**：`currentPhase` 是组件内部状态，Tab 切换后丢失

**解决**：

1. 将 `currentPhase` 的初始值基于已有数据推断
2. 增加对营销图片存在性的检测逻辑

```typescript
// 改进初始化逻辑
const [currentPhase, setCurrentPhase] = useState<1 | 2>(() => {
  // 如果有已选择的产品图且有营销图片，直接进入 phase 2
  const hasSelectedProduct = productImages.some(img => img.is_selected);
  const hasMarketingImages = marketingImages.length > 0;
  return (hasSelectedProduct && hasMarketingImages) ? 2 : 1;
});
```

### 四、修复图片生成累积逻辑

**核心改动**：在 `generateMarketingImages` 循环中使用 `useRef` 追踪实时状态

```typescript
// 新增 ref 追踪最新图片
const latestImagesRef = useRef<GeneratedImage[]>(images);

useEffect(() => {
  latestImagesRef.current = images;
}, [images]);

// 生成时使用 ref
const generateMarketingImages = async () => {
  // ...
  for (const type of selectedTypes) {
    // ...
    if (savedImage) {
      const updatedImages = [...latestImagesRef.current, savedImage];
      latestImagesRef.current = updatedImages;
      onImagesChange(updatedImages);
    }
  }
};
```

---

## 涉及文件

| 文件 | 改动类型 | 说明 |
|------|---------|------|
| `src/components/MarketingImageGallery.tsx` | 重构 | 修复状态累积逻辑，添加 useRef 追踪 |
| `src/components/VisualGenerationPhase.tsx` | 优化 | 改进 phase 初始化和导航逻辑 |
| `src/pages/Project.tsx` | 微调 | 增强 images 状态管理 |

---

## 技术细节

### MarketingImageGallery.tsx 完整改动

```typescript
// 1. 添加 useRef 追踪
import { useState, useRef, useEffect } from "react";

// 2. 组件内部
const imagesRef = useRef<GeneratedImage[]>(images);

useEffect(() => {
  imagesRef.current = images;
}, [images]);

// 3. generateMarketingImages 函数内
const generateMarketingImages = async () => {
  // ... 前置检查 ...
  
  const newlyGeneratedImages: GeneratedImage[] = [];
  
  for (const type of selectedTypes) {
    // ... 生成逻辑 ...
    
    if (savedImage) {
      newlyGeneratedImages.push(savedImage as GeneratedImage);
      // 实时更新：基于 ref 获取最新状态
      const updatedImages = [...imagesRef.current, savedImage as GeneratedImage];
      imagesRef.current = updatedImages;
      onImagesChange(updatedImages);
    }
  }
};

// 4. regenerateImage 函数同样使用 ref
const regenerateImage = async (image: GeneratedImage) => {
  // ... 生成逻辑 ...
  
  if (savedImage) {
    const updatedImages = [...imagesRef.current, savedImage as GeneratedImage];
    imagesRef.current = updatedImages;
    onImagesChange(updatedImages);
  }
};
```

### VisualGenerationPhase.tsx 改动

```typescript
// 1. 改进 phase 初始化
const [currentPhase, setCurrentPhase] = useState<1 | 2>(() => {
  const hasSelectedProduct = productImages.some(img => img.is_selected);
  return hasSelectedProduct ? 2 : 1;
});

// 2. 改进 useEffect - 仅在首次有选中图片时切换
useEffect(() => {
  const selected = productImages.find(img => img.is_selected);
  if (selected) {
    setSelectedProductImage(selected);
    // 仅当之前未进入 phase 2 且现在有选中图片时自动切换
    if (currentPhase === 1 && marketingImages.length > 0) {
      setCurrentPhase(2);
    }
  }
}, [productImages]);

// 3. 返回 phase 1 后再返回 phase 2 时保持数据
const handleBackToPhase1 = () => {
  setCurrentPhase(1);
  // 不清除 selectedProductImage，保持选中状态
};
```

---

## 预期效果

1. **图片不再消失**：生成过程中每张图片实时累积显示
2. **导航后数据保持**：从产品造型返回营销素材时，已生成的图片完整保留
3. **Phase 状态正确**：有已选产品时自动进入 phase 2，无需重复确认
4. **并发生成稳定**：使用 ref 追踪最新状态，避免闭包陷阱

---

## 测试要点

1. 生成 3+ 张营销图片，验证全部显示
2. 切换到"产品造型"再返回，验证图片保留
3. 更换产品造型，验证旧营销图片被正确清除
4. 刷新页面后返回，验证从数据库正确加载
