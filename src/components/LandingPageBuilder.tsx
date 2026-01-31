import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { 
  Loader2, 
  Globe, 
  Copy, 
  ExternalLink, 
  Mail, 
  Eye, 
  Check,
  Sparkles,
  Megaphone
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AdStrategyPanel } from "./AdStrategyPanel";

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

export function LandingPageBuilder({
  projectId,
  projectName,
  selectedImageUrl,
  prdData,
  landingPage,
  onLandingPageChange,
}: LandingPageBuilderProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .slice(0, 50) + "-" + Date.now().toString(36);
  };

  const handleGenerateLandingPage = async () => {
    setIsGenerating(true);
    try {
      const slug = generateSlug(projectName);
      
      // Default content if PRD data is not available
      const painPoints = prdData?.pain_points || [
        "传统产品使用不便",
        "市场上缺乏创新解决方案",
        "现有产品价格过高"
      ];
      
      const sellingPoints = prdData?.selling_points || [
        "创新设计，解决核心痛点",
        "高品质材料，持久耐用",
        "性价比超高，物超所值"
      ];
      
      const trustBadges = [
        "✓ 30天无理由退款",
        "✓ 专业团队研发",
        "✓ 全球用户信赖"
      ];

      const { data, error } = await supabase
        .from("landing_pages")
        .insert({
          project_id: projectId,
          title: projectName,
          slug,
          hero_image_url: selectedImageUrl || null,
          pain_points: painPoints,
          selling_points: sellingPoints,
          trust_badges: trustBadges,
          is_published: false,
        })
        .select()
        .single();

      if (error) throw error;

      onLandingPageChange(data as unknown as LandingPageData);
      toast.success("落地页生成成功！");
    } catch (error) {
      console.error(error);
      toast.error("落地页生成失败");
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
      toast.success("落地页发布成功！");
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

  if (!landingPage) {
    return (
      <Card className="glass border-border/50">
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-stage-3/20 flex items-center justify-center mx-auto mb-4">
            <Globe className="w-8 h-8 text-stage-3" />
          </div>
          <h3 className="text-xl font-semibold mb-2">生成营销落地页</h3>
          <p className="text-muted-foreground mb-6">
            基于您的产品信息和选定的设计方案，一键生成专业的营销落地页
          </p>
          <Button
            onClick={handleGenerateLandingPage}
            disabled={isGenerating}
            className="bg-gradient-to-r from-stage-3 to-stage-3/80"
            size="lg"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                正在生成...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                生成落地页
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <Card className={`glass ${landingPage.is_published ? "border-green-500/50" : "border-stage-3/50"}`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${landingPage.is_published ? "bg-green-500" : "bg-yellow-500"}`} />
              <div>
                <p className="font-medium">
                  {landingPage.is_published ? "已发布" : "草稿"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {landingPage.title}
                </p>
              </div>
            </div>
            
            {landingPage.is_published && (
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  {landingPage.view_count} 次访问
                </span>
              </div>
            )}
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
              className="w-full bg-stage-3 hover:bg-stage-3/90"
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
          <div className="bg-white text-gray-900 p-8">
            {/* Hero Section */}
            <div className="text-center mb-8">
              {landingPage.hero_image_url && (
                <img
                  src={landingPage.hero_image_url}
                  alt={landingPage.title}
                  className="w-full max-w-md mx-auto rounded-lg shadow-lg mb-6"
                />
              )}
              <h1 className="text-3xl font-bold mb-4">{landingPage.title}</h1>
            </div>

            {/* Pain Points */}
            {landingPage.pain_points && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4 text-center">您是否遇到这些问题？</h2>
                <div className="space-y-2">
                  {(landingPage.pain_points as string[]).map((point, i) => (
                    <p key={i} className="text-gray-600 text-center">❌ {point}</p>
                  ))}
                </div>
              </div>
            )}

            {/* Selling Points */}
            {landingPage.selling_points && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4 text-center">我们的解决方案</h2>
                <div className="space-y-2">
                  {(landingPage.selling_points as string[]).map((point, i) => (
                    <p key={i} className="text-green-600 text-center">✓ {point}</p>
                  ))}
                </div>
              </div>
            )}

            {/* Trust Badges */}
            {landingPage.trust_badges && (
              <div className="flex justify-center gap-4 mb-8 flex-wrap">
                {(landingPage.trust_badges as string[]).map((badge, i) => (
                  <span key={i} className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                    {badge}
                  </span>
                ))}
              </div>
            )}

            {/* CTA */}
            <div className="text-center bg-gradient-to-r from-blue-500 to-purple-500 text-white p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-2">抢先体验</h3>
              <p className="text-sm opacity-90 mb-4">留下邮箱，第一时间获取产品动态</p>
              <div className="flex max-w-sm mx-auto gap-2">
                <div className="flex-1 bg-white/20 rounded px-3 py-2 text-left text-white/50">
                  your@email.com
                </div>
                <div className="bg-white text-blue-600 px-4 py-2 rounded font-medium">
                  订阅
                </div>
              </div>
            </div>
          </div>
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
          <Megaphone className="w-6 h-6 text-accent-foreground" />
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
