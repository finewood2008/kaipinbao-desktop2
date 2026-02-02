import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { 
  ArrowRight, 
  BarChart3, 
  Search, 
  Palette, 
  Image, 
  FileText, 
  Loader2,
  ShoppingCart,
  Factory,
  Zap,
  TrendingDown,
  Rocket,
  Sparkles
} from "lucide-react";
import logoImage from "@/assets/logo.png";

export default function Index() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && user) {
      navigate("/dashboard");
    }
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-dark flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const features = [
    {
      icon: BarChart3,
      title: "市场调研",
      description: "AI智能分析市场趋势，发现潜在商机",
    },
    {
      icon: Search,
      title: "竞品分析",
      description: "自动抓取竞品数据，深度对比分析",
    },
    {
      icon: Palette,
      title: "产品设计",
      description: "AI辅助产品定义，生成专业PRD文档",
    },
    {
      icon: Image,
      title: "ID渲染生成",
      description: "基于PRD自动生成产品渲染图",
    },
    {
      icon: FileText,
      title: "落地页生成",
      description: "一键生成营销落地页，快速验证市场",
    },
  ];

  const stats = [
    { value: "20", unit: "m", label: "RAPID PROTOTYPING", labelCn: "极速设计" },
    { value: "90", unit: "%", label: "COST REDUCTION", labelCn: "降低成本" },
    { value: "20", unit: "x", label: "FASTER DEVELOPMENT", labelCn: "效率提升" },
  ];

  return (
    <div className="min-h-screen bg-[#0a0f1a] overflow-hidden">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0a0f1a]/80 backdrop-blur-xl border-b border-white/5">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logoImage} alt="开品宝" className="h-9" />
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground leading-none">半人马AI</span>
              <span className="text-base font-bold text-foreground leading-tight">开品宝</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              className="text-muted-foreground hover:text-foreground"
              onClick={() => navigate("/auth")}
            >
              登录
            </Button>
            <Button 
              className="bg-white/10 hover:bg-white/20 text-foreground border-0 rounded-full px-5"
              onClick={() => navigate("/auth")}
            >
              Get Started
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-[75vh] flex items-center justify-center pt-16 pb-10">
        {/* Background gradient effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-gradient-to-b from-primary/15 via-primary/5 to-transparent rounded-full blur-3xl" />
          <div className="absolute top-1/3 left-1/3 w-[250px] h-[250px] bg-cyan-500/10 rounded-full blur-3xl" />
          <div className="absolute top-1/3 right-1/3 w-[150px] h-[150px] bg-orange-500/10 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-6 relative z-10 text-center">
          {/* Top badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-center mb-4"
          >
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-muted-foreground">
              <Sparkles className="w-3 h-3 text-cyan-400" />
              跨境开品神器
            </span>
          </motion.div>

          {/* Main Title */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight mb-3"
          >
            开品宝
          </motion.h1>

          {/* Subtitle */}
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-medium mb-4"
          >
            <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-300 bg-clip-text text-transparent">
              您的第二
            </span>
            <span className="bg-gradient-to-r from-orange-400 to-amber-300 bg-clip-text text-transparent">
              开发部
            </span>
          </motion.h2>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xs md:text-sm text-muted-foreground mb-2 max-w-md mx-auto"
          >
            专为跨境电商打造的一站式产品研发平台，开品从未如此简单
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="text-[11px] text-muted-foreground/60 mb-6"
          >
            市场调研 · 竞品分析 · 产品设计 · ID生成 · 落地页
          </motion.p>

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="mb-8"
          >
            <Button
              className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-sm px-5 py-4 h-auto rounded-lg shadow-[0_0_25px_rgba(251,146,60,0.2)] hover:shadow-[0_0_35px_rgba(251,146,60,0.3)] transition-all duration-300"
              onClick={() => navigate("/auth")}
            >
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              开始设计
              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Button>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-wrap justify-center gap-8 md:gap-12"
          >
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + i * 0.1 }}
                className="text-center"
              >
                <div className="text-xl md:text-2xl lg:text-3xl font-light mb-0.5">
                  <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                    {stat.value}
                  </span>
                  <span className="text-orange-400">{stat.unit}</span>
                </div>
                <div className="text-[9px] uppercase tracking-wider text-muted-foreground/50">
                  {stat.labelCn}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 relative">
        {/* Background subtle glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-gradient-to-r from-cyan-500/5 via-primary/10 to-orange-500/5 rounded-full blur-3xl" />
        </div>
        
        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-8"
          >
            <div className="inline-flex items-center gap-2 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-cyan-400 text-[10px] uppercase tracking-widest">Core Features</span>
            </div>
            <h3 className="text-xl md:text-2xl lg:text-3xl font-bold">
              五大核心能力
            </h3>
          </motion.div>

          <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-3">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="group relative p-4 rounded-xl bg-gradient-to-b from-white/[0.03] to-white/[0.01] border border-white/[0.06] hover:border-cyan-500/30 transition-all duration-500 overflow-hidden"
              >
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-cyan-500/10 via-primary/5 to-orange-500/5 opacity-0 group-hover:opacity-100 transition-all duration-500" />
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <div className="relative z-10">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 via-cyan-500/15 to-orange-500/10 flex items-center justify-center mb-3 group-hover:scale-110 group-hover:shadow-[0_0_15px_rgba(34,211,238,0.3)] transition-all duration-300">
                    <feature.icon className="w-4 h-4 text-cyan-400 group-hover:text-cyan-300 transition-colors" />
                  </div>
                  <h4 className="text-sm font-semibold mb-1 group-hover:text-cyan-400 transition-colors">{feature.title}</h4>
                  <p className="text-[11px] text-muted-foreground/60 leading-relaxed">{feature.description}</p>
                </div>

                <div className="absolute -bottom-8 -right-8 w-16 h-16 bg-cyan-500/20 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Target Audience Section */}
      <section className="py-12 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent" />
        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-8"
          >
            <div className="inline-flex items-center gap-2 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-orange-400" />
              <span className="text-orange-400 text-[10px] uppercase tracking-widest">Target Audience</span>
            </div>
            <h3 className="text-xl md:text-2xl lg:text-3xl font-bold mb-2">
              专为跨境电商打造
            </h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              开品宝是跨境开品的神器，让产品研发效率提升20倍
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-4 max-w-2xl mx-auto">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="group relative p-5 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04] hover:border-cyan-500/20 transition-all duration-500 overflow-hidden"
            >
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-cyan-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="relative z-10">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                  <ShoppingCart className="w-5 h-5 text-cyan-400" />
                </div>
                <h4 className="text-lg font-bold mb-1.5 group-hover:text-cyan-400 transition-colors">跨境电商公司</h4>
                <p className="text-xs text-muted-foreground mb-3">
                  快速验证市场机会，降低试错成本
                </p>
                <ul className="space-y-1.5 text-[11px] text-muted-foreground/70">
                  <li className="flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-cyan-400" />
                    快速生成产品方案
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-cyan-400" />
                    AI驱动市场分析
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-cyan-400" />
                    一键生成营销素材
                  </li>
                </ul>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="group relative p-5 rounded-xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04] hover:border-orange-500/20 transition-all duration-500 overflow-hidden"
            >
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-orange-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="relative z-10">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500/20 to-amber-500/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                  <Factory className="w-5 h-5 text-orange-400" />
                </div>
                <h4 className="text-lg font-bold mb-1.5 group-hover:text-orange-400 transition-colors">外贸工厂</h4>
                <p className="text-xs text-muted-foreground mb-3">
                  专业产品输出，提升开发效率
                </p>
                <ul className="space-y-1.5 text-[11px] text-muted-foreground/70">
                  <li className="flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-orange-400" />
                    专业PRD文档生成
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-orange-400" />
                    产品渲染图自动生成
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-orange-400" />
                    降低研发沟通成本
                  </li>
                </ul>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 bg-[#080c14]">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <img src={logoImage} alt="开品宝" className="h-6" />
              <span className="text-sm font-semibold">开品宝</span>
              <span className="text-xs text-muted-foreground/60">— AI产品研发平台</span>
            </div>
            <p className="text-xs text-muted-foreground/50">
              © 2025 开品宝. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
