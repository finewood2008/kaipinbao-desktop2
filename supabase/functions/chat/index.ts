import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// PRD data structure for extraction
interface PrdData {
  usageScenario: string | null;
  targetAudience: string | null;
  designStyle: string | null;
  coreFeatures: string[] | null;
  pricingRange: string | null;
  marketingAssets: {
    sceneDescription: string | null;
    structureHighlights: string[] | null;
    explodedComponents: string[] | null;
    usageScenarios: string[] | null;
    lifestyleContext: string | null;
  };
  videoAssets: {
    storyLine: string | null;
    keyActions: string[] | null;
    emotionalTone: string | null;
  };
  competitorInsights: {
    positivePoints: string[] | null;
    negativePoints: string[] | null;
    differentiationStrategy: string | null;
  };
}

const BASE_SYSTEM_PROMPT = `你是"开品宝"的资深产品经理顾问。你拥有10年消费品产品开发经验，擅长将竞品洞察转化为可执行的产品策略。

# 你的核心身份

你是一位专业的产品经理，不是普通的AI助手。你的任务是：
1. 深度分析竞品研究数据（产品图片、用户评论）
2. 主动提出专业建议，而非被动回答问题
3. 通过 2-4 轮方向性选择，快速收集需求信息
4. 自动补全细节，生成完整的 PRD 文档

# 工作方式

## 第一步：专业分析报告（首次回复必须执行）

如果有竞品数据，你必须先展示专业分析：

📊 **竞品洞察报告**

**市场概况**
• 分析了 X 款竞品，Y 条用户评论

**产品外观趋势**
• 主流材质：[分析结果]
• 造型趋势：[分析结果]
• 配色策略：[分析结果]

**用户反馈分析**
✅ TOP 好评点：
1. [好评点1]
2. [好评点2]
3. [好评点3]

⚠️ TOP 痛点机会：
1. [痛点1] → [创新机会]
2. [痛点2] → [创新机会]
3. [痛点3] → [创新机会]

**💡 产品方向建议**

基于以上分析，我建议您考虑以下方向：

A. **[方向标签]** - [一句话说明]
B. **[方向标签]** - [一句话说明]
C. **[方向标签]** - [一句话说明]

请选择您倾向的方向，或告诉我您的其他想法。

[选A] | [选B] | [选C] | [我有其他想法]

## 第二步：动态方向选择（2-3 轮）

根据用户选择，动态生成后续问题。典型的决策点包括：
- 产品定位（便携性 vs 功能性）
- 目标用户（专业用户 vs 大众消费者）
- 外观风格（简约科技 vs 复古经典 vs 潮流个性）
- 核心卖点优先级
- 价格区间

每次只问一个问题，提供 3-4 个选项：

**方向选择 [N/4]：[问题主题]**

[问题描述和专业建议]

A. [选项标签] - [说明]
B. [选项标签] - [说明]
C. [选项标签] - [说明]

💡 建议：根据[分析依据]，推荐选择[X]

[选A] | [选B] | [选C] | [其他想法]

## 第三步：生成完整 PRD（信息足够时自动触发）

当收集到足够的方向信息后（通常 2-4 轮对话），自动生成完整 PRD：

━━━━━━━ 📋 产品定义 (PRD) ━━━━━━━

**📍 使用场景**
• 场景1：[具体描述]
• 场景2：[具体描述]
• 场景3：[具体描述]

**👥 目标用户**
[详细的用户画像描述，包括年龄、职业、需求特征]

**🎨 外观风格**
• 整体调性：[描述]
• 推荐材质：[描述]
• 配色方案：[描述]
• 造型特征：[描述]

**⚡ 核心功能**
1. **[功能名称]** - [功能说明]（解决[痛点]）
2. **[功能名称]** - [功能说明]
3. **[功能名称]** - [功能说明]
4. **[功能名称]** - [功能说明]

**🏷️ 核心卖点**
• [卖点1]
• [卖点2]
• [卖点3]

**💰 定价策略**
建议零售价区间：[价格范围]
定价依据：[分析说明]

**📸 营销素材方案**（AI 自动生成）
• 产品主图：[场景描述]
• 使用场景图：[用户形象和环境描述]
• 生活方式图：[生活方式场景描述]
• 细节特写：[结构和工艺亮点]

**🎬 视频创意**（AI 自动生成）
• 故事线：[6秒短视频故事]
• 关键画面：[核心动作和场景]
• 情感基调：[情感描述]
• 背景音乐：[音乐风格建议]

**📊 竞争差异化**
相比竞品的核心优势：
1. [差异点1]
2. [差异点2]
3. [差异点3]

━━━━━━━━━━━━━━━━━━━━━━

[PRD_READY]

✅ **PRD 文档已生成完成！**

我已经基于您的选择和竞品分析，生成了完整的产品需求文档。您现在可以：
• 点击"查看完整 PRD"进入审核页面
• 在审核页面中手动修改任何内容
• 或继续与我对话，调整某个维度

# 重要规则

## 禁止
- ❌ 不要逐项询问"请告诉我使用场景"这样的开放式问题
- ❌ 不要问固定的模板问题
- ❌ 不要让用户描述营销图片或视频的具体参数
- ❌ 不要等待用户询问，主动引导

## 必须
- ✅ 首次回复必须包含竞品分析报告（如果有数据）
- ✅ 用选择题代替开放式问题
- ✅ 每次提供 3-4 个选项
- ✅ 根据产品场景自动推断所有素材需求
- ✅ 收集到足够信息后主动生成完整 PRD

# PRD 数据提取

每次回复后，如果收集到了产品信息，在回复末尾添加结构化数据：

\`\`\`prd-data
{
  "usageScenario": "场景描述",
  "targetAudience": "用户描述",
  "designStyle": "风格描述",
  "coreFeatures": ["功能1", "功能2"],
  "pricingRange": "价格区间",
  "marketingAssets": {
    "sceneDescription": "场景图描述",
    "usageScenarios": ["使用场景1", "使用场景2"],
    "lifestyleContext": "生活方式描述"
  },
  "videoAssets": {
    "storyLine": "故事线",
    "keyActions": ["动作1", "动作2"],
    "emotionalTone": "情感基调"
  }
}
\`\`\`

只填写用户已确认的信息，未确定的保持 null。

# 语言要求
- 对话使用中文
- PRD 文档专业术语可中英结合
- 落地页文案需要提供英文版本`;



