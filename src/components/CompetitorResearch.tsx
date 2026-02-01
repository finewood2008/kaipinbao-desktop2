import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Plus, Loader2, ArrowRight, SkipForward, Link } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CompetitorCard, CompetitorProduct } from "@/components/CompetitorCard";
import { ReviewAnalysisSummary, ReviewAnalysis } from "@/components/ReviewAnalysisSummary";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CompetitorResearchProps {
  projectId: string;
  onComplete: (hasResearch: boolean) => void;
  onSkip: () => void;
}

function detectPlatform(url: string): string {
  const lowerUrl = url.toLowerCase();
  if (lowerUrl.includes("amazon")) return "amazon";
  if (lowerUrl.includes("aliexpress")) return "aliexpress";
  if (lowerUrl.includes("taobao")) return "taobao";
  if (lowerUrl.includes("tmall")) return "tmall";
  if (lowerUrl.includes("ebay")) return "ebay";
  if (lowerUrl.includes("1688")) return "1688";
  return "unknown";
}

export function CompetitorResearch({ projectId, onComplete, onSkip }: CompetitorResearchProps) {
  const [urlInput, setUrlInput] = useState("");
  const [products, setProducts] = useState<CompetitorProduct[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [isScraping, setIsScraping] = useState(false);
  const [analysis, setAnalysis] = useState<ReviewAnalysis | null>(null);

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

    setIsAdding(true);

    try {
      const platform = detectPlatform(urlInput);
      
      const { data, error } = await supabase
        .from("competitor_products")
        .insert({
          project_id: projectId,
          url: urlInput.trim(),
          platform,
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

    try {
      const { data, error } = await supabase.functions.invoke("scrape-competitor", {
        body: { productId, url },
      });

      if (error) throw error;

      if (data.success) {
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
          <Search className="w-8 h-8 text-primary" />
        </motion.div>
        <h2 className="text-xl font-semibold text-foreground">竞品研究 <span className="text-muted-foreground text-sm">(可选)</span></h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          添加竞争对手产品链接，我们将抓取产品信息和评论，帮助您更好地了解市场需求和用户痛点
        </p>
      </div>

      {/* URL Input */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="粘贴 Amazon、AliExpress、淘宝等平台的产品链接..."
            className="pl-9 bg-background/50"
            onKeyDown={(e) => e.key === "Enter" && handleAddUrl()}
          />
        </div>
        <Button onClick={handleAddUrl} disabled={isAdding || !urlInput.trim()}>
          {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          <span className="ml-1">添加</span>
        </Button>
      </div>

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

      {/* Actions */}
      <div className="flex justify-between pt-4 border-t border-border/30">
        <Button variant="ghost" onClick={onSkip} className="text-muted-foreground">
          <SkipForward className="w-4 h-4 mr-1" />
          跳过此步骤
        </Button>
        <Button
          onClick={handleComplete}
          disabled={scrapingCount > 0}
          className="bg-primary hover:bg-primary/90"
        >
          {scrapingCount > 0 ? (
            <>
              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              正在抓取 ({scrapingCount})
            </>
          ) : (
            <>
              {completedCount > 0 ? "完成研究" : "开始PRD对话"}
              <ArrowRight className="w-4 h-4 ml-1" />
            </>
          )}
        </Button>
      </div>
    </motion.div>
  );
}
