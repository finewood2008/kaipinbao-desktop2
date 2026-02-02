import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MapPin, 
  Users, 
  Palette, 
  Zap, 
  Check, 
  Circle, 
  Image as ImageIcon, 
  Tag, 
  DollarSign, 
  Lightbulb,
  Pencil,
  X,
  ArrowRight,
  Asterisk
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
  isEditable?: boolean;
  onFieldEdit?: (field: string, value: unknown) => void;
  onProceedToDesign?: () => void;
}

const progressItems = [
  { key: "selectedDirection", label: "产品方向", icon: Lightbulb, placeholder: "例如：智能便携方向、专业高端路线" },
  { key: "usageScenario", label: "使用场景", icon: MapPin, placeholder: "例如：户外露营、办公室使用" },
  { key: "targetAudience", label: "目标用户", icon: Users, placeholder: "例如：25-35岁都市白领、户外爱好者" },
  { key: "designStyle", label: "外观风格", icon: Palette, placeholder: "例如：极简北欧风、科技感、复古风" },
  { key: "coreFeatures", label: "核心功能", icon: Zap, placeholder: "每行一个功能，例如：\n快速加热\n智能温控\n便携设计", isArray: true },
  { key: "pricingRange", label: "定价策略", icon: DollarSign, placeholder: "例如：中高端 ¥299-399" },
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
      return { label: "定义完成", color: "bg-green-500/20 text-green-400" };
    default:
      return { label: "开始对话", color: "bg-muted text-muted-foreground" };
  }
}

