import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, Loader2, ArrowRight, SkipForward, Sparkles, Target, Users, DollarSign, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface MarketAnalysisPhaseProps {
  projectId: string;
  onComplete: () => void;
  onSkip: () => void;
}

interface InitialMarketAnalysis {
  marketSize: string;
  targetUserProfile: string;
  competitionLandscape: string;
  pricingStrategy: string;
  differentiationOpportunities: string[];
  generatedAt: string;
}

export function MarketAnalysisPhase({ projectId, onComplete, onSkip }: MarketAnalysisPhaseProps) {
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<InitialMarketAnalysis | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    loadProjectData();
  }, [projectId]);

  const loadProjectData = async () => {
    const { data } = await supabase
      .from("projects")
      .select("name, description, prd_data")
      .eq("id", projectId)
      .single();

    if (data) {
      setProjectName(data.name);
      setProjectDescription(data.description || "");
      
      // Check for existing analysis
      const prdData = data.prd_data as Record<string, unknown> | null;
      if (prdData?.initialMarketAnalysis) {
        setAnalysis(prdData.initialMarketAnalysis as InitialMarketAnalysis);
      }
    }
  };

  const handleStartAnalysis = async () => {
    setIsAnalyzing(true);
    setProgress(10);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 85) {
            clearInterval(progressInterval);
            return 85;
          }
          return prev + Math.random() * 15;
        });
      }, 500);

      const { data, error } = await supabase.functions.invoke("initial-market-analysis", {
        body: { projectId },
      });

      clearInterval(progressInterval);

      if (error) throw error;

      if (data.success && data.analysis) {
        setProgress(100);
        setAnalysis(data.analysis);
        toast.success("市场分析完成");
      } else {
        throw new Error(data.error || "Analysis failed");
      }
    } catch (error) {
      console.error("Market analysis failed:", error);
      toast.error("市场分析失败，请重试");
    } finally {
      setIsAnalyzing(false);
      setTimeout(() => setProgress(0), 500);
    }
  };

  const handleComplete = () => {
    onComplete();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto space-y-6 p-6"
    >
      {/* Header */}
      <div className="text-center space-y-2">
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          className="w-16 h-16 mx-auto bg-primary/20 rounded-full flex items-center justify-center"
        >
          <TrendingUp className="w-8 h-8 text-primary" />
        </motion.div>
        <h2 className="text-xl font-semibold text-foreground">市场分析</h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          AI 市场专家将基于您的产品描述，分析市场格局、目标用户和差异化机会
        </p>
      </div>

      {/* Project Info Card */}
      <Card className="bg-muted/30 border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">项目信息</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <span className="text-sm text-muted-foreground">项目名称：</span>
            <span className="text-sm font-medium ml-2">{projectName}</span>
          </div>
          {projectDescription && (
            <div>
              <span className="text-sm text-muted-foreground">项目描述：</span>
              <p className="text-sm mt-1 text-foreground/80">{projectDescription}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Progress indicator */}
      <AnimatePresence>
        {isAnalyzing && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-muted/30 rounded-lg p-4 border border-border/50"
          >
            <div className="flex items-center gap-3 mb-3">
              <Sparkles className="w-4 h-4 animate-pulse text-primary" />
              <span className="text-sm font-medium">AI 市场专家正在分析...</span>
            </div>
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-muted-foreground mt-2">
              正在分析市场规模、目标用户画像、竞争格局和定价策略
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Start Analysis Button */}
      {!analysis && !isAnalyzing && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-center"
        >
          <Button
            onClick={handleStartAnalysis}
            className="bg-primary hover:bg-primary/90"
            size="lg"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            开始 AI 市场分析
          </Button>
        </motion.div>
      )}

      {/* Analysis Results */}
      <AnimatePresence>
        {analysis && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Market Size */}
            <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                    <Target className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm mb-1">市场规模评估</h4>
                    <p className="text-sm text-muted-foreground">{analysis.marketSize}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Target User */}
            <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                    <Users className="w-5 h-5 text-purple-500" />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm mb-1">目标用户画像</h4>
                    <p className="text-sm text-muted-foreground">{analysis.targetUserProfile}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Competition */}
            <Card className="bg-gradient-to-br from-orange-500/10 to-amber-500/10 border-orange-500/20">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-5 h-5 text-orange-500" />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm mb-1">竞争格局预判</h4>
                    <p className="text-sm text-muted-foreground">{analysis.competitionLandscape}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pricing */}
            <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center flex-shrink-0">
                    <DollarSign className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm mb-1">定价策略建议</h4>
                    <p className="text-sm text-muted-foreground">{analysis.pricingStrategy}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Differentiation */}
            {analysis.differentiationOpportunities && analysis.differentiationOpportunities.length > 0 && (
              <Card className="bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <Lightbulb className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm mb-2">差异化机会</h4>
                      <ul className="space-y-1">
                        {analysis.differentiationOpportunities.map((opp, i) => (
                          <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="text-primary">•</span>
                            {opp}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Actions */}
      <div className="flex justify-between pt-4 border-t border-border/30">
        <Button variant="ghost" onClick={onSkip} className="text-muted-foreground">
          <SkipForward className="w-4 h-4 mr-1" />
          跳过此步骤
        </Button>
        <Button
          onClick={handleComplete}
          disabled={isAnalyzing}
          className="bg-primary hover:bg-primary/90"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              分析中...
            </>
          ) : (
            <>
              进入竞品分析
              <ArrowRight className="w-4 h-4 ml-1" />
            </>
          )}
        </Button>
      </div>
    </motion.div>
  );
}
