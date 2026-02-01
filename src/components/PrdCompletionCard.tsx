import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Check, Sparkles, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface PrdCompletionCardProps {
  onViewPrd: () => void;
  onContinueChat: () => void;
  autoNavigateDelay?: number;
}

export function PrdCompletionCard({
  onViewPrd,
  onContinueChat,
  autoNavigateDelay = 5,
}: PrdCompletionCardProps) {
  const [countdown, setCountdown] = useState(autoNavigateDelay);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused || countdown <= 0) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          onViewPrd();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isPaused, countdown, onViewPrd]);

  const handleContinueChat = () => {
    setIsPaused(true);
    onContinueChat();
  };

  const progress = ((autoNavigateDelay - countdown) / autoNavigateDelay) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
    >
      <Card className="max-w-md w-full p-6 bg-card border-primary/20 shadow-2xl">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
          className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center"
        >
          <Check className="w-8 h-8 text-primary" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center space-y-3"
        >
          <h2 className="text-xl font-bold text-foreground">
            🎉 PRD 文档已生成完成！
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            我们已基于您的选择和竞品分析生成了完整的产品需求文档。
            您可以在审核页面查看详情并进行修改。
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-6 space-y-4"
        >
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1 gap-2"
              onClick={handleContinueChat}
            >
              <MessageSquare className="w-4 h-4" />
              继续对话
            </Button>
            <Button
              className="flex-1 gap-2 bg-gradient-primary glow-primary"
              onClick={onViewPrd}
            >
              <Sparkles className="w-4 h-4" />
              查看 PRD 文档
            </Button>
          </div>

          {!isPaused && countdown > 0 && (
            <div className="space-y-2">
              <Progress value={progress} className="h-1" />
              <p className="text-xs text-center text-muted-foreground">
                {countdown} 秒后自动进入审核页面...
              </p>
            </div>
          )}
        </motion.div>
      </Card>
    </motion.div>
  );
}
