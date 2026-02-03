
# 产品定义文档独立展示与增强功能

## 概述

本次升级将实现以下核心功能：
1. **独立悬浮文档窗口**：完成所有决策后，生成的产品定义文档在独立悬浮窗口中展示
2. **文档可编辑与导出**：用户可自由修改文档内容，并支持多格式导出（Markdown、JSON、PDF）
3. **工作台集成**：文档可从项目卡片点击打开
4. **确认后进入设计**：用户必须确认文档后才能进入产品设计阶段
5. **竞品参考图片手动上传**：在侧边栏支持上传参考图片
6. **移除对话框图片上传**：取消 AI 对话输入框的图片上传功能
7. **产品名称同步**：PRD 中的产品名称自动更新到项目名称

## 一、新增 PRD 文档悬浮窗组件

### 1.1 创建 `PrdDocumentModal.tsx`

```text
src/components/PrdDocumentModal.tsx

功能：
- 全屏悬浮模态窗口展示完整 PRD 文档
- 分区块展示：产品名称、使用场景、目标用户、外观风格详情、核心功能详情、定价策略等
- 每个区块支持点击编辑
- 顶部工具栏：导出按钮（Markdown / JSON / PDF）、关闭按钮
- 底部操作栏：确认文档按钮（触发进入产品设计阶段）

结构：
┌─────────────────────────────────────────────────────────┐
│  📋 产品定义文档                    [导出 ▾] [×]       │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  🏷️ 产品名称                                [编辑]      │
│  ────────────────────                                    │
│  智能便携加热杯                                          │
│                                                          │
│  📍 使用场景                                 [编辑]      │
│  ────────────────────                                    │
│  户外露营、办公室、差旅途中                              │
│                                                          │
│  👥 目标用户                                 [编辑]      │
│  ────────────────────                                    │
│  25-40岁都市白领、户外爱好者                             │
│                                                          │
│  🎨 外观风格                                 [编辑]      │
│  ────────────────────                                    │
│  整体风格: 北欧极简                                      │
│  色彩基调: 冷色调银白系                                  │
│  表面质感: 哑光磨砂                                      │
│  造型语言: 圆润流线                                      │
│  材质偏好: 阳极氧化铝、食品级硅胶                        │
│                                                          │
│  ⚡ 核心功能                                 [编辑]      │
│  ────────────────────                                    │
│  ✓ 快速加热 [必备]                                      │
│    30秒内将水温提升至设定温度                            │
│    用户收益：无需等待，随时享用热水                      │
│                                                          │
│  ✓ 智能温控 [必备]                                      │
│    支持40-100℃自由调节                                  │
│    用户收益：不同饮品对应不同温度                        │
│                                                          │
│  💰 定价策略                                 [编辑]      │
│  ────────────────────                                    │
│  中高端定位：¥299-399                                    │
│                                                          │
├─────────────────────────────────────────────────────────┤
│           [继续完善]           [✓ 确认并进入产品设计]    │
└─────────────────────────────────────────────────────────┘
```

### 1.2 导出功能实现

```typescript
// 导出为 Markdown
const exportAsMarkdown = () => {
  const content = generateMarkdownContent(prdData);
  downloadFile(content, `${projectName}-PRD.md`, "text/markdown");
};

// 导出为 JSON
const exportAsJson = () => {
  const content = JSON.stringify(prdData, null, 2);
  downloadFile(content, `${projectName}-PRD.json`, "application/json");
};

// 导出为 PDF（使用浏览器打印功能）
const exportAsPdf = () => {
  window.print(); // 使用 @media print 样式控制打印内容
};
```

## 二、修改 PRD 阶段流程

### 2.1 修改 `PrdPhase.tsx`

**改动点**：
1. 添加状态 `showPrdDocument: boolean` 控制文档窗口显示
2. 当所有必填项完成时，触发显示文档窗口（而非直接进入设计阶段）
3. 传递 `onOpenPrdDocument` 给侧边栏，允许用户主动打开文档

```typescript
// 新增状态
const [showPrdDocument, setShowPrdDocument] = useState(false);

// 当所有必填项完成时
if (checkAllRequiredFilled(mergedPrdData)) {
  setTimeout(() => {
    setShowPrdDocument(true);  // 显示文档窗口
  }, 1000);
}

// 确认文档后进入设计阶段
const handleConfirmPrdDocument = async () => {
  // 同步产品名称到项目名称
  if (prdData?.productName) {
    await supabase
      .from("projects")
      .update({ name: prdData.productName })
      .eq("id", projectId);
  }
  
  // 更新阶段
  await handleProceedToDesign();
};
```

### 2.2 修改 `PrdExtractionSidebar.tsx`

**改动点**：
1. 添加"查看完整文档"按钮
2. 添加参考图片上传功能（从对话框移至此处）
3. 移除 `referenceImages` props，改为直接管理上传

```typescript
interface PrdExtractionSidebarProps {
  // 新增
  onOpenPrdDocument?: () => void;
  onImageUpload?: (file: File) => Promise<void>;
  isUploadingImage?: boolean;
}

// 在竞品参考区域下方添加上传按钮
<div className="mt-3">
  <label className="cursor-pointer">
    <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
    <Button variant="outline" size="sm" className="w-full" asChild>
      <span>
        <ImagePlus className="w-4 h-4 mr-2" />
        上传参考图片
      </span>
    </Button>
  </label>
</div>
```

