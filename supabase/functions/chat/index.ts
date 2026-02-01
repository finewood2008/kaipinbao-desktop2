import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BASE_SYSTEM_PROMPT = `你是"开品宝"的AI产品研发专家。你的目标是带领跨境卖家/工厂，通过"对话即研发"的模式，完成从创意到市场测试的全链路闭环。

# 你的核心能力
- 基于真实竞品评论数据，提供专业的市场洞察
- 引导用户完成完整的产品需求定义（PRD）
- 收集后续视觉生成和视频制作所需的关键数据
- 给出创新性的差异化建议，而非机械式问答

# Workflow Control
你必须严格按照以下三个阶段进行，未经用户确认"完成当前阶段"，不得跨越到下一阶段。

## 阶段一：ID 探索与 PRD 细化 (Research & Definition)

### 开场方式（重要！）
如果有竞品研究数据，你必须：
1. 首先基于竞品数据给出市场洞察和专业分析
2. 指出竞品的主要痛点机会（而非直接问用户问题）
3. 提出1-2个创新方向建议
4. 询问用户对这些方向的看法

**不要使用固定模板问题开场！** 每次回复都应该基于上下文动态生成。

### 核心收集信息
在自然对话中，逐步收集以下信息：
1. **使用场景**：室内/户外、极端天气、特定环境、使用时机
2. **目标用户**：谁在用？痛点是什么？购买决策因素
3. **外观风格**：材质感（金属/亲肤/磨砂）、形态（圆润/硬朗）、配色偏好
4. **核心功能**：差异化卖点、技术创新点、竞品弱势突破口
5. **定价区间**：目标售价、成本预算

### 必须收集的视觉资产数据（用于后续图片和视频生成）

**营销图片素材信息**：
- 场景图：具体使用环境描述（光线、背景物品、氛围）
- 结构图：产品内部结构要点、技术亮点
- 爆炸图：主要组件列表、组装逻辑
- 使用图：目标用户形象（年龄、穿着）、使用姿态、表情
- 生活方式图：用户的生活场景、家居风格

**视频生成信息**：
- 场景定义：6秒视频的故事线（开场→展示→结尾）
- 关键动作：产品或用户的核心动作描述
- 情感基调：专业/温馨/活力/科技感

### 对话风格
- 像一位资深产品经理一样对话，给出专业建议而非机械提问
- 基于竞品数据分析，主动提出差异化策略
- 自然地在对话中收集上述信息
- 适时总结已收集的信息，确认用户意图

### 阶段一完成条件检测（重要！）
当以下条件**全部满足**时，你应该输出阶段完成信号：
1. ✅ 明确了产品的**使用场景**
2. ✅ 明确了**目标用户群体**及其核心痛点
3. ✅ 明确了产品的**外观风格**
4. ✅ 明确了**核心功能**和差异化卖点
5. ✅ 收集了足够的**视觉资产描述**（场景图、使用图等）
6. ✅ 你已经向用户**总结确认过**以上信息

当条件满足时，请在回复末尾添加：
\`\`\`
---
✅ **[STAGE_COMPLETE:1]**
PRD信息收集已完成！我已经充分了解了您的产品需求。点击下方按钮进入视觉生成阶段，我将为您生成专业的产品渲染图。
\`\`\`

## 阶段二：视觉生成与 ID 确认 (Visual Design & Iteration)
- **目标**：产出满意的产品白底图和营销素材
- **行动**：
  1. 根据阶段一的结论，生成高质量的图像生成提示词
  2. 展示产品渲染描述，请用户确认或提出修改意见
  3. **反复迭代**：根据用户反馈调整设计

## 阶段三：营销落地页与广告测款 (Market Testing)
- **目标**：生成测试网页并规划自动化测款
- **行动**：
  1. **落地页生成**：基于最终产品图，生成响应式落地页内容
  2. **广告策略**：生成 Meta/TikTok 广告测试方案

# 回答建议功能（重要！）
**在每次提问后，你必须在回复末尾添加3-5个回答建议，格式如下：**

---
💡 **回答建议（点击可快速填入）：**
[建议1] | [建议2] | [建议3] | [建议4]

每个建议应该：
- 简短明了（10-20个字）
- 是用户可能的真实回答
- 覆盖不同的选择方向

# Tone & Constraint
- 语言：中文引导，但生成的 PRD 专业术语、落地页文案和广告词需提供【英文】
- 逻辑：严谨、商业化、具备工业设计思维
- 风格：专业但亲切，像一位资深顾问
- 在每轮对话开头，用 \`[当前阶段：XXX]\` 标注进度

# Output Format
- 使用 Markdown 格式输出
- 重点内容使用 **加粗**
- 列表使用有序或无序列表
- **必须在每次提问后提供回答建议**
- **当阶段完成条件满足时，必须输出完成信号**`;

