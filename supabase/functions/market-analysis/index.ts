import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MARKET_ANALYST_SYSTEM_PROMPT = `你是一位资深市场分析专家，拥有15年消费电子和跨境电商行业经验。

## 你的专业背景
- 曾任职于Nielsen、Euromonitor等顶级市场研究机构
- 专精于竞品分析、市场趋势预测、用户需求洞察
- 擅长从零散数据中提炼可执行的产品策略

## 分析任务
基于提供的竞品数据（产品信息、价格、评分、用户评论），生成一份全面的市场分析报告。

## 输出格式
返回严格的JSON格式，不要包含markdown代码块标记：

{
  "marketOverview": {
    "competitorCount": 竞品数量,
    "priceDistribution": { "low": 低端占比百分数, "mid": 中端占比百分数, "high": 高端占比百分数 },
    "averageRating": 平均评分数字
  },
  "priceAnalysis": {
    "minPrice": "最低价格",
    "maxPrice": "最高价格",
    "sweetSpot": "甜点价格区间",
    "opportunityGap": "价格机会缺口描述"
  },
  "reviewInsights": {
    "positiveHighlights": ["好评点1", "好评点2", "好评点3"],
    "negativeHighlights": ["差评点1", "差评点2", "差评点3"],
    "unmetNeeds": ["未满足需求1", "未满足需求2"]
  },
  "differentiationOpportunities": ["差异化机会1", "差异化机会2", "差异化机会3"],
  "marketTrends": ["市场趋势1", "市场趋势2"],
  "strategicRecommendations": ["战略建议1", "战略建议2", "战略建议3"]
}

## 分析原则
1. 数据驱动：所有结论必须基于提供的数据
2. 可执行性：建议要具体、可操作
3. 差异化优先：重点发现市场空白和机会
4. 用户导向：从用户评论中提取真实痛点`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { projectId } = await req.json();

    if (!projectId) {
      return new Response(
        JSON.stringify({ success: false, error: "projectId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY not configured");
      return new Response(
        JSON.stringify({ success: false, error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch competitor products
    const { data: products, error: productsError } = await supabase
      .from("competitor_products")
      .select("*")
      .eq("project_id", projectId)
      .eq("status", "completed");

    if (productsError) {
      throw productsError;
    }

    if (!products || products.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "No competitor products found" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch reviews for all products
    const productIds = products.map(p => p.id);
    const { data: reviews, error: reviewsError } = await supabase
      .from("competitor_reviews")
      .select("*")
      .in("competitor_product_id", productIds);

    if (reviewsError) {
      console.error("Error fetching reviews:", reviewsError);
    }

    // Build analysis prompt with data
    const productSummaries = products.map(p => ({
      title: p.product_title || "Unknown",
      price: p.price || "N/A",
      rating: p.rating || "N/A",
      reviewCount: p.review_count || 0,
    }));

    const reviewTexts = (reviews || []).map(r => ({
      text: r.review_text.substring(0, 500),
      rating: r.rating,
    })).slice(0, 50); // Limit reviews to avoid token overflow

    const analysisPrompt = `请分析以下竞品数据，生成市场分析报告：

## 竞品列表
${JSON.stringify(productSummaries, null, 2)}

## 用户评论样本 (共${reviews?.length || 0}条)
${JSON.stringify(reviewTexts, null, 2)}

请基于以上数据，输出JSON格式的市场分析报告。`;

    console.log("Calling AI for market analysis...");

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-pro-preview",
        messages: [
          { role: "system", content: MARKET_ANALYST_SYSTEM_PROMPT },
          { role: "user", content: analysisPrompt }
        ],
        temperature: 0.3,
        max_tokens: 4000,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API error:", aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ success: false, error: "AI请求频率过高，请稍后重试" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ success: false, error: "AI额度已用完，请充值后再试" }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI request failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const analysisContent = aiData.choices?.[0]?.message?.content || "";

    console.log("AI response received, length:", analysisContent.length);

    // Parse JSON from response
    let analysis;
    try {
      // Try to extract JSON from potential markdown code blocks
      let jsonStr = analysisContent;
      const jsonMatch = analysisContent.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1].trim();
      }
      analysis = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      console.log("Raw response:", analysisContent.substring(0, 500));
      
      // Return a basic fallback analysis
      analysis = {
        marketOverview: {
          competitorCount: products.length,
          priceDistribution: { low: 33, mid: 34, high: 33 },
          averageRating: products.reduce((sum, p) => sum + (p.rating || 0), 0) / products.length || 0,
        },
        priceAnalysis: {
          minPrice: products[0]?.price || "N/A",
          maxPrice: products[products.length - 1]?.price || "N/A",
          sweetSpot: "待定",
          opportunityGap: "需要更多数据分析",
        },
        reviewInsights: {
          positiveHighlights: [],
          negativeHighlights: [],
          unmetNeeds: [],
        },
        differentiationOpportunities: ["分析数据不足，建议添加更多竞品"],
        marketTrends: [],
        strategicRecommendations: ["建议添加更多竞品链接以获得更准确的分析"],
      };
    }

    // Save analysis to project
    await supabase
      .from("projects")
      .update({
        prd_data: {
          marketAnalysis: analysis,
        },
      })
      .eq("id", projectId);

    return new Response(
      JSON.stringify({
        success: true,
        analysis,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Market analysis error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
