import { motion } from "framer-motion";
import { Check, MapPin, Users, Palette, Zap, ClipboardCheck, TrendingUp, TrendingDown, Lightbulb, Image, Video } from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

export interface PrdProgress {
  usageScenario: boolean;
  targetAudience: boolean;
  designStyle: boolean;
  coreFeatures: boolean;
  confirmed: boolean;
}

interface CompetitorInsight {
  positivePoints: string[];
  negativePoints: string[];
  totalReviews: number;
  productsAnalyzed: number;
}

interface PrdSidebarProps {
  progress: PrdProgress;
  competitorInsight?: CompetitorInsight | null;
  onItemClick?: (item: keyof PrdProgress) => void;
  className?: string;
}

const progressItems = [
  { key: "usageScenario" as const, label: "使用场景", icon: MapPin, description: "产品使用环境" },
  { key: "targetAudience" as const, label: "目标用户", icon: Users, description: "用户画像与痛点" },
  { key: "designStyle" as const, label: "外观风格", icon: Palette, description: "材质、形态、颜色" },
  { key: "coreFeatures" as const, label: "核心功能", icon: Zap, description: "卖点与差异化" },
  { key: "confirmed" as const, label: "信息确认", icon: ClipboardCheck, description: "确认PRD信息" },
];

const assetReminders = [
  { icon: Image, label: "场景图数据", items: ["使用环境", "光线氛围", "背景元素"] },
  { icon: Image, label: "结构/爆炸图", items: ["内部组件", "技术亮点"] },
  { icon: Video, label: "视频场景", items: ["6秒故事线", "情感基调"] },
];

export function PrdSidebar({ progress, competitorInsight, onItemClick, className }: PrdSidebarProps) {
  const completedCount = Object.values(progress).filter(Boolean).length;
  const totalCount = progressItems.length;
  const progressPercent = (completedCount / totalCount) * 100;

  return (
    <ScrollArea className={cn("h-full bg-card/30 backdrop-blur-sm border-r border-border/50", className)}>
      <div className="p-4 space-y-6">
        {/* Progress Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
              📋 PRD 进度
            </h4>
            <span className="text-xs font-medium text-primary">
              {completedCount}/{totalCount}
            </span>
          </div>
          <Progress value={progressPercent} className="h-2" />
          <p className="text-xs text-muted-foreground mt-1 text-right">
            {Math.round(progressPercent)}% 完成
          </p>
        </motion.div>

        {/* Progress Steps */}
        <div className="space-y-1">
          {progressItems.map((item, index) => {
            const isCompleted = progress[item.key];
            const Icon = item.icon;

            return (
              <motion.button
                key={item.key}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => onItemClick?.(item.key)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all",
                  "hover:bg-muted/50",
                  isCompleted
                    ? "bg-primary/10"
                    : "bg-transparent"
                )}
              >
                <div className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0",
                  isCompleted
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}>
                  {isCompleted ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : (
                    <Icon className="w-3.5 h-3.5" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    "text-sm font-medium truncate",
                    isCompleted ? "text-primary" : "text-foreground"
                  )}>
                    {item.label}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {item.description}
                  </p>
                </div>
              </motion.button>
            );
          })}
        </div>

        <Separator className="bg-border/50" />

        {/* Competitor Insights */}
        {competitorInsight && competitorInsight.productsAnalyzed > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="space-y-3"
          >
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
              📊 竞品洞察
            </h4>
            <p className="text-xs text-muted-foreground">
              已分析 {competitorInsight.productsAnalyzed} 款竞品，{competitorInsight.totalReviews} 条评论
            </p>

            {competitorInsight.positivePoints.length > 0 && (
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-green-500">
                  <TrendingUp className="w-3 h-3" />
                  <span className="font-medium">好评要点</span>
                </div>
                <ul className="text-xs text-muted-foreground space-y-0.5 pl-4">
                  {competitorInsight.positivePoints.slice(0, 3).map((point, i) => (
                    <li key={i} className="list-disc">{point}</li>
                  ))}
                </ul>
              </div>
            )}

            {competitorInsight.negativePoints.length > 0 && (
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-red-500">
                  <TrendingDown className="w-3 h-3" />
                  <span className="font-medium">差评痛点</span>
                </div>
                <ul className="text-xs text-muted-foreground space-y-0.5 pl-4">
                  {competitorInsight.negativePoints.slice(0, 3).map((point, i) => (
                    <li key={i} className="list-disc">{point}</li>
                  ))}
                </ul>
              </div>
            )}
          </motion.div>
        )}

        <Separator className="bg-border/50" />

        {/* Asset Data Reminders */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="space-y-3"
        >
          <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-yellow-500" />
            待收集信息
          </h4>
          <p className="text-xs text-muted-foreground">
            用于后续视觉生成
          </p>
          <div className="space-y-2">
            {assetReminders.map((reminder, index) => {
              const Icon = reminder.icon;
              return (
                <div key={index} className="bg-muted/30 rounded-lg p-2">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-foreground mb-1">
                    <Icon className="w-3 h-3 text-primary" />
                    {reminder.label}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {reminder.items.map((item, i) => (
                      <span key={i} className="text-xs bg-background/50 text-muted-foreground px-1.5 py-0.5 rounded">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </ScrollArea>
  );
}

// Utility function to calculate progress from chat messages
export function calculatePrdProgress(messages: { role: string; content: string }[]): PrdProgress {
  const allContent = messages.map(m => m.content).join(' ').toLowerCase();
  
  return {
    usageScenario: /室内|户外|家用|办公|车载|便携|露营|旅行|运动|健身|厨房|卧室|浴室/.test(allContent),
    targetAudience: /用户|客户|人群|年轻|白领|家庭|学生|商务|女性|男性|老人|儿童|宝妈|上班族/.test(allContent),
    designStyle: /材质|颜色|风格|外观|金属|塑料|圆润|硬朗|简约|现代|复古|科技感|木质|皮质/.test(allContent),
    coreFeatures: /功能|特性|特点|优势|卖点|支持|具备|包含|差异化|创新/.test(allContent),
    confirmed: /确认|总结|汇总|以上信息|需求文档|prd|stage_complete/i.test(allContent)
  };
}
