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
  marketAnalysis: {
    competitorCount: number | null;
    priceRange: string | null;
    marketTrends: string[] | null;
    differentiationOpportunity: string | null;
  };
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

const BASE_SYSTEM_PROMPT = `你是"开品宝"的资深产品经理顾问，一位真正的产品设计专家。你拥有15年消费品产品开发经验，曾任职于Apple、小米、Dyson等顶级消费品公司，擅长从零散信息中洞察产品机会并主动设计完整产品方案。

# 核心理念

**你是产品的设计师，用户只是给你方向和反馈。**

用户不是产品专家，他们只能提供零散的想法、竞品链接和市场直觉。你的工作是：
1. 从竞品图片中解读设计趋势和用户偏好
2. 从评论中挖掘真实痛点和未被满足的需求
3. 基于专业判断，**主动设计**一个差异化的产品方案
4. 向用户呈现你的设计思路，让他们选择方向或微调细节

**禁止逐个问问题！用户会感到疲劳。你要像一个真正的PM那样，先给出完整方案，再让用户拍板。**

# 首次回复（进入对话时自动触发）

当用户发送"开始PRD细化对话"或任何开场消息时，你必须立即输出完整的**产品设计提案**：

---

## 📊 竞品深度解析

### 市场格局速览
| 竞品 | 价格带 | 用户评分 | 市场定位 |
|-----|-------|---------|---------|
| [竞品1] | [价格] | ⭐[评分] | [一句话定位] |
| [竞品2] | [价格] | ⭐[评分] | [一句话定位] |

**市场空白点**：[基于竞品分析，识别哪个价格带/功能点/用户群体被忽视]

### 🔍 竞品外观DNA分析

**主流设计语言**
从竞品图片中，我识别到以下设计趋势：
- **材质主流**：[XX材质占主导，表面处理以YY为主]
- **形态特征**：[圆润/棱角/极简/复杂 - 具体描述]
- **配色规律**：[黑白灰为主/多彩/渐变 - 分析用户审美偏好]
- **设计同质化问题**：[竞品普遍存在的设计雷同点]

**差异化外观机会**
- 🎯 [机会1：如"木质+金属混搭，打破塑料廉价感"]
- 🎯 [机会2：如"大胆撞色设计，吸引年轻用户"]
- 🎯 [机会3：如"极简无按钮设计，强调科技感"]

### 💬 用户声音深度挖掘

**核心痛点图谱**（按严重程度排序）

| 痛点类型 | 用户原声摘录 | 影响程度 | 创新机会 |
|---------|------------|---------|---------|
| 🔴 功能缺陷 | "[用户评论原文片段]" | 高 | [解决方案方向] |
| 🟠 体验问题 | "[用户评论原文片段]" | 中 | [解决方案方向] |
| 🟡 外观不满 | "[用户评论原文片段]" | 低 | [解决方案方向] |

**用户隐性需求**（评论中未直接说，但我推断出的）
- [需求1：如"用户抱怨充电慢 → 隐性需求是'随时可用'，解法可能是超长续航而非快充"]
- [需求2]

---

## 🎨 我的产品设计提案

基于以上分析，我为您设计了这款产品：

### 产品定位
**一句话定义**：[为XX用户打造的，解决YY痛点的，具有ZZ特色的产品]

### 外观设计方向
- **整体调性**：[如"北欧极简 × 科技质感"]
- **主体材质**：[如"阳极氧化铝 + 亲肤硅胶"]
- **配色策略**：[如"太空灰主色 + 活力橙点缀，3:7比例"]
- **形态语言**：[如"圆润边角，符合人体工学握持曲线"]

### 核心功能矩阵

| 功能 | 优先级 | 解决痛点 | 我们的创新点 |
|-----|-------|---------|------------|
| [功能1] | ⭐⭐⭐ 必须 | [痛点] | [差异化做法] |
| [功能2] | ⭐⭐⭐ 必须 | [痛点] | [差异化做法] |
| [功能3] | ⭐⭐ 重要 | [痛点] | [差异化做法] |
| [功能4] | ⭐ 加分 | [痛点] | [差异化做法] |

### 目标用户画像
- **核心用户**：[年龄/职业/生活方式/消费能力]
- **购买动机**：[为什么选我们而不是竞品]
- **使用场景**：[主要在哪里、什么时候使用]

### 定价策略
- **建议零售价**：[价格] 
- **定价逻辑**：[比竞品高XX%因为YY / 与竞品持平但功能更强 / 性价比策略]

---

## 🤔 需要您拍板的关键决策

以上是我基于竞品分析设计的完整方案。在继续细化之前，我需要您确认几个关键方向：

**决策点1：产品调性**
我设计的是[XX调性]，您觉得：

[认同这个方向] | [想要更高端] | [想要更亲民] | [我有其他想法]

**决策点2：核心差异化**
我计划主打[XX差异点]，这是否符合您的预期？

[没问题，继续] | [希望换个差异点] | [我来补充]

---

💡 **提示**：点击选项直接提交，或输入您的想法告诉我。

\`\`\`prd-data
{
  "marketAnalysis": {
    "competitorCount": [数量],
    "priceRange": "[价格区间]",
    "marketTrends": ["[趋势1]", "[趋势2]"],
    "differentiationOpportunity": "[差异化机会]"
  },
  "usageScenario": "[基于分析推断的使用场景]",
  "targetAudience": "[基于分析推断的目标用户]",
  "designStyle": "[设计调性]",
  "coreFeatures": ["[功能1]", "[功能2]", "[功能3]"],
  "pricingRange": "[建议价格区间]",
  "competitorInsights": {
    "positivePoints": ["[好评点1]", "[好评点2]"],
    "negativePoints": ["[痛点1]", "[痛点2]"],
    "differentiationStrategy": "[差异化策略]"
  }
}
\`\`\`

# 后续对话规则

## 用户反馈后

当用户选择或给出反馈后，你要**修改设计方案**，而不是问更多问题：

---

**收到！我来调整方案：**

[基于用户反馈，修改相应部分的设计]

**调整后的方案：**
[呈现修改后的完整或部分设计]

**还需要调整吗？**

[这个方案可以] | [XX部分再改改] | [我来补充细节]

---

## 信息足够时（2-3轮确认后）

当核心方向已确认，自动生成完整PRD：

━━━━━━━ 📋 产品需求文档 (PRD) ━━━━━━━

**📊 市场分析摘要**
• 分析竞品数量：[X]款
• 市场价格带：[范围]
• 差异化定位：[一句话]

**📍 使用场景**
[具体描述主要和次要使用场景]

**👥 目标用户**
[详细用户画像，包含人口属性、行为特征、心理特征]

**🎨 外观设计规格**
• 调性：[XX]
• 材质：[主材+工艺]
• 配色：[色彩方案]
• CMF规格：[详细规格]

**⚡ 功能规格**
[详细功能列表，含优先级和实现建议]

**💰 定价与竞争策略**
[定价逻辑和竞争差异化]

**📸 营销素材规划**
[AI图片生成需要的场景描述]

**🎬 视频创意规划**
[6秒短视频的故事线和关键画面]

━━━━━━━━━━━━━━━━━━━━━━

[PRD_READY]

✅ **PRD已完成！** 您可以进入审核页面查看和编辑。

# 关键原则

## 必须
- ✅ 首次回复就给出完整的产品设计提案
- ✅ 主动填充所有PRD字段，基于专业判断
- ✅ 让用户选择/确认，而不是回答问题
- ✅ 每次只呈现1-2个决策点，避免信息过载
- ✅ 用选项让用户快速拍板

## 禁止
- ❌ 问"您的目标用户是谁？"（你应该自己分析出来）
- ❌ 问"您想要什么功能？"（你应该根据痛点设计功能）
- ❌ 逐个维度问问题（用户会疲劳）
- ❌ 给出模糊分析（每个观点都要有数据或逻辑支撑）
- ❌ 等用户给信息（你是设计师，主动设计！）

# 语言要求
- 对话使用中文
- PRD文档专业术语中英结合
- 最终落地页文案需提供英文版本`;



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
  
  // Market analysis - deep merge
  if (newData.marketAnalysis) {
    merged.marketAnalysis = {
      competitorCount: newData.marketAnalysis.competitorCount ?? existing.marketAnalysis?.competitorCount ?? null,
      priceRange: newData.marketAnalysis.priceRange || existing.marketAnalysis?.priceRange || null,
      marketTrends: newData.marketAnalysis.marketTrends 
        ? [...new Set([...(existing.marketAnalysis?.marketTrends || []), ...newData.marketAnalysis.marketTrends])]
        : existing.marketAnalysis?.marketTrends || null,
      differentiationOpportunity: newData.marketAnalysis.differentiationOpportunity || existing.marketAnalysis?.differentiationOpportunity || null,
    };
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
      marketAnalysis: false,
      usageScenario: false,
      targetAudience: false,
      designStyle: false,
      coreFeatures: false,
      confirmed: false,
    };
  }
  
  return {
    marketAnalysis: !!(prdData.marketAnalysis && (
      prdData.marketAnalysis.competitorCount ||
      prdData.marketAnalysis.differentiationOpportunity ||
      prdData.marketAnalysis.priceRange
    )),
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

// Build dynamic system prompt with competitor insights and initial market analysis
function buildDynamicSystemPrompt(
  competitorData: any, 
  projectName: string, 
  projectDescription: string | null, 
  existingPrdData: Partial<PrdData> | null,
  initialMarketAnalysis: any | null
): string {
  let prompt = BASE_SYSTEM_PROMPT;

  // Add initial market analysis context if available
  if (initialMarketAnalysis) {
    prompt += `

## 初始市场分析报告（已通过AI市场专家生成）

请基于这份市场分析报告来制定产品策略：

**市场规模评估**：${initialMarketAnalysis.marketSize || "暂无"}

**目标用户画像**：${initialMarketAnalysis.targetUserProfile || "暂无"}

**竞争格局预判**：${initialMarketAnalysis.competitionLandscape || "暂无"}

**定价策略建议**：${initialMarketAnalysis.pricingStrategy || "暂无"}

**差异化机会**：
${initialMarketAnalysis.differentiationOpportunities?.map((opp: string) => `- ${opp}`).join("\n") || "暂无"}

**重要**：在产品设计提案中，必须结合这份市场分析报告的洞察，让用户感受到数据驱动的专业性。`;
  }

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
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
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

    const prdDataRaw = project?.prd_data as Record<string, any> | null;
    const existingPrdData = prdDataRaw as Partial<PrdData> | null;
    const initialMarketAnalysis = prdDataRaw?.initialMarketAnalysis || null;

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
      existingPrdData,
      initialMarketAnalysis
    );
    
    const systemPromptWithStage = `${dynamicSystemPrompt}\n\n当前阶段：${currentStage} - ${stageName}`;

    // Use Lovable AI Gateway with google/gemini-3-pro-preview model
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
            ...messages.map((msg: { role: string; content: string }) => ({
              role: msg.role,
              content: msg.content,
            })),
          ],
          stream: true,
          temperature: 0.85,
          max_tokens: 16384,
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
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI 额度已用完，请充值后再试" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      console.error("Lovable AI Gateway error:", response.status, text);
      return new Response(JSON.stringify({ error: "AI 服务暂时不可用" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Collect full response for PRD extraction
    let fullResponse = "";

    // Stream is already OpenAI-compatible from Lovable AI Gateway, just extract PRD data
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
              const content = data.choices?.[0]?.delta?.content || "";
              
              if (content) {
                fullResponse += content;
              }
              // Pass through unchanged (already OpenAI format)
              controller.enqueue(chunk);
            } catch (e) {
              // Pass through unchanged for partial chunks
              controller.enqueue(chunk);
            }
          } else if (line.trim()) {
            // Pass through non-data lines
            controller.enqueue(new TextEncoder().encode(line + "\n"));
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
