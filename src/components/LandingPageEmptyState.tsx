import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Palette, 
  Wand2, 
  BarChart3, 
  Check, 
  ChevronRight,
  Sparkles,
  Image as ImageIcon,
  Video,
  FileText,
  Target
} from "lucide-react";
import { cn } from "@/lib/utils";

interface LandingPageEmptyStateProps {
  hasProductImage: boolean;
  hasMarketingImages: boolean;
  hasVideo: boolean;
  hasPrdData: boolean;
  onBackToVisual?: () => void;
}

export function LandingPageEmptyState({
  hasProductImage,
  hasMarketingImages,
  hasVideo,
  hasPrdData,
}: LandingPageEmptyStateProps) {
  const workflowSteps = [
    {
      step: 1,
      title: "选择模板风格",
      desc: "挑选最适合产品定位的页面风格",
      icon: Palette,
      color: "text-stage-1",
      bgColor: "bg-stage-1/10",
      borderColor: "border-stage-1/30",
    },
    {
      step: 2,
      title: "AI 智能生成",
      desc: "融合 PRD、素材与竞品洞察，自动生成高转化页面",
      icon: Wand2,
      color: "text-stage-2",
      bgColor: "bg-stage-2/10",
      borderColor: "border-stage-2/30",
    },
    {
      step: 3,
      title: "发布 & 数据追踪",
      desc: "一键发布并实时追踪访问量与邮件转化",
      icon: BarChart3,
      color: "text-stage-3",
      bgColor: "bg-stage-3/10",
      borderColor: "border-stage-3/30",
    },
  ];

  const prerequisites = [
    { 
      id: "prd", 
      label: "产品定义", 
      ready: hasPrdData, 
      icon: FileText,
      hint: "痛点、卖点、目标用户" 
    },
    { 
      id: "product", 
      label: "产品造型", 
      ready: hasProductImage, 
      icon: Target,
      hint: "选定的产品渲染图" 
    },
    { 
      id: "images", 
      label: "营销图片", 
      ready: hasMarketingImages, 
      icon: ImageIcon,
      hint: "场景图、结构图等" 
    },
    { 
      id: "video", 
      label: "产品视频", 
      ready: hasVideo, 
      icon: Video,
      hint: "用于页面 Hero 区域" 
    },
  ];

  const readyCount = prerequisites.filter(p => p.ready).length;
  const allReady = readyCount === prerequisites.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Workflow Steps */}
      <Card className="glass border-primary/20 overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-stage-3/20 to-accent/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-stage-3" />
            </div>
            <div>
              <h4 className="font-semibold">落地页生成流程</h4>
              <p className="text-xs text-muted-foreground">AI 将自动完成以下步骤</p>
            </div>
          </div>

          {/* Steps Flow */}
          <div className="flex flex-col md:flex-row gap-4 md:gap-2">
            {workflowSteps.map((item, index) => (
              <div key={item.step} className="flex-1 flex items-center gap-2">
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.15 }}
                  className={cn(
                    "flex-1 p-4 rounded-xl border transition-all",
                    item.bgColor,
                    item.borderColor
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                      "bg-gradient-to-br from-background to-muted"
                    )}>
                      <item.icon className={cn("w-5 h-5", item.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={cn(
                          "text-xs font-medium px-1.5 py-0.5 rounded",
                          item.bgColor, item.color
                        )}>
                          步骤 {item.step}
                        </span>
                      </div>
                      <p className="font-medium text-sm truncate">{item.title}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                </motion.div>
                {index < workflowSteps.length - 1 && (
                  <ChevronRight className="w-5 h-5 text-muted-foreground/50 hidden md:block flex-shrink-0" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Prerequisites Checklist */}
      <Card className={cn(
        "border transition-all",
        allReady 
          ? "border-accent/30 bg-accent/5" 
          : "border-primary/30 bg-primary/5"
      )}>
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center",
                allReady ? "bg-accent/20" : "bg-primary/20"
              )}>
                {allReady ? (
                  <Check className="w-4 h-4 text-accent" />
                ) : (
                  <FileText className="w-4 h-4 text-primary" />
                )}
              </div>
              <div>
                <h4 className="font-medium text-sm">
                  {allReady ? "素材已就绪" : "素材准备情况"}
                </h4>
                <p className="text-xs text-muted-foreground">
                  {allReady 
                    ? "所有素材已准备完毕，可以生成最佳效果的落地页" 
                    : `已完成 ${readyCount}/${prerequisites.length} 项，缺少的素材可能影响页面效果`
                  }
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {prerequisites.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className={cn(
                  "p-3 rounded-lg border transition-all",
                  item.ready
                    ? "bg-accent/10 border-accent/30"
                    : "bg-muted/50 border-border/50"
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  <item.icon className={cn(
                    "w-4 h-4",
                    item.ready ? "text-accent" : "text-muted-foreground"
                  )} />
                  <span className={cn(
                    "text-sm font-medium",
                    item.ready ? "text-accent-foreground" : "text-muted-foreground"
                  )}>
                    {item.label}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  {item.ready ? (
                    <Check className="w-3 h-3 text-accent" />
                  ) : (
                    <span className="w-3 h-3 rounded-full border-2 border-muted-foreground/30" />
                  )}
                  <span className={cn(
                    "text-xs",
                    item.ready ? "text-accent-foreground" : "text-muted-foreground"
                  )}>
                    {item.ready ? "已就绪" : item.hint}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>

          {!allReady && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-xs text-muted-foreground mt-4 text-center"
            >
              💡 提示：缺少的素材不会阻止生成，但完整素材能让落地页效果更佳
            </motion.p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
