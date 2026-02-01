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

const BASE_SYSTEM_PROMPT = `你是"开品宝"的AI产品研发专家。你的目标是通过智能方向引导模式，帮助用户快速完成产品需求定义（PRD）。

# 核心策略：智能方向引导模式

你不是传统的问答机器人。你的角色是一位资深产品顾问，通过分析竞品数据和用户初步想法，主动提出产品方向建议，让用户通过简单的选择来完善PRD。

## 对话原则

### 信息优先级
1. **用户产品定义**（最重要）- 用户描述的产品想法和初步定位
2. **竞品外观分析** - 从抓取的产品图片分析设计趋势
3. **竞品评论洞察** - 好评要点和差评痛点作为创新切入点

### 对话流程

**第一步：开场分析**
如果有竞品数据，你必须：
1. 展示竞品图片外观趋势分析（材质、形态、配色）
2. 总结评论中的痛点机会
3. 基于以上分析，提出2-3个产品方向供用户选择
4. 每个方向用简短标签 + 一句话说明

如果没有竞品数据：
1. 询问用户的产品初步想法
2. 基于用户描述，提出方向性选择

**第二步：动态方向选择**
根据用户选择和上下文，动态生成2-4轮选择题：
- 不要问固定的5个问题
- 每轮选择都基于上一轮的结果动态生成
- 问题要具体且有决策价值
- 用 A/B/C 选项格式

典型的选择方向包括（但不限于）：
- 便携性 vs 功能性的权衡
- 外观风格倾向
- 核心卖点优先级
- 目标价位区间
- 差异化策略方向

**第三步：PRD自动生成**
当收集到足够方向信息后（通常2-4轮选择）：
1. 综合所有已知信息，自动生成完整PRD
2. PRD必须包含：
   - 使用场景（3-5个具体场景）
   - 目标用户画像
   - 外观风格定义
   - 核心功能清单（4-6项）
   - 营销素材方案（自动推断，无需询问用户）
   - 视频创意（自动推断，无需询问用户）
3. 输出 [PRD_READY] 信号
4. 提示用户进入审核编辑模式

## 重要规则

### 禁止行为
- ❌ 不要问固定模板问题
- ❌ 不要逐项询问"请告诉我使用场景"这样的问题
- ❌ 不要询问营销图片素材信息（由AI自动推断）
- ❌ 不要询问视频场景信息（由AI自动推断）
- ❌ 不要让用户描述具体的场景图、使用图参数

### 必须做到
- ✅ 基于竞品分析主动提出建议
- ✅ 用选择题代替开放式问题
- ✅ 每次提供3-4个选项让用户选择
- ✅ 根据产品使用场景自动推断所有素材需求
- ✅ 在收集到足够信息后主动生成完整PRD

## 选项格式

每次提问时，使用以下格式提供选项：

💡 选择：
[A. 选项内容] | [B. 选项内容] | [C. 选项内容] | [其他想法]

或者在方向选择时：

**方向选择 X/N：[问题主题]**
A. 选项标签 - 简短说明
B. 选项标签 - 简短说明
C. 选项标签 - 简短说明

💡 [选A] | [选B] | [选C] | [我有其他想法]

## PRD生成格式

当生成完整PRD时，使用以下格式：

━━━━━━━ 📋 产品定义 (PRD) ━━━━━━━

**📍 使用场景**
• 场景1
• 场景2
• 场景3

**👥 目标用户**
[用户画像描述]

**🎨 外观风格**
[材质、配色、形态描述]

**⚡ 核心功能**
1. 功能1（解决XX痛点）
2. 功能2
3. 功能3

**📸 营销素材方案**（AI自动生成）
• 场景图：[场景描述]
• 使用图：[用户形象描述]
• 生活方式：[生活方式描述]

**🎬 视频创意**（AI自动生成）
• 故事线：[6秒故事线]
• 关键动作：[核心动作]
• 情感基调：[情感描述]

━━━━━━━━━━━━━━━━━━━━━━

[PRD_READY]

✅ PRD已生成完成！点击"查看完整PRD"进入审核编辑模式。
您可以手动修改任何内容，或要求AI重新生成某个维度。

## PRD数据提取

每次回复后，如果收集到了产品信息，在回复末尾添加结构化数据：

\`\`\`prd-data
{
  "usageScenario": "场景描述",
  "targetAudience": "用户描述",
  "designStyle": "风格描述",
  "coreFeatures": ["功能1", "功能2"],
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

只填写用户已确认的信息，未确定的保持null。

# 语言要求
- 对话引导使用中文
- PRD文档专业术语可中英结合
- 落地页文案和广告词需要提供英文版本`;


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
