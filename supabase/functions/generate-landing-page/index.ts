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

// AI Advertising Expert System Prompt
const SYSTEM_PROMPT = `You are a world-class AI Advertising Expert with 15 years of experience in cross-border e-commerce and DTC brand advertising.

## Your Professional Background
- Former core member of advertising teams at Meta, Google, and TikTok
- Managed over $50 million in advertising budgets
- Specialized in new product market validation and cold-start strategies
- Deep expertise in Facebook/Instagram/Google Ads best practices

## Core Mission
You are designing an advertising landing page for a BRAND NEW PRODUCT. The core purpose of this landing page is:
**To validate market interest and acceptance of this new product through email subscription collection**

## Design Principles
1. **AIDA Model**: Attention → Interest → Desire → Action
2. **Pain Point Resonance**: Use real user pain points from competitor reviews to build empathy
3. **Differentiated Value**: Highlight core differences from competitors
4. **Urgency Creation**: Use "limited", "early access", "exclusive" to boost conversions
5. **Trust Building**: Show social proof and professional endorsements
6. **Single Clear CTA**: One page, one core action - email subscription

## Copywriting Style
- Target international markets, ALL content MUST be in ENGLISH
- Concise and powerful, every sentence has a clear purpose
- Action-oriented language, create visual imagery
- Data-driven, use specific numbers to enhance persuasion`;

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

    // Build comprehensive prompt with professional advertising strategy analysis
    const strategyPrompt = `Based on the following product intelligence, design a high-converting landing page strategy.

## PRODUCT INTELLIGENCE
Product Name: ${prdData.name}
Product Description: ${prdData.description || "N/A"}
Target Market: ${targetMarket || "International"}
Target Audience: ${prdData.target_audience || "General consumers"}
Usage Scenario: ${prdData.usageScenario || "N/A"}
Design Style: ${prdData.designStyle || "Modern minimalist"}
Core Features: ${prdData.coreFeatures?.join(", ") || prdData.features?.join(", ") || "N/A"}
Pain Points (from PRD): ${prdData.pain_points?.join(", ") || "N/A"}
Selling Points: ${prdData.selling_points?.join(", ") || "N/A"}

${prdData.competitorInsights ? `
## COMPETITOR INTELLIGENCE
Competitor Strengths: ${prdData.competitorInsights.positivePoints?.join(", ") || "N/A"}
Competitor Weaknesses (Our Opportunities): ${prdData.competitorInsights.negativePoints?.join(", ") || "N/A"}
Differentiation Strategy: ${prdData.competitorInsights.differentiationStrategy || "N/A"}
` : ""}

${prdData.marketingAssets ? `
## VISUAL CONTEXT
Scene Description: ${prdData.marketingAssets.sceneDescription || "N/A"}
Structure Highlights: ${prdData.marketingAssets.structureHighlights?.join(", ") || "N/A"}
Lifestyle Context: ${prdData.marketingAssets.lifestyleContext || "N/A"}
` : ""}

## YOUR TASK
Design a landing page strategy optimized for EMAIL COLLECTION as the primary conversion goal.
This is for MARKET VALIDATION - we want to test if there's genuine interest in this product before full launch.

Return a JSON object with these fields:
{
  "headline": "Compelling headline (max 8 words) - use power words, create curiosity",
  "subheadline": "Value proposition that addresses the #1 pain point",
  "painPoints": ["3 customer pain points - from competitor reviews, real user language"],
  "sellingPoints": ["3 key differentiators - specific, measurable benefits"],
  "trustBadges": ["✓ Trust signal 1", "✓ Trust signal 2", "✓ Trust signal 3"],
  "ctaText": "Action-oriented CTA (e.g., 'Get Early Access', 'Join Waitlist')",
  "urgencyMessage": "Scarcity/urgency message (e.g., 'Limited spots for beta testers')",
  "socialProof": "Social proof statement (e.g., 'Join 1,000+ who signed up this week')",
  "benefitStatement": "One-liner benefit that removes friction for signing up",
  "imagePrompts": {
    "hero": "Hero image prompt - lifestyle setting showing product in use",
    "lifestyle": "Secondary lifestyle image prompt",
    "detail": "Product detail close-up prompt"
  },
  "colorScheme": {
    "primary": "Primary brand color hex",
    "accent": "CTA button color hex (high contrast)",
    "background": "Background color hex"
  },
  "pageFlow": [
    {"section": "hero", "purpose": "Grab attention, state value prop"},
    {"section": "pain_points", "purpose": "Build empathy"},
    {"section": "solution", "purpose": "Present product as answer"},
    {"section": "benefits", "purpose": "Highlight key features"},
    {"section": "social_proof", "purpose": "Build trust"},
    {"section": "cta", "purpose": "Drive email signup"}
  ]
}

CRITICAL: All text content MUST be in English. Focus on conversion, not description.
Only return the JSON object, no other text.`;

    const strategyResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-pro-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: strategyPrompt },
        ],
      }),
    });

    if (!strategyResponse.ok) {
      if (strategyResponse.status === 429) {
        return new Response(JSON.stringify({ error: "AI 请求频率过高，请稍后重试" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (strategyResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI 额度已用完，请充值后再试" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
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
        headline: `Discover ${prdData.name}`,
        subheadline: prdData.description || "Revolutionary innovation that changes everything",
        painPoints: prdData.pain_points || ["Frustrated with outdated solutions", "Tired of compromise", "Ready for change"],
        sellingPoints: prdData.selling_points || ["Cutting-edge design", "Premium quality", "Unbeatable value"],
        trustBadges: ["✓ 30-Day Money Back", "✓ Expert Designed", "✓ Trusted Worldwide"],
        ctaText: "Get Early Access",
        urgencyMessage: "Limited spots for beta testers",
        socialProof: "Join early adopters shaping the future",
        benefitStatement: "Be the first to experience the difference",
        imagePrompts: {
          hero: `${prdData.name} being used in a modern lifestyle setting`,
          lifestyle: `hands demonstrating ${prdData.name} usage`,
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
        // Conversion optimization fields for frontend
        conversionOptimization: {
          primaryCta: strategy?.ctaText || "Get Early Access",
          urgencyMessage: strategy?.urgencyMessage || "Limited spots available",
          socialProof: strategy?.socialProof || "",
          benefitStatement: strategy?.benefitStatement || "",
        },
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
