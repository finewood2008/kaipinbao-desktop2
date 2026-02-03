
# 升级图像生成模型与统一双备份机制

## 概述

根据需求，将所有 AI 调用统一为：
1. **优先调用 Google 直连 API**
2. **被屏蔽时自动切换到 Lovable AI Gateway 备份**
3. **图像生成统一使用 `google/gemini-3-pro-image-preview`（Google 直连）和 `google/gemini-3-pro-image-preview`（Lovable 备份）**

## 一、当前状态分析

| 边缘函数 | 当前主调用 | 状态 |
|----------|----------|------|
| `generate-image` | Google 直连 `google/gemini-3-pro-image-preview` | ⚠️ 无备份 |
| `chat` | Lovable AI Gateway | ⚠️ 需改为 Google 优先 |
| `market-analysis` | Google 直连 `gemini-2.5-flash` | ⚠️ 无备份 |
| `generate-landing-page` | Lovable AI Gateway | ⚠️ 需改为 Google 优先 |
| `analyze-reviews` | Lovable AI Gateway | ⚠️ 需改为 Google 优先 |
| `initial-market-analysis` | Google 直连 | ⚠️ 无备份 |
| `regenerate-prd-section` | Google 直连 | ⚠️ 无备份 |
| `scrape-competitor` | Lovable AI Gateway（OCR） | ⚠️ 需改为 Google 优先 |

## 二、统一调用策略

### 2.1 文本生成模型

| 调用顺序 | API | 模型 |
|----------|-----|------|
| 主调用 | Google 直连 | `gemini-2.5-flash` |
| 备份 | Lovable AI Gateway | `google/gemini-2.5-flash` |

### 2.2 图像生成模型

| 调用顺序 | API | 模型 |
|----------|-----|------|
| 主调用 | Google 直连 | `google/gemini-3-pro-image-preview` |
| 备份 | Lovable AI Gateway | `google/gemini-3-pro-image-preview` |

### 2.3 视觉理解/OCR模型

| 调用顺序 | API | 模型 |
|----------|-----|------|
| 主调用 | Google 直连 | `gemini-2.5-pro`（支持视觉） |
| 备份 | Lovable AI Gateway | `google/gemini-2.5-pro` |

## 三、核心技术实现

### 3.1 创建共享备份工具 `_shared/ai-fallback.ts`

创建统一的 AI 调用包装器，实现自动故障切换：

```typescript
// supabase/functions/_shared/ai-fallback.ts

export interface CallAIOptions {
  logPrefix?: string;
  retryCount?: number;
}

// 判断是否应该切换到备份
export function shouldFallback(error: unknown): boolean {
  if (error instanceof Response) {
    return [429, 402, 500, 502, 503, 504].includes(error.status);
  }
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    return (
      msg.includes("429") ||
      msg.includes("rate limit") ||
      msg.includes("blocked") ||
      msg.includes("network") ||
      msg.includes("timeout") ||
      msg.includes("503") ||
      msg.includes("502")
    );
  }
  return true; // 默认切换备份
}

// 统一的双备份调用函数
export async function callWithFallback<T>(
  primaryCall: () => Promise<T>,
  fallbackCall: () => Promise<T>,
  options?: CallAIOptions
): Promise<{ result: T; usedFallback: boolean }> {
  const prefix = options?.logPrefix || "AI";
  
  try {
    console.log(`${prefix}: Attempting primary call (Google Direct)...`);
    const result = await primaryCall();
    console.log(`${prefix}: Primary call succeeded`);
    return { result, usedFallback: false };
  } catch (primaryError) {
    console.warn(`${prefix}: Primary call failed:`, primaryError);
    
    if (!shouldFallback(primaryError)) {
      throw primaryError;
    }
    
    console.log(`${prefix}: Switching to fallback (Lovable AI)...`);
    try {
      const result = await fallbackCall();
      console.log(`${prefix}: Fallback succeeded`);
      return { result, usedFallback: true };
    } catch (fallbackError) {
      console.error(`${prefix}: Both primary and fallback failed`);
      throw fallbackError;
    }
  }
}
```

