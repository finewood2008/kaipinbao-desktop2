import { motion } from "framer-motion";
import { Check, MessageSquare, Palette, Rocket } from "lucide-react";
import { cn } from "@/lib/utils";

interface StageIndicatorProps {
  currentStage: number;
  className?: string;
  onStageClick?: (stageId: number) => void;
}

const stages = [
  { id: 1, name: "产品定义", icon: MessageSquare, description: "ID探索与产品定义" },
  { id: 2, name: "产品设计", icon: Palette, description: "AI图像生成与迭代" },
  { id: 3, name: "落地页", icon: Rocket, description: "营销页面与发布" },
];

export function StageIndicator({ currentStage, className, onStageClick }: StageIndicatorProps) {
  const handleStageClick = (stageId: number) => {
    // Only allow clicking on completed stages or current stage
    if (stageId <= currentStage && onStageClick) {
      onStageClick(stageId);
    }
  };

  return (
    <div className={cn("flex items-center justify-between", className)}>
      {stages.map((stage, index) => {
        const isCompleted = currentStage > stage.id;
        const isCurrent = currentStage === stage.id;
        const isClickable = stage.id <= currentStage;
        const Icon = stage.icon;

        return (
          <div key={stage.id} className="flex items-center flex-1">
            {/* Stage circle */}
            <div 
              className={cn(
                "flex flex-col items-center",
                isClickable && "cursor-pointer group"
              )}
              onClick={() => handleStageClick(stage.id)}
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: index * 0.1 }}
                whileHover={isClickable ? { scale: 1.1 } : undefined}
                whileTap={isClickable ? { scale: 0.95 } : undefined}
                className={cn(
                  "relative flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300",
                  isCompleted && "bg-stage-3 border-stage-3",
                  isCurrent && "border-primary bg-primary/20 glow-primary",
                  !isCompleted && !isCurrent && "border-muted bg-muted/20",
                  isClickable && "hover:border-primary/80"
                )}
              >
                {isCompleted ? (
                  <Check className="w-5 h-5 text-primary-foreground" />
                ) : (
                  <Icon
                    className={cn(
                      "w-5 h-5",
                      isCurrent ? "text-primary" : "text-muted-foreground"
                    )}
                  />
                )}
                {isCurrent && (
                  <motion.div
                    className="absolute inset-0 rounded-full border-2 border-primary"
                    animate={{ scale: [1, 1.2, 1], opacity: [1, 0, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                )}
              </motion.div>
              <div className="mt-2 text-center">
                <p
                  className={cn(
                    "text-sm font-medium transition-colors",
                    isCurrent ? "text-primary" : isCompleted ? "text-foreground" : "text-muted-foreground",
                    isClickable && "group-hover:text-primary"
                  )}
                >
                  {stage.name}
                </p>
                <p className="text-xs text-muted-foreground hidden md:block">
                  {stage.description}
                </p>
              </div>
            </div>

            {/* Connector line */}
            {index < stages.length - 1 && (
              <div className="flex-1 h-0.5 mx-4 bg-muted relative overflow-hidden">
                <motion.div
                  className="absolute inset-y-0 left-0 bg-gradient-primary"
                  initial={{ width: "0%" }}
                  animate={{ width: isCompleted ? "100%" : isCurrent ? "50%" : "0%" }}
                  transition={{ duration: 0.5, delay: index * 0.2 }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
