
# AI 产品经理 - 切换到 Google Gemini API 直接调用

## 问题分析

通过检查网络请求和代码，发现：

1. **当前架构**：使用 Lovable AI Gateway (`https://ai.gateway.lovable.dev/v1/chat/completions`) + `google/gemini-3-pro-preview` 模型
2. **响应格式问题**：Gateway 返回的 SSE 流包含 `: OPENROUTER PROCESSING` 注释行，以及 `reasoning` 字段（推理过程），但实际内容 `content` 为空或延迟到达
3. **用户需求**：切换到直接调用 Google Generative AI API，使用 `GOOGLE_API_KEY` 和 `gemini-2.5-flash` 模型

## 解决方案

将 chat edge function 从 Lovable AI Gateway 切换到直接调用 Google Generative AI API。

---

## 技术实现

### 修改文件：`supabase/functions/chat/index.ts`

#### 1. API 端点变更

```text
修改前: https://ai.gateway.lovable.dev/v1/chat/completions
修改后: https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse
```

#### 2. 使用的密钥

```text
修改前: LOVABLE_API_KEY
修改后: GOOGLE_API_KEY (用户已配置)
```

#### 3. 请求格式变更

**修改前 (OpenAI 格式)**:
```json
{
  "model": "google/gemini-3-pro-preview",
  "messages": [
    { "role": "system", "content": "..." },
    { "role": "user", "content": "..." }
  ],
  "stream": true
}
```

**修改后 (Google Gemini 格式)**:
```json
{
  "system_instruction": {
    "parts": [{ "text": "系统提示词" }]
  },
  "contents": [
    { "role": "user", "parts": [{ "text": "用户消息" }] },
    { "role": "model", "parts": [{ "text": "助手回复" }] }
  ],
  "generationConfig": {
    "temperature": 0.85,
    "maxOutputTokens": 16384
  }
}
```

#### 4. SSE 响应解析变更

**修改前 (OpenAI 格式)**:
```json
{
  "choices": [{ "delta": { "content": "文本内容" } }]
}
```

**修改后 (Google Gemini 格式)**:
```json
{
  "candidates": [
    {
      "content": {
        "parts": [{ "text": "文本内容" }]
      }
    }
  ]
}
```

#### 5. 转换 SSE 流

需要将 Google Gemini 的 SSE 格式转换为 OpenAI 格式，以保持前端代码兼容性：

```typescript
// Google Gemini 响应
data: {"candidates":[{"content":{"parts":[{"text":"你好"}]}}]}

// 转换为 OpenAI 格式
data: {"choices":[{"delta":{"content":"你好"}}]}
```

---

## 完整代码改动摘要

### `supabase/functions/chat/index.ts` 主要改动

1. **替换 API 密钥获取**:
   - `LOVABLE_API_KEY` → `GOOGLE_API_KEY`
   
2. **替换 API 端点**:
   - Lovable Gateway → Google Generative AI API
   
3. **消息格式转换函数**:
   - OpenAI messages 格式 → Gemini contents 格式
   - 处理 `role: "system"` → `system_instruction`
   - 处理 `role: "assistant"` → `role: "model"`
   
4. **SSE 流转换**:
   - 解析 Gemini SSE 响应
   - 转换为 OpenAI 格式的 SSE 输出
   - 保持前端代码完全兼容

---

## 改动范围

| 文件 | 修改类型 | 内容 |
|------|---------|------|
| `supabase/functions/chat/index.ts` | 修改 | 切换到 Google Gemini API 直接调用 |

---

## 预期效果

| 改动 | 效果 |
|------|------|
| 使用 Google API 直接调用 | 更稳定的 API 响应，无 Gateway 中间层 |
| 切换到 gemini-2.5-flash | 更快的响应速度，成本更低 |
| 使用用户提供的 GOOGLE_API_KEY | 完全控制 API 配额和计费 |
| 保持前端兼容 | 无需修改前端代码，SSE 格式保持一致 |

---

## 技术细节

### Google Gemini API 格式

**请求头**:
```text
Content-Type: application/json
x-goog-api-key: ${GOOGLE_API_KEY}
```

**角色映射**:
- OpenAI `user` → Gemini `user`
- OpenAI `assistant` → Gemini `model`
- OpenAI `system` → Gemini `system_instruction`

### SSE 流格式

Google Gemini 返回的 SSE 格式：
```text
data: {"candidates":[{"content":{"parts":[{"text":"内容片段"}],"role":"model"},"finishReason":null}],"modelVersion":"gemini-2.5-flash"}
```

转换后的 OpenAI 兼容格式：
```text
data: {"choices":[{"index":0,"delta":{"content":"内容片段"}}]}
```
