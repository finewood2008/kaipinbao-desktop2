import { motion } from "framer-motion";
import { ExternalLink, Loader2, Star, Trash2, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface CompetitorProduct {
  id: string;
  url: string;
  platform: string;
  product_title?: string;
  price?: string;
  rating?: number;
  review_count?: number;
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
        <div className="space-y-1.5 pt-1 border-t border-border/30">
          <p className="text-sm font-medium text-foreground line-clamp-2">
            {product.product_title}
          </p>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
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
