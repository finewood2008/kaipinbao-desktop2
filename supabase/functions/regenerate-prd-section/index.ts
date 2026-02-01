import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const sectionPrompts: Record<string, string> = {
  usageScenario: `Based on the product context provided, generate a detailed description of usage scenarios for this product. 
Include 3-5 specific scenarios where the product would be used, mentioning:
- Environment (indoor/outdoor, specific locations)
- Context (work, leisure, travel, etc.)
- User state (alone, with others, on the go, etc.)
Output in Chinese. Be specific and vivid.`,

  targetAudience: `Based on the product context provided, generate a detailed target audience description. Include:
- Age range and demographics
- Occupation or lifestyle
- Key pain points they experience
- What they value most in such products
- Purchasing behavior characteristics
Output in Chinese. Be specific and create a vivid persona.`,

  designStyle: `Based on the product context provided, generate a detailed design style description. Include:
- Material choices (metal, plastic, fabric, etc.)
- Color scheme (specific colors and their rationale)
- Form factor (rounded, angular, minimal, etc.)
- Texture and finish (matte, glossy, textured, etc.)
- Overall aesthetic direction
Output in Chinese. Be specific and aligned with the target audience.`,

  coreFeatures: `Based on the product context provided, generate a list of 4-6 core features. Each feature should:
- Address a specific user pain point
- Differentiate from competitors
- Be technically feasible
- Have clear user benefit
Output as a JSON array of strings in Chinese. Example: ["功能1", "功能2"]`,

  marketingAssets: `Based on the product context provided, generate marketing asset descriptions. Include:
- sceneDescription: A detailed scene for product photography (lighting, background, props)
- usageScenarios: 3 specific usage scenario descriptions for photos
- lifestyleContext: The lifestyle message to convey
Output as JSON object in Chinese. Example:
{
  "sceneDescription": "现代简约办公桌，柔和自然光...",
  "usageScenarios": ["场景1", "场景2", "场景3"],
  "lifestyleContext": "追求效率与品质的生活方式"
}`,

  videoAssets: `Based on the product context provided, generate video creative descriptions for a 6-second product video. Include:
- storyLine: A brief story arc (beginning, middle, end)
- keyActions: 2-3 key actions to show in the video
- emotionalTone: The emotional message to convey
Output as JSON object in Chinese. Example:
{
  "storyLine": "产品展开 → 使用中 → 收纳便携",
  "keyActions": ["单手折叠", "快速展开"],
  "emotionalTone": "专业高效"
}`,
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { projectId, section, currentPrdData } = await req.json();

    if (!projectId || !section) {
      return new Response(
        JSON.stringify({ error: "projectId and section are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const GOOGLE_API_KEY = Deno.env.get("GOOGLE_API_KEY");
    if (!GOOGLE_API_KEY) {
      throw new Error("GOOGLE_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get project info
    const { data: project } = await supabase
      .from("projects")
      .select("name, description")
      .eq("id", projectId)
      .single();

    // Get competitor insights
    const { data: competitors } = await supabase
      .from("competitor_products")
      .select("product_title, price, rating, review_count")
      .eq("project_id", projectId)
      .eq("status", "completed");

    // Build context
    let context = `产品项目: ${project?.name || "未命名"}
${project?.description ? `产品描述: ${project.description}` : ""}

当前PRD数据:
${currentPrdData?.usageScenario ? `- 使用场景: ${currentPrdData.usageScenario}` : ""}
${currentPrdData?.targetAudience ? `- 目标用户: ${currentPrdData.targetAudience}` : ""}
${currentPrdData?.designStyle ? `- 外观风格: ${currentPrdData.designStyle}` : ""}
${currentPrdData?.coreFeatures?.length ? `- 核心功能: ${currentPrdData.coreFeatures.join(", ")}` : ""}
`;

    if (competitors && competitors.length > 0) {
      context += `\n竞品分析:
${competitors.map((c: any) => `- ${c.product_title} (${c.price || "价格未知"}, ${c.rating || 0}★)`).join("\n")}`;
    }

    const sectionPrompt = sectionPrompts[section];
    if (!sectionPrompt) {
      return new Response(
        JSON.stringify({ error: `Unknown section: ${section}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Call Gemini API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GOOGLE_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `${context}\n\n${sectionPrompt}`,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 2048,
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error("Gemini API error:", error);
      throw new Error("AI generation failed");
    }

    const data = await response.json();
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // Parse the generated content based on section type
    let regeneratedContent: any;

    if (section === "coreFeatures") {
      // Extract JSON array from response
      const jsonMatch = generatedText.match(/\[[\s\S]*?\]/);
      if (jsonMatch) {
        try {
          regeneratedContent = JSON.parse(jsonMatch[0]);
        } catch {
          // If JSON parsing fails, split by newlines
          regeneratedContent = generatedText
            .split("\n")
            .filter((line: string) => line.trim().startsWith("-") || line.trim().startsWith("•"))
            .map((line: string) => line.replace(/^[-•]\s*/, "").trim());
        }
      } else {
        regeneratedContent = generatedText
          .split("\n")
          .filter((line: string) => line.trim().length > 0 && !line.startsWith("#"))
          .slice(0, 6);
      }
    } else if (section === "marketingAssets" || section === "videoAssets") {
      // Extract JSON object from response
      const jsonMatch = generatedText.match(/\{[\s\S]*?\}/);
      if (jsonMatch) {
        try {
          regeneratedContent = JSON.parse(jsonMatch[0]);
        } catch {
          regeneratedContent = { raw: generatedText };
        }
      } else {
        regeneratedContent = { raw: generatedText };
      }
    } else {
      // For text sections, clean up the response
      regeneratedContent = generatedText
        .replace(/^#+\s*/gm, "")
        .replace(/\*\*/g, "")
        .trim();
    }

    // Update the project with new content
    const updatedPrdData = { ...currentPrdData };
    if (section === "coreFeatures") {
      updatedPrdData.coreFeatures = regeneratedContent;
    } else if (section === "marketingAssets") {
      updatedPrdData.marketingAssets = regeneratedContent;
    } else if (section === "videoAssets") {
      updatedPrdData.videoAssets = regeneratedContent;
    } else {
      (updatedPrdData as any)[section] = regeneratedContent;
    }

    await supabase
      .from("projects")
      .update({ prd_data: updatedPrdData })
      .eq("id", projectId);

    return new Response(
      JSON.stringify({ success: true, regeneratedContent }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Regenerate error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
