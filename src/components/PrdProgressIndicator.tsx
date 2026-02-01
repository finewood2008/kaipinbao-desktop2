import { motion } from "framer-motion";
import { Check, MapPin, Users, Palette, Zap, ClipboardCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

export interface PrdProgress {
  usageScenario: boolean;
  targetAudience: boolean;
  designStyle: boolean;
  coreFeatures: boolean;
  confirmed: boolean;
}

interface PrdProgressIndicatorProps {
  progress: PrdProgress;
  onItemClick?: (item: keyof PrdProgress) => void;
  className?: string;
}

const progressItems = [
  { key: "usageScenario" as const, label: "使用场景", icon: MapPin },
  { key: "targetAudience" as const, label: "目标用户", icon: Users },
  { key: "designStyle" as const, label: "外观风格", icon: Palette },
  { key: "coreFeatures" as const, label: "核心功能", icon: Zap },
  { key: "confirmed" as const, label: "信息确认", icon: ClipboardCheck },
];

export function PrdProgressIndicator({ progress, onItemClick, className }: PrdProgressIndicatorProps) {
  const completedCount = Object.values(progress).filter(Boolean).length;
  const totalCount = progressItems.length;
  const progressPercent = (completedCount / totalCount) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg p-4",
        className
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
          📋 PRD 信息收集进度
        </h4>
        <span className="text-xs text-muted-foreground">
          {completedCount}/{totalCount}
        </span>
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        {progressItems.map((item, index) => {
          const isCompleted = progress[item.key];
          const Icon = item.icon;

          return (
            <motion.button
              key={item.key}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => onItemClick?.(item.key)}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs transition-all",
                "border",
                isCompleted
                  ? "bg-primary/20 border-primary/50 text-primary"
                  : "bg-muted/30 border-border/50 text-muted-foreground hover:bg-muted/50 hover:border-border"
              )}
            >
              {isCompleted ? (
                <Check className="w-3 h-3" />
              ) : (
                <Icon className="w-3 h-3" />
              )}
              <span>{item.label}</span>
            </motion.button>
          );
        })}
      </div>

      <Progress value={progressPercent} className="h-1.5" />
    </motion.div>
  );
}

// Utility function to calculate progress from chat messages
export function calculatePrdProgress(messages: { role: string; content: string }[]): PrdProgress {
  const allContent = messages.map(m => m.content).join(' ').toLowerCase();
  
  return {
    usageScenario: /室内|户外|家用|办公|车载|便携|露营|旅行|运动|健身/.test(allContent),
    targetAudience: /用户|客户|人群|年轻|白领|家庭|学生|商务|女性|男性|老人|儿童/.test(allContent),
    designStyle: /材质|颜色|风格|外观|金属|塑料|圆润|硬朗|简约|现代|复古|科技感/.test(allContent),
    coreFeatures: /功能|特性|特点|优势|卖点|支持|具备|包含/.test(allContent),
    confirmed: /确认|总结|汇总|以上信息|需求文档|prd|stage_complete/i.test(allContent)
  };
}
