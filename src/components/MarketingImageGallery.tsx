import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Loader2, 
  Sparkles, 
  RefreshCw, 
  Download,
  Trash2,
  ZoomIn,
  ImagePlus,
  Copy
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ImageLightbox } from "./ImageLightbox";
import { ImageGenerationProgress } from "./ImageGenerationProgress";
import { ImageType, IMAGE_TYPES } from "./ImageTypeSelector";
import { cn } from "@/lib/utils";
import { AspectRatio } from "@/components/ui/aspect-ratio";

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

interface PrdData {
  usageScenario?: string;
  usageScenarios?: string[];
  targetAudience?: string;
  coreFeatures?: string[];
  designStyle?: string;
  selectedDirection?: string;
}

interface MarketingImageGalleryProps {
  projectId: string;
  parentImageId?: string;
  parentImageUrl?: string;
  selectedTypes: ImageType[];
  images: GeneratedImage[];
  onImagesChange: (images: GeneratedImage[]) => void;
  prdSummary?: string;
  prdData?: PrdData;
}

export function MarketingImageGallery({
  projectId,
  parentImageId,
  parentImageUrl,
  selectedTypes,
  images,
  onImagesChange,
  prdSummary,
  prdData,
}: MarketingImageGalleryProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingTypes, setGeneratingTypes] = useState<string[]>([]);
  const [currentGeneratingType, setCurrentGeneratingType] = useState("");
  const [completedCount, setCompletedCount] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const generateMarketingImages = async () => {
    if (selectedTypes.length === 0) {
      toast.error("请先选择至少一种图片类型");
      return;
    }

    if (!parentImageId) {
      toast.error("请先选择产品造型");
      return;
    }

    setIsGenerating(true);
    setGeneratingTypes(selectedTypes.map(t => t.id));
    setCompletedCount(0);

    // Generate images one by one and update UI immediately
    for (const type of selectedTypes) {
      setCurrentGeneratingType(type.label);
      try {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-image`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            },
            body: JSON.stringify({
              prompt: type.customPrompt || prdSummary || "A modern product",
              projectId,
              imageType: type.id,
              phase: 2,
              parentImageId,
              parentImageUrl,
              prdData, // Pass full PRD data
            }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `生成${type.label}失败`);
        }

        const data = await response.json();

        // Save to database with marketing copy
        const { data: savedImage, error } = await supabase
          .from("generated_images")
          .insert({
            project_id: projectId,
            image_url: data.imageUrl,
            prompt: data.prompt,
            is_selected: false,
            image_type: type.id,
            phase: 2,
            parent_image_id: parentImageId,
            marketing_copy: data.marketingCopy || null,
          })
          .select()
          .single();

        if (error) throw error;

        // Immediately update UI with the new image
        onImagesChange([...images, savedImage as GeneratedImage]);
        
        // Update progress
        setCompletedCount(prev => prev + 1);
        setGeneratingTypes(prev => prev.filter(t => t !== type.id));
        
        toast.success(`${type.label}已生成`);
        
      } catch (error) {
        console.error(`Error generating ${type.id}:`, error);
        toast.error(`生成${type.label}失败`);
        setGeneratingTypes(prev => prev.filter(t => t !== type.id));
      }
    }

    setIsGenerating(false);
    setCurrentGeneratingType("");
  };

  const regenerateImage = async (image: GeneratedImage) => {
    const type = IMAGE_TYPES.find(t => t.id === image.image_type);
    if (!type) return;

    setGeneratingTypes([image.image_type || ""]);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-image`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            prompt: prdSummary || "A modern product",
            projectId,
            imageType: image.image_type,
            phase: 2,
            parentImageId,
            parentImageUrl,
            prdData,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("重新生成失败");
      }

      const data = await response.json();

      // Save new image to database
      const { data: savedImage, error } = await supabase
        .from("generated_images")
        .insert({
          project_id: projectId,
          image_url: data.imageUrl,
          prompt: data.prompt,
          is_selected: false,
          image_type: image.image_type,
          phase: 2,
          parent_image_id: parentImageId,
          marketing_copy: data.marketingCopy || null,
        })
        .select()
        .single();

      if (error) throw error;

      onImagesChange([...images, savedImage as GeneratedImage]);
      toast.success(`${type.label}已重新生成`);
    } catch (error) {
      toast.error("重新生成失败");
    } finally {
      setGeneratingTypes([]);
    }
  };

  const deleteImage = async (imageId: string) => {
    const { error } = await supabase
      .from("generated_images")
      .delete()
      .eq("id", imageId);

    if (error) {
      toast.error("删除失败");
    } else {
      onImagesChange(images.filter(img => img.id !== imageId));
      toast.success("已删除");
    }
  };

  const copyMarketingCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("文案已复制");
  };

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  // Group images by type
  const groupedImages = images.reduce((acc, image) => {
    const type = image.image_type || "other";
    if (!acc[type]) acc[type] = [];
    acc[type].push(image);
    return acc;
  }, {} as Record<string, GeneratedImage[]>);

  const getTypeLabel = (typeId: string) => {
    return IMAGE_TYPES.find(t => t.id === typeId)?.label || "其他";
  };

  return (
    <div className="space-y-6">
      {/* Generation Progress */}
      <ImageGenerationProgress
        isGenerating={isGenerating}
        currentType={currentGeneratingType}
        currentStep={`正在生成 ${currentGeneratingType}...`}
        totalTypes={selectedTypes.length}
        completedCount={completedCount}
        estimatedTimeRemaining={isGenerating ? (selectedTypes.length - completedCount) * 30 : undefined}
      />
      {/* Generate Button */}
      <Card className="glass border-border/50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold flex items-center gap-2">
                <ImagePlus className="w-5 h-5 text-stage-2" />
                生成营销图片
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {selectedTypes.length > 0 
                  ? `已选择 ${selectedTypes.length} 种类型`
                  : "请先在上方选择图片类型"
                }
              </p>
            </div>
            <Button
              onClick={generateMarketingImages}
              disabled={isGenerating || selectedTypes.length === 0}
              className="bg-gradient-to-r from-stage-2 to-accent"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  生成中...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  批量生成选中类型
                </>
              )}
            </Button>
          </div>

          {/* Generating progress */}
          {generatingTypes.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {generatingTypes.map(typeId => (
                <Badge key={typeId} variant="secondary" className="animate-pulse">
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  正在生成{getTypeLabel(typeId)}...
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Grouped Image Display - Larger layout with marketing copy */}
      {Object.entries(groupedImages).map(([typeId, typeImages]) => (
        <Card key={typeId} className="glass border-border/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                {getTypeLabel(typeId)}
                <Badge variant="outline">{typeImages.length}</Badge>
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {/* Larger grid: 1 column on mobile, 2 on larger screens */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <AnimatePresence mode="popLayout">
                {typeImages.map((image, index) => (
                  <motion.div
                    key={image.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  >
                    <Card className="overflow-hidden border border-border bg-card">
                      {/* Image - Larger aspect ratio */}
                      <div 
                        className="relative cursor-pointer group"
                        onClick={() => openLightbox(images.indexOf(image))}
                      >
                        <AspectRatio ratio={16 / 10}>
                          <img
                            src={image.image_url}
                            alt={`${getTypeLabel(typeId)} image`}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        </AspectRatio>
                        
                        {/* Overlay */}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                          <ZoomIn className="w-10 h-10 text-white" />
                        </div>
                      </div>

                      {/* Content area with type and marketing copy */}
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <Badge variant="secondary" className="text-xs">
                            {getTypeLabel(typeId)}
                          </Badge>
                          <div className="flex gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              onClick={() => regenerateImage(image)}
                              disabled={generatingTypes.includes(image.image_type || "")}
                            >
                              {generatingTypes.includes(image.image_type || "") ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <RefreshCw className="w-4 h-4" />
                              )}
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              onClick={() => window.open(image.image_url, "_blank")}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => deleteImage(image.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Marketing Copy */}
                        {image.marketing_copy && (
                          <div className="bg-muted/50 rounded-lg p-3">
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-sm text-foreground leading-relaxed">
                                {image.marketing_copy}
                              </p>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 flex-shrink-0"
                                onClick={() => copyMarketingCopy(image.marketing_copy!)}
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Empty State */}
      {images.length === 0 && !isGenerating && (
        <Card className="glass border-dashed border-border/50">
          <CardContent className="p-10 text-center">
            <ImagePlus className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
            <h4 className="font-medium mb-1">尚未生成营销图片</h4>
            <p className="text-sm text-muted-foreground">
              选择图片类型后点击"批量生成"按钮
            </p>
          </CardContent>
        </Card>
      )}

      {/* Lightbox */}
      <ImageLightbox
        images={images}
        currentIndex={lightboxIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        onNavigate={setLightboxIndex}
      />
    </div>
  );
}
