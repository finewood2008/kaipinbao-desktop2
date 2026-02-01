import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  ChevronRight, 
  Sparkles, 
  Palette, 
  Rocket,
  Check
} from "lucide-react";
import { cn } from "@/lib/utils";

interface StageTransitionPromptProps {
  isVisible: boolean;
  currentStage: number;
  onConfirm: () => void;
  onDismiss?: () => void;
}

const stageInfo = {
  1: {
    title: "PRD 细化完成！",
    nextStage: "视觉生成",
    description: "AI 已收集足够信息，准备为您生成专业的产品渲染图",
    icon: Palette,
    gradient: "from-stage-1 to-stage-2",
  },
  2: {
    title: "设计方案已确定！",
    nextStage: "营销落地页",
    description: "基于您选择的设计方案，AI 将生成专业的营销落地页",
    icon: Rocket,
    gradient: "from-stage-2 to-stage-3",
  },
  3: {
    title: "项目完成！",
    nextStage: "查看成果",
    description: "恭喜！您的产品研发流程已完成",
    icon: Check,
    gradient: "from-stage-3 to-green-500",
  },
};

export function StageTransitionPrompt({
  isVisible,
  currentStage,
  onConfirm,
  onDismiss,
}: StageTransitionPromptProps) {
  const info = stageInfo[currentStage as keyof typeof stageInfo];
  if (!info) return null;

  const Icon = info.icon;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-background/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
          onClick={onDismiss}
        >
          <motion.div
            initial={{ scale: 0.8, y: 50, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.8, y: 50, opacity: 0 }}
            transition={{ 
              type: "spring", 
              stiffness: 300, 
              damping: 25,
              delay: 0.1 
            }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md"
          >
            <Card className="glass border-primary/30 overflow-hidden">
              {/* Animated gradient border */}
              <div className={cn(
                "absolute inset-0 opacity-30",
                `bg-gradient-to-br ${info.gradient}`
              )} />
              
              <CardContent className="relative p-8 text-center">
                {/* Floating icon */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 400, 
                    damping: 15,
                    delay: 0.3 
                  }}
                  className="relative mb-6"
                >
                  <motion.div
                    animate={{ 
                      y: [0, -10, 0],
                      rotate: [0, 5, -5, 0]
                    }}
                    transition={{ 
                      duration: 3, 
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className={cn(
                      "w-20 h-20 rounded-2xl mx-auto flex items-center justify-center",
                      `bg-gradient-to-br ${info.gradient}`,
                      "shadow-lg"
                    )}
                    style={{
                      boxShadow: "0 0 40px hsl(var(--primary) / 0.4)"
                    }}
                  >
                    <Icon className="w-10 h-10 text-white" />
                  </motion.div>
                  
                  {/* Sparkle effects */}
                  {[...Array(6)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ 
                        opacity: [0, 1, 0],
                        scale: [0.5, 1, 0.5],
                        x: [0, (i % 2 === 0 ? 1 : -1) * (20 + i * 10)],
                        y: [0, -(10 + i * 8)]
                      }}
                      transition={{ 
                        duration: 2,
                        repeat: Infinity,
                        delay: i * 0.3,
                        ease: "easeOut"
                      }}
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                    >
                      <Sparkles className="w-4 h-4 text-accent" />
                    </motion.div>
                  ))}
                </motion.div>

                {/* Title */}
                <motion.h3
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-2xl font-bold mb-2 text-gradient"
                >
                  {info.title}
                </motion.h3>

                {/* Description */}
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="text-muted-foreground mb-6"
                >
                  {info.description}
                </motion.p>

                {/* CTA Button */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <Button
                    onClick={onConfirm}
                    size="lg"
                    className={cn(
                      "w-full relative overflow-hidden group",
                      `bg-gradient-to-r ${info.gradient}`,
                      "hover:opacity-90 transition-opacity"
                    )}
                  >
                    {/* Glow animation */}
                    <motion.div
                      className="absolute inset-0 bg-white/20"
                      animate={{
                        x: ["-100%", "100%"],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "linear"
                      }}
                      style={{
                        background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)",
                      }}
                    />
                    <span className="relative z-10 flex items-center gap-2">
                      进入{info.nextStage}
                      <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </Button>
                </motion.div>

                {/* Stage indicator dots */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  className="flex justify-center gap-2 mt-6"
                >
                  {[1, 2, 3].map((stage) => (
                    <div
                      key={stage}
                      className={cn(
                        "w-2 h-2 rounded-full transition-all",
                        stage <= currentStage
                          ? "bg-primary scale-100"
                          : "bg-muted scale-75"
                      )}
                    />
                  ))}
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
