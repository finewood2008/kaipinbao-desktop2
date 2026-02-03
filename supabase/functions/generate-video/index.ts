import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.93.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Helper function to verify project ownership
async function verifyProjectOwnership(
  supabase: any,
  projectId: string,
  userId: string
): Promise<{ error?: string }> {
  const { data: project, error } = await supabase
    .from("projects")
    .select("user_id")
    .eq("id", projectId)
    .single();

  if (error || !project) {
    return { error: "Project not found" };
  }

  if (project.user_id !== userId) {
    return { error: "Forbidden: You don't have access to this project" };
  }

  return {};
}

interface PrdData {
  usageScenario?: string;
  usageScenarios?: string[];
  targetAudience?: string;
  coreFeatures?: string[];
  designStyle?: string;
  selectedDirection?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // Create client with user's auth token for verification
    const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } }
    });

    // Verify user token and get claims
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claimsData.claims.sub;
    if (!userId) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { 
      projectId, 
      sceneDescription, 
      parentImageId, 
      parentImageUrl, 
      duration = 6,
      prdData 
    } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    if (!projectId || !sceneDescription) {
      throw new Error("Project ID and scene description are required");
    }

    // Create Supabase client with service role for database operations
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Verify project ownership
    const ownershipCheck = await verifyProjectOwnership(supabase, projectId, userId);
    if (ownershipCheck.error) {
      return new Response(
        JSON.stringify({ error: ownershipCheck.error }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build enhanced video prompt with PRD context
    const videoPrompt = buildVideoPrompt(sceneDescription, parentImageUrl, prdData);

    // Create video record with pending status
    const { data: videoRecord, error: insertError } = await supabase
      .from("generated_videos")
      .insert({
        project_id: projectId,
        prompt: videoPrompt,
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

    // Attempt to generate video using Lovable AI Gateway
    try {
      // Call video generation API
      const videoResponse = await fetch("https://ai.gateway.lovable.dev/v1/video/generate", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: videoPrompt,
          duration: duration,
          starting_frame: parentImageUrl || undefined,
          resolution: "720p",
          aspect_ratio: "16:9",
        }),
      });

      if (videoResponse.ok) {
        const videoData = await videoResponse.json();
        const videoUrl = videoData.video_url || videoData.url;

        if (videoUrl) {
          // Update video record with completed status and URL
          await supabase
            .from("generated_videos")
            .update({ 
              status: "completed",
              video_url: videoUrl,
            })
            .eq("id", videoRecord.id);

          console.log(`Video generation completed for project ${projectId}, video ${videoRecord.id}`);

          // Return the updated video record
          return new Response(
            JSON.stringify({
              success: true,
              video: {
                ...videoRecord,
                status: "completed",
                video_url: videoUrl,
              },
              message: "Video generation completed successfully.",
            }),
            {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }
      }

      // If video generation failed or didn't return a URL, mark as pending
      await supabase
        .from("generated_videos")
        .update({ status: "pending" })
        .eq("id", videoRecord.id);

      console.log(`Video generation pending for project ${projectId}, video ${videoRecord.id}`);

    } catch (genError) {
      console.error("Video generation error:", genError);
      
      // Mark as pending instead of failed for graceful degradation
      await supabase
        .from("generated_videos")
        .update({ status: "pending" })
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

function buildVideoPrompt(
  sceneDescription: string, 
  parentImageUrl?: string,
  prdData?: PrdData
): string {
  // Build PRD context
  const prdParts: string[] = [];
  if (prdData?.selectedDirection) {
    prdParts.push(`Product: ${prdData.selectedDirection}`);
  }
  if (prdData?.targetAudience) {
    prdParts.push(`Target audience: ${prdData.targetAudience}`);
  }
  if (prdData?.designStyle) {
    prdParts.push(`Style: ${prdData.designStyle}`);
  }
  if (prdData?.coreFeatures?.length) {
    prdParts.push(`Key features: ${prdData.coreFeatures.join(", ")}`);
  }
  
  const prdContext = prdParts.length > 0 
    ? `\n\nPRODUCT CONTEXT:\n${prdParts.join("\n")}` 
    : "";

  const basePrompt = `Create a 6-second professional product video:

SCENE: ${sceneDescription}${prdContext}

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
