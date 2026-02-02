
# AI 产品经理对话模块重构方案

## 问题诊断

通过代码审查，发现当前模块存在以下问题：

1. **ScrollArea 高度继承链断裂**：虽然已多次尝试添加 `min-h-0`，但整个布局层级过于复杂，Radix ScrollArea 仍无法正确计算高度
2. **思考进度条存在但不稳定**：`isSending && !isStreaming` 条件下的进度组件渲染正常，但由于布局问题可能被挤出可视区
3. **模型需升级**：当前使用 `gemini-2.5-flash`，需改为 `google/gemini-3-pro-preview`（主）+ 回退机制

---

## 重构策略

采用"**删除重写**"策略，彻底重建 `AiProductManagerPanel` 组件，使用更简洁、可靠的布局方案。

---

## 技术方案

### 1. 布局方案（核心）

采用 **CSS Grid + absolute positioning** 替代复杂的 Flexbox 嵌套：

```text
+--------------------------------------------------+
|  AiProductManagerPanel (grid cols: 280px 1fr)    |
|  ┌─────────────────┬────────────────────────────┐|
|  │ Left Sidebar    │ Right Chat Area            ││
|  │ (fixed width)   │ (flex-1, relative)         ││
|  │ ScrollArea      │ ┌────────────────────────┐ ││
|  │                 │ │ Header (fixed height)  │ ││
|  │                 │ ├────────────────────────┤ ││
|  │                 │ │ Messages Container     │ ││
|  │                 │ │ (absolute inset)       │ ││
|  │                 │ │ ┌──────────────────┐   │ ││
|  │                 │ │ │ ScrollArea       │   │ ││
|  │                 │ │ │ (h-full)         │   │ ││
|  │                 │ │ └──────────────────┘   │ ││
|  │                 │ ├────────────────────────┤ ││
|  │                 │ │ Input (fixed height)  │ ││
|  └─────────────────┴────────────────────────────┘|
+--------------------------------------------------+
```

关键技术点：
- 外层使用 `display: grid; grid-template-columns: 280px 1fr;`
- 右侧聊天区使用 `position: relative` + 内部 `position: absolute` 容器
- 消息容器使用 `absolute inset-x-0 top-[header] bottom-[input]`
- 这样 ScrollArea 可以获得明确的像素高度，滚动必定生效

### 2. AI 思考进度条

提取为独立组件 `AiThinkingIndicator`：

```text
┌──────────────────────────────────────────────────┐
│  💭 AI 产品经理正在思考...                        │
│  ┌──────────────────────────────────────────────┐│
│  │ ████████████████░░░░░░░░░░░░ 45%            ││
│  │ [分析数据 ✓] → [整合洞察 ●] → [生成提案 ○]   ││
│  └──────────────────────────────────────────────┘│
│  预计等待 10-15 秒                               │
└──────────────────────────────────────────────────┘
```

特点：
- 3 步骤可视化（分析数据 → 整合洞察 → 生成提案）
- 步骤之间有流畅的过渡动画
- 主进度条带发光脉冲效果
- 每个步骤有独立的小进度条

### 3. 模型升级（chat Edge Function）

**策略：主用 Lovable AI Gemini 3 Pro + 自动回退**

```text
1. 首选：调用 Lovable AI Gateway
   - 模型：google/gemini-3-pro-preview
   - API：https://ai.gateway.lovable.dev/v1/chat/completions
   - 密钥：LOVABLE_API_KEY（自动提供）

2. 回退：调用 Google Gemini 直连
   - 模型：gemini-2.5-flash
   - API：https://generativelanguage.googleapis.com/v1beta/models/
   - 密钥：GOOGLE_API_KEY（用户已配置）

3. 触发回退条件：
   - 429 Too Many Requests（速率限制）
   - 402 Payment Required（额度不足）
   - 5xx 服务器错误
```

前端调用方式保持不变（OpenAI 兼容 SSE 格式）。

---

## 文件变更清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `src/components/AiProductManagerPanel.tsx` | **重写** | 全新布局 + 滚动方案 |
| `src/components/AiThinkingIndicator.tsx` | **新建** | 独立的思考进度组件 |
| `supabase/functions/chat/index.ts` | **修改** | Gemini 3 Pro 主模型 + 回退逻辑 |

---

## 详细实现

### AiProductManagerPanel.tsx（重写）

```text
组件结构：
1. 外层 Grid 容器
   - grid-template-columns: 280px 1fr
   - h-full overflow-hidden

2. 左侧边栏（保持现有 PrdExtractionSidebar）
   - flex-shrink-0
   - 内部自带 ScrollArea

3. 右侧聊天区
   - flex flex-col min-h-0
   - Header: 56px 固定高度
   - Messages: relative flex-1 min-h-0
     - absolute inset-0 容器
     - ScrollArea h-full
   - Input: 80px 固定高度

4. 消息列表
   - 空状态
   - 消息渲染
   - AI 思考指示器
   - 滚动锚点

5. 滚动控制
   - IntersectionObserver 检测底部
   - "回到底部" 浮动按钮
```

### AiThinkingIndicator.tsx（新建）

```text
Props:
  - currentStep: 0 | 1 | 2（当前步骤）
  - progress: number（0-100，模拟进度）

内部状态：
  - 使用 useEffect 模拟步骤推进
  - 0-5s: Step 1 (分析数据)
  - 5-10s: Step 2 (整合洞察)
  - 10s+: Step 3 (生成提案)

UI 元素：
  - 头部：图标 + 标题 + 脉冲动画
  - 主进度条：渐变色 + 发光效果
  - 步骤指示器：3 个卡片，当前步骤高亮
  - 预计时间提示
```

### chat/index.ts 修改

```text
修改点：
1. 新增 callLovableAI() 函数
   - 调用 ai.gateway.lovable.dev
   - 模型：google/gemini-3-pro-preview
   - 返回 OpenAI 兼容 SSE 流

2. 修改主函数逻辑
   - 首先尝试 Lovable AI
   - 捕获 429/402/5xx 错误
   - 错误时回退到现有 Gemini 直连

3. 保留现有功能
   - 系统提示词不变
   - PRD 数据提取逻辑不变
   - 响应格式转换不变
```

---

## 预期效果

1. ✅ 对话区域可靠滚动，无论消息多少都不会撑破布局
2. ✅ 左侧 PRD 信息收集栏固定可见
3. ✅ AI 思考时显示清晰的 3 步骤进度条
4. ✅ 使用 Gemini 3 Pro 作为主模型，提升回复质量
5. ✅ 自动回退机制确保高可用性

---

## 测试要点

1. 发送多条消息，验证滚动框正常工作
2. 观察 AI 思考时的进度条动画是否流畅
3. 检查网络请求确认使用了正确的模型
4. 模拟高负载场景验证回退机制
