import { motion } from "framer-motion";
import { TrendingUp, MessageSquare, FileText, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface PrdPhaseIndicatorProps {
  currentPhase: 1 | 2 | 3;
  onPhaseClick?: (phase: 1 | 2 | 3) => void;
  phase1Completed?: boolean;
  phase2Completed?: boolean;
}

const phases = [
  { id: 1 as const, label: "市场分析", icon: TrendingUp },
  { id: 2 as const, label: "AI产品经理", icon: MessageSquare },
  { id: 3 as const, label: "产品PRD文档", icon: FileText },
];

export function PrdPhaseIndicator({
  currentPhase,
  onPhaseClick,
  phase1Completed = false,
  phase2Completed = false,
}: PrdPhaseIndicatorProps) {
  const isCompleted = (phase: number) => {
    if (phase === 1) return phase1Completed;
    if (phase === 2) return phase2Completed;
    return false;
  };

  const canNavigate = (phase: number) => {
    if (phase === 1) return true;
    if (phase === 2) return phase1Completed;
    if (phase === 3) return phase2Completed;
    return false;
  };

  return (
    <div className="flex items-center justify-center gap-2 p-4">
      {phases.map((phase, index) => {
        const Icon = phase.icon;
        const completed = isCompleted(phase.id);
        const isCurrent = currentPhase === phase.id;
        const canClick = canNavigate(phase.id) && !isCurrent;

        return (
          <div key={phase.id} className="flex items-center">
            <motion.button
              onClick={() => canClick && onPhaseClick?.(phase.id)}
              disabled={!canClick}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300",
                isCurrent
                  ? "bg-gradient-to-r from-primary to-accent text-primary-foreground"
                  : completed
                  ? "bg-primary/20 text-primary cursor-pointer hover:bg-primary/30"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              )}
              whileHover={canClick ? { scale: 1.02 } : {}}
              whileTap={canClick ? { scale: 0.98 } : {}}
            >
              {completed && !isCurrent ? (
                <Check className="w-4 h-4" />
              ) : (
                <Icon className="w-4 h-4" />
              )}
              <span className="text-sm font-medium">{phase.label}</span>
            </motion.button>

            {index < phases.length - 1 && (
              <div className="mx-3 flex items-center">
                <motion.div
                  className={cn(
                    "h-0.5 w-8 rounded-full",
                    isCompleted(phase.id) ? "bg-primary" : "bg-border"
                  )}
                  initial={false}
                  animate={{
                    backgroundColor: isCompleted(phase.id)
                      ? "hsl(var(--primary))"
                      : "hsl(var(--border))",
                  }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
