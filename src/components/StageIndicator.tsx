import { useState } from "react";
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
  const [hoveredStage, setHoveredStage] = useState<number | null>(null);

  const handleStageClick = (stageId: number) => {
    if (stageId <= currentStage && onStageClick) {
      onStageClick(stageId);
    }
  };

  return (
    <div className={cn("flex items-center justify-between py-2", className)}>
      {stages.map((stage, index) => {
        const isCompleted = currentStage > stage.id;
        const isCurrent = currentStage === stage.id;
        const isClickable = stage.id <= currentStage;
        const isHovered = hoveredStage === stage.id;
        const Icon = stage.icon;

        return (
          <div key={stage.id} className="flex items-center flex-1">
            {/* Stage circle */}
            <div 
              className={cn(
                "flex flex-col items-center relative",
                isClickable && "cursor-pointer"
              )}
              onClick={() => handleStageClick(stage.id)}
              onMouseEnter={() => isClickable && setHoveredStage(stage.id)}
              onMouseLeave={() => setHoveredStage(null)}
            >
              {/* Hover glow effect */}
              {isClickable && (
                <motion.div
                  className="absolute -inset-3 rounded-3xl bg-primary/10 blur-xl"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ 
                    opacity: isHovered ? 0.8 : 0, 
                    scale: isHovered ? 1.2 : 0.8 
                  }}
                  transition={{ duration: 0.3 }}
                />
              )}

              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ 
                  scale: isHovered ? 1.12 : 1, 
                  opacity: 1,
                  y: isHovered ? -4 : 0 
                }}
                transition={{ 
                  delay: index * 0.1,
                  type: "spring",
                  stiffness: 400,
                  damping: 25
                }}
                whileTap={isClickable ? { scale: 0.92 } : undefined}
                className={cn(
                  "relative flex items-center justify-center w-16 h-16 rounded-2xl border-2 transition-all duration-300 z-10",
                  // Completed state
                  isCompleted && "bg-gradient-to-br from-primary via-primary to-accent border-transparent shadow-xl shadow-primary/30",
                  // Current state
                  isCurrent && !isHovered && "border-primary bg-primary/15 shadow-lg shadow-primary/25",
                  isCurrent && isHovered && "border-primary bg-primary/25 shadow-xl shadow-primary/40",
                  // Inactive state
                  !isCompleted && !isCurrent && "border-muted-foreground/20 bg-muted/20",
                  // Hover states for clickable
                  isClickable && isHovered && !isCurrent && !isCompleted && "border-primary/70 bg-primary/15 shadow-lg shadow-primary/25",
                  isCompleted && isHovered && "shadow-2xl shadow-primary/50"
                )}
              >
                {/* Icon */}
                {isCompleted ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500 }}
                  >
                    <Check className="w-7 h-7 text-primary-foreground" strokeWidth={2.5} />
                  </motion.div>
                ) : (
                  <Icon
                    className={cn(
                      "w-7 h-7 transition-all duration-300",
                      isCurrent ? "text-primary" : "text-muted-foreground",
                      isClickable && isHovered && "text-primary scale-110"
                    )}
                  />
                )}

                {/* Current stage animations */}
                {isCurrent && (
                  <>
                    {/* Outer pulse ring */}
                    <motion.div
                      className="absolute inset-0 rounded-2xl border-2 border-primary"
                      animate={{ 
                        scale: [1, 1.25, 1], 
                        opacity: [0.6, 0, 0.6] 
                      }}
                      transition={{ 
                        duration: 2.5, 
                        repeat: Infinity, 
                        ease: "easeInOut" 
                      }}
                    />
                    {/* Inner glow */}
                    <motion.div
                      className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/30 to-accent/20"
                      animate={{ opacity: [0.4, 0.7, 0.4] }}
                      transition={{ 
                        duration: 2, 
                        repeat: Infinity, 
                        ease: "easeInOut" 
                      }}
                    />
                  </>
                )}

                {/* Hover shine effect */}
                {isClickable && isHovered && (
                  <motion.div
                    className="absolute inset-0 rounded-2xl overflow-hidden"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12"
                      initial={{ x: "-100%" }}
                      animate={{ x: "200%" }}
                      transition={{ 
                        duration: 0.6, 
                        ease: "easeOut" 
                      }}
                    />
                  </motion.div>
                )}
              </motion.div>

              {/* Label */}
              <motion.div 
                className="mt-3 text-center"
                animate={{ 
                  y: isHovered ? -2 : 0,
                  scale: isHovered ? 1.05 : 1
                }}
                transition={{ duration: 0.2 }}
              >
                <p
                  className={cn(
                    "text-sm font-semibold transition-all duration-300",
                    isCurrent && "text-primary",
                    isCompleted && "text-foreground",
                    !isCompleted && !isCurrent && "text-muted-foreground",
                    isClickable && isHovered && "text-primary"
                  )}
                >
                  {stage.name}
                </p>
                <p className={cn(
                  "text-xs mt-1 hidden md:block transition-all duration-300",
                  isCurrent ? "text-primary/70" : "text-muted-foreground/70",
                  isClickable && isHovered && "text-primary/80"
                )}>
                  {stage.description}
                </p>
              </motion.div>
            </div>

            {/* Connector line */}
            {index < stages.length - 1 && (
              <div className="flex-1 h-1.5 mx-8 bg-muted/40 rounded-full relative overflow-hidden">
                {/* Progress fill */}
                <motion.div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary via-primary to-accent rounded-full"
                  initial={{ width: "0%" }}
                  animate={{ width: isCompleted ? "100%" : isCurrent ? "50%" : "0%" }}
                  transition={{ duration: 0.8, delay: index * 0.2, ease: "easeOut" }}
                />
                
                {/* Animated shimmer for current */}
                {isCurrent && (
                  <motion.div
                    className="absolute inset-y-0 w-full"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <motion.div
                      className="absolute inset-y-0 w-8 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                      animate={{ x: ["-100%", "200%"] }}
                      transition={{ 
                        duration: 2, 
                        repeat: Infinity, 
                        ease: "linear",
                        repeatDelay: 1
                      }}
                    />
                  </motion.div>
                )}
                
                {/* Pulse effect for current stage */}
                {isCurrent && (
                  <motion.div
                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-primary"
                    animate={{ 
                      scale: [1, 1.5, 1],
                      opacity: [0.8, 0.4, 0.8]
                    }}
                    transition={{ 
                      duration: 1.5, 
                      repeat: Infinity 
                    }}
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
