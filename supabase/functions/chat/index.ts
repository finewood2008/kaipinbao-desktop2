import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `你是"开品宝"的AI产品研发专家。你的目标是带领跨境卖家/工厂，通过"对话即研发"的模式，完成从创意到市场测试的全链路闭环。

# Workflow Control
你必须严格按照以下三个阶段进行，未经用户确认"完成当前阶段"，不得跨越到下一阶段。

## 阶段一：ID 探索与 PRD 细化 (Research & Definition)
- **目标**：挖掘产品的使用场景、定位及外观细节。
- **行动**：不要直接生成结果！你必须通过连续的追问，确认以下信息：
  1. 使用环境：室内/户外、极端天气、特定地理位置。
  2. ID 细节：材质感（金属/亲肤/磨砂）、形态风格（圆润/硬朗）、交互逻辑。
  3. 目标客群：谁在用？他们的痛点是什么？
- **输出**：当信息足够时，整理出一份包含【产品定义、核心规格、ID 设计要求】的 PRD。

## 阶段二：视觉生成与 ID 确认 (Visual Design & Iteration)
- **目标**：产出满意的产品白底图。
- **行动**：
  1. 根据阶段一的结论，生成 2-3 个高质量的图像生成提示词 (Prompt)，用于调用图像生成模型。
  2. 展示产品渲染描述，请用户确认或提出修改意见（如：颜色、比例、细节、材质更换）。
  3. **反复迭代**：用户提出"手柄再细一点"，你需重新生成描述，直到用户说"满意/确认"。
- **技术关联**：确认后，告知用户：已生成可用于 3D 打印的参数数据（模拟 3D 打印直连）。

## 阶段三：营销落地页与广告测款 (Market Testing)
- **目标**：生成测试网页并规划自动化测款。
- **行动**：
  1. **落地页生成**：基于最终产品图，描述响应式落地页内容，包含：Hero Image、痛点文案、信任背书、CTA（Call to Action）按钮。
  2. **广告策略**：生成一套 Meta/TikTok 广告测试方案（包含目标受众画像、A/B 测试文案、单次点击成本预估）。
  3. **数据预估**：模拟展示一个市场潜力评分报告。

# 回答建议功能（重要！）
**在每次提问后，你必须在回复末尾添加3-5个回答建议，格式如下：**

---
💡 **回答建议（点击可快速填入）：**
[建议1] | [建议2] | [建议3] | [建议4]

每个建议应该：
- 简短明了（10-20个字）
- 是用户可能的真实回答
- 覆盖不同的选择方向
- 用户可以点击后继续补充说明

示例：
问：这个产品主要在什么环境下使用？
建议：[室内家用] | [户外露营] | [办公桌面] | [车载使用]

问：目标用户群体是谁？
建议：[年轻白领] | [户外爱好者] | [家庭主妇] | [学生群体] | [商务人士]

# Tone & Constraint
- 语言：中文引导，但生成的 PRD 专业术语、落地页文案和广告词需提供【英文】。
- 逻辑：严谨、商业化、具备工业设计思维。
- 强制要求：在每轮对话开头，用 \`[当前阶段：XXX]\` 标注进度。

# Output Format
- 使用 Markdown 格式输出
- 重点内容使用 **加粗**
- 列表使用有序或无序列表
- 保持专业但友好的语气
- **必须在每次提问后提供回答建议**`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, projectId, currentStage } = await req.json();
    const GOOGLE_API_KEY = Deno.env.get("GOOGLE_API_KEY");

    if (!GOOGLE_API_KEY) {
      throw new Error("GOOGLE_API_KEY is not configured");
    }

    // Add stage context to system prompt
    const stageNames = ["PRD细化", "视觉生成", "落地页"];
    const stageName = stageNames[currentStage - 1] || "PRD细化";
    const systemPromptWithStage = `${SYSTEM_PROMPT}\n\n当前阶段：${currentStage} - ${stageName}`;

    // Convert messages to Google AI Studio format
    const googleMessages = messages.map((msg: { role: string; content: string }) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }],
    }));

    // Use Google AI Studio Gemini API with streaming
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent?alt=sse&key=${GOOGLE_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: systemPromptWithStage }],
          },
          contents: googleMessages,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 8192,
          },
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "请求过于频繁，请稍后再试" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402 || response.status === 403) {
        return new Response(JSON.stringify({ error: "API 额度已用完或权限不足" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      console.error("Google AI Studio error:", response.status, text);
      return new Response(JSON.stringify({ error: "AI 服务暂时不可用" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Transform Google SSE format to OpenAI-compatible SSE format
    const transformStream = new TransformStream({
      transform(chunk, controller) {
        const text = new TextDecoder().decode(chunk);
        const lines = text.split("\n");
        
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const jsonStr = line.slice(6).trim();
            if (jsonStr === "[DONE]") {
              controller.enqueue(new TextEncoder().encode("data: [DONE]\n\n"));
              continue;
            }
            
            try {
              const data = JSON.parse(jsonStr);
              const content = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
              
              if (content) {
                // Convert to OpenAI-compatible format
                const openAIFormat = {
                  choices: [
                    {
                      delta: { content },
                      index: 0,
                    },
                  ],
                };
                controller.enqueue(
                  new TextEncoder().encode(`data: ${JSON.stringify(openAIFormat)}\n\n`)
                );
              }
            } catch (e) {
              // Skip malformed JSON
            }
          }
        }
      },
    });

    const transformedStream = response.body?.pipeThrough(transformStream);

    return new Response(transformedStream, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Chat error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
