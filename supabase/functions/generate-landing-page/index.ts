import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface PRDData {
  name: string;
  description?: string;
  pain_points?: string[];
  selling_points?: string[];
  target_audience?: string;
  features?: string[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prdData, selectedImageUrl, targetMarket } = await req.json() as {
      prdData: PRDData;
      selectedImageUrl?: string;
      targetMarket?: string;
    };

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Step 1: Analyze PRD and generate landing page strategy using Gemini
    const strategyPrompt = `你是一位专业的营销专家和产品经理。请根据以下产品信息，为落地页生成详细的设计思路。

产品信息：
- 产品名称：${prdData.name}
- 产品描述：${prdData.description || "暂无描述"}
- 目标市场：${targetMarket || "中国市场"}
- 痛点：${prdData.pain_points?.join("、") || "暂无"}
- 卖点：${prdData.selling_points?.join("、") || "暂无"}
- 目标受众：${prdData.target_audience || "普通消费者"}

请以JSON格式返回落地页策略，包含以下字段：
{
  "headline": "吸引人的主标题",
  "subheadline": "副标题/价值主张",
  "painPoints": ["优化后的痛点1", "痛点2", "痛点3"],
  "sellingPoints": ["优化后的卖点1", "卖点2", "卖点3"],
  "trustBadges": ["信任标识1", "信任标识2", "信任标识3"],
  "ctaText": "行动号召按钮文案",
  "imagePrompts": {
    "lifestyle": "生活场景图的详细描述prompt",
    "usage": "使用场景图的详细描述prompt",
    "multiAngle": ["角度1描述", "角度2描述"]
  },
  "colorScheme": {
    "primary": "主色调建议",
    "accent": "强调色建议"
  }
}

只返回JSON，不要其他内容。`;

    const strategyResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "你是一位资深的产品营销专家。" },
          { role: "user", content: strategyPrompt },
        ],
      }),
    });

    if (!strategyResponse.ok) {
      const errorText = await strategyResponse.text();
      console.error("Strategy generation failed:", errorText);
      throw new Error("营销策略生成失败");
    }

    const strategyData = await strategyResponse.json();
    let strategy;
    try {
      const content = strategyData.choices?.[0]?.message?.content || "";
      // Extract JSON from possible markdown code blocks
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || 
                        content.match(/```\s*([\s\S]*?)\s*```/) ||
                        [null, content];
      strategy = JSON.parse(jsonMatch[1] || content);
    } catch (e) {
      console.error("Failed to parse strategy:", e);
      // Fallback strategy
      strategy = {
        headline: prdData.name,
        subheadline: prdData.description || "创新产品，改变生活",
        painPoints: prdData.pain_points || ["传统产品使用不便", "市场缺乏创新", "价格过高"],
        sellingPoints: prdData.selling_points || ["创新设计", "高品质材料", "性价比超高"],
        trustBadges: ["✓ 30天无理由退款", "✓ 专业团队研发", "✓ 全球用户信赖"],
        ctaText: "立即订阅",
        imagePrompts: {
          lifestyle: `${prdData.name} being used in a modern lifestyle setting, natural lighting, cozy atmosphere`,
          usage: `hands demonstrating ${prdData.name} usage, close-up product photography`,
          multiAngle: [`${prdData.name} front view`, `${prdData.name} side view`],
        },
      };
    }

    // Step 2: Generate marketing images using Nano Banana Pro
    const generateImage = async (prompt: string): Promise<string | null> => {
      try {
        const imagePrompt = `Professional marketing product photography:

${prompt}

STYLE REQUIREMENTS:
- Clean, modern aesthetic with soft natural lighting
- Lifestyle photography style suitable for landing page
- High-end e-commerce quality
- Warm, inviting atmosphere
- 16:9 aspect ratio for hero sections
- No text overlays on the image`;

        const imageResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-3-pro-image-preview",
            messages: [
              { role: "user", content: imagePrompt },
            ],
            modalities: ["image", "text"],
          }),
        });

        if (!imageResponse.ok) {
          console.error("Image generation failed:", await imageResponse.text());
          return null;
        }

        const imageData = await imageResponse.json();
        const imageUrl = imageData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
        return imageUrl || null;
      } catch (error) {
        console.error("Image generation error:", error);
        return null;
      }
    };

    // Generate images in parallel
    const imagePromises = [];
    
    // Lifestyle image
    if (strategy.imagePrompts?.lifestyle) {
      imagePromises.push(
        generateImage(strategy.imagePrompts.lifestyle).then(url => ({ type: "lifestyle", url }))
      );
    }

    // Usage image
    if (strategy.imagePrompts?.usage) {
      imagePromises.push(
        generateImage(strategy.imagePrompts.usage).then(url => ({ type: "usage", url }))
      );
    }

    // Multi-angle images (limit to 2 for speed)
    const multiAnglePrompts = (strategy.imagePrompts?.multiAngle || []).slice(0, 2);
    for (let i = 0; i < multiAnglePrompts.length; i++) {
      imagePromises.push(
        generateImage(multiAnglePrompts[i]).then(url => ({ type: `multiAngle_${i}`, url }))
      );
    }

    const imageResults = await Promise.all(imagePromises);
    
    const marketingImages: {
      lifestyle?: string;
      usage?: string;
      multiAngle: string[];
    } = {
      multiAngle: [],
    };

    for (const result of imageResults) {
      if (result.url) {
        if (result.type === "lifestyle") {
          marketingImages.lifestyle = result.url;
        } else if (result.type === "usage") {
          marketingImages.usage = result.url;
        } else if (result.type.startsWith("multiAngle_")) {
          marketingImages.multiAngle.push(result.url);
        }
      }
    }

    return new Response(
      JSON.stringify({
        strategy,
        marketingImages,
        heroImageUrl: selectedImageUrl,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Generate landing page error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