### 2.3 修改 `AiProductManagerPanel.tsx`

**改动点**：移除图片上传功能

```typescript
// 移除以下 props
// onImageUpload?: (file: File) => Promise<void>;
// isUploadingImage?: boolean;

// 移除输入框旁的图片上传按钮
// 只保留文本输入和发送按钮
```

## 三、工作台集成

### 3.1 修改 `ProjectCard.tsx`

**改动点**：添加 PRD 文档查看按钮

```typescript
interface ProjectCardProps {
  // 新增
  hasPrdDocument?: boolean;
  onOpenPrdDocument?: () => void;
}

// 在项目卡片中添加文档入口
{hasPrdDocument && (
  <Button
    variant="outline"
    size="sm"
    className="h-8 text-xs"
    onClick={(e) => {
      e.stopPropagation();
      onOpenPrdDocument?.();
    }}
  >
    <FileText className="w-3 h-3 mr-1" />
    产品文档
  </Button>
)}
```

### 3.2 修改 `Dashboard.tsx`

**改动点**：
1. 从项目数据中提取 PRD 状态
2. 传递 `onOpenPrdDocument` 给 ProjectCard
3. 管理文档模态窗口状态

```typescript
const [selectedProjectPrd, setSelectedProjectPrd] = useState<{
  projectId: string;
  prdData: PrdData;
} | null>(null);

// 判断是否有完整 PRD 文档
const hasPrdDocument = (project: Project) => {
  const prdData = project.prd_data;
  return prdData && checkAllRequiredFilled(prdData);
};

// 渲染文档模态窗口
{selectedProjectPrd && (
  <PrdDocumentModal
    isOpen={true}
    prdData={selectedProjectPrd.prdData}
    projectId={selectedProjectPrd.projectId}
    onClose={() => setSelectedProjectPrd(null)}
    isReadOnly={true}  // 工作台只读模式
  />
)}
```

## 四、产品名称同步

### 4.1 在确认 PRD 时同步名称

```typescript
// PrdPhase.tsx - handleConfirmPrdDocument
const handleConfirmPrdDocument = async () => {
  // 1. 同步产品名称到项目名称
  if (prdData?.productName) {
    await supabase
      .from("projects")
      .update({ name: prdData.productName })
      .eq("id", projectId);
  }
  
  // 2. 进入产品设计阶段
  await handleProceedToDesign();
};
```

### 4.2 在 AI 对话中提取产品名称

chat 边际函数已支持提取 `productName`，无需修改。

## 五、涉及文件清单

| 文件路径 | 操作 | 说明 |
|----------|------|------|
| `src/components/PrdDocumentModal.tsx` | **新建** | 独立悬浮文档窗口组件 |
| `src/components/PrdPhase.tsx` | 修改 | 添加文档窗口控制逻辑 |
| `src/components/PrdExtractionSidebar.tsx` | 修改 | 添加参考图片上传、文档入口按钮 |
| `src/components/AiProductManagerPanel.tsx` | 修改 | 移除对话框图片上传功能 |
| `src/components/ProjectCard.tsx` | 修改 | 添加产品文档入口按钮 |
| `src/pages/Dashboard.tsx` | 修改 | 集成文档模态窗口 |

## 六、用户体验流程

### PRD 完成流程

```text
用户在产品定义阶段与 AI 对话
        ↓
完成所有 6 项必填内容
        ↓
系统自动弹出「产品定义文档」悬浮窗口
        ↓
用户审阅文档内容（可编辑任意区块）
        ↓
用户可导出文档（Markdown / JSON / PDF）
        ↓
用户点击「确认并进入产品设计」
        ↓
系统同步产品名称到项目名称
        ↓
进入产品设计阶段
```

### 工作台查看文档流程

```text
用户进入工作台
        ↓
项目卡片显示「产品文档」按钮（如有完整 PRD）
        ↓
点击按钮打开只读模式文档窗口
        ↓
用户可查看和导出文档
```

### 参考图片上传流程

```text
用户在产品定义阶段侧边栏
        ↓
点击「上传参考图片」按钮
        ↓
选择本地图片文件
        ↓
图片上传到 Supabase Storage
        ↓
图片缩略图显示在侧边栏
        ↓
进入产品设计阶段时，参考图片传入 AI 生成
```

## 七、技术细节

### 导出为 Markdown 格式示例

```markdown
# 智能便携加热杯 - 产品定义文档

## 📍 使用场景
户外露营、办公室、差旅途中

## 👥 目标用户
25-40岁都市白领、户外爱好者

## 🎨 外观风格

| 维度 | 描述 |
|------|------|
| 整体风格 | 北欧极简 |
| 色彩基调 | 冷色调银白系 |
| 表面质感 | 哑光磨砂 |
| 造型语言 | 圆润流线 |
| 材质偏好 | 阳极氧化铝、食品级硅胶 |

## ⚡ 核心功能

### 1. 快速加热 ⭐ 必备
- **描述**：30秒内将水温提升至设定温度
- **用户收益**：无需等待，随时享用热水
- **技术方案**：PTC加热片 + 热敏电阻实时温度反馈

### 2. 智能温控 ⭐ 必备
- **描述**：支持40-100℃自由调节
- **用户收益**：不同饮品对应不同温度
- **技术方案**：NTC温度传感器 + MCU闭环控制算法

## 💰 定价策略
中高端定位：¥299-399

---
*文档生成时间：2026-02-03*
```
