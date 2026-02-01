import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Lightbulb, BarChart3, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface CompetitorInsight {
  positivePoints: string[];
  negativePoints: string[];
  totalReviews: number;
  productsAnalyzed: number;
  products?: Array<{
    title: string;
    rating: number;
    reviewCount: number;
  }>;
  actionableInsights?: string[];
}

interface CompetitorInsightCardProps {
  insight: CompetitorInsight;
}

export function CompetitorInsightCard({ insight }: CompetitorInsightCardProps) {
  return (
    <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            🔍 竞品研究洞察
          </CardTitle>
          <Badge variant="secondary" className="text-xs">
            {insight.productsAnalyzed} 款竞品 · {insight.totalReviews} 条评论
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Analyzed Products */}
        {insight.products && insight.products.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              分析的竞品
            </h4>
            <div className="flex flex-wrap gap-2">
              {insight.products.map((product, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-background/50 rounded-lg px-3 py-2 text-sm"
                >
                  <div className="font-medium text-foreground line-clamp-1 max-w-[200px]">
                    {product.title}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                    <span className="flex items-center gap-0.5">
                      <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                      {product.rating}
                    </span>
                    <span>·</span>
                    <span>{product.reviewCount} 评论</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Two Column Layout for Pros and Cons */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Positive Points */}
          {insight.positivePoints.length > 0 && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-2"
            >
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
                  <TrendingUp className="w-3.5 h-3.5 text-green-500" />
                </div>
                <h4 className="text-sm font-semibold text-foreground">用户看重的优点</h4>
              </div>
              <ul className="space-y-1.5 pl-8">
                {insight.positivePoints.slice(0, 4).map((point, index) => (
                  <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-green-500 mt-1">•</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          )}

          {/* Negative Points */}
          {insight.negativePoints.length > 0 && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-2"
            >
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center">
                  <TrendingDown className="w-3.5 h-3.5 text-red-500" />
                </div>
                <h4 className="text-sm font-semibold text-foreground">主要痛点机会</h4>
              </div>
              <ul className="space-y-1.5 pl-8">
                {insight.negativePoints.slice(0, 4).map((point, index) => (
                  <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-red-500 mt-1">•</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          )}
        </div>

        {/* Actionable Insights */}
        {insight.actionableInsights && insight.actionableInsights.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 space-y-2"
          >
            <div className="flex items-center gap-1.5">
              <Lightbulb className="w-4 h-4 text-yellow-500" />
              <h4 className="text-sm font-semibold text-foreground">💡 创新建议</h4>
            </div>
            <ul className="space-y-1">
              {insight.actionableInsights.slice(0, 3).map((insight, index) => (
                <li key={index} className="text-sm text-muted-foreground pl-5">
                  {insight}
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
