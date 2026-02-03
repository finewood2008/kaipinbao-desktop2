
# 修复市场分析页面宽度问题

## 问题分析

从截图中可以看到，"市场分析"页面的内容区域显示为狭窄的移动端布局，而不是应有的桌面端全宽布局。

经过代码审查，发现问题出在组件嵌套链中缺少明确的宽度声明：

```text
TabsContent (flex容器)
    └── MarketResearchPhase (h-full flex flex-col) 
        └── Phase Content div (flex-1 min-h-0 overflow-hidden) ← 缺少 w-full
            └── motion.div (h-full min-h-0) ← 缺少 w-full  
                └── MarketAnalysisPhase (h-full overflow-y-auto) ← 缺少 w-full
```

在 Flexbox 布局中，子元素不会自动继承父容器的全宽，需要显式声明 `width: 100%`（Tailwind 的 `w-full`）。

## 解决方案

### 修改 1: MarketResearchPhase.tsx

在以下位置添加 `w-full` 类：

1. **Phase Content 容器** (第413行)
   - 原: `className="flex-1 min-h-0 overflow-hidden"`
   - 改: `className="flex-1 min-h-0 overflow-hidden w-full"`

2. **motion.div 包装器** (第416行和第433行)
   - 原: `className="h-full min-h-0"`
   - 改: `className="h-full min-h-0 w-full"`

### 修改 2: MarketAnalysisPhase.tsx

在根容器添加 `w-full`：

1. **根 motion.div** (第194行)
   - 原: `className="h-full overflow-y-auto"`
   - 改: `className="h-full w-full overflow-y-auto"`

## 技术细节

这是一个常见的 Flexbox 布局问题：

- 当使用 `display: flex` 时，子元素的宽度默认由其内容决定
- `flex: 1`（`flex-1`）只控制主轴方向的伸缩，不自动设置交叉轴的宽度
- 对于水平排列的 flex 容器（默认），需要显式设置 `width: 100%` 确保子元素撑满宽度

修改后的布局链将确保从 `TabsContent` 到 `MarketAnalysisPhase` 的每一层都正确继承全宽。
