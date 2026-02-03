import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.93.3";
import {
  GoogleGenAI,
} from "https://esm.sh/@google/genai@0.14.1";

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

// Fetch image and convert to base64
async function fetchImageAsBase64(imageUrl: string): Promise<{ base64: string; mimeType: string }> {
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.status}`);
  }
  
  const contentType = response.headers.get("content-type") || "image/png";
  const arrayBuffer = await response.arrayBuffer();
  const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
  
  return { base64, mimeType: contentType };
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
    const GOOGLE_API_KEY = Deno.env.get("GOOGLE_API_KEY");
    
    if (!GOOGLE_API_KEY) {
      throw new Error("GOOGLE_API_KEY is not configured");
    }

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
    const videoPrompt = buildVideoPrompt(sceneDescription, prdData);

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

    // Initialize Google GenAI
    const ai = new GoogleGenAI({ apiKey: GOOGLE_API_KEY });

    // Attempt to generate video using Google Veo
    try {
      let operation;
      
      if (parentImageUrl) {
        // Image-to-video generation - maintain product consistency
        console.log("Using image-to-video mode with parent image:", parentImageUrl);
        
        const { base64, mimeType } = await fetchImageAsBase64(parentImageUrl);
        
        const imageToVideoPrompt = `基于这个产品图片生成6秒的产品展示视频。

${videoPrompt}

【最重要的要求】
这是产品营销视频。产品的外观必须与图片中100%一致：
- 产品形状、颜色、材质不能有任何改变
- 产品设计细节必须完全保留
- 只添加轻微的相机运动和环境光线变化
- 产品始终是画面焦点`;

        operation = await ai.models.generateVideos({
          model: "veo-2.0-generate-001",
          prompt: imageToVideoPrompt,
          image: {
            imageBytes: base64,
            mimeType: mimeType,
          },
          config: {
            personGeneration: "dont_allow",
            aspectRatio: "16:9",
            numberOfVideos: 1,
          },
        });
      } else {
        // Text-to-video generation
        operation = await ai.models.generateVideos({
          model: "veo-2.0-generate-001",
          prompt: videoPrompt,
          config: {
            personGeneration: "dont_allow",
            aspectRatio: "16:9",
            numberOfVideos: 1,
          },
        });
      }

      // Poll for video generation completion
      let attempts = 0;
      const maxAttempts = 60; // Max 5 minutes (5s interval)
      
      while (!operation.done && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        operation = await ai.operations.getVideosOperation({
          operation: operation,
        });
        attempts++;
        console.log(`Video generation attempt ${attempts}/${maxAttempts}, done: ${operation.done}`);
      }

      if (operation.done && operation.response?.generatedVideos?.[0]) {
        const video = operation.response.generatedVideos[0];
        const videoUrl = video.video?.uri;

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

      // If video generation didn't complete, mark as pending
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
  prdData?: PrdData
): string {
  // Build PRD context
  const prdParts: string[] = [];
  if (prdData?.selectedDirection) {
    prdParts.push(`产品：${prdData.selectedDirection}`);
  }
  if (prdData?.targetAudience) {
    prdParts.push(`目标用户：${prdData.targetAudience}`);
  }
  if (prdData?.designStyle) {
    prdParts.push(`设计风格：${prdData.designStyle}`);
  }
  if (prdData?.coreFeatures?.length) {
    prdParts.push(`核心功能：${prdData.coreFeatures.join("、")}`);
  }
  
  const prdContext = prdParts.length > 0 
    ? `\n\n产品信息：\n${prdParts.join("\n")}` 
    : "";

  return `创建一个6秒的专业产品展示视频：

场景描述：${sceneDescription}${prdContext}

【视频规格】
- 时长：6秒
- 分辨率：720p或更高
- 帧率：24fps
- 风格：电影级产品展示

【摄影要求】
- 流畅的相机运动（慢速平移、轻柔旋转或微妙变焦）
- 专业灯光配合柔和阴影
- 干净整洁的背景，与场景相协调
- 聚焦产品细节和可用性

【氛围与基调】
- 专业高端感
- 自然真实的呈现
- 温暖舒适的色彩调性
- 适度景深营造电影质感

【关键约束 - 产品一致性】
如果基于产品图片生成，必须：
- 产品外观、颜色、形状必须与原图100%一致
- 不得改变产品任何设计细节
- 产品始终是画面焦点
- 只添加相机运动和环境变化

输出：一个流畅的、适合循环播放的产品视频，可用于营销和电商展示。`;
}
