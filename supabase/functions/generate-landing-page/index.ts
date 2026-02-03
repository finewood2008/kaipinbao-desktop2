import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface MarketingImageWithCopy {
  id: string;
  image_url: string;
  image_type: string;
  marketing_copy?: string;
}

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
  pricingStrategy?: string;
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
  marketingImages?: MarketingImageWithCopy[];
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

// Call Google Gemini API directly (Primary)
async function callGoogleDirect(strategyPrompt: string): Promise<string> {
  const GOOGLE_API_KEY = Deno.env.get("GOOGLE_API_KEY");
  if (!GOOGLE_API_KEY) {
    throw new Error("GOOGLE_API_KEY not configured");
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": GOOGLE_API_KEY,
      },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: SYSTEM_PROMPT }],
        },
        contents: [
          {
            role: "user",
            parts: [{ text: strategyPrompt }],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 4096,
        },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Google API error:", response.status, errorText);
    throw new Error(`Google API error: ${response.status}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

// Call Lovable AI Gateway (Fallback)
async function callLovableAI(strategyPrompt: string): Promise<string> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) {
    throw new Error("LOVABLE_API_KEY not configured");
  }

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: strategyPrompt },
      ],
    }),
  });

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error("Rate limit exceeded");
    }
    if (response.status === 402) {
      throw new Error("Payment required");
    }
    const errorText = await response.text();
    console.error("Lovable AI error:", response.status, errorText);
    throw new Error(`Lovable AI error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prdData, selectedImageUrl, targetMarket, visualAssets, templateStyle } = await req.json() as {
      prdData: PRDData;
      selectedImageUrl?: string;
      targetMarket?: string;
      visualAssets?: VisualAssets;
      templateStyle?: string;
    };

    // Get marketing images with their copy
    const marketingImagesWithCopy: MarketingImageWithCopy[] = visualAssets?.marketingImages || [];

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
Pricing Strategy: ${prdData.pricingStrategy || "N/A"}

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
Usage Scenarios: ${prdData.marketingAssets.usageScenarios?.join(", ") || "N/A"}
` : ""}

## AVAILABLE VISUAL ASSETS
- Product Hero Image: ${selectedImageUrl ? "Available" : "Not available"}
- Video for Hero Background: ${visualAssets?.videoUrl ? "Available" : "Not available"}
- Marketing Images with Copy: ${marketingImagesWithCopy.length} images available

## YOUR TASK
Design a comprehensive landing page strategy optimized for EMAIL COLLECTION as the primary conversion goal.
This is for MARKET VALIDATION - we want to test if there's genuine interest in this product before full launch.

Return a JSON object with these fields:
{
  "headline": "Compelling headline (max 8 words) - use power words, create curiosity",
  "subheadline": "Value proposition that addresses the #1 pain point (one sentence)",
  "painPoints": ["3-4 customer pain points - from competitor reviews, real user language"],
  "sellingPoints": ["3-4 key differentiators - specific, measurable benefits"],
  "trustBadges": ["✓ Trust signal 1", "✓ Trust signal 2", "✓ Trust signal 3"],
  "ctaText": "Action-oriented CTA (e.g., 'Get Early Access', 'Join Waitlist')",
  "urgencyMessage": "Scarcity/urgency message (e.g., 'Limited spots for beta testers')",
  "faqItems": [
    {"question": "What makes this product different?", "answer": "Detailed answer..."},
    {"question": "When will the product be available?", "answer": "Detailed answer..."},
    {"question": "Is there a money-back guarantee?", "answer": "Detailed answer..."},
    {"question": "How can I contact support?", "answer": "Detailed answer..."}
  ],
  "specifications": ["Feature 1", "Feature 2", "Feature 3", "Feature 4", "Feature 5", "Feature 6"],
  "usageScenarios": ["Scenario 1 description", "Scenario 2 description", "Scenario 3 description", "Scenario 4 description"],
  "socialProofItems": [
    {"name": "John D.", "role": "Early Adopter", "content": "This product changed how I..."},
    {"name": "Sarah M.", "role": "Tech Enthusiast", "content": "Finally, something that actually..."},
    {"name": "Mike R.", "role": "Professional User", "content": "I've tried many alternatives but..."}
  ],
  "colorScheme": {
    "primary": "Primary brand color hex",
    "accent": "CTA button color hex (high contrast)",
    "background": "Background color hex"
  }
}

CRITICAL: 
- All text content MUST be in English
- Focus on conversion, not description
- Make FAQ answers detailed and helpful (2-3 sentences each)
- Social proof should sound authentic and specific
- Specifications should highlight technical advantages
- Usage scenarios should help users visualize themselves using the product
Only return the JSON object, no other text.`;

    console.log("GenerateLandingPage: Attempting Google Direct API...");

    // Primary: Google Direct API
    let content: string;
    let usedFallback = false;

    try {
      content = await callGoogleDirect(strategyPrompt);
      console.log("GenerateLandingPage: Google Direct API succeeded");
    } catch (googleError) {
      console.warn("GenerateLandingPage: Google API failed, switching to Lovable AI...", googleError);
      usedFallback = true;
      content = await callLovableAI(strategyPrompt);
      console.log("GenerateLandingPage: Lovable AI fallback succeeded");
    }

    let strategy;
    try {
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || 
                        content.match(/```\s*([\s\S]*?)\s*```/) ||
                        [null, content];
      strategy = JSON.parse(jsonMatch[1] || content);
    } catch (e) {
      console.error("Failed to parse strategy:", e);
      // Fallback strategy
      strategy = {
        headline: `Discover ${prdData.name}`,
        subheadline: prdData.description || "Revolutionary innovation that changes everything",
        painPoints: prdData.pain_points || ["Frustrated with outdated solutions", "Tired of compromise", "Ready for change"],
        sellingPoints: prdData.selling_points || ["Cutting-edge design", "Premium quality", "Unbeatable value"],
        trustBadges: ["✓ 30-Day Money Back", "✓ Expert Designed", "✓ Trusted Worldwide"],
        ctaText: "Get Early Access",
        urgencyMessage: "Limited spots for beta testers",
        faqItems: [
          { question: "What makes this product different?", answer: "Our product combines innovative design with premium materials to deliver an unmatched experience. We've addressed common complaints found in competitor products." },
          { question: "When will the product be available?", answer: "We're launching to early subscribers first. Sign up now to be among the first to experience it and receive exclusive early-bird pricing." },
          { question: "Is there a money-back guarantee?", answer: "Yes! We offer a 30-day satisfaction guarantee. If you're not completely satisfied, we'll refund your purchase, no questions asked." },
          { question: "How can I contact support?", answer: "Our dedicated support team is available 24/7 via email. We typically respond within 2 hours during business hours." }
        ],
        specifications: prdData.coreFeatures || ["Premium Materials", "Ergonomic Design", "Long-lasting Battery", "Smart Connectivity", "Compact Size", "Easy Maintenance"],
        usageScenarios: prdData.marketingAssets?.usageScenarios || [
          "Perfect for daily commute and travel",
          "Ideal for home office setup",
          "Great for outdoor activities",
          "Essential for busy professionals"
        ],
        socialProofItems: [
          { name: "John D.", role: "Early Adopter", content: "This product exceeded my expectations. The quality is outstanding!" },
          { name: "Sarah M.", role: "Tech Enthusiast", content: "Finally, something that actually works as advertised. Highly recommended." },
          { name: "Mike R.", role: "Professional User", content: "I've tried many alternatives but this is by far the best solution I've found." }
        ],
        colorScheme: {
          primary: "#3B82F6",
          accent: "#8B5CF6",
          background: "#F8FAFC",
        },
      };
    }

    // Compile marketing images
    const allMarketingImages: Record<string, string | string[]> = {
      multiAngle: [],
    };

    // Add existing images
    for (const img of marketingImagesWithCopy) {
      if (img.image_type === "lifestyle") {
        allMarketingImages.lifestyle = img.image_url;
      } else if (img.image_type === "usage") {
        allMarketingImages.usage = img.image_url;
      } else if (img.image_type === "multi_angle") {
        (allMarketingImages.multiAngle as string[]).push(img.image_url);
      } else if (img.image_type === "detail") {
        allMarketingImages.detail = img.image_url;
      }
    }

    return new Response(
      JSON.stringify({
        strategy,
        marketingImages: allMarketingImages,
        marketingImagesWithCopy,
        heroImageUrl: selectedImageUrl || visualAssets?.selectedProductImage,
        videoUrl: visualAssets?.videoUrl,
        productImages: marketingImagesWithCopy.filter(img => img.image_type === "product").map(img => img.image_url),
        // New structured content
        faqItems: strategy?.faqItems || [],
        specifications: strategy?.specifications || [],
        usageScenarios: strategy?.usageScenarios || [],
        socialProofItems: strategy?.socialProofItems || [],
        urgencyMessage: strategy?.urgencyMessage || "",
        usedFallback,
        // Conversion optimization fields for frontend
        conversionOptimization: {
          primaryCta: strategy?.ctaText || "Get Early Access",
          urgencyMessage: strategy?.urgencyMessage || "Limited spots available",
          socialProof: strategy?.socialProofItems?.[0]?.content || "",
          benefitStatement: strategy?.subheadline || "",
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Generate landing page error:", error);
    
    if (error instanceof Error) {
      if (error.message.includes("Rate limit")) {
        return new Response(JSON.stringify({ error: "AI 请求频率过高，请稍后重试" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (error.message.includes("Payment required")) {
        return new Response(JSON.stringify({ error: "AI 额度已用完，请充值后再试" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }
    
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
