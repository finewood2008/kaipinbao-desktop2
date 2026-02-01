import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.93.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { projectId, sceneDescription, parentImageId, parentImageUrl, duration = 6 } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase credentials not configured");
    }

    if (!projectId || !sceneDescription) {
      throw new Error("Project ID and scene description are required");
    }

    // Create Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Create video record with pending status
    const { data: videoRecord, error: insertError } = await supabase
      .from("generated_videos")
      .insert({
        project_id: projectId,
        prompt: sceneDescription,
        scene_description: sceneDescription,
        duration_seconds: duration,
        status: "processing",
        parent_image_id: parentImageId || null,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Failed to create video record:", insertError);
      throw new Error("Failed to create video record");
    }

    // Build video generation prompt
    const videoPrompt = buildVideoPrompt(sceneDescription, parentImageUrl);

    // Note: This is a placeholder for actual video generation
    // In production, this would call Google Veo 2 or similar video generation API
    // For now, we'll simulate the process and update status
    
    // Attempt to generate video using Lovable AI Gateway
    // Currently video generation may not be available, so we handle gracefully
    try {
      // Simulating video generation process
      // In a real implementation, you would call the video generation API here
      // const response = await fetch("https://ai.gateway.lovable.dev/v1/video/generate", {...});
      
      // For now, mark as pending for manual processing or future API integration
      await supabase
        .from("generated_videos")
        .update({ 
          status: "pending",
          // video_url would be set here when actual video is generated
        })
        .eq("id", videoRecord.id);

      console.log(`Video generation initiated for project ${projectId}, video ${videoRecord.id}`);

    } catch (genError) {
      console.error("Video generation error:", genError);
      
      await supabase
        .from("generated_videos")
        .update({ status: "failed" })
        .eq("id", videoRecord.id);
    }

    // Return the video record (client will poll for status updates)
    return new Response(
      JSON.stringify({
        success: true,
        video: videoRecord,
        message: "Video generation task created. Check status for updates.",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error("Generate video error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

function buildVideoPrompt(sceneDescription: string, parentImageUrl?: string): string {
  const basePrompt = `Create a 6-second professional product video:

SCENE: ${sceneDescription}

VIDEO SPECIFICATIONS:
- Duration: 6 seconds
- Resolution: 720p or higher
- Frame rate: 24fps
- Style: Cinematic product showcase

CINEMATOGRAPHY:
- Smooth camera movement (slow pan, gentle rotation, or subtle zoom)
- Professional lighting with soft shadows
- Clean, uncluttered background appropriate to the scene
- Focus on product details and usability

MOOD & TONE:
- Professional and premium feel
- Natural and authentic interaction
- Warm, inviting color grading
- Subtle depth of field for cinematic look

OUTPUT: A seamless, looping-friendly product video suitable for marketing and e-commerce use.`;

  if (parentImageUrl) {
    return `${basePrompt}\n\nREFERENCE PRODUCT IMAGE: The product should match the design shown in the reference image.`;
  }

  return basePrompt;
}
