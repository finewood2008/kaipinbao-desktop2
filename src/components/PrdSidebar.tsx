import { motion } from "framer-motion";
import { Check, MapPin, Users, Palette, Zap, ClipboardCheck, TrendingUp, TrendingDown, Lightbulb, Image, Video, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState } from "react";

export interface PrdProgress {
  usageScenario: boolean;
  targetAudience: boolean;
  designStyle: boolean;
  coreFeatures: boolean;
  confirmed: boolean;
}

export interface PrdData {
  usageScenario?: string | null;
  targetAudience?: string | null;
  designStyle?: string | null;
  coreFeatures?: string[] | null;
  pricingRange?: string | null;
  painPoints?: string[] | null;
  sellingPoints?: string[] | null;
  marketingAssets?: {
    sceneDescription?: string | null;
    structureHighlights?: string[] | null;
    explodedComponents?: string[] | null;
    usageScenarios?: string[] | null;
    lifestyleContext?: string | null;
  };
  videoAssets?: {
    storyLine?: string | null;
    keyActions?: string[] | null;
    emotionalTone?: string | null;
  };
  competitorInsights?: {
    positivePoints?: string[] | null;
    negativePoints?: string[] | null;
    differentiationStrategy?: string | null;
  };
}

interface CompetitorInsight {
  positivePoints: string[];
  negativePoints: string[];
  totalReviews: number;
  productsAnalyzed: number;
}

interface PrdSidebarProps {
  progress: PrdProgress;
  prdData?: PrdData | null;
  competitorInsight?: CompetitorInsight | null;
  onItemClick?: (item: keyof PrdProgress) => void;
  onViewPrd?: () => void;
  className?: string;
}

const progressItems = [
  { key: "usageScenario" as const, label: "使用场景", icon: MapPin, dataKey: "usageScenario" as const },
  { key: "targetAudience" as const, label: "目标用户", icon: Users, dataKey: "targetAudience" as const },
  { key: "designStyle" as const, label: "外观风格", icon: Palette, dataKey: "designStyle" as const },
  { key: "coreFeatures" as const, label: "核心功能", icon: Zap, dataKey: "coreFeatures" as const },
  { key: "confirmed" as const, label: "信息确认", icon: ClipboardCheck, dataKey: null },
];

const assetReminders = [
  { icon: Image, label: "场景图数据", items: ["使用环境", "光线氛围", "背景元素"], dataKey: "sceneDescription" as const },
  { icon: Image, label: "结构/爆炸图", items: ["内部组件", "技术亮点"], dataKey: "structureHighlights" as const },
  { icon: Video, label: "视频场景", items: ["6秒故事线", "情感基调"], dataKey: "storyLine" as const },
];

