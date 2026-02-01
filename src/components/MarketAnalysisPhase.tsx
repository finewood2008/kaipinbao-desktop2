import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, Loader2, ArrowRight, SkipForward, Sparkles, Target, Users, DollarSign, Lightbulb, BarChart3, PieChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  PieChart as RechartsPieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  ResponsiveContainer,
  Tooltip,
  Legend,
  RadialBarChart,
  RadialBar,
} from "recharts";

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
  // Enhanced data for charts
  marketSizeData?: {
    current: number;
    projected: number;
    growth: number;
    unit: string;
  };
  userSegments?: {
    name: string;
    percentage: number;
  }[];
  pricingDistribution?: {
    range: string;
    count: number;
    color: string;
  }[];
  competitorRatings?: {
    category: string;
    ourScore: number;
    competitorAvg: number;
  }[];
}

const CHART_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "#22c55e",
  "#f59e0b",
  "#8b5cf6",
  "#ec4899",
];

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

  // Generate mock chart data from analysis text (in production, AI should return structured data)
  const getMarketSizeChartData = () => {
    if (analysis?.marketSizeData) {
      return [
        { name: "当前规模", value: analysis.marketSizeData.current, fill: CHART_COLORS[0] },
        { name: "预测增长", value: analysis.marketSizeData.projected - analysis.marketSizeData.current, fill: CHART_COLORS[1] },
      ];
    }
    // Fallback mock data
    return [
      { name: "当前规模", value: 85, fill: CHART_COLORS[0] },
      { name: "预测增长", value: 35, fill: CHART_COLORS[1] },
    ];
  };

  const getUserSegmentData = () => {
    if (analysis?.userSegments) {
      return analysis.userSegments.map((seg, i) => ({
        ...seg,
        fill: CHART_COLORS[i % CHART_COLORS.length],
      }));
    }
    // Fallback mock data based on analysis
    return [
      { name: "商务人士", percentage: 35, fill: CHART_COLORS[0] },
      { name: "年轻白领", percentage: 30, fill: CHART_COLORS[1] },
      { name: "户外运动", percentage: 20, fill: CHART_COLORS[2] },
      { name: "其他", percentage: 15, fill: CHART_COLORS[3] },
    ];
  };

  const getPricingData = () => {
    if (analysis?.pricingDistribution) {
      return analysis.pricingDistribution;
    }
    // Fallback mock data
    return [
      { range: "$0-30", count: 15, color: CHART_COLORS[2] },
      { range: "$30-60", count: 35, color: CHART_COLORS[0] },
      { range: "$60-100", count: 30, color: CHART_COLORS[1] },
      { range: "$100+", count: 20, color: CHART_COLORS[4] },
    ];
  };

  const getCompetitorData = () => {
    if (analysis?.competitorRatings) {
      return analysis.competitorRatings;
    }
    // Fallback mock data
    return [
      { category: "功能", ourScore: 85, competitorAvg: 70 },
      { category: "设计", ourScore: 90, competitorAvg: 65 },
      { category: "价格", ourScore: 75, competitorAvg: 80 },
      { category: "品质", ourScore: 88, competitorAvg: 72 },
    ];
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto space-y-6 p-6 overflow-y-auto max-h-full"
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

      {/* Analysis Results with Charts */}
      <AnimatePresence>
        {analysis && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Charts Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Market Size Chart */}
              <Card className="bg-gradient-to-br from-blue-500/5 to-cyan-500/5 border-blue-500/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-blue-500" />
                    市场规模趋势
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[180px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadialBarChart 
                        cx="50%" 
                        cy="50%" 
                        innerRadius="30%" 
                        outerRadius="90%" 
                        data={getMarketSizeChartData()}
                        startAngle={180}
                        endAngle={0}
                      >
                        <RadialBar
                          dataKey="value"
                          cornerRadius={10}
                          background={{ fill: "hsl(var(--muted))" }}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: "hsl(var(--card))", 
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                          }}
                        />
                        <Legend 
                          iconSize={8} 
                          wrapperStyle={{ fontSize: "12px" }}
                        />
                      </RadialBarChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    预计年增长率 15-25%
                  </p>
                </CardContent>
              </Card>

              {/* User Segments Pie Chart */}
              <Card className="bg-gradient-to-br from-purple-500/5 to-pink-500/5 border-purple-500/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <PieChart className="w-4 h-4 text-purple-500" />
                    目标用户分布
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[180px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          data={getUserSegmentData()}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={70}
                          paddingAngle={2}
                          dataKey="percentage"
                          label={({ name, percentage }) => `${name}: ${percentage}%`}
                          labelLine={false}
                        >
                          {getUserSegmentData().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: "hsl(var(--card))", 
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                          }}
                        />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Pricing Distribution Bar Chart */}
            <Card className="bg-gradient-to-br from-green-500/5 to-emerald-500/5 border-green-500/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-green-500" />
                  市场定价分布
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[160px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={getPricingData()} layout="vertical">
                      <XAxis type="number" hide />
                      <YAxis 
                        type="category" 
                        dataKey="range" 
                        width={60}
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: "hsl(var(--card))", 
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                        formatter={(value: number) => [`${value}%`, "占比"]}
                      />
                      <Bar 
                        dataKey="count" 
                        radius={[0, 4, 4, 0]}
                        fill="hsl(var(--primary))"
                      >
                        {getPricingData().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-xs text-muted-foreground text-center mt-2">
                  {analysis.pricingStrategy}
                </p>
              </CardContent>
            </Card>

            {/* Competition Comparison */}
            <Card className="bg-gradient-to-br from-orange-500/5 to-amber-500/5 border-orange-500/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-orange-500" />
                  竞争力对比分析
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[160px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={getCompetitorData()}>
                      <XAxis 
                        dataKey="category" 
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis 
                        domain={[0, 100]}
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: "hsl(var(--card))", 
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                      <Legend 
                        wrapperStyle={{ fontSize: "12px" }}
                      />
                      <Bar 
                        dataKey="ourScore" 
                        name="我们的产品" 
                        fill="hsl(var(--primary))" 
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar 
                        dataKey="competitorAvg" 
                        name="竞品平均" 
                        fill="hsl(var(--muted-foreground))" 
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-xs text-muted-foreground text-center mt-2">
                  {analysis.competitionLandscape}
                </p>
              </CardContent>
            </Card>

            {/* Text Analysis Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Market Size Text */}
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

              {/* Target User Text */}
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
            </div>

            {/* Differentiation Opportunities */}
            {analysis.differentiationOpportunities && analysis.differentiationOpportunities.length > 0 && (
              <Card className="bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <Lightbulb className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-sm mb-3">差异化机会</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {analysis.differentiationOpportunities.map((opp, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="flex items-start gap-2 p-2 rounded-lg bg-background/50"
                          >
                            <span className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0">
                              {i + 1}
                            </span>
                            <span className="text-sm text-muted-foreground">{opp}</span>
                          </motion.div>
                        ))}
                      </div>
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
