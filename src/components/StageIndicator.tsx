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
                whileHover={isClickable ? { scale: 1.15, y: -2 } : undefined}
                whileTap={isClickable ? { scale: 0.95 } : undefined}
                className={cn(
                  "relative flex items-center justify-center w-14 h-14 rounded-2xl border-2 transition-all duration-300",
                  isCompleted && "bg-gradient-to-br from-primary to-accent border-primary/50 shadow-lg shadow-primary/25",
                  isCurrent && "border-primary bg-primary/20 shadow-lg shadow-primary/30",
                  !isCompleted && !isCurrent && "border-muted-foreground/30 bg-muted/30",
                  isClickable && !isCurrent && "hover:border-primary/60 hover:bg-primary/10 hover:shadow-md hover:shadow-primary/20"
                )}
              >
                {isCompleted ? (
                  <Check className="w-6 h-6 text-primary-foreground" />
                ) : (
                  <Icon
                    className={cn(
                      "w-6 h-6 transition-colors duration-300",
                      isCurrent ? "text-primary" : "text-muted-foreground",
                      isClickable && "group-hover:text-primary"
                    )}
                  />
                )}
                {isCurrent && (
                  <>
                    <motion.div
                      className="absolute inset-0 rounded-2xl border-2 border-primary"
                      animate={{ scale: [1, 1.15, 1], opacity: [0.8, 0, 0.8] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    />
                    <motion.div
                      className="absolute inset-0 rounded-2xl bg-primary/20"
                      animate={{ opacity: [0.3, 0.6, 0.3] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                    />
                  </>
                )}
              </motion.div>
              <div className="mt-3 text-center">
                <motion.p
                  className={cn(
                    "text-sm font-semibold transition-all duration-300",
                    isCurrent ? "text-primary scale-105" : isCompleted ? "text-foreground" : "text-muted-foreground",
                    isClickable && "group-hover:text-primary group-hover:scale-105"
                  )}
                >
                  {stage.name}
                </motion.p>
                <p className={cn(
                  "text-xs mt-0.5 hidden md:block transition-colors duration-300",
                  isCurrent ? "text-primary/70" : "text-muted-foreground",
                  isClickable && "group-hover:text-primary/70"
                )}>
                  {stage.description}
                </p>
              </div>
            </div>

            {/* Connector line */}
            {index < stages.length - 1 && (
              <div className="flex-1 h-1 mx-6 bg-muted/50 rounded-full relative overflow-hidden">
                <motion.div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-accent rounded-full"
                  initial={{ width: "0%" }}
                  animate={{ width: isCompleted ? "100%" : isCurrent ? "50%" : "0%" }}
                  transition={{ duration: 0.6, delay: index * 0.2, ease: "easeOut" }}
                />
                {isCurrent && (
                  <motion.div
                    className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-primary/50 to-transparent rounded-full"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
