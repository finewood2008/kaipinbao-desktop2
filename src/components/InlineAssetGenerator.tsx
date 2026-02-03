import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  ImagePlus, 
  Video, 
  Loader2, 
  ChevronDown, 
  ChevronUp,
  Sparkles,
  Check
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { IMAGE_TYPES } from "./ImageTypeSelector";

interface GeneratedImage {
  id: string;
  image_url: string;
  prompt: string;
  is_selected: boolean;
  feedback: string | null;
  image_type?: string;
  phase?: number;
  parent_image_id?: string | null;
  marketing_copy?: string | null;
}

interface GeneratedVideo {
  id: string;
  video_url: string | null;
  prompt: string;
  scene_description: string | null;
  duration_seconds: number;
  status: string;
}

interface PrdData {
  usageScenario?: string;
  usageScenarios?: string[];
  targetAudience?: string;
  coreFeatures?: string[];
  designStyle?: string;
  selectedDirection?: string;
}

interface InlineAssetGeneratorProps {
  projectId: string;
  selectedImageUrl?: string;
  selectedImageId?: string;
  prdData?: PrdData;
  onImagesGenerated: (images: GeneratedImage[]) => void;
  onVideoGenerated: (video: GeneratedVideo) => void;
  existingImages: GeneratedImage[];
  existingVideos: GeneratedVideo[];
}

