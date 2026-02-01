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
  usageScenario?: string;
  designStyle?: string;
  coreFeatures?: string[];
  marketingAssets?: {
    sceneDescription?: string;
    structureHighlights?: string[];
    explodedComponents?: string[];
    usageScenarios?: string[];
    lifestyleContext?: string;
  };
  videoAssets?: {
    storyLine?: string;
    keyActions?: string[];
    emotionalTone?: string;
  };
  competitorInsights?: {
    positivePoints?: string[];
    negativePoints?: string[];
    differentiationStrategy?: string;
  };
}

interface VisualAssets {
  selectedProductImage?: string;
  marketingImages?: Array<{
    id: string;
    image_url: string;
    image_type: string;
  }>;
  videoUrl?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prdData, selectedImageUrl, targetMarket, visualAssets } = await req.json() as {
      prdData: PRDData;
      selectedImageUrl?: string;
      targetMarket?: string;
      visualAssets?: VisualAssets;
    };

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build comprehensive prompt with all PRD data
    const strategyPrompt = `你是一位专业的营销专家和产品经理。请根据以下产品信息，为落地页生成详细的设计思路。

产品信息：
- 产品名称：${prdData.name}
- 产品描述：${prdData.description || "暂无描述"}
- 目标市场：${targetMarket || "国际市场"}
- 使用场景：${prdData.usageScenario || "暂无"}
- 目标受众：${prdData.target_audience || "普通消费者"}
- 设计风格：${prdData.designStyle || "现代简约"}
- 核心功能：${prdData.coreFeatures?.join("、") || prdData.features?.join("、") || "暂无"}
- 痛点：${prdData.pain_points?.join("、") || "暂无"}
- 卖点：${prdData.selling_points?.join("、") || "暂无"}

${prdData.competitorInsights ? `
竞品洞察：
- 竞品优势：${prdData.competitorInsights.positivePoints?.join("、") || "暂无"}
- 竞品劣势（我们的机会）：${prdData.competitorInsights.negativePoints?.join("、") || "暂无"}
- 差异化策略：${prdData.competitorInsights.differentiationStrategy || "暂无"}
` : ""}

${prdData.marketingAssets ? `
营销素材描述：
- 场景描述：${prdData.marketingAssets.sceneDescription || "暂无"}
- 结构亮点：${prdData.marketingAssets.structureHighlights?.join("、") || "暂无"}
- 生活方式：${prdData.marketingAssets.lifestyleContext || "暂无"}
` : ""}

请以JSON格式返回落地页策略，包含以下字段：
{
  "headline": "吸引人的主标题（突出核心卖点）",
  "subheadline": "副标题/价值主张",
  "painPoints": ["基于竞品差评优化的痛点1", "痛点2", "痛点3"],
  "sellingPoints": ["突出差异化的卖点1", "卖点2", "卖点3"],
  "trustBadges": ["✓ 信任标识1", "✓ 信任标识2", "✓ 信任标识3"],
  "ctaText": "行动号召按钮文案",
  "imagePrompts": {
    "lifestyle": "生活场景图的详细描述prompt（如果需要AI补充生成）",
    "usage": "使用场景图的详细描述prompt",
    "detail": "产品细节图的详细描述prompt"
  },
  "colorScheme": {
    "primary": "主色调hex值",
    "accent": "强调色hex值",
    "background": "背景色hex值"
  },
  "sections": [
    {"type": "hero", "title": "主标题区域"},
    {"type": "pain_points", "title": "痛点共鸣区"},
    {"type": "solution", "title": "解决方案区"},
    {"type": "features", "title": "功能展示区"},
    {"type": "gallery", "title": "产品展示区"},
    {"type": "video", "title": "视频展示区"},
    {"type": "trust", "title": "信任背书区"},
    {"type": "cta", "title": "行动号召区"}
  ]
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
          { role: "system", content: "你是一位资深的产品营销专家，擅长打造高转化率的广告落地页。" },
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
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || 
                        content.match(/```\s*([\s\S]*?)\s*```/) ||
                        [null, content];
      strategy = JSON.parse(jsonMatch[1] || content);
    } catch (e) {
      console.error("Failed to parse strategy:", e);
      strategy = {
        headline: prdData.name,
        subheadline: prdData.description || "创新产品，改变生活",
        painPoints: prdData.pain_points || ["传统产品使用不便", "市场缺乏创新", "价格过高"],
        sellingPoints: prdData.selling_points || ["创新设计", "高品质材料", "性价比超高"],
        trustBadges: ["✓ 30天无理由退款", "✓ 专业团队研发", "✓ 全球用户信赖"],
        ctaText: "立即订阅",
        imagePrompts: {
          lifestyle: `${prdData.name} being used in a modern lifestyle setting`,
          usage: `hands demonstrating ${prdData.name} usage`,
          detail: `${prdData.name} close-up detail shot`,
        },
        colorScheme: {
          primary: "#3B82F6",
          accent: "#8B5CF6",
          background: "#F8FAFC",
        },
      };
    }

    // Determine which images need to be generated
    const existingImages = visualAssets?.marketingImages || [];
    const hasLifestyle = existingImages.some(img => img.image_type === "lifestyle");
    const hasUsage = existingImages.some(img => img.image_type === "usage");
    const hasDetail = existingImages.some(img => img.image_type === "detail");

    // Generate missing images
    const generateImage = async (prompt: string, imageType: string): Promise<{ type: string; url: string } | null> => {
      try {
        const imagePrompt = `Professional marketing product photography:

${prompt}

STYLE REQUIREMENTS:
- Clean, modern aesthetic with soft natural lighting
- Lifestyle photography style suitable for advertising landing page
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
        return imageUrl ? { type: imageType, url: imageUrl } : null;
      } catch (error) {
        console.error("Image generation error:", error);
        return null;
      }
    };

    // Generate images in parallel (only missing ones)
    const imagePromises = [];
    
    if (!hasLifestyle && strategy.imagePrompts?.lifestyle) {
      imagePromises.push(generateImage(strategy.imagePrompts.lifestyle, "lifestyle"));
    }

    if (!hasUsage && strategy.imagePrompts?.usage) {
      imagePromises.push(generateImage(strategy.imagePrompts.usage, "usage"));
    }

    if (!hasDetail && strategy.imagePrompts?.detail) {
      imagePromises.push(generateImage(strategy.imagePrompts.detail, "detail"));
    }

    const imageResults = await Promise.all(imagePromises);
    
    const generatedImages: Record<string, string> = {};
    for (const result of imageResults) {
      if (result?.url) {
        generatedImages[result.type] = result.url;
      }
    }

    // Compile all marketing images
    const allMarketingImages: Record<string, string | string[]> = {
      multiAngle: [],
    };

    // Add existing images
    for (const img of existingImages) {
      if (img.image_type === "lifestyle") {
        allMarketingImages.lifestyle = img.image_url;
      } else if (img.image_type === "usage") {
        allMarketingImages.usage = img.image_url;
      } else if (img.image_type === "multi_angle") {
        (allMarketingImages.multiAngle as string[]).push(img.image_url);
      }
    }

    // Add generated images
    for (const [type, url] of Object.entries(generatedImages)) {
      allMarketingImages[type] = url;
    }

    return new Response(
      JSON.stringify({
        strategy,
        marketingImages: allMarketingImages,
        generatedImages,
        heroImageUrl: selectedImageUrl || visualAssets?.selectedProductImage,
        videoUrl: visualAssets?.videoUrl,
        productImages: existingImages.filter(img => img.image_type === "product").map(img => img.image_url),
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
