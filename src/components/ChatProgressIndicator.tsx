import { motion } from "framer-motion";
import { Check, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProgressStage {
  name: string;
  completed: boolean;
}

interface ChatProgressIndicatorProps {
  stages: ProgressStage[];
  currentStage: number;
  className?: string;
}

export function ChatProgressIndicator({
  stages,
  currentStage,
  className,
}: ChatProgressIndicatorProps) {
  const completedCount = stages.filter((s) => s.completed).length;

  return (
    <div
      className={cn(
        "flex items-center gap-4 px-4 py-2 bg-muted/30 border-b border-border/50",
        className
      )}
    >
      {/* Progress indicator */}
      <div className="flex items-center gap-1">
        <span className="text-xs font-medium text-primary">📍 PRD定义进度</span>
        <span className="text-xs text-muted-foreground ml-1">
          {completedCount}/{stages.length}
        </span>
      </div>

      {/* Progress dots */}
      <div className="flex items-center gap-1">
        {stages.map((stage, index) => (
          <motion.div
            key={stage.name}
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className={cn(
              "w-2 h-2 rounded-full transition-colors",
              stage.completed
                ? "bg-primary"
                : index === currentStage
                  ? "bg-primary/50"
                  : "bg-muted-foreground/30"
            )}
          />
        ))}
      </div>

      {/* Stage labels */}
      <div className="hidden md:flex items-center gap-2 flex-1">
        {stages.map((stage, index) => (
          <div
            key={stage.name}
            className={cn(
              "flex items-center gap-1 text-xs transition-colors",
              stage.completed
                ? "text-primary"
                : index === currentStage
                  ? "text-foreground"
                  : "text-muted-foreground/60"
            )}
          >
            {stage.completed ? (
              <Check className="w-3 h-3" />
            ) : (
              <Circle className="w-3 h-3" />
            )}
            <span>{stage.name}</span>
            {index < stages.length - 1 && (
              <span className="text-muted-foreground/30 mx-1">→</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
