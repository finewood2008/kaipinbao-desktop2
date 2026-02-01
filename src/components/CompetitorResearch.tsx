import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, Plus, Loader2, ArrowRight, SkipForward, Link, BarChart3, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { CompetitorCard, CompetitorProduct } from "@/components/CompetitorCard";
import { ReviewAnalysisSummary, ReviewAnalysis } from "@/components/ReviewAnalysisSummary";
import { MarketAnalysisReport, MarketAnalysisData } from "@/components/MarketAnalysisReport";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CompetitorResearchProps {
  projectId: string;
  onComplete: (hasResearch: boolean) => void;
  onSkip: () => void;
}

function isAmazonUrl(url: string): boolean {
  const lowerUrl = url.toLowerCase();
  return lowerUrl.includes("amazon.com") || 
         lowerUrl.includes("amazon.co.") || 
         lowerUrl.includes("amazon.de") ||
         lowerUrl.includes("amazon.fr") ||
         lowerUrl.includes("amazon.it") ||
         lowerUrl.includes("amazon.es") ||
         lowerUrl.includes("amazon.ca") ||
         lowerUrl.includes("amazon.co.uk") ||
         lowerUrl.includes("amazon.co.jp") ||
         lowerUrl.includes("amazon.in");
}

export function CompetitorResearch({ projectId, onComplete, onSkip }: CompetitorResearchProps) {
  const [urlInput, setUrlInput] = useState("");
  const [products, setProducts] = useState<CompetitorProduct[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [isScraping, setIsScraping] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isMarketAnalyzing, setIsMarketAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<ReviewAnalysis | null>(null);
  const [marketAnalysis, setMarketAnalysis] = useState<MarketAnalysisData | null>(null);
  const [scrapeProgress, setScrapeProgress] = useState(0);

  // Load existing competitor products
  useEffect(() => {
    loadProducts();
  }, [projectId]);

  const loadProducts = async () => {
    const { data, error } = await supabase
      .from("competitor_products")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to load competitor products:", error);
      return;
    }

    // Map to CompetitorProduct type with proper status typing
    const mappedProducts: CompetitorProduct[] = (data || []).map(p => ({
      id: p.id,
      url: p.url,
      platform: p.platform,
      product_title: p.product_title || undefined,
      price: p.price || undefined,
      rating: p.rating ? Number(p.rating) : undefined,
      review_count: p.review_count || undefined,
      status: p.status as CompetitorProduct["status"],
    }));

    setProducts(mappedProducts);
    
    // If we have completed products, generate analysis
    const completedProducts = (data || []).filter(p => p.status === "completed");
    if (completedProducts.length > 0) {
      await generateAnalysis();
    }

    // Check if we already have market analysis
    const { data: projectData } = await supabase
      .from("projects")
      .select("prd_data")
      .eq("id", projectId)
      .single();

    if (projectData?.prd_data && typeof projectData.prd_data === 'object') {
      const prdData = projectData.prd_data as Record<string, unknown>;
      if (prdData.marketAnalysis) {
        setMarketAnalysis(prdData.marketAnalysis as MarketAnalysisData);
      }
    }
  };

  const handleAddUrl = async () => {
    if (!urlInput.trim()) return;

    // Validate URL
    try {
      new URL(urlInput);
    } catch {
      toast.error("请输入有效的URL");
      return;
    }

    // Check if it's an Amazon URL
    if (!isAmazonUrl(urlInput)) {
      toast.error("目前仅支持 Amazon 产品链接");
      return;
    }

    setIsAdding(true);

    try {
      const { data, error } = await supabase
        .from("competitor_products")
        .insert({
          project_id: projectId,
          url: urlInput.trim(),
          platform: "amazon",
          status: "pending",
        })
        .select()
        .single();

      if (error) throw error;

      const newProduct: CompetitorProduct = {
        id: data.id,
        url: data.url,
        platform: data.platform,
        status: data.status as CompetitorProduct["status"],
      };
      setProducts(prev => [newProduct, ...prev]);
      setUrlInput("");
      
      // Start scraping
      scrapeProduct(data.id, urlInput.trim());
    } catch (error) {
      console.error("Failed to add URL:", error);
      toast.error("添加链接失败");
    } finally {
      setIsAdding(false);
    }
  };

  const scrapeProduct = async (productId: string, url: string) => {
    // Update status to scraping
    setProducts(prev =>
      prev.map(p => (p.id === productId ? { ...p, status: "scraping" as const } : p))
    );
    setIsScraping(true);
    setScrapeProgress(10); // Start progress

    try {
      // Simulate progress during scraping
      const progressInterval = setInterval(() => {
        setScrapeProgress(prev => {
          if (prev >= 85) {
            clearInterval(progressInterval);
            return 85;
          }
          return prev + Math.random() * 15;
        });
      }, 800);

      const { data, error } = await supabase.functions.invoke("scrape-competitor", {
        body: { productId, url },
      });

      clearInterval(progressInterval);

      if (error) throw error;

      if (data.success) {
        setScrapeProgress(100);
        // Reload products to get updated data
        await loadProducts();
        toast.success("产品信息抓取成功");
      } else {
        throw new Error(data.error || "Scraping failed");
      }
    } catch (error) {
      console.error("Scrape failed:", error);
      // Update status to failed
      await supabase
        .from("competitor_products")
        .update({ status: "failed" })
        .eq("id", productId);
      
      setProducts(prev =>
        prev.map(p => (p.id === productId ? { ...p, status: "failed" as const } : p))
      );
      toast.error("抓取失败，请检查链接是否正确");
    } finally {
      setIsScraping(false);
      setTimeout(() => setScrapeProgress(0), 500);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await supabase.from("competitor_products").delete().eq("id", id);
      setProducts(prev => prev.filter(p => p.id !== id));
      toast.success("已删除");
    } catch (error) {
      console.error("Delete failed:", error);
      toast.error("删除失败");
    }
  };

  const handleRetry = (id: string) => {
    const product = products.find(p => p.id === id);
    if (product) {
      scrapeProduct(id, product.url);
    }
  };

  const generateAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-reviews", {
        body: { projectId },
      });

      if (error) throw error;

      if (data.success && data.analysis) {
        setAnalysis(data.analysis);
      }
    } catch (error) {
      console.error("Analysis failed:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleStartMarketAnalysis = async () => {
    setIsMarketAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke("market-analysis", {
        body: { projectId },
      });

      if (error) throw error;

      if (data.success && data.analysis) {
        setMarketAnalysis(data.analysis);
        toast.success("市场分析完成");
      } else {
        throw new Error(data.error || "Analysis failed");
      }
    } catch (error) {
      console.error("Market analysis failed:", error);
      toast.error("市场分析失败，请重试");
    } finally {
      setIsMarketAnalyzing(false);
    }
  };

  const handleComplete = async () => {
    // Mark competitor research as completed
    await supabase
      .from("projects")
      .update({ competitor_research_completed: true })
      .eq("id", projectId);

    const completedProducts = products.filter(p => p.status === "completed");
    onComplete(completedProducts.length > 0);
  };

  const completedCount = products.filter(p => p.status === "completed").length;
  const scrapingCount = products.filter(p => p.status === "scraping" || p.status === "pending").length;

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
        <h2 className="text-xl font-semibold text-foreground">市场分析 <span className="text-muted-foreground text-sm">(可选)</span></h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          添加 Amazon 竞品链接，AI 市场分析专家将帮您了解市场格局、价格策略和用户真实需求
        </p>
      </div>

      {/* URL Input */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="粘贴 Amazon 产品链接 (例如: amazon.com/dp/...)"
            className="pl-9 bg-background/50"
            onKeyDown={(e) => e.key === "Enter" && handleAddUrl()}
          />
        </div>
        <Button onClick={handleAddUrl} disabled={isAdding || !urlInput.trim()}>
          {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          <span className="ml-1">添加</span>
        </Button>
      </div>

      {/* Progress indicator for scraping */}
      <AnimatePresence>
        {(isScraping || isAnalyzing || isMarketAnalyzing) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-muted/30 rounded-lg p-4 border border-border/50"
          >
            <div className="flex items-center gap-3 mb-3">
              {isScraping ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  <span className="text-sm font-medium">正在抓取产品信息与评论...</span>
                </>
              ) : isMarketAnalyzing ? (
                <>
                  <Sparkles className="w-4 h-4 animate-pulse text-primary" />
                  <span className="text-sm font-medium">AI 市场分析专家正在分析数据...</span>
                </>
              ) : (
                <>
                  <BarChart3 className="w-4 h-4 animate-pulse text-primary" />
                  <span className="text-sm font-medium">正在分析评论数据...</span>
                </>
              )}
            </div>
            <Progress 
              value={isScraping ? scrapeProgress : isMarketAnalyzing ? 60 : 50} 
              className="h-2"
            />
            <p className="text-xs text-muted-foreground mt-2">
              {isScraping 
                ? "正在从 Amazon 抓取产品信息和用户评论" 
                : isMarketAnalyzing
                ? "正在生成市场格局、价格策略、差异化机会等专业分析报告"
                : "AI 正在分析用户评论，提取痛点与需求洞察"}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Product list */}
      <AnimatePresence mode="popLayout">
        {products.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-3"
          >
            <h4 className="text-sm font-medium text-muted-foreground">
              已添加的竞品 ({completedCount}/{products.length})
            </h4>
            {products.map((product) => (
              <CompetitorCard
                key={product.id}
                product={product}
                onDelete={handleDelete}
                onRetry={handleRetry}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Analysis summary */}
      {analysis && <ReviewAnalysisSummary analysis={analysis} />}

      {/* Market Analysis Button */}
      {completedCount > 0 && !marketAnalysis && !isMarketAnalyzing && scrapingCount === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-center"
        >
          <Button
            onClick={handleStartMarketAnalysis}
            variant="outline"
            className="border-primary/50 hover:bg-primary/10"
          >
            <Sparkles className="w-4 h-4 mr-2 text-primary" />
            开始 AI 市场分析
          </Button>
        </motion.div>
      )}

      {/* Market Analysis Report */}
      {marketAnalysis && <MarketAnalysisReport analysis={marketAnalysis} />}

      {/* Actions */}
      <div className="flex justify-between pt-4 border-t border-border/30">
        <Button variant="ghost" onClick={onSkip} className="text-muted-foreground">
          <SkipForward className="w-4 h-4 mr-1" />
          跳过此步骤
        </Button>
        <Button
          onClick={handleComplete}
          disabled={scrapingCount > 0 || isMarketAnalyzing}
          className="bg-primary hover:bg-primary/90"
        >
          {scrapingCount > 0 || isMarketAnalyzing ? (
            <>
              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              {isMarketAnalyzing ? "分析中..." : `正在抓取 (${scrapingCount})`}
            </>
          ) : (
            <>
              {completedCount > 0 ? "进入AI产品经理" : "开始PRD对话"}
              <ArrowRight className="w-4 h-4 ml-1" />
            </>
          )}
        </Button>
      </div>
    </motion.div>
  );
}
