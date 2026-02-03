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
  designStyleDetails?: {
    overallStyle?: string;
    colorTone?: string;
    surfaceTexture?: string;
    formLanguage?: string;
    materialPreference?: string;
    avoidElements?: string;
  };
  coreFeatures?: string[];
  coreFeaturesDetails?: Array<{
    feature: string;
    benefit?: string;
    implementation?: string;
    priority?: string;
  }>;
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

// AI Brand Strategy Expert System Prompt
const SYSTEM_PROMPT = `You are a world-class Brand Strategy Expert with 15 years of experience in cross-border e-commerce, DTC brand building, and luxury product marketing.

## Your Professional Background
- Former brand director at leading global agencies (IDEO, Pentagram, R/GA)
- Built and launched 50+ successful consumer brands
- Specialized in premium product positioning and visual identity
- Deep expertise in conversion-focused landing page design
- Master of color psychology and visual storytelling

## Core Mission
Based on the complete product definition provided, craft a compelling BRAND LANDING PAGE that:
1. Establishes strong brand identity and positioning
2. Creates emotional connection with target audience
3. Showcases product value through visual storytelling
4. Optimizes for email subscription conversion

## Brand Design Philosophy
1. **Hero Impact**: Full-screen hero with product as the visual anchor
2. **Brand Story Arc**: Pain → Solution → Deep Product Introduction → Trust → Action
3. **Visual Selling Points**: Every core feature paired with compelling imagery
4. **Scenario Immersion**: Help users visualize themselves using the product
5. **Trust Architecture**: Technical specs, social proof, FAQ to build confidence
6. **Single CTA Focus**: Email collection as the sole conversion goal

## Visual Style Decision Framework
Analyze the product category and target audience to determine:
- Color Mode: Light (premium, clean) vs Dark (tech, luxury, bold)
- Primary Color: Reflects brand personality and product category
- Accent Color: High-contrast CTA color for conversion
- Visual Tone: Minimalist, Bold, Elegant, Tech, Organic

## Copywriting Excellence
- ALL content MUST be in ENGLISH for international markets
- Headlines: Powerful, benefit-driven, max 8 words
- Subheadlines: Address primary pain point directly
- Body: Action-oriented, visual imagery, specific data points
- CTAs: Clear, urgent, value-focused`;

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
    const { prdData, selectedImageUrl, targetMarket, visualAssets } = await req.json() as {
      prdData: PRDData;
      selectedImageUrl?: string;
      targetMarket?: string;
      visualAssets?: VisualAssets;
    };

    // Get marketing images with their copy
    const marketingImagesWithCopy: MarketingImageWithCopy[] = visualAssets?.marketingImages || [];

    // Build comprehensive brand strategy prompt
    const strategyPrompt = `Based on the following complete product definition, create a compelling brand landing page strategy.

## PRODUCT INTELLIGENCE
Product Name: ${prdData.name}
Product Description: ${prdData.description || "N/A"}
Target Market: ${targetMarket || "International"}
Target Audience: ${prdData.target_audience || "General consumers"}
Usage Scenario: ${prdData.usageScenario || "N/A"}

## DESIGN DIRECTION (from PRD)
Overall Design Style: ${prdData.designStyle || "Modern minimalist"}
${prdData.designStyleDetails ? `
Detailed Style Preferences:
- Overall Style: ${prdData.designStyleDetails.overallStyle || "N/A"}
- Color Tone: ${prdData.designStyleDetails.colorTone || "N/A"}
- Surface Texture: ${prdData.designStyleDetails.surfaceTexture || "N/A"}
- Form Language: ${prdData.designStyleDetails.formLanguage || "N/A"}
- Material Preference: ${prdData.designStyleDetails.materialPreference || "N/A"}
- Elements to Avoid: ${prdData.designStyleDetails.avoidElements || "N/A"}
` : ""}

## CORE FEATURES
${prdData.coreFeaturesDetails?.map(f => `- ${f.feature}: ${f.benefit || ""} (Priority: ${f.priority || "medium"})`).join("\n") || prdData.coreFeatures?.join(", ") || prdData.features?.join(", ") || "N/A"}

## PAIN POINTS (from market research)
${prdData.pain_points?.join("\n- ") || "N/A"}

## SELLING POINTS
${prdData.selling_points?.join("\n- ") || "N/A"}

## PRICING STRATEGY
${prdData.pricingStrategy || "N/A"}

${prdData.competitorInsights ? `
## COMPETITOR INTELLIGENCE
Competitor Strengths: ${prdData.competitorInsights.positivePoints?.join(", ") || "N/A"}
Competitor Weaknesses (Our Opportunities): ${prdData.competitorInsights.negativePoints?.join(", ") || "N/A"}
Differentiation Strategy: ${prdData.competitorInsights.differentiationStrategy || "N/A"}
` : ""}

${prdData.marketingAssets ? `
## VISUAL CONTEXT (for copywriting reference)
Scene Description: ${prdData.marketingAssets.sceneDescription || "N/A"}
Structure Highlights: ${prdData.marketingAssets.structureHighlights?.join(", ") || "N/A"}
Lifestyle Context: ${prdData.marketingAssets.lifestyleContext || "N/A"}
Usage Scenarios: ${prdData.marketingAssets.usageScenarios?.join(", ") || "N/A"}
` : ""}

## AVAILABLE VISUAL ASSETS
- Product Hero Image: ${selectedImageUrl ? "Available ✓" : "Not available"}
- Video for Hero Background: ${visualAssets?.videoUrl ? "Available ✓" : "Not available"}
- Marketing Images with Copy: ${marketingImagesWithCopy.length} images available
  ${marketingImagesWithCopy.map(img => `  - ${img.image_type}: "${img.marketing_copy || 'no copy'}"`).join("\n")}

## YOUR TASK
Create a comprehensive brand landing page strategy. Based on the product category, target audience, and design preferences above, AUTOMATICALLY SELECT the most appropriate visual style.

### Visual Style Decision:
1. Analyze the product category (tech/lifestyle/luxury/wellness/etc.)
2. Consider the target audience demographics and preferences
3. Reference the design style preferences from PRD
4. Select appropriate color mode (light for premium/clean, dark for tech/luxury/bold)
5. Choose primary and accent colors that reflect brand personality

Return a JSON object with these fields:
{
  "headline": "Compelling headline (max 8 words) - use power words, create curiosity",
  "subheadline": "Value proposition that addresses the #1 pain point (one sentence)",
  "painPoints": ["3-4 customer pain points - from competitor reviews, real user language"],
  "sellingPoints": ["3-4 key differentiators - specific, measurable benefits"],
  "trustBadges": ["✓ Trust signal 1", "✓ Trust signal 2", "✓ Trust signal 3"],
  "ctaText": "Action-oriented CTA (e.g., 'Get Early Access', 'Join Waitlist')",
  "urgencyMessage": "Scarcity/urgency message (e.g., 'Limited spots for beta testers')",
  "colorScheme": {
    "primary": "#HEX - Primary brand color matching product personality",
    "accent": "#HEX - High-contrast CTA color for conversions",
    "background": "#HEX - Page background color",
    "mode": "light" or "dark" - based on product category and audience
  },
  "visualStyle": {
    "heroLayout": "split" or "centered" or "fullscreen",
    "cardStyle": "glass" or "solid" or "minimal",
    "animationLevel": "minimal" or "moderate" or "rich"
  },
  "faqItems": [
    {"question": "What makes this product different?", "answer": "Detailed answer (2-3 sentences)..."},
    {"question": "When will the product be available?", "answer": "Detailed answer..."},
    {"question": "Is there a money-back guarantee?", "answer": "Detailed answer..."},
    {"question": "How can I contact support?", "answer": "Detailed answer..."}
  ],
  "specifications": ["Feature 1", "Feature 2", "Feature 3", "Feature 4", "Feature 5", "Feature 6"],
  "usageScenarios": ["Scenario 1 description", "Scenario 2 description", "Scenario 3 description", "Scenario 4 description"],
  "socialProofItems": [
    {"name": "John D.", "role": "Early Adopter", "content": "Authentic testimonial (2-3 sentences)..."},
    {"name": "Sarah M.", "role": "Tech Enthusiast", "content": "Authentic testimonial..."},
    {"name": "Mike R.", "role": "Professional User", "content": "Authentic testimonial..."}
  ]
}

CRITICAL REQUIREMENTS:
- All text content MUST be in English
- colorScheme MUST be determined based on product category and design preferences
- For tech products: consider dark mode with cyan/blue accents
- For lifestyle/wellness products: consider light mode with warm/organic tones
- For luxury products: consider elegant dark or neutral tones with gold/amber accents
- For bold/youth brands: consider vibrant colors and high contrast
- FAQ answers should be detailed and helpful (2-3 sentences each)
- Social proof should sound authentic and specific
- Specifications should highlight technical advantages

Only return the JSON object, no other text.`;

    console.log("GenerateLandingPage: Attempting Google Direct API (Brand Strategy Expert)...");

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
      // Fallback strategy with smart defaults based on design style
      const isDarkProduct = prdData.designStyle?.toLowerCase().includes("tech") || 
                           prdData.designStyle?.toLowerCase().includes("科技") ||
                           prdData.designStyle?.toLowerCase().includes("dark");
      
      strategy = {
        headline: `Discover ${prdData.name}`,
        subheadline: prdData.description || "Revolutionary innovation that changes everything",
        painPoints: prdData.pain_points || ["Frustrated with outdated solutions", "Tired of compromise", "Ready for change"],
        sellingPoints: prdData.selling_points || ["Cutting-edge design", "Premium quality", "Unbeatable value"],
        trustBadges: ["✓ 30-Day Money Back", "✓ Expert Designed", "✓ Trusted Worldwide"],
        ctaText: "Get Early Access",
        urgencyMessage: "Limited spots for beta testers",
        colorScheme: {
          primary: isDarkProduct ? "#06B6D4" : "#3B82F6",
          accent: isDarkProduct ? "#8B5CF6" : "#EC4899",
          background: isDarkProduct ? "#0F172A" : "#FFFFFF",
          mode: isDarkProduct ? "dark" : "light"
        },
        visualStyle: {
          heroLayout: "split",
          cardStyle: "glass",
          animationLevel: "moderate"
        },
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