export function PrdExtractionSidebar({
  prdData,
  competitorProducts = [],
  className,
  isEditable = false,
  onFieldEdit,
  onProceedToDesign,
}: PrdExtractionSidebarProps) {
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>("");

  const completedCount = progressItems.filter((item) => 
    isItemCompleted(prdData, item.key)
  ).length;

  const progressPercent = (completedCount / progressItems.length) * 100;
  const phase = getPhaseLabel(prdData?.dialoguePhase);
  const isAllCompleted = completedCount === progressItems.length;

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

  const handleEditClick = (key: string) => {
    if (!isEditable) return;
    
    const currentValue = prdData?.[key as keyof PrdData];
    if (key === "coreFeatures" && Array.isArray(currentValue)) {
      setEditValue(currentValue.join("\n"));
    } else {
      setEditValue(typeof currentValue === "string" ? currentValue : "");
    }
    setEditingField(key);
  };

  const handleSaveEdit = () => {
    if (!editingField || !onFieldEdit) return;
    
    const item = progressItems.find(i => i.key === editingField);
    if (item && 'isArray' in item && item.isArray) {
      // Split by newlines and filter empty strings
      const arrayValue = editValue.split("\n").map(s => s.trim()).filter(Boolean);
      onFieldEdit(editingField, arrayValue);
    } else {
      onFieldEdit(editingField, editValue.trim());
    }
    
    setEditingField(null);
    setEditValue("");
  };

  const handleCancelEdit = () => {
    setEditingField(null);
    setEditValue("");
  };

  const currentEditItem = progressItems.find(i => i.key === editingField);

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
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-foreground">产品定义</h3>
                <Badge variant="outline" className="text-xs bg-background/50 gap-1">
                  <Asterisk className="w-2.5 h-2.5 text-destructive" />
                  {completedCount}/{progressItems.length} 必填项
                </Badge>
              </div>
            </div>
            <div className="relative">
              <Progress value={progressPercent} className="h-2.5" />
              {/* Progress glow effect */}
              <motion.div 
                className="absolute top-0 left-0 h-2.5 rounded-full bg-gradient-to-r from-primary/50 to-accent/50 blur-sm"
                style={{ width: `${progressPercent}%` }}
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {completedCount === 0 ? "开始与 AI 对话收集产品信息" : 
               isAllCompleted ? "✓ 所有必填项已完成" :
               `已收集 ${completedCount} 项，继续对话或手动填写`}
            </p>
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
                  whileHover={{ scale: 1.02, x: 4 }}
                >
                  <Card
                    className={cn(
                      "p-3 transition-all duration-300 group relative",
                      isCompleted
                        ? "bg-primary/10 border-primary/30 shadow-sm shadow-primary/10"
                        : "bg-muted/30 border-border/50 hover:bg-muted/50 hover:border-border",
                      isEditable && "cursor-pointer"
                    )}
                    onClick={() => handleEditClick(item.key)}
                  >
                    {/* Required indicator */}
                    <div className="absolute top-2 right-2 flex items-center gap-1">
                      <Asterisk className="w-3 h-3 text-destructive" />
                      {isEditable && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditClick(item.key);
                          }}
                        >
                          <Pencil className="w-3 h-3" />
                        </Button>
                      )}
                    </div>

                    <div className="flex items-start gap-3">
                      <motion.div
                        className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-300",
                          isCompleted ? "bg-primary/20" : "bg-muted group-hover:bg-muted/80"
                        )}
                        animate={isCompleted ? {
                          boxShadow: [
                            "0 0 0 0 rgba(var(--primary), 0)",
                            "0 0 0 4px rgba(var(--primary), 0.15)",
                            "0 0 0 0 rgba(var(--primary), 0)"
                          ]
                        } : {}}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        {isCompleted ? (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 500 }}
                          >
                            <Check className="w-4 h-4 text-primary" />
                          </motion.div>
                        ) : (
                          <Icon className="w-4 h-4 text-muted-foreground" />
                        )}
                      </motion.div>
                      <div className="flex-1 min-w-0 pr-8">
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "text-sm font-medium transition-colors",
                              isCompleted ? "text-foreground" : "text-muted-foreground"
                            )}
                          >
                            {item.label}
                          </span>
                          {isCompleted ? (
                            <motion.div
                              animate={{ scale: [1, 1.3, 1] }}
                              transition={{ duration: 1.5, repeat: Infinity }}
                            >
                              <Circle className="w-2 h-2 fill-primary text-primary" />
                            </motion.div>
                          ) : (
                            <Circle className="w-2 h-2 text-muted-foreground/50" />
                          )}
                        </div>
                        {isCompleted && value && (
                          <motion.p 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            className="text-xs text-muted-foreground mt-1 line-clamp-2"
                          >
                            {value}
                          </motion.p>
                        )}
                        {!isCompleted && (
                          <p className="text-xs text-muted-foreground/50 mt-1 italic">
                            {isEditable ? "点击填写..." : "等待收集..."}
                          </p>
                        )}
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          <Separator />

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

          {/* Completion Status & Action */}
          {isAllCompleted && onProceedToDesign && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3"
            >
              <div className="p-4 rounded-xl bg-gradient-to-r from-primary/20 to-accent/20 border border-primary/30">
                <div className="flex items-center gap-2 mb-2">
                  <Check className="w-5 h-5 text-primary" />
                  <span className="font-semibold text-foreground">所有必填项已完成</span>
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  您可以进入产品设计阶段，或继续与 AI 对话完善更多细节
                </p>
                <Button
                  className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
                  onClick={onProceedToDesign}
                >
                  进入产品设计阶段
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </ScrollArea>

      {/* Edit Dialog */}
      <Dialog open={!!editingField} onOpenChange={(open) => !open && handleCancelEdit()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {currentEditItem && (
                <>
                  <currentEditItem.icon className="w-5 h-5 text-primary" />
                  编辑{currentEditItem.label}
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-value">
                {currentEditItem?.label}
                <span className="text-destructive ml-1">*</span>
              </Label>
              {currentEditItem && 'isArray' in currentEditItem && currentEditItem.isArray ? (
                <Textarea
                  id="edit-value"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  placeholder={currentEditItem?.placeholder}
                  rows={5}
                  className="resize-none"
                />
              ) : (
                <Input
                  id="edit-value"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  placeholder={currentEditItem?.placeholder}
                />
              )}
              <p className="text-xs text-muted-foreground">
                {currentEditItem && 'isArray' in currentEditItem && currentEditItem.isArray
                  ? "每行输入一项内容"
                  : "请输入内容"}
              </p>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={handleCancelEdit}>
              <X className="w-4 h-4 mr-2" />
              取消
            </Button>
            <Button onClick={handleSaveEdit} disabled={!editValue.trim()}>
              <Check className="w-4 h-4 mr-2" />
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