### 3.2 `generate-image/index.ts` 改造

添加 Lovable AI 备份，使用 `google/gemini-3-pro-image-preview`：

```typescript
// 新增：通过 Lovable AI 生成图片（备份）
async function generateImageViaLovable(
  prompt: string,
  parentImageUrl?: string
): Promise<{ imageUrl: string; description?: string }> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

  const content: any[] = [{ type: "text", text: prompt }];
  if (parentImageUrl) {
    const { base64, mimeType } = await fetchImageAsBase64(parentImageUrl);
    content.push({
      type: "image_url",
      image_url: { url: `data:${mimeType};base64,${base64}` }
    });
  }

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-3-pro-image-preview",
      messages: [{ role: "user", content }],
      modalities: ["image", "text"],
    }),
  });

  if (!response.ok) {
    throw new Error(`Lovable AI failed: ${response.status}`);
  }

  const data = await response.json();
  const imageData = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
  const description = data.choices?.[0]?.message?.content;
  
  if (!imageData) throw new Error("No image in Lovable response");
  return { imageUrl: imageData, description };
}

// 主流程使用双备份
let imageResult: { imageUrl: string; description?: string };
let usedFallback = false;

try {
  // 主调用：Google 直连
  imageResult = await generateImageViaGoogle(enhancedPrompt, parentImageUrl);
} catch (googleError) {
  console.warn("Google API failed, switching to Lovable AI...", googleError);
  usedFallback = true;
  imageResult = await generateImageViaLovable(enhancedPrompt, parentImageUrl);
}
```

### 3.3 `chat/index.ts` 改造

改为 Google 优先，Lovable 备份：

```typescript
// 主调用：Google 直连
async function chatViaGoogle(contents: GeminiContent[], systemPrompt: string) {
  const GOOGLE_API_KEY = Deno.env.get("GOOGLE_API_KEY");
  if (!GOOGLE_API_KEY) throw new Error("GOOGLE_API_KEY not configured");
  
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": GOOGLE_API_KEY,
      },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents,
        generationConfig: { temperature: 0.7, maxOutputTokens: 4096 },
      }),
    }
  );
  return response;
}

// 备份调用：Lovable AI
async function chatViaLovable(messages: OpenAIMessage[]) {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");
  
  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages,
      stream: true,
    }),
  });
  return response;
}
```

### 3.4 其他边缘函数统一改造

所有边缘函数遵循相同模式：

```typescript
import { callWithFallback, shouldFallback } from "../_shared/ai-fallback.ts";

// 每个函数内部：
const { result, usedFallback } = await callWithFallback(
  () => callGoogleDirect(prompt),
  () => callLovableAI(prompt),
  { logPrefix: "MarketAnalysis" }
);
```

## 四、各边缘函数改造清单

| 文件 | 改造内容 |
|------|----------|
| `supabase/functions/_shared/ai-fallback.ts` | 新建共享备份工具 |
| `supabase/functions/generate-image/index.ts` | 添加 `generateImageViaLovable()` 备份函数 |
| `supabase/functions/chat/index.ts` | 改为 Google 优先，添加 `chatViaGoogle()` 主调用 |
| `supabase/functions/market-analysis/index.ts` | 添加 Lovable 备份 |
| `supabase/functions/generate-landing-page/index.ts` | 改为 Google 优先 |
| `supabase/functions/analyze-reviews/index.ts` | 改为 Google 优先 |
| `supabase/functions/initial-market-analysis/index.ts` | 添加 Lovable 备份 |
| `supabase/functions/regenerate-prd-section/index.ts` | 添加 Lovable 备份 |
| `supabase/functions/scrape-competitor/index.ts` | OCR 部分改为 Google 优先 |

## 五、前端进度显示增强

### 5.1 新建进度组件 `ImageGenerationProgress.tsx`

