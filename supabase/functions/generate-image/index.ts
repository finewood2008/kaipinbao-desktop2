import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface PrdData {
  usageScenario?: string;
  usageScenarios?: string[];
  targetAudience?: string;
  coreFeatures?: string[];
  designStyle?: string;
  selectedDirection?: string;
}

// Build context from PRD data
function buildPrdContext(prdData?: PrdData): string {
  if (!prdData) return "";
  
  const parts: string[] = [];
  
  if (prdData.selectedDirection) {
    parts.push(`产品方向：${prdData.selectedDirection}`);
  }
  if (prdData.targetAudience) {
    parts.push(`目标用户：${prdData.targetAudience}`);
  }
  if (prdData.usageScenario) {
    parts.push(`使用场景：${prdData.usageScenario}`);
  }
  if (prdData.usageScenarios?.length) {
    parts.push(`使用场景：${prdData.usageScenarios.join("、")}`);
  }
  if (prdData.coreFeatures?.length) {
    parts.push(`核心功能：${prdData.coreFeatures.join("、")}`);
  }
  if (prdData.designStyle) {
    parts.push(`设计风格：${prdData.designStyle}`);
  }
  
  return parts.length > 0 ? `\n\n产品定义：\n${parts.join("\n")}` : "";
}

// Generate marketing copy based on image type and PRD data
async function generateMarketingCopy(
  imageType: string, 
  prdData: PrdData | undefined,
  apiKey: string
): Promise<string | null> {
  try {
    const imageTypeLabels: Record<string, string> = {
      scene: "场景图",
      structure: "结构图",
      exploded: "爆炸图",
      usage: "使用图",
      lifestyle: "生活方式图",
      detail: "细节图",
      comparison: "对比图",
    };

    const typeLabel = imageTypeLabels[imageType] || "营销图";
    const prdContext = buildPrdContext(prdData);
    
    const prompt = `为一张产品${typeLabel}生成简短的营销文案（1-2句话，不超过50字）。文案要吸引人、突出产品价值。${prdContext}

要求：
- 简洁有力，易于理解
- 突出产品的独特卖点
- 适合社交媒体或电商平台使用
- 不要使用引号包裹

只输出文案内容，不要任何其他解释。`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      console.error("Failed to generate marketing copy:", response.status);
      return null;
    }

    const data = await response.json();
    const copy = data.choices?.[0]?.message?.content?.trim();
    return copy || null;
  } catch (error) {
    console.error("Error generating marketing copy:", error);
    return null;
  }
}

