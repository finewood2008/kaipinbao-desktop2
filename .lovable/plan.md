
# 产品定义阶段重构计划

## 目标概述

移除独立的"产品PRD文档"页面，将产品定义集中在对话流程中完成。左侧边栏展示6个核心必填字段（带必填图标），支持手动编辑。当所有字段完成后，AI提示进入产品设计阶段。

---

## 一、移除"产品PRD文档"子阶段

### 当前结构
```
产品定义阶段
├── AI产品经理（对话）
└── 产品PRD文档（独立页面）← 移除
```

### 新结构
```
产品定义阶段
└── AI产品经理对话 + 可编辑侧边栏
```

### 修改文件
- `src/components/PrdPhase.tsx`
  - 移除 `subPhases` 数组和切换逻辑
  - 移除 `PrdDocumentPanel` 导入和渲染
  - 简化为只渲染 `AiProductManagerPanel`
  - 移除 `showTransition` 和相关逻辑

---

## 二、增强左侧边栏（PrdExtractionSidebar）

### UI 设计

```
┌────────────────────────────────────┐
│  对话阶段  [探索方向]               │
├────────────────────────────────────┤
│  产品名称（如有）                   │
├────────────────────────────────────┤
│  产品定义  [3/6 必填项]             │
│  ▓▓▓▓▓▓░░░░░░ 50%                 │
├────────────────────────────────────┤
│  ┌──────────────────────────────┐  │
│  │ ⭐ 产品方向 * [必填]          │  │
│  │ 智能便携方向                  │  │
│  │                      [编辑]  │  │
│  └──────────────────────────────┘  │
│                                    │
│  ┌──────────────────────────────┐  │
│  │ 📍 使用场景 * [必填]          │  │
│  │ 户外露营场景                  │  │
│  │                      [编辑]  │  │
│  └──────────────────────────────┘  │
│                                    │
│  ... 其他4个必填字段 ...            │
├────────────────────────────────────┤
│  ✅ 所有必填项已完成               │
│  [进入产品设计阶段 →]              │
└────────────────────────────────────┘
```

### 6个核心必填字段

| 序号 | 字段 Key | 字段名称 | 图标 |
|------|----------|----------|------|
| 1 | selectedDirection | 产品方向 | Lightbulb |
| 2 | usageScenario | 使用场景 | MapPin |
| 3 | targetAudience | 目标用户 | Users |
| 4 | designStyle | 外观风格 | Palette |
| 5 | coreFeatures | 核心功能 | Zap |
| 6 | pricingRange | 定价策略 | DollarSign |

### 新增功能

1. **必填标识**：每个字段卡片右上角显示红色星号 `*` 和 `[必填]` 徽章
2. **手动编辑**：点击"编辑"按钮弹出编辑模态框或内联编辑
3. **完成状态**：所有字段完成后显示"进入产品设计"按钮

### 修改文件
- `src/components/PrdExtractionSidebar.tsx`
  - 添加必填标识图标
  - 添加编辑功能（模态框或内联）
  - 添加"进入产品设计"按钮
  - 添加 `onEdit` 和 `onProceedToDesign` 回调

---

## 三、更新 AI 对话逻辑

### 流程变化

```
用户开始对话
    ↓
AI 引导填写6个必填字段
    ↓
检测所有字段完成
    ↓
AI 消息包含 [DESIGN_READY] 信号
并提示："所有产品定义已完成！是否进入产品设计阶段？"
    ↓
├── 用户选择"进入产品设计" → 切换阶段
└── 用户选择"继续对话" → AI 在后续回复中再次询问
```

### 修改文件

1. `supabase/functions/chat/index.ts`
   - 添加检测6个必填字段是否完成的逻辑
   - 当所有字段完成时，在回复末尾添加 `[DESIGN_READY]` 信号
   - 如果用户继续对话，后续回复持续询问

2. `src/components/PrdPhase.tsx`
   - 检测 `[DESIGN_READY]` 信号（替代 `[PRD_READY]`）
   - 显示"进入产品设计"提示卡片
   - 处理用户选择

3. `src/components/PrdCompletionCard.tsx`
   - 更新文案："PRD 完成" → "产品定义完成"
   - 按钮："查看 PRD 文档" → "进入产品设计阶段"

