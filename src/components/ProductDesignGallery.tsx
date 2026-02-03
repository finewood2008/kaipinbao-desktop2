import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Loader2, 
  Sparkles, 
  Check, 
  RefreshCw, 
  ImagePlus,
  MessageSquare,
  X,
  ZoomIn
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ImageLightbox } from "./ImageLightbox";
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

interface CompetitorProduct {
  id: string;
  product_title?: string;
  product_images?: string[];
  main_image?: string;
  price?: string;
  rating?: number;
}

interface ProductDesignGalleryProps {
  projectId: string;
  images: GeneratedImage[];
  onImagesChange: (images: GeneratedImage[]) => void;
  onSelectImage: (image: GeneratedImage) => void;
  onDesignChange?: (oldImageId: string, newImageId: string) => Promise<boolean>;
  prdSummary?: string;
  prdData?: {
    usageScenarios?: string[];
    targetAudience?: string;
    coreFeatures?: string[];
    designStyle?: string;
    selectedDirection?: string;
  };
  competitorProducts?: CompetitorProduct[];
}

export function ProductDesignGallery({
  projectId,
  images,
  onImagesChange,
  onSelectImage,
  onDesignChange,
  prdSummary,
  prdData,
  competitorProducts = [],
}: ProductDesignGalleryProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [customPrompt, setCustomPrompt] = useState("");
  const [feedbackImageId, setFeedbackImageId] = useState<string | null>(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const generateImage = async (prompt: string) => {
    setIsGenerating(true);
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
            prompt,
            projectId,
            imageType: "product",
            phase: 1,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "图像生成失败");
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
          image_type: "product",
          phase: 1,
        })
        .select()
        .single();

      if (error) throw error;

      onImagesChange([...images, savedImage as GeneratedImage]);
      toast.success("产品造型生成成功！");
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "图像生成失败");
    } finally {
      setIsGenerating(false);
      setCustomPrompt("");
    }
  };

  const handleGenerateFromPRD = () => {
    const prompt = prdSummary || "A modern, innovative product design";
    generateImage(prompt);
  };

  const handleCustomGenerate = () => {
    if (!customPrompt.trim()) return;
    generateImage(customPrompt);
  };

  const handleSelectImage = async (image: GeneratedImage) => {
    // Find currently selected design
    const currentSelected = images.find(img => img.is_selected);
    
    // If changing design (not first selection and not same image), notify parent
    if (currentSelected && currentSelected.id !== image.id && onDesignChange) {
      const shouldProceed = await onDesignChange(currentSelected.id, image.id);
      if (!shouldProceed) {
        return; // User cancelled the design change
      }
    }
    
    // Update all images - only the selected one is marked
    const updatedImages = images.map((img) => ({
      ...img,
      is_selected: img.id === image.id,
    }));

    // Update in database
    await supabase
      .from("generated_images")
      .update({ is_selected: false })
      .eq("project_id", projectId)
      .eq("phase", 1);

    await supabase
      .from("generated_images")
      .update({ is_selected: true })
      .eq("id", image.id);

    onImagesChange(updatedImages);
    
    // Notify parent with the selected image
    onSelectImage({ ...image, is_selected: true });
  };

  const handleSubmitFeedback = async () => {
    if (!feedbackImageId || !feedbackText.trim()) return;

    setIsSubmittingFeedback(true);
    try {
      // Save feedback
      await supabase
        .from("generated_images")
        .update({ feedback: feedbackText })
        .eq("id", feedbackImageId);

      // Generate new image based on feedback
      const originalImage = images.find((img) => img.id === feedbackImageId);
      const newPrompt = `${originalImage?.prompt}. Modification request: ${feedbackText}`;
      
      await generateImage(newPrompt);
      
      setFeedbackImageId(null);
      setFeedbackText("");
    } catch (error) {
      toast.error("提交反馈失败");
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Generation Controls */}
      <Card className="glass border-border/50">
        <CardContent className="p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-stage-2" />
            AI 产品造型生成
            <span className="text-xs text-muted-foreground font-normal ml-2">
              板块一：基于PRD生成产品外观
            </span>
          </h3>

          <div className="space-y-4">
            <Button
              onClick={handleGenerateFromPRD}
              disabled={isGenerating}
              className="w-full bg-gradient-to-r from-stage-2 to-accent relative overflow-hidden group"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  正在生成产品造型...
                </>
              ) : (
                <>
                  <ImagePlus className="w-4 h-4 mr-2" />
                  基于 PRD 生成产品造型
                </>
              )}
              {/* Shimmer effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                animate={{ x: ["-100%", "100%"] }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              />
            </Button>

            <div className="flex gap-2">
              <Input
                placeholder="或输入自定义造型描述..."
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                disabled={isGenerating}
              />
              <Button
                variant="outline"
                onClick={handleCustomGenerate}
                disabled={isGenerating || !customPrompt.trim()}
              >
                生成
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Image Gallery */}
      {images.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-semibold flex items-center gap-2">
            产品造型方案 
            <span className="text-sm text-muted-foreground font-normal">
              ({images.length} 个方案，点击选择进入下一板块)
            </span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AnimatePresence mode="popLayout">
              {images.map((image, index) => (
                <motion.div
                  key={image.id}
                  layout
                  initial={{ opacity: 0, scale: 0.8, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, y: -20 }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 300, 
                    damping: 25,
                    delay: index * 0.05
                  }}
                >
                  <Card
                    className={cn(
                      "overflow-hidden transition-all duration-300 group",
                      image.is_selected
                        ? "ring-2 ring-stage-2 shadow-lg"
                        : "hover:ring-1 hover:ring-border hover:shadow-md"
                    )}
                    style={image.is_selected ? { boxShadow: "0 0 20px hsl(var(--stage-2) / 0.3)" } : {}}
                  >
                    {/* Image Container */}
                    <div 
                      className="aspect-[4/3] relative cursor-pointer overflow-hidden"
                      onClick={() => openLightbox(index)}
                    >
                      <img
                        src={image.image_url}
                        alt="Product design"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      
                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-4">
                        <Button variant="secondary" size="sm" className="gap-2">
                          <ZoomIn className="w-4 h-4" />
                          查看大图
                        </Button>
                      </div>

                      {/* Selected badge */}
                      {image.is_selected && (
                        <motion.div 
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ type: "spring", stiffness: 500, damping: 25 }}
                          className="absolute top-3 right-3 bg-stage-2 text-white rounded-full p-2 shadow-lg"
                          style={{ boxShadow: "0 0 20px hsl(var(--stage-2) / 0.6)" }}
                        >
                          <Check className="w-5 h-5" />
                        </motion.div>
                      )}
                    </div>

                    {/* Actions */}
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              setFeedbackImageId(image.id);
                            }}
                          >
                            <MessageSquare className="w-4 h-4 mr-1" />
                            反馈
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              generateImage(image.prompt);
                            }}
                            disabled={isGenerating}
                          >
                            <RefreshCw className="w-4 h-4 mr-1" />
                            重新生成
                          </Button>
                        </div>
                        
                        <Button
                          size="sm"
                          variant={image.is_selected ? "default" : "outline"}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectImage(image);
                          }}
                          className={cn(
                            image.is_selected 
                              ? "bg-stage-2 hover:bg-stage-2/90" 
                              : "border-stage-2/50 text-stage-2 hover:bg-stage-2/10"
                          )}
                        >
                          <Check className="w-4 h-4 mr-1" />
                          {image.is_selected ? "已选择" : "选择此造型"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Empty State */}
      {images.length === 0 && !isGenerating && (
        <Card className="glass border-dashed border-border/50">
          <CardContent className="p-12 text-center">
            <ImagePlus className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h4 className="font-medium mb-2">开始创建产品造型</h4>
            <p className="text-sm text-muted-foreground mb-4">
              点击上方按钮，AI 将根据 PRD 信息生成多种产品外观方案
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
        onSelect={(imageId) => {
          const image = images.find(img => img.id === imageId);
          if (image) handleSelectImage(image);
        }}
        onNavigate={setLightboxIndex}
      />

      {/* Feedback Modal */}
      <AnimatePresence>
        {feedbackImageId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setFeedbackImageId(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-card rounded-lg p-6 max-w-md w-full shadow-xl border border-border"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold">提交修改意见</h4>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setFeedbackImageId(null)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <Textarea
                placeholder="例如：把手柄做细一点，颜色改成蓝色..."
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                rows={4}
              />
              <Button
                className="w-full mt-4 bg-gradient-to-r from-stage-2 to-accent"
                onClick={handleSubmitFeedback}
                disabled={isSubmittingFeedback || !feedbackText.trim()}
              >
                {isSubmittingFeedback ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                根据反馈重新生成
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