```typescript
interface ImageGenerationProgressProps {
  isGenerating: boolean;
  currentType?: string;
  currentStep?: string;
  totalTypes: number;
  completedCount: number;
  estimatedTimeRemaining?: number;
}

export function ImageGenerationProgress({ ... }) {
  const progress = (completedCount / totalTypes) * 100;

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardContent className="p-4">
        {/* 整体进度条 */}
        <Progress value={progress} />
        
        {/* 当前任务状态 */}
        <div className="flex items-center gap-3">
          <Loader2 className="animate-spin" />
          <div>
            <p>正在生成: {currentType}</p>
            <p className="text-sm text-muted-foreground">{currentStep}</p>
          </div>
        </div>
        
        {/* 预估时间 */}
        {estimatedTimeRemaining && (
          <p>预计剩余时间: 约 {Math.ceil(estimatedTimeRemaining / 60)} 分钟</p>
        )}
      </CardContent>
    </Card>
  );
}
```

### 5.2 `ProductDesignGallery.tsx` 增强

添加详细步骤显示：

```typescript
const [generationStep, setGenerationStep] = useState("");
const [estimatedTime, setEstimatedTime] = useState(0);

// 生成时更新步骤
setGenerationStep("正在连接 AI 服务...");
// 调用 API
setGenerationStep("AI 正在绘制产品造型...");
// 保存
setGenerationStep("正在保存到数据库...");
```

### 5.3 `MarketingImageGallery.tsx` 增强

批量生成详细进度：

```typescript
const [currentGeneratingType, setCurrentGeneratingType] = useState("");
const [completedCount, setCompletedCount] = useState(0);

// 生成循环中
for (const type of selectedTypes) {
  setCurrentGeneratingType(type.label);
  // 生成逻辑...
  setCompletedCount(prev => prev + 1);
}
```

## 六、错误处理增强

### 6.1 错误消息映射

```typescript
function getErrorMessage(status: number, source: "google" | "lovable"): string {
  switch (status) {
    case 429:
      return source === "google" 
        ? "Google API 请求频率过高，正在切换备用服务..."
        : "AI 请求频率过高，请稍后再试";
    case 402:
      return "AI 额度已用完，请充值后再试";
    case 503:
    case 502:
      return source === "google"
        ? "Google 服务暂时不可用，正在切换备用服务..."
        : "AI 服务暂时不可用";
    default:
      return "AI 服务出错，请重试";
  }
}
```

### 6.2 前端错误提示

在边缘函数返回中添加 `usedFallback` 标记，前端可显示：

```typescript
if (data.usedFallback) {
  toast.info("已使用备用 AI 服务");
}
```

## 七、涉及文件清单

| 文件路径 | 修改类型 | 说明 |
|----------|----------|------|
| `supabase/functions/_shared/ai-fallback.ts` | 新建 | 统一双备份工具函数 |
| `supabase/functions/generate-image/index.ts` | 修改 | 添加 Lovable 备份 |
| `supabase/functions/chat/index.ts` | 修改 | 改为 Google 优先 + Lovable 备份 |
| `supabase/functions/market-analysis/index.ts` | 修改 | 添加 Lovable 备份 |
| `supabase/functions/generate-landing-page/index.ts` | 修改 | 改为 Google 优先 |
| `supabase/functions/analyze-reviews/index.ts` | 修改 | 改为 Google 优先 |
| `supabase/functions/initial-market-analysis/index.ts` | 修改 | 添加 Lovable 备份 |
| `supabase/functions/regenerate-prd-section/index.ts` | 修改 | 添加 Lovable 备份 |
| `supabase/functions/scrape-competitor/index.ts` | 修改 | OCR 改为 Google 优先 |
| `src/components/ImageGenerationProgress.tsx` | 新建 | 进度显示组件 |
| `src/components/ProductDesignGallery.tsx` | 修改 | 添加详细进度 |
| `src/components/MarketingImageGallery.tsx` | 修改 | 添加详细进度 |
| `src/components/InlineAssetGenerator.tsx` | 修改 | 增强进度显示 |

## 八、预期效果

1. **服务稳定性提升**：双备份确保 99%+ 可用性
2. **用户体验优化**：生成过程透明化，进度可视
3. **统一架构**：所有 AI 调用遵循相同模式，便于维护
4. **自动故障转移**：网络屏蔽或限流时无感切换
