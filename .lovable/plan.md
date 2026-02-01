
# AI 产品经理对话修复计划

## 问题诊断

AI 产品经理对话无法工作，边缘函数日志显示：
```
Google AI Studio error: 404 models/gemini-2.5-pro-preview-06-05 is not found
```

**根本原因**：
- 当前代码直接调用 Google AI Studio API，使用的模型 `gemini-2.5-pro-preview-06-05` 已不可用
- 应该使用 Lovable AI Gateway，它已经预配置好且支持最新模型

---

## 解决方案

将 `chat` 边缘函数从直接调用 Google API 改为使用 **Lovable AI Gateway**，指定 **`google/gemini-3-pro-preview`** 模型（Google 最先进的下一代 LLM）。

---

## 具体修改

### 文件：`supabase/functions/chat/index.ts`

#### 1. 修改 API 调用方式

**当前（有问题）：**
```typescript
const GOOGLE_API_KEY = Deno.env.get("GOOGLE_API_KEY");

const response = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro-preview-06-05:streamGenerateContent?alt=sse&key=${GOOGLE_API_KEY}`,
  ...
);
```

**改为（使用 Lovable AI Gateway）：**
```typescript
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

const response = await fetch(
  "https://ai.gateway.lovable.dev/v1/chat/completions",
  {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-3-pro-preview",
      messages: [
        { role: "system", content: systemPromptWithStage },
        ...messages.map(m => ({ role: m.role, content: m.content }))
      ],
      stream: true,
      temperature: 0.85,
      max_tokens: 16384,
    }),
  }
);
```

#### 2. 简化响应流处理

由于 Lovable AI Gateway 已经返回 OpenAI 兼容格式，可以直接透传流而无需转换。

#### 3. 更新错误处理

添加 402（余额不足）和 429（频率限制）错误的处理和用户友好提示。

---

## 预期效果

| 修改前 | 修改后 |
|--------|--------|
| 直接调用 Google API，模型已不可用 | 使用 Lovable AI Gateway |
| 404 错误，对话无法启动 | 正常使用 Gemini 3 Pro 模型 |
| 需要手动管理 GOOGLE_API_KEY | 自动使用预配置的 LOVABLE_API_KEY |

---

## 技术细节

### 选用模型：`google/gemini-3-pro-preview`

这是 Google Gemini 家族的下一代顶级模型，具备：
- 强大的多模态理解能力
- 超长上下文窗口
- 最先进的推理能力
- 适合复杂产品分析和 PRD 生成任务

### API 端点

- **Gateway URL**: `https://ai.gateway.lovable.dev/v1/chat/completions`
- **认证**: 使用自动配置的 `LOVABLE_API_KEY`
- **格式**: OpenAI 兼容的 Chat Completions API

---

## 修改范围

仅修改 1 个文件：
- `supabase/functions/chat/index.ts` — 将 Google API 直接调用改为 Lovable AI Gateway

无需修改前端代码，因为响应格式保持 OpenAI 兼容。