export function InlineAssetGenerator({
  projectId,
  selectedImageUrl,
  selectedImageId,
  prdData,
  onImagesGenerated,
  onVideoGenerated,
  existingImages,
  existingVideos,
}: InlineAssetGeneratorProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isGeneratingImages, setIsGeneratingImages] = useState(false);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [selectedTypeIds, setSelectedTypeIds] = useState<string[]>(["scene", "structure"]);
  const [generatingTypeIds, setGeneratingTypeIds] = useState<string[]>([]);
  const [generatedCount, setGeneratedCount] = useState(0);

  const toggleType = (typeId: string) => {
    setSelectedTypeIds(prev => 
      prev.includes(typeId) 
        ? prev.filter(t => t !== typeId)
        : [...prev, typeId]
    );
  };

  const handleGenerateImages = async () => {
    if (!selectedImageId || !selectedImageUrl) {
      toast.error("缺少产品造型图，请先在产品设计阶段选择造型");
      return;
    }

    if (selectedTypeIds.length === 0) {
      toast.error("请至少选择一种图片类型");
      return;
    }

    setIsGeneratingImages(true);
    setGeneratingTypeIds([...selectedTypeIds]);
    setGeneratedCount(0);

    const newImages: GeneratedImage[] = [];

    for (const imageType of selectedTypeIds) {
      try {
        const typeInfo = IMAGE_TYPES.find(t => t.id === imageType);
        
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-image`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            },
            body: JSON.stringify({
              projectId,
              parentImageId: selectedImageId,
              parentImageUrl: selectedImageUrl,
              imageType,
              phase: 2,
              prdContext: {
                usageScenarios: prdData?.usageScenarios || [],
                targetAudience: prdData?.targetAudience || "",
                designStyle: prdData?.designStyle || "",
                coreFeatures: prdData?.coreFeatures || [],
              },
            }),
          }
        );

        if (!response.ok) {
          console.error(`Failed to generate ${imageType}`);
          continue;
        }

        const data = await response.json();
        
        if (data.imageUrl) {
          const { data: saved, error } = await supabase
            .from("generated_images")
            .insert({
              project_id: projectId,
              image_url: data.imageUrl,
              prompt: data.prompt || typeInfo?.description || "",
              image_type: imageType,
              phase: 2,
              parent_image_id: selectedImageId,
              marketing_copy: data.marketingCopy || null,
            })
            .select()
            .single();

          if (!error && saved) {
            newImages.push(saved as GeneratedImage);
            setGeneratedCount(prev => prev + 1);
          }
        }

        setGeneratingTypeIds(prev => prev.filter(t => t !== imageType));
      } catch (error) {
        console.error(`Error generating ${imageType}:`, error);
        setGeneratingTypeIds(prev => prev.filter(t => t !== imageType));
      }
    }

    if (newImages.length > 0) {
      onImagesGenerated([...existingImages, ...newImages]);
      toast.success(`成功生成 ${newImages.length} 张营销图片`);
    }

    setIsGeneratingImages(false);
    setGeneratingTypeIds([]);
  };

  const handleGenerateVideo = async () => {
    if (!selectedImageId || !selectedImageUrl) {
      toast.error("缺少产品造型图，请先在产品设计阶段选择造型");
      return;
    }

    setIsGeneratingVideo(true);

    try {
      const scenarios = [
        ...(prdData?.usageScenarios || []),
        ...(prdData?.usageScenario ? [prdData.usageScenario] : []),
      ].filter(Boolean);

      const sceneDescription = scenarios[0] || "产品展示动态效果";

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-video`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            projectId,
            parentImageId: selectedImageId,
            parentImageUrl: selectedImageUrl,
            sceneDescription,
            durationSeconds: 6,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("视频生成请求失败");
      }

      const data = await response.json();

      if (data.videoId) {
        const newVideo: GeneratedVideo = {
          id: data.videoId,
          video_url: null,
          prompt: data.prompt || "",
          scene_description: sceneDescription,
          duration_seconds: 6,
          status: "pending",
        };
        onVideoGenerated(newVideo);
        toast.success("视频生成已开始，请稍候...");
      }
    } catch (error) {
      console.error("Video generation error:", error);
      toast.error("视频生成失败");
    } finally {
      setIsGeneratingVideo(false);
    }
  };

  const hasProductImage = !!selectedImageUrl && !!selectedImageId;
  const hasVideo = existingVideos.some(v => v.video_url);

  return (
    <Card className={cn(
      "border-dashed transition-all",
      isExpanded ? "border-primary/50 bg-primary/5" : "border-border/50"
    )}>
      <CardContent className="p-4">
        {/* Header */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-stage-3/20 to-accent/20 flex items-center justify-center">
              <ImagePlus className="w-4 h-4 text-stage-3" />
            </div>
            <div>
              <p className="font-medium text-sm">快速补充素材</p>
              <p className="text-xs text-muted-foreground">
                直接生成营销图片或视频
              </p>
            </div>
          </div>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-5 h-5 text-muted-foreground" />
          )}
        </button>

        {/* Expanded Content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="pt-4 mt-4 border-t border-border/50 space-y-4">
                {!hasProductImage && (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-sm text-amber-600 dark:text-amber-400">
                    ⚠️ 需要先在产品设计阶段选择产品造型才能生成素材
                  </div>
                )}

                {/* Image Type Selection */}
                <div>
                  <p className="text-sm font-medium mb-2">选择图片类型</p>
                  <div className="flex flex-wrap gap-2">
                    {IMAGE_TYPES.map((type) => {
                      const isSelected = selectedTypeIds.includes(type.id);
                      const isGenerating = generatingTypeIds.includes(type.id);
                      return (
                        <button
                          key={type.id}
                          onClick={() => toggleType(type.id)}
                          disabled={isGeneratingImages}
                          className={cn(
                            "px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5",
                            isSelected
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted hover:bg-muted/80 text-muted-foreground",
                            isGenerating && "animate-pulse"
                          )}
                        >
                          {isGenerating ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : isSelected ? (
                            <Check className="w-3 h-3" />
                          ) : null}
                          {type.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Generation Progress */}
                {isGeneratingImages && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">生成进度</span>
                      <span className="font-medium">{generatedCount}/{selectedTypeIds.length}</span>
                    </div>
                    <Progress value={(generatedCount / selectedTypeIds.length) * 100} className="h-2" />
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button
                    onClick={handleGenerateImages}
                    disabled={!hasProductImage || isGeneratingImages || selectedTypeIds.length === 0}
                    size="sm"
                    className="flex-1"
                  >
                    {isGeneratingImages ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        生成中...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        生成图片 ({selectedTypeIds.length})
                      </>
                    )}
                  </Button>

                  <Button
                    onClick={handleGenerateVideo}
                    disabled={!hasProductImage || isGeneratingVideo || hasVideo}
                    size="sm"
                    variant="outline"
                    className="flex-1"
                  >
                    {isGeneratingVideo ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        生成中...
                      </>
                    ) : hasVideo ? (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        已有视频
                      </>
                    ) : (
                      <>
                        <Video className="w-4 h-4 mr-2" />
                        生成视频
                      </>
                    )}
                  </Button>
                </div>

                {/* Existing Assets Preview */}
                {(existingImages.length > 0 || existingVideos.length > 0) && (
                  <div className="pt-3 border-t border-border/50">
                    <p className="text-xs text-muted-foreground mb-2">已有素材</p>
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {existingImages.slice(0, 4).map((img) => (
                        <div 
                          key={img.id} 
                          className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border border-border/50"
                        >
                          <img 
                            src={img.image_url} 
                            alt="" 
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                      {existingImages.length > 4 && (
                        <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                          <span className="text-xs text-muted-foreground">+{existingImages.length - 4}</span>
                        </div>
                      )}
                      {existingVideos.filter(v => v.video_url).map((video) => (
                        <div 
                          key={video.id} 
                          className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border border-border/50 bg-muted flex items-center justify-center"
                        >
                          <Video className="w-6 h-6 text-muted-foreground" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
