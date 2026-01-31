import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Loader2,
  Users,
  FileText,
  TrendingUp,
  DollarSign,
  Target,
  Sparkles,
  ChevronRight,
  Heart,
  ShoppingCart,
  Megaphone,
} from "lucide-react";
import { toast } from "sonner";

interface AudiencePersona {
  name: string;
  age: string;
  gender: string;
  interests: string[];
  painPoints: string[];
  platforms: string[];
  buyingBehavior: string;
  estimatedReach: string;
}

interface ABTestCopy {
  version: string;
  headline: string;
  primaryText: string;
  callToAction: string;
  angle: string;
  targetEmotion: string;
}

interface MarketPotential {
  score: number;
  level: string;
  factors: { name: string; score: number; comment: string }[];
  recommendations: string[];
}

interface BudgetEstimate {
  dailyBudget: string;
  estimatedCPC: string;
  estimatedCPM: string;
  testDuration: string;
  minimumTestBudget: string;
}

interface AdStrategy {
  audiencePersonas: AudiencePersona[];
  abTestCopies: ABTestCopy[];
  marketPotential: MarketPotential;
  budgetEstimate: BudgetEstimate;
}

interface AdStrategyPanelProps {
  productName: string;
  productDescription?: string;
  painPoints?: string[];
  sellingPoints?: string[];
}

