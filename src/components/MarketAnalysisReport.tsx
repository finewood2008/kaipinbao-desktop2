import { motion } from "framer-motion";
import { TrendingUp, DollarSign, Star, Target, Lightbulb, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export interface MarketAnalysisData {
  marketOverview: {
    competitorCount: number;
    priceDistribution: { low: number; mid: number; high: number };
    averageRating: number;
  };
  priceAnalysis: {
    minPrice: string;
    maxPrice: string;
    sweetSpot: string;
    opportunityGap: string;
  };
  reviewInsights: {
    positiveHighlights: string[];
    negativeHighlights: string[];
    unmetNeeds: string[];
  };
  differentiationOpportunities: string[];
  marketTrends: string[];
  strategicRecommendations: string[];
}

interface MarketAnalysisReportProps {
  analysis: MarketAnalysisData;
}

export function MarketAnalysisReport({ analysis }: MarketAnalysisReportProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Summary Card */}
      <Card className="bg-gradient-to-br from-primary/10 to-accent/10 border-primary/30">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              市场分析报告
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-muted-foreground"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="w-4 h-4 mr-1" />
                  收起
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4 mr-1" />
                  展开详情
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-primary">{analysis.marketOverview.competitorCount}</p>
              <p className="text-xs text-muted-foreground">分析竞品</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-primary">{analysis.priceAnalysis.sweetSpot}</p>
              <p className="text-xs text-muted-foreground">甜点价格</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-primary">{analysis.marketOverview.averageRating.toFixed(1)}</p>
              <p className="text-xs text-muted-foreground">平均评分</p>
            </div>
          </div>
          
          {/* Quick insights */}
          {analysis.differentiationOpportunities.length > 0 && (
            <div className="mt-4 pt-4 border-t border-border/50">
              <p className="text-sm text-muted-foreground mb-2">核心差异化机会：</p>
              <p className="text-sm font-medium text-foreground">
                {analysis.differentiationOpportunities[0]}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Expanded Details */}
      {isExpanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="space-y-4"
        >
          {/* Price Analysis */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-green-500" />
                价格策略洞察
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">价格区间</span>
                <span>{analysis.priceAnalysis.minPrice} - {analysis.priceAnalysis.maxPrice}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">机会缺口</span>
                <span className="text-primary font-medium">{analysis.priceAnalysis.opportunityGap}</span>
              </div>
            </CardContent>
          </Card>

          {/* Review Insights */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-500" />
                用户评价洞察
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {analysis.reviewInsights.positiveHighlights.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">用户好评点</p>
                  <div className="flex flex-wrap gap-1">
                    {analysis.reviewInsights.positiveHighlights.map((point, i) => (
                      <Badge key={i} variant="secondary" className="bg-green-500/10 text-green-600">
                        {point}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {analysis.reviewInsights.negativeHighlights.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">用户差评点</p>
                  <div className="flex flex-wrap gap-1">
                    {analysis.reviewInsights.negativeHighlights.map((point, i) => (
                      <Badge key={i} variant="secondary" className="bg-red-500/10 text-red-600">
                        {point}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {analysis.reviewInsights.unmetNeeds.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">未满足需求</p>
                  <div className="flex flex-wrap gap-1">
                    {analysis.reviewInsights.unmetNeeds.map((need, i) => (
                      <Badge key={i} variant="secondary" className="bg-primary/10 text-primary">
                        {need}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Differentiation */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" />
                差异化机会
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {analysis.differentiationOpportunities.map((opp, i) => (
                  <li key={i} className="text-sm flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>{opp}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Recommendations */}
          {analysis.strategicRecommendations.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-yellow-500" />
                  战略建议
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {analysis.strategicRecommendations.map((rec, i) => (
                    <li key={i} className="text-sm flex items-start gap-2">
                      <span className="text-yellow-500 font-bold">{i + 1}.</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}
