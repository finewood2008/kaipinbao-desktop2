import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  ArrowRight, 
  Calendar, 
  MessageSquare, 
  Palette, 
  Rocket, 
  ExternalLink, 
  Copy, 
  Eye,
  FileText,
  Globe,
  Check
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { toast } from "sonner";
import { useState } from "react";

interface LandingPageInfo {
  slug: string;
  isPublished: boolean;
  heroImageUrl?: string;
  viewCount: number;
  emailCount: number;
}

interface ProjectCardProps {
  id: string;
  name: string;
  description?: string;
  currentStage: number;
  status: string;
  createdAt: string;
  coverImage?: string;
  landingPage?: LandingPageInfo;
  onClick: () => void;
}

const stageInfo = [
  { label: "PRD细化", icon: MessageSquare, color: "bg-stage-1" },
  { label: "视觉生成", icon: Palette, color: "bg-stage-2" },
  { label: "落地页", icon: Rocket, color: "bg-stage-3" },
];

export function ProjectCard({
  name,
  description,
  currentStage,
  status,
  createdAt,
  coverImage,
  landingPage,
  onClick,
}: ProjectCardProps) {
  const [copied, setCopied] = useState(false);
  
  // Get initials for placeholder
  const initials = name.slice(0, 2).toUpperCase();
  const stage = stageInfo[currentStage - 1];
  const StageIcon = stage?.icon || MessageSquare;

  const landingPageUrl = landingPage?.slug 
    ? `${window.location.origin}/lp/${landingPage.slug}`
    : null;

  const handleCopyLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (landingPageUrl) {
      navigator.clipboard.writeText(landingPageUrl);
      setCopied(true);
      toast.success("链接已复制到剪贴板");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleVisitPage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (landingPageUrl) {
      window.open(landingPageUrl, "_blank");
    }
  };

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card
        className="glass cursor-pointer transition-all duration-300 hover:glow-card group overflow-hidden"
        onClick={onClick}
      >
        {/* Image Section - Dual Display */}
        <div className="grid grid-cols-2 gap-1 p-1">
          {/* Product Cover Image */}
          <div className="aspect-[4/3] rounded-lg overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5 relative">
            {coverImage ? (
              <img 
                src={coverImage} 
                alt={name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-primary/30 to-accent/30">
                <span className="text-3xl font-bold text-primary/70">{initials}</span>
                <span className="text-xs text-muted-foreground mt-1">产品封面</span>
              </div>
            )}
            <div className="absolute bottom-1 left-1">
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5 bg-background/80 backdrop-blur-sm">
                <Palette className="w-3 h-3 mr-1" />
                产品图
              </Badge>
            </div>
          </div>
          
          {/* Landing Page Preview */}
          <div className="aspect-[4/3] rounded-lg overflow-hidden bg-gradient-to-br from-muted/50 to-muted/20 relative">
            {landingPage?.heroImageUrl ? (
              <img 
                src={landingPage.heroImageUrl} 
                alt="落地页预览"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center">
                <Globe className="w-8 h-8 text-muted-foreground/50" />
                <span className="text-xs text-muted-foreground mt-1">
                  {landingPage ? "待添加封面" : "待生成"}
                </span>
              </div>
            )}
            <div className="absolute bottom-1 left-1">
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5 bg-background/80 backdrop-blur-sm">
                <FileText className="w-3 h-3 mr-1" />
                落地页
              </Badge>
            </div>
          </div>
        </div>

        <CardContent className="pt-3 pb-4 px-4">
          {/* Title and Status */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="text-lg font-semibold line-clamp-1 flex-1">{name}</h3>
            <Badge
              variant={status === "completed" ? "default" : "secondary"}
              className={cn(
                "flex-shrink-0 text-xs",
                status === "completed" && "bg-stage-3",
                status === "active" && "bg-primary"
              )}
            >
              {status === "completed" ? "已完成" : status === "active" ? "进行中" : "已归档"}
            </Badge>
          </div>

          {/* Description */}
          {description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
              {description}
            </p>
          )}

          {/* Stage Indicator */}
          <div className="flex items-center gap-2 mb-3 py-2 px-3 rounded-lg bg-muted/30">
            <div className={cn("p-1.5 rounded-md", stage?.color || "bg-muted")}>
              <StageIcon className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-sm">
              阶段 {currentStage}: {stage?.label}
            </span>
            {/* Stage Progress Dots */}
            <div className="flex gap-1 ml-auto">
              {stageInfo.map((_, i) => (
                <div 
                  key={i}
                  className={cn(
                    "w-2 h-2 rounded-full transition-colors",
                    i < currentStage ? "bg-primary" : "bg-muted"
                  )}
                />
              ))}
            </div>
          </div>

          {/* Landing Page Section */}
          <div className="py-2 px-3 rounded-lg bg-muted/20 border border-border/50 mb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">落地页</span>
                {landingPage ? (
                  landingPage.isPublished ? (
                    <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">
                      <Check className="w-3 h-3 mr-1" />
                      已发布
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-xs">
                      草稿
                    </Badge>
                  )
                ) : (
                  <Badge variant="outline" className="text-xs text-muted-foreground">
                    待生成
                  </Badge>
                )}
              </div>
              
              {landingPage && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Eye className="w-3 h-3" />
                  <span>{landingPage.viewCount}</span>
                  {landingPage.emailCount > 0 && (
                    <>
                      <span className="mx-1">·</span>
                      <span>{landingPage.emailCount} 订阅</span>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            {landingPage?.isPublished && landingPageUrl && (
              <div className="flex gap-2 mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 h-8 text-xs"
                  onClick={handleVisitPage}
                >
                  <ExternalLink className="w-3 h-3 mr-1" />
                  访问页面
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-3 text-xs"
                  onClick={handleCopyLink}
                >
                {copied ? (
                    <Check className="w-3 h-3 text-primary" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </Button>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="w-3 h-3" />
              <span>
                {format(new Date(createdAt), "yyyy年MM月dd日", { locale: zhCN })}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="opacity-0 group-hover:opacity-100 transition-opacity h-8"
            >
              继续 <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