// Prompt engineering templates for different image types
function buildPromptForImageType(
  basePrompt: string, 
  imageType: string, 
  phase: number,
  parentImageUrl?: string,
  prdData?: PrdData
): string {
  const prdContext = buildPrdContext(prdData);
  
  const commonQuality = `
RENDER QUALITY:
- 8K ultra high resolution render
- Photorealistic CGI quality matching real photography
- Ray-traced global illumination
- Accurate material representation with realistic textures
- Color-accurate rendering for e-commerce standards`;

  if (phase === 1 || imageType === "product") {
    // Phase 1: Product design - pure white background
    return `Create a professional e-commerce product photograph:

PRODUCT: ${basePrompt}${prdContext}

PHOTOGRAPHY SPECIFICATIONS:
- Three-point lighting setup with key light, fill light, and rim light
- Soft diffused studio lighting with subtle gradient shadows
- Professional product photography lighting with highlight control

BACKGROUND: Seamless pure white cyclorama background (RGB 255,255,255); Infinite white studio backdrop with subtle reflection plane

CAMERA SETTINGS: Shot with Phase One IQ4 150MP medium format camera; 100mm macro lens at f/11 for maximum sharpness; Focus stacked for edge-to-edge clarity
${commonQuality}

COMPOSITION: Hero product angle with 3/4 perspective view; Centered composition with balanced negative space; Product floating slightly with soft contact shadow

OUTPUT: A single, clean, commercially-ready product image suitable for Amazon, Shopify, or premium e-commerce listings. The product should be the sole focus with no distracting elements, props, or text. Maintain accurate proportions and showcase the product's key design features and material quality.`;
  }

  // Phase 2: Marketing images based on type
  const referenceNote = parentImageUrl 
    ? `\n\nREFERENCE: The product should match the design established in the reference image. Maintain consistent product appearance, colors, and proportions.`
    : "";

  switch (imageType) {
    case "scene":
      return `Create a lifestyle product scene photograph:

PRODUCT: ${basePrompt}${prdContext}

SCENE REQUIREMENTS:
- Product naturally placed in an authentic, lifestyle environment
- Soft, natural lighting (golden hour or diffused daylight)
- Subtle depth of field with product in sharp focus
- Environment complements but doesn't distract from the product
- Warm, inviting atmosphere

MOOD: Aspirational lifestyle, premium quality, authentic usage context
${commonQuality}

OUTPUT: A beautiful lifestyle photograph showing the product in its natural usage environment. The scene should tell a story and evoke desire for the product.${referenceNote}`;

    case "structure":
      return `Create a technical structure visualization:

PRODUCT: ${basePrompt}${prdContext}

VISUALIZATION REQUIREMENTS:
- Semi-transparent outer shell revealing internal structure
- Clean, technical illustration style
- Component labels and callouts where appropriate
- Blue-tinted technical color scheme
- Precise engineering accuracy

STYLE: Technical illustration, cutaway view, component breakdown
${commonQuality}

OUTPUT: A clear technical diagram showing the internal structure and key components of the product. Professional engineering visualization quality.${referenceNote}`;

    case "exploded":
      return `Create an exploded view diagram:

PRODUCT: ${basePrompt}${prdContext}

EXPLODED VIEW REQUIREMENTS:
- All components separated and arranged along central axis
- Clear spatial hierarchy showing assembly order
- Each part distinctly visible and identifiable
- Connecting lines or paths showing assembly relationships
- Clean white or light gradient background

STYLE: Technical exploded view, isometric perspective, assembly diagram
${commonQuality}

OUTPUT: A professional exploded view showing all product components in their relative positions with clear visual separation.${referenceNote}`;

    case "usage":
      return `Create a product usage photograph:

PRODUCT: ${basePrompt}${prdContext}

USAGE SCENE REQUIREMENTS:
- Show a person naturally interacting with/using the product
- Natural, authentic body language and expressions
- Focus on the interaction point between user and product
- Warm, inviting lighting
- Lifestyle context that resonates with target audience

MOOD: Natural, authentic, relatable, aspirational
${commonQuality}

OUTPUT: An authentic photograph of someone using the product in a natural way. The image should help potential customers visualize themselves using the product.${referenceNote}`;

    case "lifestyle":
      return `Create a brand lifestyle photograph:

PRODUCT: ${basePrompt}${prdContext}

LIFESTYLE REQUIREMENTS:
- Product integrated into a curated lifestyle setting
- Premium, aspirational aesthetic
- Cohesive color palette and styling
- Story-telling composition
- Editorial-quality photography style

MOOD: Premium, aspirational, brand-aligned, magazine-quality
${commonQuality}

OUTPUT: A beautiful lifestyle photograph that positions the product within an aspirational lifestyle context. Think premium magazine editorial quality.${referenceNote}`;

    case "detail":
      return `Create a product detail macro photograph:

PRODUCT: ${basePrompt}${prdContext}

DETAIL REQUIREMENTS:
- Extreme close-up of key product feature or texture
- Shallow depth of field highlighting specific detail
- Professional macro photography lighting
- Showcase material quality and craftsmanship
- Sharp focus on the detail area

STYLE: Macro photography, texture detail, craftsmanship showcase
${commonQuality}

OUTPUT: A stunning close-up photograph that highlights the quality, texture, and craftsmanship of a specific product detail.${referenceNote}`;

    case "comparison":
      return `Create a before/after or comparison image:

PRODUCT: ${basePrompt}${prdContext}

COMPARISON REQUIREMENTS:
- Split or side-by-side comparison layout
- Clear visual distinction between scenarios
- Highlight the improvement or benefit
- Consistent lighting and perspective in both halves
- Clean, professional presentation

STYLE: Comparison, before/after, problem-solution
${commonQuality}

OUTPUT: A clear comparison image showing the problem being solved or improvement being made, effectively communicating the product's value proposition.${referenceNote}`;

    default:
      // Custom or fallback
      return `Create a professional marketing photograph:

PRODUCT: ${basePrompt}${prdContext}
${commonQuality}

OUTPUT: A high-quality marketing photograph suitable for advertising and promotional use.${referenceNote}`;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      prompt, 
      projectId, 
      imageType = "product", 
      phase = 1,
      parentImageId,
      parentImageUrl,
      prdData
    } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    if (!prompt) {
      throw new Error("Prompt is required");
    }

    // Build prompt based on image type, phase, and PRD data
    const enhancedPrompt = buildPromptForImageType(prompt, imageType, phase, parentImageUrl, prdData);

    // Use Lovable AI Gateway with Nano Banana Pro model for high-quality image generation
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-pro-image-preview",
        messages: [
          { role: "user", content: enhancedPrompt },
        ],
        modalities: ["image", "text"],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "请求过于频繁，请稍后再试" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "API 额度已用完，请充值后再试" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      console.error("Lovable AI Gateway error:", response.status, text);
      return new Response(JSON.stringify({ error: "图像生成失败" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    
    // Extract image from Lovable AI Gateway response
    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    const description = data.choices?.[0]?.message?.content;

    if (!imageUrl) {
      console.error("No image in response:", JSON.stringify(data));
      return new Response(JSON.stringify({ error: "未能生成图像" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate marketing copy for phase 2 images
    let marketingCopy: string | null = null;
    if (phase === 2 && imageType !== "product") {
      marketingCopy = await generateMarketingCopy(imageType, prdData, LOVABLE_API_KEY);
    }

    return new Response(
      JSON.stringify({
        imageUrl,
        description,
        prompt: enhancedPrompt,
        imageType,
        phase,
        marketingCopy,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Generate image error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
