import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are an expert digital marketing strategist specializing in cross-border e-commerce and product launch campaigns. Generate comprehensive advertising strategies for new products.

Your output MUST be valid JSON with the following structure:
{
  "audiencePersonas": [
    {
      "name": "Persona name (e.g., 'Tech-Savvy Millennial')",
      "age": "Age range (e.g., '25-34')",
      "gender": "Target gender or 'All'",
      "interests": ["Interest 1", "Interest 2", "Interest 3"],
      "painPoints": ["Pain point 1", "Pain point 2"],
      "platforms": ["Platform 1", "Platform 2"],
      "buyingBehavior": "Description of buying behavior",
      "estimatedReach": "Estimated audience size"
    }
  ],
  "abTestCopies": [
    {
      "version": "A",
      "headline": "Ad headline",
      "primaryText": "Main ad copy",
      "callToAction": "CTA button text",
      "angle": "Marketing angle description",
      "targetEmotion": "Primary emotion to trigger"
    }
  ],
  "marketPotential": {
    "score": 85,
    "level": "High/Medium/Low",
    "factors": [
      {"name": "Factor name", "score": 80, "comment": "Brief explanation"}
    ],
    "recommendations": ["Recommendation 1", "Recommendation 2"]
  },
  "budgetEstimate": {
    "dailyBudget": "$50-100",
    "estimatedCPC": "$0.50-1.20",
    "estimatedCPM": "$8-15",
    "testDuration": "7-14 days",
    "minimumTestBudget": "$350-700"
  }
}

Generate 3 distinct audience personas and 3 A/B test copy variations. All copy should be in English for international markets.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { productName, productDescription, painPoints, sellingPoints } = await req.json();
    const GOOGLE_API_KEY = Deno.env.get("GOOGLE_API_KEY");

    if (!GOOGLE_API_KEY) {
      throw new Error("GOOGLE_API_KEY is not configured");
    }

    const userPrompt = `Generate a comprehensive advertising strategy for the following product:

PRODUCT NAME: ${productName}

PRODUCT DESCRIPTION: ${productDescription || "A new innovative product"}

PAIN POINTS IT SOLVES:
${painPoints?.map((p: string) => `- ${p}`).join("\n") || "- General consumer pain points"}

KEY SELLING POINTS:
${sellingPoints?.map((p: string) => `- ${p}`).join("\n") || "- Innovative features"}

Please generate:
1. 3 detailed audience personas for Meta/TikTok advertising
2. 3 A/B test ad copy variations with different marketing angles
3. Market potential assessment with scoring
4. Budget recommendations for testing phase

Return ONLY valid JSON, no additional text.`;

    // Use Google AI Studio Gemini API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GOOGLE_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: SYSTEM_PROMPT }],
          },
          contents: [
            {
              parts: [{ text: userPrompt }],
            },
          ],
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

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!content) {
      throw new Error("No content in AI response");
    }

    // Parse JSON from response (handle potential markdown code blocks)
    let strategyData;
    try {
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/```\s*([\s\S]*?)\s*```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : content;
      strategyData = JSON.parse(jsonStr.trim());
    } catch (parseError) {
      console.error("JSON parse error:", parseError, "Content:", content);
      throw new Error("Failed to parse AI response as JSON");
    }

    return new Response(JSON.stringify(strategyData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Generate ad strategy error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
