import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
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
  Megaphone,
  RefreshCw,
  Wand2,
  ImageIcon,
  FileText,
  Palette
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AdStrategyPanel } from "./AdStrategyPanel";
import { LandingPagePreview } from "./LandingPagePreview";
import { cn } from "@/lib/utils";

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
}

interface MarketingImages {
  lifestyle?: string;
  usage?: string;
  multiAngle?: string[];
}

interface LandingPageBuilderProps {
  projectId: string;
  projectName: string;
  selectedImageUrl?: string;
  prdData?: {
    pain_points?: string[];
    selling_points?: string[];
    target_audience?: string;
  };
  landingPage: LandingPageData | null;
  onLandingPageChange: (data: LandingPageData) => void;
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
  analyzing: "分析产品信息...",
  designing: "生成设计思路...",
  "generating-images": "生成营销图片...",
  finalizing: "整合落地页...",
  complete: "生成完成！",
};

export function LandingPageBuilder({
  projectId,
  projectName,
  selectedImageUrl,
  prdData,
  landingPage,
  onLandingPageChange,
}: LandingPageBuilderProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState<GenerationStep>("idle");
  const [isPublishing, setIsPublishing] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [marketingImages, setMarketingImages] = useState<MarketingImages>({});

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .slice(0, 50) + "-" + Date.now().toString(36);
  };

  const handleAIGenerateLandingPage = async () => {
    setIsGenerating(true);
    setGenerationStep("analyzing");

    try {
      // Step 1: Call AI to generate landing page strategy and images
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
            },
            selectedImageUrl,
            targetMarket: "中国市场",
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "落地页生成失败");
      }

      setGenerationStep("generating-images");
      
      const data = await response.json();
      const { strategy, marketingImages: generatedImages } = data;

      setMarketingImages(generatedImages || {});
      setGenerationStep("finalizing");

      // Step 2: Save to database
      const slug = generateSlug(projectName);
      
      const { data: savedPage, error } = await supabase
        .from("landing_pages")
        .insert({
          project_id: projectId,
          title: strategy?.headline || projectName,
          slug,
          hero_image_url: selectedImageUrl || null,
          pain_points: strategy?.painPoints || prdData?.pain_points || [],
          selling_points: strategy?.sellingPoints || prdData?.selling_points || [],
          trust_badges: strategy?.trustBadges || ["✓ 30天无理由退款", "✓ 专业团队研发", "✓ 全球用户信赖"],
          is_published: false,
        })
        .select()
        .single();

      if (error) throw error;

      setGenerationStep("complete");
      onLandingPageChange(savedPage as unknown as LandingPageData);
      
      // Celebrate!
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
      toast.success("🚀 落地页发布成功！");
    } catch (error) {
      toast.error("发布失败");
    } finally {
      setIsPublishing(false);
    }
  };

  const getLandingPageUrl = () => {
    if (!landingPage) return "";
    return `${window.location.origin}/lp/${landingPage.slug}`;
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(getLandingPageUrl());
    toast.success("链接已复制到剪贴板");
  };

  const handleRegenerate = async () => {
    if (!landingPage) return;
    
    setIsRegenerating(true);
    try {
      // Delete existing landing page
      await supabase
        .from("landing_pages")
        .delete()
        .eq("id", landingPage.id);

      // Generate new one
      await handleAIGenerateLandingPage();
    } catch (error) {
      console.error(error);
      toast.error("重新生成失败");
    } finally {
      setIsRegenerating(false);
    }
  };

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
                
                <h3 className="text-2xl font-bold mb-2">AI 生成营销落地页</h3>
                <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                  基于您的产品 PRD 和选定的设计方案，AI 将自动生成专业的营销落地页，
                  包括营销文案和场景图片
                </p>

                <div className="flex items-center justify-center gap-6 mb-8 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-stage-1" />
                    <span>分析 PRD</span>
                  </div>
                  <div className="w-8 h-px bg-border" />
                  <div className="flex items-center gap-2">
                    <Palette className="w-4 h-4 text-stage-2" />
                    <span>设计思路</span>
                  </div>
                  <div className="w-8 h-px bg-border" />
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-stage-3" />
                    <span>生成图片</span>
                  </div>
                </div>

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
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    {landingPage.view_count} 次访问
                  </span>
                </div>
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
            heroImageUrl={landingPage.hero_image_url}
            painPoints={landingPage.pain_points}
            sellingPoints={landingPage.selling_points}
            trustBadges={landingPage.trust_badges}
            marketingImages={marketingImages}
            landingPageId={landingPage.id}
            isInteractive={false}
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

      {/* Ad Strategy Section */}
      <Separator className="my-8" />
      
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Megaphone className="w-6 h-6 text-accent" />
          <h2 className="text-xl font-semibold">广告测款策略</h2>
        </div>
        <p className="text-muted-foreground">
          AI 将根据您的产品信息生成受众画像、A/B测试文案和市场潜力评估
        </p>
        
        <AdStrategyPanel
          productName={projectName}
          productDescription={landingPage.title}
          painPoints={landingPage.pain_points as string[] | undefined}
          sellingPoints={landingPage.selling_points as string[] | undefined}
        />
      </div>
    </div>
  );
}