// Extract PRD data from AI response
function extractPrdData(content: string): Partial<PrdData> | null {
  const prdMatch = content.match(/```prd-data\s*([\s\S]*?)\s*```/);
  if (!prdMatch) return null;
  
  try {
    const prdJson = JSON.parse(prdMatch[1]);
    return prdJson;
  } catch (e) {
    console.error("Failed to parse PRD data:", e);
    return null;
  }
}

// Merge new PRD data with existing
function mergePrdData(existing: Partial<PrdData> | null, newData: Partial<PrdData>): Partial<PrdData> {
  if (!existing) return newData;
  
  const merged: Partial<PrdData> = { ...existing };
  
  // Simple fields - overwrite if new data exists
  if (newData.usageScenario) merged.usageScenario = newData.usageScenario;
  if (newData.targetAudience) merged.targetAudience = newData.targetAudience;
  if (newData.designStyle) merged.designStyle = newData.designStyle;
  if (newData.pricingRange) merged.pricingRange = newData.pricingRange;
  
  // Array fields - merge
  if (newData.coreFeatures) {
    merged.coreFeatures = [...new Set([...(existing.coreFeatures || []), ...newData.coreFeatures])];
  }
  
  // Nested objects - deep merge
  if (newData.marketingAssets) {
    merged.marketingAssets = {
      sceneDescription: newData.marketingAssets.sceneDescription || existing.marketingAssets?.sceneDescription || null,
      structureHighlights: newData.marketingAssets.structureHighlights 
        ? [...new Set([...(existing.marketingAssets?.structureHighlights || []), ...newData.marketingAssets.structureHighlights])]
        : existing.marketingAssets?.structureHighlights || null,
      explodedComponents: newData.marketingAssets.explodedComponents
        ? [...new Set([...(existing.marketingAssets?.explodedComponents || []), ...newData.marketingAssets.explodedComponents])]
        : existing.marketingAssets?.explodedComponents || null,
      usageScenarios: newData.marketingAssets.usageScenarios
        ? [...new Set([...(existing.marketingAssets?.usageScenarios || []), ...newData.marketingAssets.usageScenarios])]
        : existing.marketingAssets?.usageScenarios || null,
      lifestyleContext: newData.marketingAssets.lifestyleContext || existing.marketingAssets?.lifestyleContext || null,
    };
  }
  
  if (newData.videoAssets) {
    merged.videoAssets = {
      storyLine: newData.videoAssets.storyLine || existing.videoAssets?.storyLine || null,
      keyActions: newData.videoAssets.keyActions
        ? [...new Set([...(existing.videoAssets?.keyActions || []), ...newData.videoAssets.keyActions])]
        : existing.videoAssets?.keyActions || null,
      emotionalTone: newData.videoAssets.emotionalTone || existing.videoAssets?.emotionalTone || null,
    };
  }
  
  if (newData.competitorInsights) {
    merged.competitorInsights = {
      positivePoints: newData.competitorInsights.positivePoints || existing.competitorInsights?.positivePoints || null,
      negativePoints: newData.competitorInsights.negativePoints || existing.competitorInsights?.negativePoints || null,
      differentiationStrategy: newData.competitorInsights.differentiationStrategy || existing.competitorInsights?.differentiationStrategy || null,
    };
  }
  
  return merged;
}

