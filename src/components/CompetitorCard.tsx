import { motion } from "framer-motion";
import { ExternalLink, Loader2, Star, Trash2, CheckCircle, XCircle, AlertCircle, Image as ImageIcon, ThumbsUp, ThumbsDown, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState } from "react";

export interface ReviewSummary {
  overallRating: number | null;
  totalReviews: number | null;
  ratingBreakdown: { stars: number; percentage: number }[];
  topPositives: string[];
  topNegatives: string[];
}

export interface CompetitorProduct {
  id: string;
  url: string;
  platform: string;
  product_title?: string;
  price?: string;
  rating?: number;
  review_count?: number;
  product_images?: string[];
  main_image?: string;
  review_summary?: ReviewSummary;
  review_screenshot_url?: string;
  status: "pending" | "scraping" | "completed" | "failed";
}

interface CompetitorCardProps {
  product: CompetitorProduct;
  onDelete: (id: string) => void;
  onRetry?: (id: string) => void;
}

const platformColors: Record<string, string> = {
  amazon: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  aliexpress: "bg-red-500/20 text-red-400 border-red-500/30",
  taobao: "bg-orange-400/20 text-orange-300 border-orange-400/30",
  tmall: "bg-red-400/20 text-red-300 border-red-400/30",
  ebay: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  unknown: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

const statusIcons = {
  pending: <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />,
  scraping: <Loader2 className="w-4 h-4 animate-spin text-primary" />,
  completed: <CheckCircle className="w-4 h-4 text-green-500" />,
  failed: <XCircle className="w-4 h-4 text-destructive" />,
};

const statusLabels = {
  pending: "等待中",
  scraping: "抓取中...",
  completed: "已完成",
  failed: "抓取失败",
};

export function CompetitorCard({ product, onDelete, onRetry }: CompetitorCardProps) {
  const platformClass = platformColors[product.platform] || platformColors.unknown;
  const displayUrl = product.url.length > 50 ? product.url.slice(0, 50) + "..." : product.url;
  const [showScreenshot, setShowScreenshot] = useState(false);

  // Use main_image if available, otherwise fall back to first product_image
  const displayImage = product.main_image || (product.product_images && product.product_images[0]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -10 }}
      className="bg-card/30 border border-border/50 rounded-lg p-3 space-y-2"
    >
      {/* Header: URL and actions */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="truncate">{displayUrl}</span>
            <a
              href={product.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 hover:text-primary transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-muted-foreground hover:text-destructive"
          onClick={() => onDelete(product.id)}
        >
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>

      {/* Status and platform */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className={cn("px-2 py-0.5 rounded-full text-xs border", platformClass)}>
          {product.platform.charAt(0).toUpperCase() + product.platform.slice(1)}
        </span>
        <div className="flex items-center gap-1 text-xs">
          {statusIcons[product.status]}
          <span className="text-muted-foreground">{statusLabels[product.status]}</span>
        </div>
      </div>

      {/* Product info (when completed) */}
      {product.status === "completed" && product.product_title && (
        <div className="space-y-3 pt-2 border-t border-border/30">
          {/* Main product image and title */}
          <div className="flex gap-3">
            {displayImage && (
              <div className="w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-muted border border-border/50">
                <img 
                  src={displayImage} 
                  alt="产品主图"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground line-clamp-2">
                {product.product_title}
              </p>
              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                {product.price && <span className="text-primary font-medium">{product.price}</span>}
                {product.rating && (
                  <span className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                    {product.rating.toFixed(1)}
                  </span>
                )}
                {product.review_count !== undefined && (
                  <span>({product.review_count.toLocaleString()} 评论)</span>
                )}
              </div>
            </div>
          </div>
          
          {/* Review Summary */}
          {product.review_summary && (
            <ReviewSummarySection summary={product.review_summary} />
          )}
          
          {/* Review Screenshot Button */}
          {product.review_screenshot_url && (
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs h-7 gap-1.5"
                onClick={() => setShowScreenshot(!showScreenshot)}
              >
                <Camera className="w-3 h-3" />
                {showScreenshot ? "隐藏评论截图" : "查看评论页截图"}
              </Button>
              
              {showScreenshot && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="rounded-lg overflow-hidden border border-border/50"
                >
                  <img
                    src={product.review_screenshot_url}
                    alt="评论页截图"
                    className="w-full"
                    loading="lazy"
                  />
                </motion.div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Retry button (when failed) */}
      {product.status === "failed" && onRetry && (
        <div className="flex items-center gap-2 pt-1 border-t border-border/30">
          <AlertCircle className="w-3 h-3 text-destructive" />
          <span className="text-xs text-muted-foreground">抓取失败，请检查链接</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-xs ml-auto"
            onClick={() => onRetry(product.id)}
          >
            重试
          </Button>
        </div>
      )}
    </motion.div>
  );
}

// Review Summary Component
function ReviewSummarySection({ summary }: { summary: ReviewSummary }) {
  const hasPositives = summary.topPositives && summary.topPositives.length > 0;
  const hasNegatives = summary.topNegatives && summary.topNegatives.length > 0;
  const hasBreakdown = summary.ratingBreakdown && summary.ratingBreakdown.length > 0;
  
  if (!hasPositives && !hasNegatives && !hasBreakdown) {
    return null;
  }

  return (
    <div className="bg-muted/30 rounded-lg p-2.5 space-y-2">
      <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
        <Star className="w-3 h-3 text-yellow-500" />
        评论摘要
      </div>
      
      {/* Rating Breakdown */}
      {hasBreakdown && (
        <div className="space-y-1">
          {summary.ratingBreakdown
            .sort((a, b) => b.stars - a.stars)
            .slice(0, 5)
            .map((item) => (
              <div key={item.stars} className="flex items-center gap-2 text-xs">
                <span className="w-10 text-muted-foreground">{item.stars} 星</span>
                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-yellow-500/70 rounded-full"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
                <span className="w-8 text-right text-muted-foreground">{item.percentage}%</span>
              </div>
            ))}
        </div>
      )}
      
      {/* Top Positives */}
      {hasPositives && (
        <div className="space-y-1">
          <div className="flex items-center gap-1 text-xs text-green-500">
            <ThumbsUp className="w-3 h-3" />
            <span>好评要点</span>
          </div>
          {summary.topPositives.slice(0, 2).map((point, idx) => (
            <p key={idx} className="text-xs text-muted-foreground line-clamp-2 pl-4">
              • {point}
            </p>
          ))}
        </div>
      )}
      
      {/* Top Negatives */}
      {hasNegatives && (
        <div className="space-y-1">
          <div className="flex items-center gap-1 text-xs text-red-500">
            <ThumbsDown className="w-3 h-3" />
            <span>差评痛点</span>
          </div>
          {summary.topNegatives.slice(0, 2).map((point, idx) => (
            <p key={idx} className="text-xs text-muted-foreground line-clamp-2 pl-4">
              • {point}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
