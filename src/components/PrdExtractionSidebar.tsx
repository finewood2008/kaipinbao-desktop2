import { motion } from "framer-motion";
import { MapPin, Users, Palette, Zap, Check, Circle, Image as ImageIcon, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export interface PrdData {
  usageScenario?: string | null;
  targetAudience?: string | null;
  designStyle?: string | null;
  coreFeatures?: string[] | null;
  pricingRange?: string | null;
  painPoints?: string[] | null;
  sellingPoints?: string[] | null;
  marketAnalysis?: {
    competitorCount?: number | null;
    priceRange?: string | null;
    marketTrends?: string[] | null;
    differentiationOpportunity?: string | null;
  };
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

interface CompetitorProduct {
  id: string;
  product_title?: string;
  product_images?: string[];
  main_image?: string;
}

interface PrdExtractionSidebarProps {
  prdData: PrdData | null;
  competitorProducts?: CompetitorProduct[];
  className?: string;
}

const progressItems = [
  { key: "marketAnalysis", label: "市场分析", icon: TrendingUp },
  { key: "usageScenario", label: "使用场景", icon: MapPin },
  { key: "targetAudience", label: "目标用户", icon: Users },
  { key: "designStyle", label: "外观风格", icon: Palette },
  { key: "coreFeatures", label: "核心功能", icon: Zap },
] as const;

// Helper function to get display value for progress item
function getDisplayValue(prdData: PrdData | null, key: string): string | null {
  if (!prdData) return null;
  
  switch (key) {
    case "coreFeatures":
      return prdData.coreFeatures?.join("、") || null;
    case "marketAnalysis":
      if (!prdData.marketAnalysis) return null;
      const ma = prdData.marketAnalysis;
      const parts: string[] = [];
      if (ma.competitorCount) parts.push(`${ma.competitorCount}款竞品`);
      if (ma.priceRange) parts.push(ma.priceRange);
      if (ma.differentiationOpportunity) parts.push(ma.differentiationOpportunity);
      return parts.length > 0 ? parts.join(" · ") : null;
    default:
      const value = prdData[key as keyof PrdData];
      return typeof value === "string" ? value : null;
  }
}

// Helper function to check if progress item is completed
function isItemCompleted(prdData: PrdData | null, key: string): boolean {
  if (!prdData) return false;
  
  switch (key) {
    case "coreFeatures":
      return !!(prdData.coreFeatures && prdData.coreFeatures.length > 0);
    case "marketAnalysis":
      return !!(prdData.marketAnalysis && (
        prdData.marketAnalysis.competitorCount ||
        prdData.marketAnalysis.differentiationOpportunity ||
        prdData.marketAnalysis.priceRange
      ));
    default:
      return !!prdData[key as keyof PrdData];
  }
}

export function PrdExtractionSidebar({
  prdData,
  competitorProducts = [],
  className,
}: PrdExtractionSidebarProps) {
  const completedCount = progressItems.filter((item) => 
    isItemCompleted(prdData, item.key)
  ).length;

  const progressPercent = (completedCount / progressItems.length) * 100;

  // Get competitor images
  const competitorImages = competitorProducts
    .flatMap((p) => {
      const images = p.product_images || [];
      if (p.main_image && !images.includes(p.main_image)) {
        return [p.main_image, ...images];
      }
      return images;
    })
    .slice(0, 6);

  return (
    <div className={cn("flex flex-col h-full border-r border-border/50 bg-card/30", className)}>
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Progress Header */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">PRD 信息收集</h3>
              <span className="text-xs text-muted-foreground">
                {completedCount}/{progressItems.length}
              </span>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </div>

          {/* Progress Items */}
          <div className="space-y-3">
            {progressItems.map((item, index) => {
              const Icon = item.icon;
              const isCompleted = isItemCompleted(prdData, item.key);
              const value = getDisplayValue(prdData, item.key);

              return (
                <motion.div
                  key={item.key}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card
                    className={cn(
                      "p-3 transition-all duration-200",
                      isCompleted
                        ? "bg-primary/10 border-primary/30"
                        : "bg-muted/30 border-border/50"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                          isCompleted ? "bg-primary/20" : "bg-muted"
                        )}
                      >
                        {isCompleted ? (
                          <Check className="w-4 h-4 text-primary" />
                        ) : (
                          <Icon className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "text-sm font-medium",
                              isCompleted ? "text-foreground" : "text-muted-foreground"
                            )}
                          >
                            {item.label}
                          </span>
                          {isCompleted ? (
                            <Circle className="w-2 h-2 fill-primary text-primary" />
                          ) : (
                            <Circle className="w-2 h-2 text-muted-foreground/50" />
                          )}
                        </div>
                        {isCompleted && value && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {value}
                          </p>
                        )}
                        {!isCompleted && (
                          <p className="text-xs text-muted-foreground/50 mt-1 italic">
                            等待收集...
                          </p>
                        )}
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          {/* Competitor Images Reference */}
          {competitorImages.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-muted-foreground" />
                <h4 className="text-sm font-medium text-muted-foreground">竞品图片参考</h4>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {competitorImages.map((imageUrl, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="aspect-square rounded-lg overflow-hidden border border-border/50"
                  >
                    <img
                      src={imageUrl}
                      alt={`竞品 ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Completion Status */}
          {completedCount === progressItems.length && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-xl bg-gradient-to-r from-primary/20 to-accent/20 border border-primary/30"
            >
              <div className="flex items-center gap-2 mb-2">
                <Check className="w-5 h-5 text-primary" />
                <span className="font-semibold text-foreground">信息收集完成</span>
              </div>
              <p className="text-xs text-muted-foreground">
                所有核心信息已收集，可以生成完整 PRD 文档
              </p>
            </motion.div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
