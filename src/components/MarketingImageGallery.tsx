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
  ImagePlus
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ImageLightbox } from "./ImageLightbox";
import { ImageType, IMAGE_TYPES } from "./ImageTypeSelector";
import { cn } from "@/lib/utils";

interface GeneratedImage {
  id: string;
  image_url: string;
  prompt: string;
  is_selected: boolean;
  feedback: string | null;
  image_type?: string;
  phase?: number;
  parent_image_id?: string | null;
}

interface MarketingImageGalleryProps {
  projectId: string;
  parentImageId?: string;
  parentImageUrl?: string;
  selectedTypes: ImageType[];
  images: GeneratedImage[];
  onImagesChange: (images: GeneratedImage[]) => void;
  prdSummary?: string;
}

export function MarketingImageGallery({
  projectId,
  parentImageId,
  parentImageUrl,
  selectedTypes,
  images,
  onImagesChange,
  prdSummary,
}: MarketingImageGalleryProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingTypes, setGeneratingTypes] = useState<string[]>([]);
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

    const newImages: GeneratedImage[] = [];

    for (const type of selectedTypes) {
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
            }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `生成${type.label}失败`);
        }

        const data = await response.json();

        // Save to database
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
          })
          .select()
          .single();

        if (error) throw error;

        newImages.push(savedImage as GeneratedImage);
        setGeneratingTypes(prev => prev.filter(t => t !== type.id));
        
      } catch (error) {
        console.error(`Error generating ${type.id}:`, error);
        toast.error(`生成${type.label}失败`);
        setGeneratingTypes(prev => prev.filter(t => t !== type.id));
      }
    }

    onImagesChange([...images, ...newImages]);
    setIsGenerating(false);

    if (newImages.length > 0) {
      toast.success(`成功生成 ${newImages.length} 张营销图片`);
    }
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
      {/* Generate Button */}
      <Card className="glass border-border/50">
        <CardContent className="p-6">
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

      {/* Grouped Image Display */}
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
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <AnimatePresence mode="popLayout">
                {typeImages.map((image, index) => (
                  <motion.div
                    key={image.id}
                    layout
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  >
                    <div className="group relative rounded-lg overflow-hidden border border-border bg-card">
                      {/* Image */}
                      <div 
                        className="aspect-square cursor-pointer"
                        onClick={() => openLightbox(images.indexOf(image))}
                      >
                        <img
                          src={image.image_url}
                          alt={`${getTypeLabel(typeId)} image`}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        
                        {/* Overlay */}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                          <ZoomIn className="w-8 h-8 text-white" />
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="flex justify-center gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-white hover:bg-white/20"
                            onClick={(e) => {
                              e.stopPropagation();
                              regenerateImage(image);
                            }}
                          >
                            <RefreshCw className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-white hover:bg-white/20"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(image.image_url, "_blank");
                            }}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-white hover:bg-red-500/50"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteImage(image.id);
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
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
          <CardContent className="p-12 text-center">
            <ImagePlus className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h4 className="font-medium mb-2">尚未生成营销图片</h4>
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