// Calculate PRD progress based on collected data
function calculatePrdProgressFromData(prdData: Partial<PrdData> | null): Record<string, boolean> {
  if (!prdData) {
    return {
      usageScenario: false,
      targetAudience: false,
      designStyle: false,
      coreFeatures: false,
      confirmed: false,
    };
  }
  
  return {
    usageScenario: !!prdData.usageScenario,
    targetAudience: !!prdData.targetAudience,
    designStyle: !!prdData.designStyle,
    coreFeatures: !!(prdData.coreFeatures && prdData.coreFeatures.length > 0),
    confirmed: false, // This is set separately when stage completes
  };
}

// Fetch competitor research data
async function getCompetitorData(supabase: any, projectId: string) {
  try {
    // Get competitor products including images
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
        images: p.product_images || [],
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
function buildDynamicSystemPrompt(competitorData: any, projectName: string, projectDescription: string | null, existingPrdData: Partial<PrdData> | null): string {
  let prompt = BASE_SYSTEM_PROMPT;

  // Add existing PRD data context
  if (existingPrdData && Object.keys(existingPrdData).some(k => existingPrdData[k as keyof PrdData])) {
    prompt += `

## 已收集的PRD数据（基于这些继续对话，不要重复询问已确认的信息）

${existingPrdData.usageScenario ? `- **使用场景**: ${existingPrdData.usageScenario}` : ""}
${existingPrdData.targetAudience ? `- **目标用户**: ${existingPrdData.targetAudience}` : ""}
${existingPrdData.designStyle ? `- **外观风格**: ${existingPrdData.designStyle}` : ""}
${existingPrdData.coreFeatures?.length ? `- **核心功能**: ${existingPrdData.coreFeatures.join(", ")}` : ""}
${existingPrdData.pricingRange ? `- **定价区间**: ${existingPrdData.pricingRange}` : ""}

**重要**：继续收集尚未获取的信息，当信息足够时生成完整PRD。`;
  }

  if (competitorData && competitorData.products?.length > 0) {
    const { products, reviews, totalReviews } = competitorData;

    // Analyze reviews for insights
    const positiveKeywords = ["quality", "great", "love", "excellent", "perfect", "好", "不错", "满意", "喜欢", "推荐", "sturdy", "stable", "portable", "lightweight"];
    const negativeKeywords = ["bad", "poor", "broken", "issue", "problem", "差", "失望", "坏", "问题", "退货", "cheap", "flimsy", "unstable", "heavy"];

    const positiveReviews = reviews.filter((r: any) => 
      positiveKeywords.some(kw => r.review_text?.toLowerCase().includes(kw)) || r.rating >= 4
    );
    const negativeReviews = reviews.filter((r: any) => 
      negativeKeywords.some(kw => r.review_text?.toLowerCase().includes(kw)) || r.rating <= 2
    );

    // Count products with images
    const productsWithImages = products.filter((p: any) => p.images && p.images.length > 0);

    prompt += `

## 竞品研究数据（必须在首次回复中分析并使用！）

### 项目信息
- 项目名称：${projectName}
${projectDescription ? `- 项目描述：${projectDescription}` : ""}

### 已分析的竞品（${products.length} 款）：
${products.map((p: any) => `- **${p.title}** ${p.rating ? `(${p.rating}★)` : ""} ${p.reviewCount ? `- ${p.reviewCount}条评论` : ""} ${p.price ? `- ${p.price}` : ""} ${p.images?.length ? `[已获取${p.images.length}张产品图]` : ""}`).join("\n")}

### 竞品外观趋势分析
${productsWithImages.length > 0 ? `已获取 ${productsWithImages.length} 款产品的实物图片，你需要在开场时分析：
- 主流设计趋势（材质、形态、配色）
- 共同的设计特征
- 可能的差异化方向` : "未获取产品图片"}

### 评论分析摘要（共 ${totalReviews} 条评论）：
- 好评倾向：约 ${positiveReviews.length} 条
- 差评倾向：约 ${negativeReviews.length} 条

### 首次回复要求：
1. 📸 分析竞品外观趋势（如果有图片数据）
2. 💬 总结评论痛点机会
3. 🎯 基于以上，提出2-3个产品方向选项
4. 让用户选择，而非直接问开放式问题`;
  } else {
    prompt += `

## 项目信息
- 项目名称：${projectName}
${projectDescription ? `- 项目描述：${projectDescription}` : ""}

### 无竞品数据
用户未进行竞品研究。请：
1. 询问用户的产品初步想法
2. 基于用户描述，提出2-3个方向选项供选择
3. 通过选择题而非开放式问题收集信息`;
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

    // Get project info including existing PRD data
    const { data: project } = await supabase
      .from("projects")
      .select("name, description, prd_data")
      .eq("id", projectId)
      .single();

    const existingPrdData = project?.prd_data as Partial<PrdData> | null;

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
      project?.description,
      existingPrdData
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

    // Collect full response for PRD extraction
    let fullResponse = "";

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
                fullResponse += content;
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
      async flush() {
        // After streaming is complete, extract and save PRD data
        if (fullResponse && currentStage === 1) {
          const extractedPrd = extractPrdData(fullResponse);
          if (extractedPrd) {
            const mergedPrd = mergePrdData(existingPrdData, extractedPrd);
            const newProgress = calculatePrdProgressFromData(mergedPrd);
            
            // Check if stage is complete
            if (fullResponse.includes("[STAGE_COMPLETE:1]")) {
              newProgress.confirmed = true;
            }
            
            // Update project with merged PRD data and progress
            await supabase
              .from("projects")
              .update({ 
                prd_data: mergedPrd,
                prd_progress: newProgress,
              })
              .eq("id", projectId);
            
            console.log("PRD data saved:", mergedPrd);
          }
        }
      }
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
