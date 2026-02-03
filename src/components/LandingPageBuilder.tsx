import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { 
  Loader2, 
  Globe, 
  Copy, 
  ExternalLink, 
  Mail, 
  Eye, 
  Check,
  Sparkles,
  RefreshCw,
  Wand2,
  ImageIcon,
  FileText,
  Palette,
  BarChart3,
  Edit,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { LandingPagePreview } from "./LandingPagePreview";
import { TemplateSelect, type TemplateStyle } from "./LandingPageTemplates";
import { LandingPageAnalytics } from "./LandingPageAnalytics";
import { cn } from "@/lib/utils";

interface FaqItem {
  question: string;
  answer: string;
}

interface SocialProofItem {
  name: string;
  role: string;
  content: string;
}

interface MarketingImageWithCopy {
  id: string;
  image_url: string;
  image_type: string;
  marketing_copy?: string;
}

interface LandingPageData {
  id: string;
  title: string;
  slug: string;
  hero_image_url: string | null;
  pain_points: string[] | null;
  selling_points: string[] | null;
  trust_badges: string[] | null;
  is_published: boolean;
  view_count: number;
  subheadline?: string | null;
  cta_text?: string | null;
  video_url?: string | null;
  marketing_images?: Record<string, string | string[]> | null;
  marketing_images_with_copy?: MarketingImageWithCopy[] | null;
  product_images?: string[] | null;
  template_style?: string | null;
  faq_items?: FaqItem[] | null;
  specifications?: string[] | null;
  usage_scenarios?: string[] | null;
  social_proof_items?: SocialProofItem[] | null;
  urgency_message?: string | null;
}

interface MarketingImage {
  id: string;
  image_url: string;
  image_type: string;
  marketing_copy?: string;
}

interface PrdDataInput {
  pain_points?: string[];
  selling_points?: string[];
  target_audience?: string;
  usageScenario?: string;
  designStyle?: string;
  coreFeatures?: string[];
  marketingAssets?: {
    sceneDescription?: string;
    structureHighlights?: string[];
    lifestyleContext?: string;
  };
  competitorInsights?: {
    positivePoints?: string[];
    negativePoints?: string[];
    differentiationStrategy?: string;
  };
}

interface LandingPageBuilderProps {
  projectId: string;
  projectName: string;
  selectedImageUrl?: string;
  prdData?: PrdDataInput;
  marketingImages?: MarketingImage[];
  videoUrl?: string;
  landingPage: LandingPageData | null;
  onLandingPageChange: (data: LandingPageData) => void;
  onBackToVisual?: () => void;
}

type GenerationStep = "idle" | "analyzing" | "designing" | "generating-images" | "finalizing" | "complete";

const stepProgress: Record<GenerationStep, number> = {
  idle: 0,
  analyzing: 20,
  designing: 40,
  "generating-images": 70,
  finalizing: 90,
  complete: 100,
};

const stepLabels: Record<GenerationStep, string> = {
  idle: "准备中",
  analyzing: "分析 PRD 数据...",
  designing: "生成设计策略...",
  "generating-images": "补充营销图片...",
  finalizing: "整合落地页...",
  complete: "生成完成！",
};

// Generate short slug for URLs
const generateSlug = () => {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let shortId = '';
  for (let i = 0; i < 6; i++) {
    shortId += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `p-${shortId}`;
};

export function LandingPageBuilder({
  projectId,
  projectName,
  selectedImageUrl,
  prdData,
  marketingImages = [],
  videoUrl,
  landingPage,
  onLandingPageChange,
  onBackToVisual,
}: LandingPageBuilderProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState<GenerationStep>("idle");
  const [isPublishing, setIsPublishing] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [generatedMarketingImages, setGeneratedMarketingImages] = useState<Record<string, string | string[]>>({});
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateStyle>("modern");
  const [showAnalytics, setShowAnalytics] = useState(false);

  // Auto-show analytics if page is already published
  const shouldShowAnalytics = showAnalytics || (landingPage?.is_published && !isRegenerating);

  const handleAIGenerateLandingPage = async () => {
    setIsGenerating(true);
    setGenerationStep("analyzing");

    try {
      setGenerationStep("designing");
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-landing-page`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            prdData: {
              name: projectName,
              description: projectName,
              pain_points: prdData?.pain_points,
              selling_points: prdData?.selling_points,
              target_audience: prdData?.target_audience,
              usageScenario: prdData?.usageScenario,
              designStyle: prdData?.designStyle,
              coreFeatures: prdData?.coreFeatures,
              marketingAssets: prdData?.marketingAssets,
              competitorInsights: prdData?.competitorInsights,
            },
            selectedImageUrl,
            targetMarket: "国际市场",
            templateStyle: selectedTemplate,
            visualAssets: {
              selectedProductImage: selectedImageUrl,
              marketingImages: marketingImages,
              videoUrl: videoUrl,
            },
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "落地页生成失败");
      }

      setGenerationStep("generating-images");
      
      const data = await response.json();
      const { strategy, marketingImages: generatedImages, generatedImages: newlyGenerated, videoUrl: respVideoUrl, productImages } = data;

      setGeneratedMarketingImages(generatedImages || {});
      setGenerationStep("finalizing");

      // Save to database with new fields
      const slug = generateSlug();
      
      const { data: savedPage, error } = await supabase
        .from("landing_pages")
        .insert({
          project_id: projectId,
          title: strategy?.headline || projectName,
          slug,
          hero_image_url: selectedImageUrl || null,
          subheadline: strategy?.subheadline || null,
          cta_text: strategy?.ctaText || "Get Early Access",
          pain_points: strategy?.painPoints || prdData?.pain_points || [],
          selling_points: strategy?.sellingPoints || prdData?.selling_points || [],
          trust_badges: strategy?.trustBadges || ["✓ 30-Day Money Back", "✓ Expert Designed", "✓ Trusted Worldwide"],
          marketing_images: generatedImages || {},
          marketing_images_with_copy: marketingImages.map(img => ({
            id: img.id,
            image_url: img.image_url,
            image_type: img.image_type,
            marketing_copy: img.marketing_copy || null,
          })),
          product_images: productImages || [],
          video_url: respVideoUrl || videoUrl || null,
          generated_images: newlyGenerated || {},
          color_scheme: strategy?.colorScheme || null,
          template_style: selectedTemplate,
          faq_items: data.faqItems || [],
          specifications: data.specifications || [],
          usage_scenarios: data.usageScenarios || [],
          social_proof_items: data.socialProofItems || [],
          urgency_message: data.urgencyMessage || null,
          is_published: false,
        })
        .select()
        .single();

      if (error) throw error;

      setGenerationStep("complete");
      onLandingPageChange(savedPage as unknown as LandingPageData);
      
      toast.success("🎉 落地页生成成功！");
      
      setTimeout(() => {
        setGenerationStep("idle");
      }, 2000);
      
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "落地页生成失败");
      setGenerationStep("idle");
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePublish = async () => {
    if (!landingPage) return;
    
    setIsPublishing(true);
    try {
      const { error } = await supabase
        .from("landing_pages")
        .update({ is_published: true })
        .eq("id", landingPage.id);

      if (error) throw error;

      onLandingPageChange({ ...landingPage, is_published: true });
      setShowAnalytics(true); // Switch to analytics view after publishing
      toast.success("🚀 落地页发布成功！");
    } catch (error) {
      toast.error("发布失败");
    } finally {
      setIsPublishing(false);
    }
  };

  const getLandingPageUrl = () => {
    if (!landingPage) return "";
    return `https://kaipinbao.lovable.app/lp/${landingPage.slug}`;
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(getLandingPageUrl());
    toast.success("链接已复制到剪贴板");
  };

  const handleRegenerate = async () => {
    if (!landingPage) return;
    
    setIsRegenerating(true);
    try {
      await supabase
        .from("landing_pages")
        .delete()
        .eq("id", landingPage.id);

      await handleAIGenerateLandingPage();
    } catch (error) {
      console.error(error);
      toast.error("重新生成失败");
    } finally {
      setIsRegenerating(false);
    }
  };

  // If analytics view is active, show analytics
  if (landingPage && shouldShowAnalytics) {
    return (
      <LandingPageAnalytics
        landingPageId={landingPage.id}
        landingPageSlug={landingPage.slug}
        landingPageTitle={landingPage.title}
        viewCount={landingPage.view_count}
        onBackToEdit={() => setShowAnalytics(false)}
      />
    );
  }

  // No landing page yet - show generation UI
  if (!landingPage) {
    return (
      <Card className="glass border-border/50 overflow-hidden">
        <CardContent className="p-8">
          <AnimatePresence mode="wait">
            {!isGenerating ? (
              <motion.div
                key="idle"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-center"
              >
                <motion.div
                  className="w-20 h-20 rounded-2xl bg-gradient-to-br from-stage-3 to-accent flex items-center justify-center mx-auto mb-6"
                  animate={{ 
                    y: [0, -10, 0],
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  style={{ boxShadow: "0 0 40px hsl(var(--stage-3) / 0.4)" }}
                >
                  <Wand2 className="w-10 h-10 text-white" />
                </motion.div>
                
                <h3 className="text-2xl font-bold mb-2">AI 广告投放专家</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  专业广告投放 AI 为您生成高转化率落地页，
                  通过邮件收集验证市场对新产品的接受度
                </p>

                {/* Template Selection */}
                <div className="mb-8 text-left max-w-3xl mx-auto">
                  <TemplateSelect 
                    selectedTemplate={selectedTemplate}
                    onSelect={setSelectedTemplate}
                  />
                </div>

                <div className="flex items-center justify-center gap-6 mb-8 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-stage-1" />
                    <span>分析 PRD</span>
                  </div>
                  <div className="w-8 h-px bg-border" />
                  <div className="flex items-center gap-2">
                    <Palette className="w-4 h-4 text-stage-2" />
                    <span>整合素材</span>
                  </div>
                  <div className="w-8 h-px bg-border" />
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-stage-3" />
                    <span>生成页面</span>
                  </div>
                </div>

                {/* Show available assets summary */}
                <div className="mb-8 p-4 bg-muted/50 rounded-lg text-left max-w-md mx-auto">
                  <p className="text-sm font-medium mb-2">已有素材：</p>
                  <div className="flex flex-wrap gap-2 text-xs">
                    {selectedImageUrl && (
                      <span className="px-2 py-1 bg-primary/10 text-primary rounded">✓ 产品图</span>
                    )}
                    {marketingImages.length > 0 && (
                      <span className="px-2 py-1 bg-primary/10 text-primary rounded">✓ 营销图 x{marketingImages.length}</span>
                    )}
                    {videoUrl && (
                      <span className="px-2 py-1 bg-primary/10 text-primary rounded">✓ 视频</span>
                    )}
                    {prdData?.pain_points && prdData.pain_points.length > 0 && (
                      <span className="px-2 py-1 bg-accent/10 text-accent rounded">✓ 痛点分析</span>
                    )}
                    {prdData?.competitorInsights && (
                      <span className="px-2 py-1 bg-secondary text-secondary-foreground rounded">✓ 竞品洞察</span>
                    )}
                  </div>
                </div>

                {/* Missing assets warning */}
                {(marketingImages.length === 0 || !videoUrl) && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg max-w-md mx-auto"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <ImageIcon className="w-4 h-4 text-amber-500" />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="text-sm font-medium text-amber-600 dark:text-amber-400 mb-1">
                          素材不完整
                        </p>
                        <p className="text-xs text-muted-foreground mb-3">
                          {marketingImages.length === 0 && !videoUrl 
                            ? "缺少营销图片和视频，落地页效果可能受限" 
                            : marketingImages.length === 0 
                            ? "缺少营销图片，建议先生成场景图、结构图等" 
                            : "缺少视频，建议先生成产品视频提升转化率"}
                        </p>
                        {onBackToVisual && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={onBackToVisual}
                            className="text-xs border-amber-500/30 hover:bg-amber-500/10"
                          >
                            <ImageIcon className="w-3 h-3 mr-1" />
                            返回生成素材
                          </Button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}

                <Button
                  onClick={handleAIGenerateLandingPage}
                  size="lg"
                  className="bg-gradient-to-r from-stage-3 to-accent hover:opacity-90 transition-opacity relative overflow-hidden group min-w-[200px]"
                >
                  <motion.div
                    className="absolute inset-0 bg-white/20"
                    animate={{ x: ["-100%", "100%"] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  />
                  <Sparkles className="w-5 h-5 mr-2" />
                  开始 AI 生成
                </Button>
              </motion.div>
            ) : (
              <motion.div
                key="generating"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="text-center py-8"
              >
                <motion.div
                  className="w-16 h-16 rounded-2xl bg-gradient-to-br from-stage-3 to-accent flex items-center justify-center mx-auto mb-6"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  <Loader2 className="w-8 h-8 text-white" />
                </motion.div>

                <h4 className="text-lg font-semibold mb-4">{stepLabels[generationStep]}</h4>
                
                <div className="max-w-md mx-auto mb-6">
                  <Progress 
                    value={stepProgress[generationStep]} 
                    className="h-2"
                  />
                </div>

                <div className="flex justify-center gap-8 text-sm">
                  {(["analyzing", "designing", "generating-images", "finalizing"] as GenerationStep[]).map((step, index) => (
                    <motion.div
                      key={step}
                      initial={{ opacity: 0.5 }}
                      animate={{ 
                        opacity: stepProgress[generationStep] >= stepProgress[step] ? 1 : 0.5,
                        scale: generationStep === step ? 1.1 : 1
                      }}
                      className={cn(
                        "flex flex-col items-center gap-1",
                        stepProgress[generationStep] >= stepProgress[step] 
                          ? "text-foreground" 
                          : "text-muted-foreground"
                      )}
                    >
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium",
                        stepProgress[generationStep] >= stepProgress[step]
                          ? "bg-stage-3 text-white"
                          : "bg-muted"
                      )}>
                        {stepProgress[generationStep] > stepProgress[step] ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          index + 1
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <Card className={cn(
        "glass transition-all",
        landingPage.is_published ? "border-green-500/50" : "border-stage-3/50"
      )}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.div 
                className={cn(
                  "w-3 h-3 rounded-full",
                  landingPage.is_published ? "bg-green-500" : "bg-yellow-500"
                )}
                animate={landingPage.is_published ? {} : { scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <div>
                <p className="font-medium">
                  {landingPage.is_published ? "已发布" : "草稿"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {landingPage.title}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {landingPage.is_published && (
                <>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      {landingPage.view_count} 次访问
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAnalytics(true)}
                  >
                    <BarChart3 className="w-4 h-4 mr-2" />
                    查看数据
                  </Button>
                </>
              )}
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isRegenerating}
                  >
                    {isRegenerating ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4 mr-2" />
                    )}
                    重新生成
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>确认重新生成？</AlertDialogTitle>
                    <AlertDialogDescription>
                      这将删除当前的落地页并生成一个新的。如果落地页已发布，之前的链接将失效。此操作无法撤销。
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>取消</AlertDialogCancel>
                    <AlertDialogAction onClick={handleRegenerate}>
                      确认重新生成
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* URL and Actions */}
      <Card className="glass border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">落地页链接</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={getLandingPageUrl()}
              readOnly
              className="font-mono text-sm"
            />
            <Button variant="outline" onClick={copyToClipboard}>
              <Copy className="w-4 h-4" />
            </Button>
            <Button variant="outline" asChild>
              <a href={getLandingPageUrl()} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4" />
              </a>
            </Button>
          </div>

          {!landingPage.is_published && (
            <Button
              onClick={handlePublish}
              disabled={isPublishing}
              className="w-full bg-gradient-to-r from-stage-3 to-green-500 hover:opacity-90"
            >
              {isPublishing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Globe className="w-4 h-4 mr-2" />
              )}
              发布落地页
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Preview */}
      <Card className="glass border-border/50 overflow-hidden">
        <CardHeader>
          <CardTitle className="text-lg">页面预览</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <LandingPagePreview
            title={landingPage.title}
            subheadline={landingPage.subheadline}
            heroImageUrl={landingPage.hero_image_url}
            painPoints={landingPage.pain_points}
            sellingPoints={landingPage.selling_points}
            trustBadges={landingPage.trust_badges}
            marketingImages={landingPage.marketing_images || generatedMarketingImages}
            marketingImagesWithCopy={landingPage.marketing_images_with_copy}
            videoUrl={landingPage.video_url}
            ctaText={landingPage.cta_text}
            landingPageId={landingPage.id}
            isInteractive={false}
            templateStyle={(landingPage.template_style as TemplateStyle) || selectedTemplate}
            faqItems={landingPage.faq_items}
            specifications={landingPage.specifications}
            usageScenarios={landingPage.usage_scenarios}
            socialProofItems={landingPage.social_proof_items}
            urgencyMessage={landingPage.urgency_message}
          />
        </CardContent>
      </Card>

      {/* Email Stats */}
      {landingPage.is_published && (
        <Card className="glass border-border/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Mail className="w-5 h-5" />
              邮箱收集数据
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              查看收集到的潜在客户邮箱，请访问仪表盘。
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