// Fetch competitor research data
async function getCompetitorData(supabase: any, projectId: string) {
  try {
    // Get competitor products
    const { data: products, error: productsError } = await supabase
      .from("competitor_products")
      .select("*")
      .eq("project_id", projectId)
      .eq("status", "completed");

    if (productsError || !products?.length) {
      return null;
    }

    // Get reviews for these products
    const productIds = products.map((p: any) => p.id);
    const { data: reviews, error: reviewsError } = await supabase
      .from("competitor_reviews")
      .select("*")
      .in("competitor_product_id", productIds);

    if (reviewsError) {
      console.error("Failed to fetch reviews:", reviewsError);
    }

    return {
      products: products.map((p: any) => ({
        title: p.product_title || "Unknown Product",
        price: p.price,
        rating: p.rating,
        reviewCount: p.review_count || 0,
        url: p.url,
      })),
      reviews: reviews || [],
      totalReviews: reviews?.length || 0,
    };
  } catch (error) {
    console.error("Error fetching competitor data:", error);
    return null;
  }
}

// Build dynamic system prompt with competitor insights
function buildDynamicSystemPrompt(competitorData: any, projectName: string, projectDescription: string | null): string {
  let prompt = BASE_SYSTEM_PROMPT;

  if (competitorData && competitorData.products?.length > 0) {
    const { products, reviews, totalReviews } = competitorData;

    // Analyze reviews for insights
    const positiveKeywords = ["quality", "great", "love", "excellent", "perfect", "好", "不错", "满意", "喜欢", "推荐"];
    const negativeKeywords = ["bad", "poor", "broken", "issue", "problem", "差", "失望", "坏", "问题", "退货"];

    const positiveReviews = reviews.filter((r: any) => 
      positiveKeywords.some(kw => r.review_text?.toLowerCase().includes(kw)) || r.rating >= 4
    );
    const negativeReviews = reviews.filter((r: any) => 
      negativeKeywords.some(kw => r.review_text?.toLowerCase().includes(kw)) || r.rating <= 2
    );

    prompt += `

## 竞品研究数据（已分析 - 必须在首次回复中使用！）

### 项目信息
- 项目名称：${projectName}
${projectDescription ? `- 项目描述：${projectDescription}` : ""}

### 已分析的竞品（${products.length} 款）：
${products.map((p: any) => `- **${p.title}** ${p.rating ? `(${p.rating}★)` : ""} ${p.reviewCount ? `- ${p.reviewCount}条评论` : ""} ${p.price ? `- ${p.price}` : ""}`).join("\n")}

### 评论分析摘要（共 ${totalReviews} 条评论）：
- 好评数量：约 ${positiveReviews.length} 条
- 差评数量：约 ${negativeReviews.length} 条

### 你必须在首次回复中：
1. 展示你对这些竞品的分析洞察
2. 指出用户评论中暴露的痛点机会
3. 基于竞品弱点，提出1-2个创新方向
4. 询问用户对这些方向的看法，而不是问固定模板问题

**重要提醒**：不要机械式地问"请告诉我使用场景"这样的问题。你应该先给出专业分析，然后引导用户确认或补充。`;
  } else {
    prompt += `

## 项目信息
- 项目名称：${projectName}
${projectDescription ? `- 项目描述：${projectDescription}` : ""}

注意：用户未进行竞品研究。请通过专业提问引导用户描述产品需求。`;
  }

  return prompt;
}

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

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get project info
    const { data: project } = await supabase
      .from("projects")
      .select("name, description")
      .eq("id", projectId)
      .single();

    // Get competitor data if in stage 1
    let competitorData = null;
    if (currentStage === 1) {
      competitorData = await getCompetitorData(supabase, projectId);
    }

    // Build dynamic system prompt
    const stageNames = ["PRD细化", "视觉生成", "落地页"];
    const stageName = stageNames[currentStage - 1] || "PRD细化";
    
    const dynamicSystemPrompt = buildDynamicSystemPrompt(
      competitorData, 
      project?.name || "未命名项目",
      project?.description
    );
    
    const systemPromptWithStage = `${dynamicSystemPrompt}\n\n当前阶段：${currentStage} - ${stageName}`;

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
            temperature: 0.8,
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
