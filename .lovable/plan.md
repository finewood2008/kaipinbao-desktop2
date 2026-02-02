
目标：让“AI 产品经理”对话区始终呈现为“内部可滚动的滚动框”，而不是把整个页面撑高；并保证左侧信息收集栏固定可见（不跟随对话滚动）。

---

## 现状定位（基于代码检查）
当前 `AiProductManagerPanel.tsx` 内部已经用了：
- 外层：`flex-1 flex h-full overflow-hidden`
- 对话区：`<div className="flex-1 min-h-0 relative">` + `<ScrollArea className="h-full">`

这套写法在“父容器高度被正确约束”的前提下是可滚动的。

问题点通常不在这个组件内部，而在它的父级链路上：只要任意一层父容器缺少 `min-h-0`（或没有形成可计算高度），`ScrollArea` 就会被内容撑高，导致“看起来没有滚动框”。

在本项目中，`AiProductManagerPanel` 位于：
`Project.tsx (TabsContent chat)` → `PrdPhase.tsx (flex column)` → `AiProductManagerPanel.tsx`

目前看到：
- `Project.tsx` 的 `Tabs`/`TabsContent` 虽然有 `flex-1` 和 `overflow-hidden`，但缺少关键的 `min-h-0`（Radix TabsContent 默认可能会让子元素高度无法收敛）
- `PrdPhase.tsx` 顶层容器 `h-full overflow-hidden`，但中间“Phase Content”容器是 `flex-1 overflow-hidden mt-4`，也缺少 `min-h-0`，会导致内部滚动失效（常见的 flex 子项最小高度问题）

---

## 实施方案（以“高度约束链路”为核心）
### 1) 修复高度约束链路：在父级补齐 `min-h-0`
修改文件：`src/pages/Project.tsx`
- 给 Tabs 容器补齐 `min-h-0`
  - 现有：`className="flex-1 flex flex-col"`
  - 计划：改为 `className="flex-1 flex flex-col min-h-0"`
- 给 `TabsContent value="chat"` 补齐 `min-h-0`
  - 现有：`className="flex-1 flex overflow-hidden m-0"`
  - 计划：改为 `className="flex-1 flex overflow-hidden min-h-0 m-0"`

预期效果：
- `PrdPhase` 能拿到一个“可计算且被约束的高度”，内部滚动才会触发。

---

### 2) PrdPhase 内部补齐 `min-h-0` 并消除“h-full 依赖”
修改文件：`src/components/PrdPhase.tsx`
- 顶层容器保持 flex column，但确保可收敛：
  - 现有：`className="flex-1 flex flex-col h-full overflow-hidden"`
  - 计划：改为 `className="flex-1 flex flex-col min-h-0 overflow-hidden"`
- Phase Content 容器补齐 `min-h-0`
  - 现有：`className="flex-1 overflow-hidden mt-4"`
  - 计划：改为 `className="flex-1 min-h-0 overflow-hidden mt-4"`
- 各 phase 的 `motion.div className="h-full"` 改为更稳的写法（避免 h-full 依赖父级高度计算不稳定）：
  - 计划：改为 `className="flex-1 min-h-0"`（或 `className="h-full min-h-0"`，依据现有布局最少改动）

预期效果：
- Phase 3（AI 产品经理）永远不会把父级撑开。
- `AiProductManagerPanel` 的 ScrollArea “一定”出现内部滚动。

---

### 3) AiProductManagerPanel：把“滚动容器”写得更不依赖 h-full
修改文件：`src/components/AiProductManagerPanel.tsx`
虽然内部看起来接近正确，但为了更稳：
- 将 `<ScrollArea className="h-full">` 改为更典型的 flex 写法：
  - 计划：`className="flex-1 min-h-0"`（并确保它的父容器也是 `flex flex-col` 或者当前 `relative` 容器仍能给它高度）
- 同时确保右侧 Chat Area（header + content + input）这三段结构：
  - header：`flex-shrink-0`
  - messages：`flex-1 min-h-0`（已有）
  - input：`flex-shrink-0`（已有）

预期效果：
- 即使某些情况下 `h-full` 在不同浏览器/容器下高度继承不稳定，仍然能滚动。

---

## 验证方法（必须逐条验证）
1. 进入 `/project/:id` → PRD 阶段 → AI 产品经理对话页面
2. 人为制造长对话（至少 30+ 条消息，或让 AI 输出很长的 markdown）
3. 观察：
   - 页面整体不应该出现“整个页面变长”的趋势（主要滚动发生在对话框内部）
   - 对话区域出现独立滚动条/可滚动行为
   - 左侧信息收集栏始终固定在视窗内（不跟随对话上下移动）
4. 验证“回到底部”按钮：手动上滚后出现，点击能回到底部

---

## 可能的边界问题与处理
- Radix TabsContent/AnimatePresence 动画切换可能导致初次进入时高度尚未稳定：
  - 处理：必要时在进入 phase3 时触发一次 `scrollToBottom("auto")`（你目前已经有这套逻辑）
- 如果外层布局（Project 页面）某一层容器并非 `overflow-hidden` 而是 `overflow-auto`，会导致页面也滚动：
  - 处理：保持“内容区容器”只作为高度约束与裁剪，滚动只发生在对话 ScrollArea

---

## 涉及文件清单
- `src/pages/Project.tsx`（Tabs/TabsContent 增加 min-h-0，保证高度链路）
- `src/components/PrdPhase.tsx`（容器 min-h-0，phase wrapper 由 h-full 调整为 flex/min-h-0）
- `src/components/AiProductManagerPanel.tsx`（ScrollArea 用 flex-1/min-h-0 更稳地实现内部滚动）

---

## 交付结果
- AI 产品经理对话区稳定为“内部滚动框”
- 左侧信息收集栏固定可见
- 不再出现“对话始终无法正确显示滚动框/页面被撑高”的问题