---

## 四、数据传递到产品设计阶段

### 传递内容

当用户进入产品设计阶段时，需要传递：

1. **PRD 数据**（prd_data）
   - 6个核心字段
   - 其他已收集的详细信息

2. **竞品参考图片**（competitor_products）
   - main_image
   - product_images 数组

3. **对话摘要**（可选）
   - 关键决策点总结

### 数据流

```
PrdPhase (current_stage=2)
    │
    │ 用户点击"进入产品设计"
    │
    ├─→ 更新 project.current_stage = 3
    │
    └─→ VisualGenerationPhase
            │
            ├─→ 读取 project.prd_data
            │
            └─→ 读取 competitor_products（含图片）
                 传递给图片生成 prompt
```

### 修改文件

1. `src/pages/Project.tsx`
   - 在 `handlePrdPhaseComplete` 中传递完整数据
   - 确保 `VisualGenerationPhase` 接收 prd_data 和竞品图片

2. `src/components/VisualGenerationPhase.tsx`
   - 扩展 props 接收完整 PRD 数据
   - 将数据传递给 `ProductDesignGallery`

3. `src/components/ProductDesignGallery.tsx`
   - 接收竞品图片列表
   - 在生成 prompt 时引用竞品风格

---

## 五、技术实现细节

### 1. PrdExtractionSidebar 编辑功能

```tsx
interface PrdExtractionSidebarProps {
  prdData: PrdData | null;
  competitorProducts?: CompetitorProduct[];
  className?: string;
  isEditable?: boolean;  // 新增：是否可编辑
  onFieldEdit?: (field: string, value: any) => void;  // 新增：编辑回调
  onProceedToDesign?: () => void;  // 新增：进入设计阶段
}
```

### 2. 必填字段检测

```tsx
const requiredFields = [
  'selectedDirection',
  'usageScenario', 
  'targetAudience',
  'designStyle',
  'coreFeatures',
  'pricingRange'
];

const isAllRequiredFilled = requiredFields.every(field => {
  if (field === 'coreFeatures') {
    return prdData?.coreFeatures && prdData.coreFeatures.length > 0;
  }
  return !!prdData?.[field];
});
```

### 3. AI Prompt 更新（chat Edge Function）

在系统提示中添加：

```
## 完成检测

当用户通过对话确认了以下6个必填字段后，你的回复必须：
1. 在末尾添加 [DESIGN_READY] 标记
2. 询问用户是否进入产品设计阶段
3. 提供选项：[进入产品设计] | [我想继续完善]

如果用户选择"继续完善"，在之后的每次回复末尾都要询问是否进入产品设计。
```

---

## 修改文件清单

| 文件 | 操作 | 修改内容 |
|------|------|----------|
| `src/components/PrdPhase.tsx` | 修改 | 移除子阶段切换，简化为单一对话界面 |
| `src/components/PrdExtractionSidebar.tsx` | 修改 | 添加必填图标、编辑功能、进入设计按钮 |
| `src/components/PrdCompletionCard.tsx` | 修改 | 更新文案和按钮行为 |
| `src/components/AiProductManagerPanel.tsx` | 修改 | 支持编辑回调和完成状态 |
| `supabase/functions/chat/index.ts` | 修改 | 添加完成检测和 DESIGN_READY 信号 |
| `src/pages/Project.tsx` | 修改 | 传递竞品图片到产品设计阶段 |
| `src/components/VisualGenerationPhase.tsx` | 修改 | 接收完整 PRD 和竞品图片 |
| `src/components/ProductDesignGallery.tsx` | 修改 | 使用竞品图片生成 prompt |

---

## 用户体验流程

```
1. 用户进入产品定义阶段
2. AI 开始对话，引导用户确定产品方向
3. 左侧边栏实时显示已收集的信息（带必填标识）
4. 用户可随时手动编辑任何字段
5. 当6个必填字段全部完成：
   - 侧边栏显示"进入产品设计"按钮
   - AI 在对话中提示可以进入下一阶段
6. 用户点击"进入产品设计"：
   - 系统保存所有 PRD 数据
   - 传递竞品图片到设计阶段
   - 切换到产品设计界面
```
