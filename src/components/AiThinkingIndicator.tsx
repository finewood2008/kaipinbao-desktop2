import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Check, Brain, Zap, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";

interface AiThinkingIndicatorProps {
  className?: string;
}

const STEPS = [
  { label: "分析数据", icon: "📊", thinkingIcon: Brain, duration: 5000 },
  { label: "整合洞察", icon: "🔍", thinkingIcon: Zap, duration: 5000 },
  { label: "生成提案", icon: "✨", thinkingIcon: Lightbulb, duration: 5000 },
];

const THINKING_PHRASES = [
  "正在分析竞品数据...",
  "识别市场机会...",
  "提炼用户需求...",
  "构建产品策略...",
  "生成专业建议...",
];

// Floating particle component
function FloatingParticle({ delay, duration, size }: { delay: number; duration: number; size: number }) {
  const randomX = useMemo(() => Math.random() * 100, []);
  const randomY = useMemo(() => Math.random() * 100, []);
  
  return (
    <motion.div
      className="absolute rounded-full bg-gradient-to-r from-primary/60 to-accent/60"
      style={{
        width: size,
        height: size,
        left: `${randomX}%`,
        top: `${randomY}%`,
      }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{
        opacity: [0, 0.8, 0.4, 0.8, 0],
        scale: [0, 1, 1.2, 0.8, 0],
        x: [0, 20, -10, 15, 0],
        y: [0, -30, -20, -40, -60],
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  );
}

// Orbiting dot component
function OrbitingDot({ index, total }: { index: number; total: number }) {
  const angle = (index / total) * 360;
  
  return (
    <motion.div
      className="absolute w-2 h-2 rounded-full bg-primary shadow-lg shadow-primary/50"
      style={{
        left: "50%",
        top: "50%",
      }}
      animate={{
        x: [
          Math.cos((angle * Math.PI) / 180) * 24,
          Math.cos(((angle + 360) * Math.PI) / 180) * 24,
        ],
        y: [
          Math.sin((angle * Math.PI) / 180) * 24,
          Math.sin(((angle + 360) * Math.PI) / 180) * 24,
        ],
        opacity: [0.4, 1, 0.4],
      }}
      transition={{
        duration: 3,
        repeat: Infinity,
        ease: "linear",
        delay: index * 0.2,
      }}
    />
  );
}

// Typing animation component
function TypingText({ phrases }: { phrases: string[] }) {
  const [currentPhrase, setCurrentPhrase] = useState(0);
  const [displayText, setDisplayText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const phrase = phrases[currentPhrase];
    const typingSpeed = isDeleting ? 30 : 60;

    const timer = setTimeout(() => {
      if (!isDeleting) {
        if (displayText.length < phrase.length) {
          setDisplayText(phrase.slice(0, displayText.length + 1));
        } else {
          setTimeout(() => setIsDeleting(true), 1500);
        }
      } else {
        if (displayText.length > 0) {
          setDisplayText(displayText.slice(0, -1));
        } else {
          setIsDeleting(false);
          setCurrentPhrase((prev) => (prev + 1) % phrases.length);
        }
      }
    }, typingSpeed);

    return () => clearTimeout(timer);
  }, [displayText, isDeleting, currentPhrase, phrases]);

  return (
    <span className="inline-flex items-center">
      <span className="text-primary/90">{displayText}</span>
      <motion.span
        className="inline-block w-0.5 h-4 bg-primary ml-0.5"
        animate={{ opacity: [1, 0, 1] }}
        transition={{ duration: 0.8, repeat: Infinity }}
      />
    </span>
  );
}

// Neural network connection lines
function NeuralConnections() {
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20">
      {[...Array(6)].map((_, i) => (
        <motion.line
          key={i}
          x1={`${10 + i * 15}%`}
          y1="20%"
          x2={`${20 + i * 12}%`}
          y2="80%"
          stroke="url(#gradient)"
          strokeWidth="1"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: [0, 0.5, 0] }}
          transition={{
            duration: 2,
            delay: i * 0.3,
            repeat: Infinity,
            repeatDelay: 1,
          }}
        />
      ))}
      <defs>
        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="hsl(var(--primary))" />
          <stop offset="100%" stopColor="hsl(var(--accent))" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function AiThinkingIndicator({ className }: AiThinkingIndicatorProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [stepProgress, setStepProgress] = useState(0);
  const [overallProgress, setOverallProgress] = useState(0);

  useEffect(() => {
    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < STEPS.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 5000);

    const progressInterval = setInterval(() => {
      setOverallProgress((prev) => {
        if (prev < 95) {
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

  // Generate particles
  const particles = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => ({
        id: i,
        delay: i * 0.3,
        duration: 3 + Math.random() * 2,
        size: 3 + Math.random() * 4,
      })),
    []
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.98 }}
      className={cn(
        "relative flex flex-col gap-4 p-6 rounded-2xl overflow-hidden",
        "bg-gradient-to-br from-card via-secondary/50 to-card",
        "border border-primary/30 shadow-xl",
        className
      )}
    >
      {/* Background neural connections */}
      <NeuralConnections />

      {/* Floating particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {particles.map((particle) => (
          <FloatingParticle
            key={particle.id}
            delay={particle.delay}
            duration={particle.duration}
            size={particle.size}
          />
        ))}
      </div>

      {/* Ambient glow effect */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{
          background: [
            "radial-gradient(circle at 20% 50%, hsl(var(--primary) / 0.1) 0%, transparent 50%)",
            "radial-gradient(circle at 80% 50%, hsl(var(--accent) / 0.1) 0%, transparent 50%)",
            "radial-gradient(circle at 50% 20%, hsl(var(--primary) / 0.1) 0%, transparent 50%)",
            "radial-gradient(circle at 20% 50%, hsl(var(--primary) / 0.1) 0%, transparent 50%)",
          ],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
      />

      {/* Header with enhanced pulsing icon */}
      <div className="relative flex items-center gap-4 z-10">
        <motion.div
          className="relative w-16 h-16 rounded-xl bg-gradient-to-br from-primary via-accent to-primary flex items-center justify-center shadow-lg"
          animate={{
            scale: [1, 1.05, 1],
            rotate: [0, 2, -2, 0],
          }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          {/* Multiple glow rings */}
          {[1, 2, 3].map((ring) => (
            <motion.div
              key={ring}
              className="absolute inset-0 rounded-xl border border-primary/30"
              animate={{
                scale: [1, 1.2 + ring * 0.15, 1],
                opacity: [0.6, 0, 0.6],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: ring * 0.3,
              }}
            />
          ))}
          
          {/* Orbiting dots */}
          {[0, 1, 2, 3].map((i) => (
            <OrbitingDot key={i} index={i} total={4} />
          ))}

          <Sparkles className="w-8 h-8 text-primary-foreground relative z-10" />
        </motion.div>

        <div className="flex-1">
          <p className="text-lg font-bold text-foreground flex items-center gap-2">
            <motion.span
              animate={{ opacity: [1, 0.7, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              🤖
            </motion.span>
            AI 产品经理正在思考
          </p>
          <div className="text-sm text-muted-foreground mt-1 h-5 overflow-hidden">
            <TypingText phrases={THINKING_PHRASES} />
          </div>
        </div>
      </div>

      {/* Main Progress Bar with enhanced effects */}
      <div className="relative space-y-2 z-10">
        <div className="flex justify-between text-xs text-muted-foreground mb-1">
          <span className="flex items-center gap-1">
            <motion.span
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              ⚙️
            </motion.span>
            处理进度
          </span>
          <motion.span
            className="flex items-center gap-1"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <span className="text-primary font-medium">{Math.round(overallProgress)}%</span>
            <span className="text-muted-foreground">· 预计 10-15 秒</span>
          </motion.span>
        </div>
        <div className="relative h-4 bg-muted/40 rounded-full overflow-hidden border border-border/50">
          {/* Animated background stripes */}
          <motion.div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `repeating-linear-gradient(
                45deg,
                transparent,
                transparent 10px,
                hsl(var(--primary) / 0.3) 10px,
                hsl(var(--primary) / 0.3) 20px
              )`,
              backgroundSize: "200% 100%",
            }}
            animate={{ backgroundPosition: ["0% 0%", "100% 0%"] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          />

          {/* Progress fill with gradient */}
          <motion.div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary via-accent to-primary rounded-full"
            style={{ width: `${overallProgress}%` }}
            transition={{ duration: 0.2 }}
          />

          {/* Glowing edge */}
          <motion.div
            className="absolute top-0 bottom-0 w-8 bg-gradient-to-r from-transparent via-white/60 to-transparent"
            style={{ left: `calc(${overallProgress}% - 16px)` }}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 0.5, repeat: Infinity }}
          />

          {/* Multiple shimmer sweeps */}
          {[0, 1].map((i) => (
            <motion.div
              key={i}
              className="absolute inset-y-0 w-20 bg-gradient-to-r from-transparent via-white/40 to-transparent"
              animate={{ x: ["-80px", "400px"] }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "linear",
                delay: i * 0.75,
              }}
            />
          ))}
        </div>
      </div>

      {/* Step-by-Step Indicators with enhanced animations */}
      <div className="relative grid grid-cols-3 gap-3 mt-2 z-10">
        {STEPS.map((step, index) => {
          const isActive = index === currentStep;
          const isCompleted = index < currentStep;
          const StepIcon = step.thinkingIcon;

          return (
            <motion.div
              key={step.label}
              className={cn(
                "relative flex flex-col items-center gap-2 p-3 rounded-xl backdrop-blur-sm transition-all duration-300",
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
                      boxShadow: [
                        "0 0 0 0 hsl(var(--primary) / 0)",
                        "0 0 20px 4px hsl(var(--primary) / 0.2)",
                        "0 0 0 0 hsl(var(--primary) / 0)",
                      ],
                    }
                  : {}
              }
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              {/* Connecting line animation */}
              {index < STEPS.length - 1 && (
                <motion.div
                  className="absolute top-1/2 -right-1.5 w-3 h-0.5 bg-gradient-to-r from-primary/50 to-transparent"
                  animate={
                    isCompleted
                      ? { opacity: [0.3, 0.8, 0.3] }
                      : { opacity: 0.2 }
                  }
                  transition={{ duration: 1, repeat: Infinity }}
                />
              )}

              {/* Step Icon with animations */}
              <div className="relative">
                <AnimatePresence mode="wait">
                  {isCompleted ? (
                    <motion.div
                      key="completed"
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      exit={{ scale: 0 }}
                      className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/30"
                    >
                      <Check className="w-5 h-5 text-primary-foreground" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="pending"
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center",
                        isActive ? "bg-primary/20" : "bg-muted/30"
                      )}
                      animate={
                        isActive
                          ? {
                              scale: [1, 1.1, 1],
                              rotate: [0, 5, -5, 0],
                            }
                          : {}
                      }
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <StepIcon
                        className={cn(
                          "w-5 h-5",
                          isActive ? "text-primary" : "text-muted-foreground"
                        )}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Pulse ring for active step */}
                {isActive && (
                  <>
                    <motion.div
                      className="absolute -inset-1 rounded-full border-2 border-primary/50"
                      animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0, 0.5] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                    <motion.div
                      className="absolute -inset-2 rounded-full border border-primary/30"
                      animate={{ scale: [1, 1.6, 1], opacity: [0.3, 0, 0.3] }}
                      transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
                    />
                  </>
                )}
              </div>

              {/* Step Label */}
              <span
                className={cn(
                  "text-xs font-semibold text-center",
                  isActive
                    ? "text-primary"
                    : isCompleted
                    ? "text-foreground"
                    : "text-foreground/60"
                )}
              >
                {step.label}
              </span>

              {/* Enhanced mini progress bar */}
              <div className="w-full h-2 bg-muted/50 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full relative overflow-hidden"
                  style={{
                    background: isCompleted
                      ? "linear-gradient(90deg, hsl(var(--primary)), hsl(var(--accent)))"
                      : isActive
                      ? "linear-gradient(90deg, hsl(var(--primary)), hsl(var(--accent)))"
                      : "transparent",
                  }}
                  initial={{ width: "0%" }}
                  animate={{
                    width: isCompleted
                      ? "100%"
                      : isActive
                      ? `${stepProgress}%`
                      : "0%",
                  }}
                  transition={{ duration: 0.2 }}
                >
                  {/* Shimmer on progress bar */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                    animate={{ x: ["-100%", "100%"] }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                </motion.div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Bottom decorative wave */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-accent to-primary opacity-50"
        animate={{
          backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
        }}
        style={{ backgroundSize: "200% 100%" }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
      />
    </motion.div>
  );
}
