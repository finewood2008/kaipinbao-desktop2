import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, ChevronRight, ArrowLeft, TrendingUp, Search, Sparkles } from "lucide-react";
import { MarketAnalysisPhase } from "@/components/MarketAnalysisPhase";
import { CompetitorResearch } from "@/components/CompetitorResearch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface MarketResearchPhaseProps {
  projectId: string;
  onComplete: () => void;
  isReadOnly?: boolean;
}

interface CompetitorProduct {
  id: string;
  product_title?: string;
  product_images?: string[];
  main_image?: string;
  price?: string;
  rating?: number;
}

const subPhases = [
  { id: 1 as const, label: "市场分析", icon: TrendingUp },
  { id: 2 as const, label: "竞品分析", icon: Search },
];

export function MarketResearchPhase({
  projectId,
  onComplete,
  isReadOnly = false,
}: MarketResearchPhaseProps) {
  const [currentSubPhase, setCurrentSubPhase] = useState<1 | 2>(1);
  const [phase1Completed, setPhase1Completed] = useState(false);
  const [phase2Completed, setPhase2Completed] = useState(false);
  const [showTransition, setShowTransition] = useState(false);
  const [competitorProducts, setCompetitorProducts] = useState<CompetitorProduct[]>([]);

  useEffect(() => {
    loadProjectData();
    loadCompetitorProducts();
  }, [projectId]);

  const loadProjectData = async () => {
    const { data } = await supabase
      .from("projects")
      .select("prd_data, competitor_research_completed")
      .eq("id", projectId)
      .single();

    if (data?.prd_data) {
      const prd = data.prd_data as { initialMarketAnalysis?: unknown };
      if (prd.initialMarketAnalysis) {
        setPhase1Completed(true);
      }
    }
    if (data?.competitor_research_completed) {
      setPhase2Completed(true);
    }
  };

  const loadCompetitorProducts = async () => {
    const { data } = await supabase
      .from("competitor_products")
      .select("*")
      .eq("project_id", projectId)
      .eq("status", "completed");

    if (data) {
      setCompetitorProducts(
        data.map((p) => ({
          id: p.id,
          product_title: p.product_title || undefined,
          product_images: (p.product_images as string[]) || undefined,
          main_image: p.main_image || undefined,
          price: p.price || undefined,
          rating: p.rating ? Number(p.rating) : undefined,
        }))
      );
    }
  };

  const handleMarketAnalysisComplete = () => {
    setPhase1Completed(true);
    setShowTransition(true);
  };

  const handleMarketAnalysisSkip = () => {
    setPhase1Completed(true);
    setCurrentSubPhase(2);
  };

  const handleCompetitorResearchComplete = async (hasResearch: boolean) => {
    await supabase
      .from("projects")
      .update({ competitor_research_completed: true })
      .eq("id", projectId);

    setPhase2Completed(true);
    await loadCompetitorProducts();
    
    // Proceed to next main stage (Product Definition)
    onComplete();
  };

  const handleCompetitorResearchSkip = async () => {
    await supabase
      .from("projects")
      .update({ competitor_research_completed: true })
      .eq("id", projectId);

    setPhase2Completed(true);
    onComplete();
  };

  const handleTransitionConfirm = () => {
    setShowTransition(false);
    setCurrentSubPhase(2);
  };

  const handleSubPhaseClick = (phase: 1 | 2) => {
    if (phase === 1) {
      setCurrentSubPhase(1);
    } else if (phase === 2 && phase1Completed) {
      setCurrentSubPhase(2);
    }
  };

  const isCompleted = (phase: number) => {
    if (phase === 1) return phase1Completed;
    if (phase === 2) return phase2Completed;
    return false;
  };

  const canNavigate = (phase: number) => {
    if (phase === 1) return true;
    if (phase === 2) return phase1Completed;
    return false;
  };

  return (
    <div className="h-full flex flex-col min-h-0 overflow-hidden">
      {/* Read-only Banner */}
      {isReadOnly && (
        <div className="bg-muted/50 border-b border-border px-4 py-2 flex items-center justify-center gap-2">
          <span className="text-sm text-muted-foreground">
            📖 查看模式 - 市场调研阶段已完成
          </span>
        </div>
      )}

      {/* Sub-phase Indicator */}
      <div className="flex items-center justify-center gap-1 p-3 border-b border-border/50">
        {subPhases.map((phase, index) => {
          const Icon = phase.icon;
          const completed = isCompleted(phase.id);
          const isCurrent = currentSubPhase === phase.id;
          const canClick = canNavigate(phase.id) && !isCurrent;

          return (
            <div key={phase.id} className="flex items-center">
              <motion.button
                onClick={() => canClick && handleSubPhaseClick(phase.id)}
                disabled={!canClick}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all duration-300 text-xs",
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
                  <Check className="w-3.5 h-3.5" />
                ) : (
                  <Icon className="w-3.5 h-3.5" />
                )}
                <span className="font-medium">{phase.label}</span>
              </motion.button>

              {index < subPhases.length - 1 && (
                <div className="mx-2 flex items-center">
                  <motion.div
                    className={cn(
                      "h-0.5 w-6 rounded-full",
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

      {/* Transition Animation */}
      <AnimatePresence>
        {showTransition && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/90 backdrop-blur-md z-50 flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="max-w-lg w-full"
            >
              <Card className="glass border-primary/50 overflow-hidden">
                <motion.div
                  className="absolute inset-0 pointer-events-none"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  {[...Array(12)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-2 h-2 rounded-full bg-primary/60"
                      style={{
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                      }}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{
                        scale: [0, 1, 0.5],
                        opacity: [0, 1, 0],
                        y: [0, -30, -50],
                      }}
                      transition={{
                        duration: 1.5,
                        delay: i * 0.05,
                        repeat: Infinity,
                        repeatDelay: 2,
                      }}
                    />
                  ))}
                </motion.div>

                <CardContent className="p-8 text-center relative">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 25, delay: 0.1 }}
                    className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center"
                    style={{ boxShadow: "0 0 30px hsl(var(--primary) / 0.4)" }}
                  >
                    <Sparkles className="w-10 h-10 text-primary-foreground" />
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <h3 className="text-xl font-bold mb-2">🎯 市场分析完成！</h3>
                    <p className="text-muted-foreground mb-6">
                      接下来添加 Amazon 竞品链接，获取真实用户反馈
                    </p>
                  </motion.div>

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setShowTransition(false)}
                      className="flex-1"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      返回修改
                    </Button>
                    <Button
                      onClick={handleTransitionConfirm}
                      className="flex-1 bg-gradient-to-r from-primary to-accent animate-glow-pulse"
                    >
                      进入竞品分析
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Phase Content */}
      <div className="flex-1 min-h-0 overflow-hidden mt-4">
        <AnimatePresence mode="wait">
          {currentSubPhase === 1 && (
            <motion.div
              key="subphase1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="h-full min-h-0"
            >
              <MarketAnalysisPhase
                projectId={projectId}
                onComplete={handleMarketAnalysisComplete}
                onSkip={handleMarketAnalysisSkip}
              />
            </motion.div>
          )}

          {currentSubPhase === 2 && (
            <motion.div
              key="subphase2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="h-full min-h-0"
            >
              <CompetitorResearch
                projectId={projectId}
                onComplete={handleCompetitorResearchComplete}
                onSkip={handleCompetitorResearchSkip}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
