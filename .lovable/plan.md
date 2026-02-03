# 产品定义文档独立展示与增强功能

## ✅ 已完成实现

本次升级已成功实现以下核心功能：

### 1. 独立悬浮文档窗口 ✅
- 创建了 `PrdDocumentModal.tsx` 组件
- 完成所有决策后自动弹出产品定义文档窗口
- 分区块展示：产品名称、使用场景、目标用户、外观风格、核心功能、定价策略

### 2. 文档可编辑与导出 ✅
- 每个区块支持点击编辑
- 支持导出为 Markdown、JSON 格式
- 支持打印/PDF 导出

### 3. 工作台集成 ✅
- 项目卡片新增"产品文档"按钮（仅完整PRD项目显示）
- Dashboard 集成文档模态窗口（只读模式）

### 4. 确认后进入设计 ✅
- 用户必须通过文档窗口确认后才能进入产品设计阶段
- 确认时自动同步产品名称到项目名称

### 5. 竞品参考图片手动上传 ✅
- 参考图片上传功能移至侧边栏
- 支持预览和删除已上传图片

### 6. 移除对话框图片上传 ✅
- 已从 AI 对话输入框移除图片上传按钮

### 7. 产品名称同步 ✅
- PRD 中的产品名称在确认时自动更新到项目名称

## 涉及修改的文件

| 文件路径 | 操作 |
|----------|------|
| `src/components/PrdDocumentModal.tsx` | 新建 |
| `src/components/PrdPhase.tsx` | 修改 |
| `src/components/PrdExtractionSidebar.tsx` | 修改 |
| `src/components/AiProductManagerPanel.tsx` | 修改 |
| `src/components/ProjectCard.tsx` | 修改 |
| `src/pages/Dashboard.tsx` | 修改 |
