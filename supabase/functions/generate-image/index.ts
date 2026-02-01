import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, projectId } = await req.json();
    const GOOGLE_API_KEY = Deno.env.get("GOOGLE_API_KEY");

    if (!GOOGLE_API_KEY) {
      throw new Error("GOOGLE_API_KEY is not configured");
    }

    if (!prompt) {
      throw new Error("Prompt is required");
    }

    // Professional product photography prompt engineering
    const photographyParams = [
      // Lighting setup
      "three-point lighting setup with key light, fill light, and rim light",
      "soft diffused studio lighting with subtle gradient shadows",
      "professional product photography lighting with highlight control",
      
      // Background & Environment
      "seamless pure white cyclorama background (RGB 255,255,255)",
      "infinite white studio backdrop with subtle reflection plane",
      
      // Camera & Technical specs
      "shot with Phase One IQ4 150MP medium format camera",
      "100mm macro lens at f/11 for maximum sharpness",
      "focus stacked for edge-to-edge clarity",
      
      // Rendering quality
      "8K ultra high resolution render",
      "photorealistic CGI quality matching real photography",
      "ray-traced global illumination",
      "subsurface scattering for realistic materials",
      
      // Composition
      "hero product angle with 3/4 perspective view",
      "centered composition with balanced negative space",
      "product floating slightly with soft contact shadow",
      
      // Material rendering
      "accurate material representation with realistic textures",
      "subtle specular highlights showing surface quality",
      "color-accurate rendering for e-commerce standards"
    ];

    const enhancedPrompt = `Create a professional e-commerce product photograph:

PRODUCT: ${prompt}

PHOTOGRAPHY SPECIFICATIONS:
- ${photographyParams.slice(0, 3).join("\n- ")}

BACKGROUND: ${photographyParams.slice(3, 5).join("; ")}

CAMERA SETTINGS: ${photographyParams.slice(5, 8).join("; ")}

RENDER QUALITY: ${photographyParams.slice(8, 12).join("; ")}

COMPOSITION: ${photographyParams.slice(12, 15).join("; ")}

MATERIALS: ${photographyParams.slice(15).join("; ")}

OUTPUT: A single, clean, commercially-ready product image suitable for Amazon, Shopify, or premium e-commerce listings. The product should be the sole focus with no distracting elements, props, or text. Maintain accurate proportions and showcase the product's key design features and material quality.`;

    // Use Google AI Studio Gemini API for image generation
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent?key=${GOOGLE_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: enhancedPrompt }],
            },
          ],
          generationConfig: {
            responseModalities: ["TEXT", "IMAGE"],
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
      return new Response(JSON.stringify({ error: "图像生成失败" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    
    // Extract image from Google AI Studio response
    let imageUrl = null;
    let description = null;
    
    const candidates = data.candidates || [];
    for (const candidate of candidates) {
      const parts = candidate.content?.parts || [];
      for (const part of parts) {
        if (part.inlineData?.mimeType?.startsWith("image/")) {
          // Convert inline data to data URL
          imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
        if (part.text) {
          description = part.text;
        }
      }
    }

    if (!imageUrl) {
      console.error("No image in response:", JSON.stringify(data));
      return new Response(JSON.stringify({ error: "未能生成图像" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        imageUrl,
        description,
        prompt: enhancedPrompt,
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
