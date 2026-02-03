import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  ArrowRight, 
  Calendar, 
  MessageSquare, 
  Palette, 
  Rocket, 
  ExternalLink, 
  Copy, 
  Eye,
  Mail,
  Globe,
  Check,
  TrendingUp,
  Trash2,
  Image as ImageIcon,
  Loader2
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
  productImages?: string[];
  landingPage?: LandingPageInfo;
  onClick: () => void;
  onDelete?: () => Promise<void>;
}

const stageInfo = [
  { label: "市场调研", icon: MessageSquare, color: "bg-stage-1" },
  { label: "产品定义", icon: MessageSquare, color: "bg-stage-1" },
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
  productImages = [],
  landingPage,
  onClick,
  onDelete,
}: ProjectCardProps) {
  const [copied, setCopied] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Get initials for placeholder
  const initials = name.slice(0, 2).toUpperCase();
  const stage = stageInfo[currentStage - 1];
  const StageIcon = stage?.icon || MessageSquare;

  // Combine cover image with product images
  const allImages = coverImage 
    ? [coverImage, ...productImages.filter(img => img !== coverImage)]
    : productImages;
  const displayImages = allImages.slice(0, 4);

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

  const handleDelete = async () => {
    if (!onDelete) return;
    setIsDeleting(true);
    try {
      await onDelete();
    } finally {
      setIsDeleting(false);
    }
  };

  // Calculate conversion rate
  const conversionRate = landingPage && landingPage.viewCount > 0 
    ? ((landingPage.emailCount / landingPage.viewCount) * 100).toFixed(1)
    : null;

  return (
    <motion.div
      whileHover={{ scale: 1.005 }}
      whileTap={{ scale: 0.995 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card
        className="glass cursor-pointer transition-all duration-300 hover:glow-card group overflow-hidden"
        onClick={onClick}
      >
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Left: Product Images Grid */}
            <div className="w-full lg:w-1/3 flex-shrink-0">
              <div className="grid grid-cols-2 gap-2">
                {displayImages.length > 0 ? (
                  displayImages.map((img, i) => (
                    <div 
                      key={i}
                      className={cn(
                        "aspect-square rounded-lg overflow-hidden bg-gradient-to-br from-muted/50 to-muted/20",
                        i === 0 && "ring-2 ring-primary/30"
                      )}
                    >
                      <img 
                        src={img} 
                        alt={`产品图 ${i + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))
                ) : (
                  // Placeholder when no images
                  Array.from({ length: 4 }).map((_, i) => (
                    <div 
                      key={i}
                      className="aspect-square rounded-lg bg-gradient-to-br from-muted/30 to-muted/10 flex items-center justify-center"
                    >
                      {i === 0 ? (
                        <span className="text-2xl font-bold text-primary/50">{initials}</span>
                      ) : (
                        <ImageIcon className="w-6 h-6 text-muted-foreground/30" />
                      )}
                    </div>
                  ))
                )}
              </div>
              {/* Fill remaining slots if less than 4 images */}
              {displayImages.length > 0 && displayImages.length < 4 && (
                <div className="hidden">
                  {/* Images already displayed above */}
                </div>
              )}
            </div>

            {/* Center: Project Info */}
            <div className="flex-1 flex flex-col min-w-0">
              {/* Header with Title, Status and Delete */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-semibold line-clamp-1">{name}</h3>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge
                    variant={status === "completed" ? "default" : "secondary"}
                    className={cn(
                      "text-xs",
                      status === "completed" && "bg-stage-3",
                      status === "active" && "bg-primary"
                    )}
                  >
                    {status === "completed" ? "已完成" : status === "active" ? "进行中" : "已归档"}
                  </Badge>
                  
                  {onDelete && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                        <AlertDialogHeader>
                          <AlertDialogTitle>确认删除项目？</AlertDialogTitle>
                          <AlertDialogDescription>
                            此操作将永久删除「{name}」项目及其所有相关数据（包括落地页、生成的图片等），且无法恢复。
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>取消</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={handleDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            disabled={isDeleting}
                          >
                            {isDeleting ? (
                              <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            ) : null}
                            确认删除
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
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

              {/* Landing Page Actions */}
              {landingPage?.isPublished && landingPageUrl && (
                <div className="flex gap-2 mt-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs"
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

              {/* Footer */}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/30">
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
            </div>

            {/* Right: Landing Page Preview */}
            <div className="w-full lg:w-1/4 flex-shrink-0">
              {/* Browser Frame Style Preview */}
              <div className="rounded-lg border border-border/50 shadow-lg overflow-hidden bg-background/50">
                {/* Browser Toolbar */}
                <div className="h-6 bg-muted/50 flex items-center px-2 gap-1.5 border-b border-border/30">
                  <div className="w-2 h-2 rounded-full bg-destructive/60" />
                  <div className="w-2 h-2 rounded-full bg-yellow-500/60" />
                  <div className="w-2 h-2 rounded-full bg-green-500/60" />
                  <div className="flex-1 mx-2">
                    <div className="h-3 rounded-full bg-muted/50 flex items-center justify-center">
                      <span className="text-[8px] text-muted-foreground truncate px-2">
                        {landingPage?.slug ? `kaipinbao.lovable.app/lp/${landingPage.slug}` : '待生成落地页'}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Page Preview */}
                <div className="aspect-[9/16] max-h-[200px] overflow-hidden relative">
                  {landingPage?.heroImageUrl ? (
                    <img 
                      src={landingPage.heroImageUrl} 
                      alt="落地页预览"
                      className="w-full h-full object-cover object-top"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-muted/30 to-muted/10">
                      <Globe className="w-8 h-8 text-muted-foreground/30" />
                      <span className="text-xs text-muted-foreground/50 mt-2">
                        {landingPage ? "待添加封面" : "待生成"}
                      </span>
                    </div>
                  )}
                  
                  {/* Published Badge Overlay */}
                  {landingPage && (
                    <div className="absolute top-2 right-2">
                      {landingPage.isPublished ? (
                        <Badge className="bg-primary/90 text-primary-foreground text-[10px] px-1.5 py-0.5">
                          <Check className="w-2.5 h-2.5 mr-0.5" />
                          已发布
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5">
                          草稿
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Stats Card Below Preview */}
              {landingPage && (
                <div className="mt-2 p-2 rounded-lg bg-muted/20 border border-border/30">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <div className="flex items-center justify-center gap-1 text-muted-foreground">
                        <Eye className="w-3 h-3" />
                      </div>
                      <p className="text-sm font-semibold">{landingPage.viewCount}</p>
                      <p className="text-[10px] text-muted-foreground">访问</p>
                    </div>
                    <div>
                      <div className="flex items-center justify-center gap-1 text-muted-foreground">
                        <Mail className="w-3 h-3" />
                      </div>
                      <p className="text-sm font-semibold">{landingPage.emailCount}</p>
                      <p className="text-[10px] text-muted-foreground">订阅</p>
                    </div>
                    <div>
                      <div className="flex items-center justify-center gap-1 text-muted-foreground">
                        <TrendingUp className="w-3 h-3" />
                      </div>
                      <p className="text-sm font-semibold">{conversionRate || '0'}%</p>
                      <p className="text-[10px] text-muted-foreground">转化</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