export function PrdSidebar({ progress, prdData, competitorInsight, onItemClick, onViewPrd, className }: PrdSidebarProps) {
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  
  const completedCount = Object.values(progress).filter(Boolean).length;
  const totalCount = progressItems.length;
  const progressPercent = (completedCount / totalCount) * 100;

  const toggleExpand = (key: string) => {
    setExpandedItems(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const getDataValue = (key: string): string | string[] | null => {
    if (!prdData) return null;
    
    switch (key) {
      case "usageScenario":
        return prdData.usageScenario || null;
      case "targetAudience":
        return prdData.targetAudience || null;
      case "designStyle":
        return prdData.designStyle || null;
      case "coreFeatures":
        return prdData.coreFeatures || null;
      default:
        return null;
    }
  };

  const getAssetStatus = (dataKey: string): { collected: boolean; value?: string | string[] } => {
    if (!prdData) return { collected: false };
    
    switch (dataKey) {
      case "sceneDescription":
        return { 
          collected: !!prdData.marketingAssets?.sceneDescription,
          value: prdData.marketingAssets?.sceneDescription || undefined
        };
      case "structureHighlights":
        return { 
          collected: !!(prdData.marketingAssets?.structureHighlights?.length),
          value: prdData.marketingAssets?.structureHighlights || undefined
        };
      case "storyLine":
        return { 
          collected: !!prdData.videoAssets?.storyLine,
          value: prdData.videoAssets?.storyLine || undefined
        };
      default:
        return { collected: false };
    }
  };

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

        {/* Progress Steps with Data Display */}
        <div className="space-y-1">
          {progressItems.map((item, index) => {
            const isCompleted = progress[item.key];
            const Icon = item.icon;
            const dataValue = item.dataKey ? getDataValue(item.dataKey) : null;
            const hasData = dataValue !== null && (Array.isArray(dataValue) ? dataValue.length > 0 : !!dataValue);
            const isExpanded = expandedItems[item.key];

            return (
              <motion.div
                key={item.key}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Collapsible open={isExpanded && hasData} onOpenChange={() => hasData && toggleExpand(item.key)}>
                  <CollapsibleTrigger asChild>
                    <button
                      onClick={() => hasData ? toggleExpand(item.key) : onItemClick?.(item.key)}
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
                        {hasData && !isExpanded && (
                          <p className="text-xs text-muted-foreground truncate">
                            {Array.isArray(dataValue) 
                              ? `${dataValue.length}项功能` 
                              : String(dataValue).slice(0, 20) + (String(dataValue).length > 20 ? "..." : "")}
                          </p>
                        )}
                      </div>
                      {hasData && (
                        isExpanded 
                          ? <ChevronDown className="w-4 h-4 text-muted-foreground" />
                          : <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      )}
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    {hasData && (
                      <div className="ml-9 mr-3 mb-2 p-2 bg-muted/30 rounded-md">
                        {Array.isArray(dataValue) ? (
                          <ul className="text-xs text-muted-foreground space-y-1">
                            {dataValue.map((v, i) => (
                              <li key={i} className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary/50" />
                                {v}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-xs text-muted-foreground">{String(dataValue)}</p>
                        )}
                      </div>
                    )}
                  </CollapsibleContent>
                </Collapsible>
              </motion.div>
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

        {/* AI Generated Assets Status */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="space-y-3"
        >
          <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-primary" />
            AI 素材方案
          </h4>
          <p className="text-xs text-muted-foreground">
            营销素材和视频将由 AI 自动生成
          </p>
          
          {/* View PRD Button */}
          {onViewPrd && prdData && (prdData.usageScenario || prdData.coreFeatures?.length) && (
            <button
              onClick={onViewPrd}
              className="w-full mt-2 px-3 py-2.5 rounded-lg bg-primary/10 hover:bg-primary/20 border border-primary/30 transition-colors text-left"
            >
              <div className="flex items-center gap-2">
                <ClipboardCheck className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-primary">查看完整 PRD</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">审核并编辑产品需求定义</p>
            </button>
          )}
        </motion.div>

        {/* Video Assets Status */}
        {prdData?.videoAssets && (prdData.videoAssets.storyLine || prdData.videoAssets.keyActions?.length) && (
          <>
            <Separator className="bg-border/50" />
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-2"
            >
              <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                🎬 视频素材
              </h4>
              {prdData.videoAssets.storyLine && (
                <div className="bg-primary/10 rounded-lg p-2">
                  <p className="text-xs font-medium text-primary mb-1">故事线</p>
                  <p className="text-xs text-muted-foreground">{prdData.videoAssets.storyLine}</p>
                </div>
              )}
              {prdData.videoAssets.emotionalTone && (
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-muted-foreground">情感基调:</span>
                  <span className="px-2 py-0.5 bg-accent rounded text-accent-foreground">{prdData.videoAssets.emotionalTone}</span>
                </div>
              )}
            </motion.div>
          </>
        )}
      </div>
    </ScrollArea>
  );
}

// Utility function to calculate progress from chat messages (kept for backward compatibility)
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
