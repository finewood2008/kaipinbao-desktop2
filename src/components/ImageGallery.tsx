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
  X
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface GeneratedImage {
  id: string;
  image_url: string;
  prompt: string;
  is_selected: boolean;
  feedback: string | null;
}

interface ImageGalleryProps {
  projectId: string;
  images: GeneratedImage[];
  onImagesChange: (images: GeneratedImage[]) => void;
  onConfirmSelection: () => void;
  prdSummary?: string;
}

export function ImageGallery({
  projectId,
  images,
  onImagesChange,
  onConfirmSelection,
  prdSummary,
}: ImageGalleryProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [customPrompt, setCustomPrompt] = useState("");
  const [feedbackImageId, setFeedbackImageId] = useState<string | null>(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);

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
        })
        .select()
        .single();

      if (error) throw error;

      onImagesChange([...images, savedImage as GeneratedImage]);
      toast.success("图像生成成功！");
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

  const handleSelectImage = async (imageId: string) => {
    const updatedImages = images.map((img) => ({
      ...img,
      is_selected: img.id === imageId,
    }));

    // Update in database
    await supabase
      .from("generated_images")
      .update({ is_selected: false })
      .eq("project_id", projectId);

    await supabase
      .from("generated_images")
      .update({ is_selected: true })
      .eq("id", imageId);

    onImagesChange(updatedImages);
    toast.success("已选择此设计方案");
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

  const selectedImage = images.find((img) => img.is_selected);

  return (
    <div className="space-y-6">
      {/* Generation Controls */}
      <Card className="glass border-border/50">
        <CardContent className="p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-stage-2" />
            AI 产品渲染图生成
          </h3>

          <div className="space-y-4">
            <Button
              onClick={handleGenerateFromPRD}
              disabled={isGenerating}
              className="w-full bg-gradient-to-r from-stage-2 to-stage-2/80"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  正在生成高质量渲染图...
                </>
              ) : (
                <>
                  <ImagePlus className="w-4 h-4 mr-2" />
                  基于 PRD 生成产品图
                </>
              )}
            </Button>

            <div className="flex gap-2">
              <Input
                placeholder="或输入自定义描述..."
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
          <h3 className="font-semibold">生成的设计方案 ({images.length})</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {images.map((image) => (
                <motion.div
                  key={image.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                >
                  <Card
                    className={`overflow-hidden cursor-pointer transition-all ${
                      image.is_selected
                        ? "ring-2 ring-stage-2 shadow-lg shadow-stage-2/20"
                        : "hover:ring-1 hover:ring-border"
                    }`}
                    onClick={() => handleSelectImage(image.id)}
                  >
                    <div className="aspect-square relative">
                      <img
                        src={image.image_url}
                        alt="Product render"
                        className="w-full h-full object-cover"
                      />
                      {image.is_selected && (
                        <div className="absolute top-2 right-2 bg-stage-2 text-white rounded-full p-1">
                          <Check className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                    <CardContent className="p-3">
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
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

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
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-card rounded-lg p-6 max-w-md w-full shadow-xl"
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
                className="w-full mt-4"
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

      {/* Confirm Selection */}
      {selectedImage && (
        <Card className="glass border-stage-2/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-stage-2">已选择设计方案</h4>
                <p className="text-sm text-muted-foreground">
                  确认后将进入下一阶段：营销落地页生成
                </p>
              </div>
              <Button onClick={onConfirmSelection} className="bg-stage-2 hover:bg-stage-2/90">
                <Check className="w-4 h-4 mr-2" />
                确认并进入下一阶段
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