export function AdStrategyPanel({
  productName,
  productDescription,
  painPoints,
  sellingPoints,
}: AdStrategyPanelProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [strategy, setStrategy] = useState<AdStrategy | null>(null);

  const generateStrategy = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-ad-strategy`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            productName,
            productDescription,
            painPoints,
            sellingPoints,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "生成失败");
      }

      const data = await response.json();
      setStrategy(data);
      toast.success("广告策略生成成功！");
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "生成广告策略失败");
    } finally {
      setIsGenerating(false);
    }
  };

  if (!strategy) {
    return (
      <Card className="glass border-border/50">
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-4">
            <Megaphone className="w-8 h-8 text-accent-foreground" />
          </div>
          <h3 className="text-xl font-semibold mb-2">AI 广告策略建议</h3>
          <p className="text-muted-foreground mb-6">
            基于您的产品信息，AI 将生成受众画像、A/B测试文案和市场潜力评估
          </p>
          <Button
            onClick={generateStrategy}
            disabled={isGenerating}
            className="bg-gradient-to-r from-accent to-accent/80"
            size="lg"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                正在分析市场...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                生成广告策略
              </>
            )}
          </Button>
          <p className="text-xs text-muted-foreground mt-4">
            * 此为AI模拟分析，仅供参考
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Market Potential Score */}
      <Card className="glass border-border/50 overflow-hidden">
        <div className="bg-gradient-to-r from-primary/20 to-accent/20 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                市场潜力评分
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                基于产品特性和市场数据的综合评估
              </p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold text-primary">
                {strategy.marketPotential.score}
              </div>
              <Badge
                variant={
                  strategy.marketPotential.level === "High"
                    ? "default"
                    : strategy.marketPotential.level === "Medium"
                    ? "secondary"
                    : "outline"
                }
              >
                {strategy.marketPotential.level === "High"
                  ? "高潜力"
                  : strategy.marketPotential.level === "Medium"
                  ? "中等潜力"
                  : "需验证"}
              </Badge>
            </div>
          </div>
        </div>
        <CardContent className="p-6">
          <div className="space-y-4">
            {strategy.marketPotential.factors.map((factor, i) => (
              <div key={i}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{factor.name}</span>
                  <span className="text-muted-foreground">{factor.score}/100</span>
                </div>
                <Progress value={factor.score} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">{factor.comment}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 p-4 bg-muted/50 rounded-lg">
            <h4 className="font-medium mb-2">💡 优化建议</h4>
            <ul className="space-y-1">
              {strategy.marketPotential.recommendations.map((rec, i) => (
                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                  <ChevronRight className="w-4 h-4 shrink-0 mt-0.5" />
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="personas" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="personas">
            <Users className="w-4 h-4 mr-2" />
            受众画像
          </TabsTrigger>
          <TabsTrigger value="copies">
            <FileText className="w-4 h-4 mr-2" />
            A/B测试文案
          </TabsTrigger>
          <TabsTrigger value="budget">
            <DollarSign className="w-4 h-4 mr-2" />
            预算建议
          </TabsTrigger>
        </TabsList>

        {/* Audience Personas */}
        <TabsContent value="personas" className="mt-4">
          <div className="grid gap-4">
            {strategy.audiencePersonas.map((persona, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="glass border-border/50">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Target className="w-5 h-5 text-primary" />
                        {persona.name}
                      </CardTitle>
                      <Badge variant="outline">{persona.estimatedReach}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">年龄：</span>
                        <span className="ml-1">{persona.age}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">性别：</span>
                        <span className="ml-1">{persona.gender}</span>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground mb-2">兴趣标签</p>
                      <div className="flex flex-wrap gap-1">
                        {persona.interests.map((interest, j) => (
                          <Badge key={j} variant="secondary" className="text-xs">
                            {interest}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground mb-2">痛点</p>
                      <ul className="space-y-1">
                        {persona.painPoints.map((point, j) => (
                          <li key={j} className="text-sm flex items-start gap-2">
                            <span className="text-destructive">✗</span>
                            {point}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground mb-2">投放平台</p>
                      <div className="flex gap-2">
                        {persona.platforms.map((platform, j) => (
                          <Badge key={j} variant="outline" className="text-xs">
                            {platform}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-sm">
                        <ShoppingCart className="w-4 h-4 inline mr-1" />
                        <span className="text-muted-foreground">购买行为：</span>
                        {persona.buyingBehavior}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        {/* A/B Test Copies */}
        <TabsContent value="copies" className="mt-4">
          <div className="grid gap-4">
            {strategy.abTestCopies.map((copy, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="glass border-border/50">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">
                        版本 {copy.version}
                      </CardTitle>
                      <div className="flex gap-2">
                        <Badge variant="outline">{copy.angle}</Badge>
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <Heart className="w-3 h-3" />
                          {copy.targetEmotion}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg">
                      <p className="font-semibold text-lg mb-2">{copy.headline}</p>
                      <p className="text-muted-foreground">{copy.primaryText}</p>
                    </div>
                    <Button className="w-full" variant="outline">
                      {copy.callToAction}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        {/* Budget Estimate */}
        <TabsContent value="budget" className="mt-4">
          <Card className="glass border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                测款预算建议
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-muted/50 rounded-lg text-center">
                  <p className="text-sm text-muted-foreground">日预算</p>
                  <p className="text-2xl font-bold text-primary">
                    {strategy.budgetEstimate.dailyBudget}
                  </p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg text-center">
                  <p className="text-sm text-muted-foreground">测试周期</p>
                  <p className="text-2xl font-bold text-primary">
                    {strategy.budgetEstimate.testDuration}
                  </p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg text-center">
                  <p className="text-sm text-muted-foreground">预估 CPC</p>
                  <p className="text-2xl font-bold">
                    {strategy.budgetEstimate.estimatedCPC}
                  </p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg text-center">
                  <p className="text-sm text-muted-foreground">预估 CPM</p>
                  <p className="text-2xl font-bold">
                    {strategy.budgetEstimate.estimatedCPM}
                  </p>
                </div>
              </div>
              <div className="mt-6 p-4 bg-primary/10 rounded-lg">
                <p className="text-center">
                  <span className="text-muted-foreground">建议最低测试预算：</span>
                  <span className="text-xl font-bold text-primary ml-2">
                    {strategy.budgetEstimate.minimumTestBudget}
                  </span>
                </p>
              </div>
              <p className="text-xs text-muted-foreground text-center mt-4">
                * 以上数据为AI模拟估算，实际投放效果可能因市场变化而异
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Regenerate Button */}
      <div className="text-center">
        <Button variant="outline" onClick={generateStrategy} disabled={isGenerating}>
          {isGenerating ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4 mr-2" />
          )}
          重新生成策略
        </Button>
      </div>
    </div>
  );
}
