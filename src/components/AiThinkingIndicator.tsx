import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Sparkles, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface AiThinkingIndicatorProps {
  className?: string;
}

const STEPS = [
  { label: "分析数据", icon: "📊", duration: 5000 },
  { label: "整合洞察", icon: "🔍", duration: 5000 },
  { label: "生成提案", icon: "✨", duration: 5000 },
];

export function AiThinkingIndicator({ className }: AiThinkingIndicatorProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [stepProgress, setStepProgress] = useState(0);
  const [overallProgress, setOverallProgress] = useState(0);

  useEffect(() => {
    // Step progression timer
    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < STEPS.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 5000);

    // Progress animation
    const progressInterval = setInterval(() => {
      setOverallProgress((prev) => {
        if (prev < 95) {
          // Slow down as we approach 95%
          const increment = prev < 60 ? 2 : prev < 80 ? 1 : 0.3;
          return Math.min(95, prev + increment);
        }
        return prev;
      });

      setStepProgress((prev) => {
        if (prev >= 100) return 0;
        return prev + 4;
      });
    }, 200);

    return () => {
      clearInterval(stepInterval);
      clearInterval(progressInterval);
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.98 }}
      className={cn(
        "flex flex-col gap-4 p-6 rounded-2xl",
        "bg-gradient-to-br from-card via-secondary/50 to-card",
        "border border-primary/30 shadow-xl",
        className
      )}
    >
      {/* Header with pulsing icon */}
      <div className="flex items-center gap-4">
        <motion.div
          className="relative w-14 h-14 rounded-xl bg-gradient-to-br from-primary via-accent to-primary flex items-center justify-center shadow-lg"
          animate={{
            scale: [1, 1.05, 1],
          }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        >
          {/* Outer glow ring */}
          <motion.div
            className="absolute inset-0 rounded-xl bg-primary/30"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.5, 0, 0.5],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <Sparkles className="w-7 h-7 text-primary-foreground relative z-10" />
        </motion.div>

        <div className="flex-1">
          <p className="text-lg font-bold text-foreground flex items-center gap-2">
            AI 产品经理正在思考
            <motion.span
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.2, repeat: Infinity }}
            >
              ...
            </motion.span>
          </p>
          <p className="text-sm text-muted-foreground mt-0.5">
            结合竞品数据生成专业建议
          </p>
        </div>
      </div>

      {/* Main Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-muted-foreground mb-1">
          <span>处理进度</span>
          <motion.span
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            预计 10-15 秒
          </motion.span>
        </div>
        <div className="relative h-3 bg-muted/40 rounded-full overflow-hidden border border-border/50">
          {/* Background glow */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-primary/20 via-accent/30 to-primary/20"
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          {/* Progress fill */}
          <motion.div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary via-accent to-primary rounded-full"
            style={{ width: `${overallProgress}%` }}
            transition={{ duration: 0.2 }}
          />
          {/* Shimmer sweep */}
          <motion.div
            className="absolute inset-y-0 w-20 bg-gradient-to-r from-transparent via-white/50 to-transparent"
            animate={{ x: ["-80px", "400px"] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          />
        </div>
      </div>

      {/* Step-by-Step Indicators */}
      <div className="grid grid-cols-3 gap-3 mt-2">
        {STEPS.map((step, index) => {
          const isActive = index === currentStep;
          const isCompleted = index < currentStep;

          return (
            <motion.div
              key={step.label}
              className={cn(
                "flex flex-col items-center gap-2 p-3 rounded-xl backdrop-blur-sm transition-all duration-300",
                isActive
                  ? "bg-primary/15 border-2 border-primary/50"
                  : isCompleted
                  ? "bg-primary/10 border border-primary/30"
                  : "bg-background/70 border border-border/60"
              )}
              animate={
                isActive
                  ? {
                      scale: [1, 1.02, 1],
                    }
                  : {}
              }
              transition={{ duration: 1, repeat: Infinity }}
            >
              {/* Step Icon */}
              <div className="relative">
                <motion.span
                  className="text-2xl"
                  animate={
                    isActive
                      ? {
                          scale: [1, 1.2, 1],
                          rotate: [0, 5, -5, 0],
                        }
                      : {}
                  }
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                  }}
                >
                  {isCompleted ? (
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                      <Check className="w-4 h-4 text-primary-foreground" />
                    </div>
                  ) : (
                    step.icon
                  )}
                </motion.span>
                {isActive && (
                  <motion.div
                    className="absolute -inset-1 rounded-full border border-primary/50"
                    animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                )}
              </div>

              {/* Step Label */}
              <span
                className={cn(
                  "text-xs font-semibold",
                  isActive
                    ? "text-primary"
                    : isCompleted
                    ? "text-foreground"
                    : "text-foreground/60"
                )}
              >
                {step.label}
              </span>

              {/* Mini progress bar per step */}
              <div className="w-full h-1.5 bg-muted/50 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
                  initial={{ width: "0%" }}
                  animate={{
                    width: isCompleted
                      ? "100%"
                      : isActive
                      ? `${stepProgress}%`
                      : "0%",
                  }}
                  transition={{ duration: 0.2 }}
                />
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
