import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Loader2, Sparkles, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageGenerationProgressProps {
  isGenerating: boolean;
  currentType?: string;
  currentStep?: string;
  totalTypes: number;
  completedCount: number;
  estimatedTimeRemaining?: number;
  className?: string;
}

export function ImageGenerationProgress({
  isGenerating,
  currentType,
  currentStep,
  totalTypes,
  completedCount,
  estimatedTimeRemaining,
  className,
}: ImageGenerationProgressProps) {
  if (!isGenerating) return null;

  const progress = totalTypes > 0 ? (completedCount / totalTypes) * 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={cn("border-primary/30 bg-primary/5", className)}>
        <CardContent className="p-4 space-y-4">
          {/* Overall Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                整体进度
              </span>
              <span className="font-medium">{completedCount} / {totalTypes}</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Current Task Status */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <motion.div
                className="absolute inset-0"
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.2, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <div className="w-8 h-8 rounded-full bg-primary/20" />
              </motion.div>
            </div>
            <div className="flex-1 min-w-0">
              {currentType && (
                <p className="font-medium text-sm truncate">
                  正在生成: {currentType}
                </p>
              )}
              {currentStep && (
                <p className="text-xs text-muted-foreground truncate">
                  {currentStep}
                </p>
              )}
            </div>
          </div>

          {/* Estimated Time */}
          {estimatedTimeRemaining !== undefined && estimatedTimeRemaining > 0 && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="w-3.5 h-3.5" />
              <span>
                预计剩余时间: 约 {estimatedTimeRemaining < 60 
                  ? `${estimatedTimeRemaining} 秒` 
                  : `${Math.ceil(estimatedTimeRemaining / 60)} 分钟`
                }
              </span>
            </div>
          )}

          {/* Progress Steps Indicator */}
          {totalTypes > 1 && (
            <div className="flex gap-1">
              {Array.from({ length: totalTypes }).map((_, index) => (
                <motion.div
                  key={index}
                  className={cn(
                    "h-1 flex-1 rounded-full transition-colors",
                    index < completedCount
                      ? "bg-primary"
                      : index === completedCount
                      ? "bg-primary/50 animate-pulse"
                      : "bg-muted"
                  )}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: index * 0.1 }}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
