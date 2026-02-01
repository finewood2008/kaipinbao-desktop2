import { motion } from "framer-motion";
import { ThumbsUp, ThumbsDown, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ReviewAnalysis {
  summary: {
    totalReviews: number;
    positivePercent: number;
    negativePercent: number;
  };
  positivePoints: Array<{ point: string; frequency: number }>;
  negativePoints: Array<{ point: string; frequency: number }>;
  actionableInsights: string[];
}

interface ReviewAnalysisSummaryProps {
  analysis: ReviewAnalysis;
  className?: string;
}

export function ReviewAnalysisSummary({ analysis, className }: ReviewAnalysisSummaryProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "bg-card/30 border border-border/50 rounded-lg p-4 space-y-4",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-foreground">📊 评论分析摘要</h4>
        <span className="text-xs text-muted-foreground">
          共 {analysis.summary.totalReviews} 条评论
        </span>
      </div>

      {/* Sentiment bar */}
      <div className="space-y-1.5">
        <div className="flex h-2 rounded-full overflow-hidden bg-muted/30">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${analysis.summary.positivePercent}%` }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-green-500/80"
          />
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${analysis.summary.negativePercent}%` }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-red-500/80"
          />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <ThumbsUp className="w-3 h-3 text-green-500" />
            好评 {analysis.summary.positivePercent}%
          </span>
          <span className="flex items-center gap-1">
            <ThumbsDown className="w-3 h-3 text-red-500" />
            差评 {analysis.summary.negativePercent}%
          </span>
        </div>
      </div>

      {/* Points grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Positive points */}
        <div className="space-y-2">
          <h5 className="text-xs font-medium text-green-400 flex items-center gap-1">
            <ThumbsUp className="w-3 h-3" />
            好评要点
          </h5>
          <ul className="space-y-1">
            {analysis.positivePoints.slice(0, 5).map((item, index) => (
              <motion.li
                key={item.point}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index }}
                className="flex items-center justify-between text-xs"
              >
                <span className="text-muted-foreground">• {item.point}</span>
                <span className="text-green-500/70">{item.frequency}</span>
              </motion.li>
            ))}
          </ul>
        </div>

        {/* Negative points */}
        <div className="space-y-2">
          <h5 className="text-xs font-medium text-red-400 flex items-center gap-1">
            <ThumbsDown className="w-3 h-3" />
            差评要点
          </h5>
          <ul className="space-y-1">
            {analysis.negativePoints.slice(0, 5).map((item, index) => (
              <motion.li
                key={item.point}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index }}
                className="flex items-center justify-between text-xs"
              >
                <span className="text-muted-foreground">• {item.point}</span>
                <span className="text-red-500/70">{item.frequency}</span>
              </motion.li>
            ))}
          </ul>
        </div>
      </div>

      {/* Actionable insights */}
      {analysis.actionableInsights.length > 0 && (
        <div className="pt-3 border-t border-border/30 space-y-2">
          <h5 className="text-xs font-medium text-primary flex items-center gap-1">
            <Lightbulb className="w-3 h-3" />
            产品建议
          </h5>
          <ul className="space-y-1">
            {analysis.actionableInsights.map((insight, index) => (
              <motion.li
                key={index}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 + 0.1 * index }}
                className="text-xs text-muted-foreground pl-3 border-l-2 border-primary/30"
              >
                {insight}
              </motion.li>
            ))}
          </ul>
        </div>
      )}
    </motion.div>
  );
}
