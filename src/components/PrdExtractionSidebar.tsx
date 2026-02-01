import { motion } from "framer-motion";
import { MapPin, Users, Palette, Zap, Check, Circle, Image as ImageIcon, Tag, DollarSign, Package, Lightbulb } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface PrdData {
  // Core fields
  usageScenario?: string | null;
  targetAudience?: string | null;
  designStyle?: string | null;
  coreFeatures?: string[] | null;
  pricingRange?: string | null;
  painPoints?: string[] | null;
  sellingPoints?: string[] | null;
  
  // Enhanced fields
  productName?: string | null;
  productTagline?: string | null;
  productCategory?: string | null;
  dialoguePhase?: "direction-exploration" | "direction-confirmed" | "details-refinement" | "prd-ready";
  selectedDirection?: string | null;
  
  // Specifications
  specifications?: {
    dimensions?: string | null;
    weight?: string | null;
    materials?: string[] | null;
    colors?: string[] | null;
    powerSource?: string | null;
    connectivity?: string | null;
  } | null;
  
  // CMF Design
  cmfDesign?: {
    primaryColor?: string | null;
    secondaryColor?: string | null;
    accentColor?: string | null;
    surfaceFinish?: string | null;
    textureDetails?: string | null;
    materialBreakdown?: { material: string; percentage: number; location: string }[] | null;
  } | null;
  
  // User Experience
  userExperience?: {
    unboxingExperience?: string | null;
    firstUseFlow?: string[] | null;
    dailyUseScenarios?: string[] | null;
    painPointsSolved?: { painPoint: string; solution: string }[] | null;
  } | null;
  
  // Feature Matrix
  featureMatrix?: {
    feature: string;
    priority: "must-have" | "important" | "nice-to-have";
    painPointAddressed: string;
    differentiator: string;
    implementationNote: string;
  }[] | null;
  
  // Market Positioning
  marketPositioning?: {
    priceTier?: "budget" | "mid-range" | "premium" | "luxury";
    primaryCompetitors?: string[] | null;
    uniqueSellingPoints?: string[] | null;
    competitiveAdvantages?: string[] | null;
    targetMarketSize?: string | null;
  } | null;
  
  // Packaging
  packaging?: {
    packageType?: string | null;
    includedAccessories?: string[] | null;
    specialPackagingFeatures?: string | null;
    sustainabilityFeatures?: string | null;
  } | null;
  
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
  { key: "selectedDirection", label: "产品方向", icon: Lightbulb },
  { key: "usageScenario", label: "使用场景", icon: MapPin },
  { key: "targetAudience", label: "目标用户", icon: Users },
  { key: "designStyle", label: "外观风格", icon: Palette },
  { key: "coreFeatures", label: "核心功能", icon: Zap },
  { key: "pricingRange", label: "定价策略", icon: DollarSign },
] as const;

// Helper function to get display value for progress item
function getDisplayValue(prdData: PrdData | null, key: string): string | null {
  if (!prdData) return null;
  
  switch (key) {
    case "coreFeatures":
      return prdData.coreFeatures?.slice(0, 3).join("、") || null;
    case "selectedDirection":
      return prdData.selectedDirection || null;
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
    case "selectedDirection":
      return !!prdData.selectedDirection;
    default:
      return !!prdData[key as keyof PrdData];
  }
}

// Get phase label
function getPhaseLabel(phase: string | undefined): { label: string; color: string } {
  switch (phase) {
    case "direction-exploration":
      return { label: "探索方向", color: "bg-blue-500/20 text-blue-400" };
    case "direction-confirmed":
      return { label: "方向已确认", color: "bg-yellow-500/20 text-yellow-400" };
    case "details-refinement":
      return { label: "细化细节", color: "bg-orange-500/20 text-orange-400" };
    case "prd-ready":
      return { label: "PRD完成", color: "bg-green-500/20 text-green-400" };
    default:
      return { label: "开始对话", color: "bg-muted text-muted-foreground" };
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
  const phase = getPhaseLabel(prdData?.dialoguePhase);

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
          {/* Phase Indicator */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">对话阶段</h3>
              <Badge className={cn("text-xs", phase.color)}>
                {phase.label}
              </Badge>
            </div>
            
            {/* Product Name if available */}
            {prdData?.productName && (
              <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                <div className="flex items-center gap-2 mb-1">
                  <Tag className="w-3 h-3 text-primary" />
                  <span className="text-xs text-muted-foreground">产品名称</span>
                </div>
                <p className="text-sm font-medium text-foreground">{prdData.productName}</p>
                {prdData.productTagline && (
                  <p className="text-xs text-muted-foreground mt-1">{prdData.productTagline}</p>
                )}
              </div>
            )}
          </div>

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
          {prdData?.dialoguePhase === "prd-ready" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-xl bg-gradient-to-r from-primary/20 to-accent/20 border border-primary/30"
            >
              <div className="flex items-center gap-2 mb-2">
                <Check className="w-5 h-5 text-primary" />
                <span className="font-semibold text-foreground">PRD 已完成</span>
              </div>
              <p className="text-xs text-muted-foreground">
                所有核心信息已收集，可以进入 PRD 审核页面查看和编辑
              </p>
            </motion.div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
