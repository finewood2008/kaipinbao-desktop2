// useEffect removed - no longer needed for auto-redirect
import { useNavigate, Link } from "react-router-dom";
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
import featureProductDesign from "@/assets/feature-product-design.jpg";
import featureIdRender from "@/assets/feature-id-render.jpg";

export default function Index() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  // Removed auto-redirect: users can now browse homepage even when logged in

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
      image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop&q=80",
    },
    {
      icon: Search,
      title: "竞品分析",
      description: "自动抓取竞品数据，深度对比分析",
      image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=300&fit=crop&q=80",
    },
    {
      icon: Palette,
      title: "产品设计",
      description: "AI辅助产品定义，生成专业PRD文档",
      image: featureProductDesign,
    },
    {
      icon: Image,
      title: "ID渲染生成",
      description: "基于PRD自动生成产品渲染图",
      image: featureIdRender,
    },
    {
      icon: FileText,
      title: "落地页生成",
      description: "一键生成营销落地页，快速验证市场",
      image: "https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?w=400&h=300&fit=crop&q=80",
    },
  ];

  const showcaseProducts = [
    {
      title: "智能无线耳机",
      category: "消费电子",
      image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&h=400&fit=crop&q=80",
    },
    {
      title: "便携式咖啡机",
      category: "家用电器",
      image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&h=400&fit=crop&q=80",
    },
    {
      title: "智能手表",
      category: "穿戴设备",
      image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&h=400&fit=crop&q=80",
    },
    {
      title: "运动水杯",
      category: "户外运动",
      image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600&h=400&fit=crop&q=80",
    },
    {
      title: "LED台灯",
      category: "家居照明",
      image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=600&h=400&fit=crop&q=80",
    },
    {
      title: "蓝牙音箱",
      category: "音频设备",
      image: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=600&h=400&fit=crop&q=80",
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
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <img src={logoImage} alt="开品宝" className="h-9" />
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground leading-none">半人马AI</span>
              <span className="text-base font-bold text-foreground leading-tight">开品宝</span>
            </div>
          </Link>
          <Button 
            className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 text-foreground border border-white/10 rounded-full px-5"
            onClick={() => navigate(user ? "/dashboard" : "/auth")}
          >
            {user ? "进入工作台" : "登录 / 注册"}
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-[85vh] flex items-center justify-center pt-20 pb-10">
        {/* Background gradient effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-gradient-to-b from-primary/15 via-primary/5 to-transparent rounded-full blur-3xl" />
          <div className="absolute top-1/3 left-1/3 w-[300px] h-[300px] bg-cyan-500/10 rounded-full blur-3xl" />
          <div className="absolute top-1/3 right-1/3 w-[200px] h-[200px] bg-orange-500/10 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-6 relative z-10 text-center">
          {/* Top badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-center mb-6"
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs text-muted-foreground">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              跨境开品神器
            </span>
          </motion.div>

          {/* Main Title */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight mb-4"
          >
            开品宝
          </motion.h1>

          {/* Subtitle - No italic */}
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-medium mb-6"
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
            className="text-sm md:text-base text-muted-foreground mb-3 max-w-xl mx-auto"
          >
            专为跨境电商打造的一站式产品研发平台，开品从未如此简单
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="text-xs text-muted-foreground/60 mb-8"
          >
            市场调研 · 竞品分析 · 产品设计 · ID生成 · 落地页
          </motion.p>

          {/* CTA Button - Smaller */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="mb-10"
          >
            <Button
              className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-sm px-6 py-5 h-auto rounded-lg shadow-[0_0_30px_rgba(251,146,60,0.25)] hover:shadow-[0_0_40px_rgba(251,146,60,0.35)] transition-all duration-300"
              onClick={() => navigate(user ? "/dashboard" : "/auth")}
            >
              <Sparkles className="w-4 h-4 mr-1.5" />
              {user ? "进入工作台" : "开始设计"}
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </motion.div>

          {/* Stats - Smaller */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-wrap justify-center gap-10 md:gap-16"
          >
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + i * 0.1 }}
                className="text-center"
              >
                <div className="text-2xl md:text-3xl lg:text-4xl font-light mb-1">
                  <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                    {stat.value}
                  </span>
                  <span className="text-orange-400">{stat.unit}</span>
                </div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground/50">
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
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-gradient-to-r from-cyan-500/5 via-primary/10 to-orange-500/5 rounded-full blur-3xl" />
        </div>
        
        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-8"
          >
            <div className="inline-flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span className="text-cyan-400 text-xs uppercase tracking-widest">Core Features</span>
            </div>
            <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold">
              五大核心能力
            </h3>
          </motion.div>

          <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-4">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="group relative rounded-xl bg-gradient-to-b from-white/[0.03] to-white/[0.01] border border-white/[0.06] hover:border-cyan-500/30 transition-all duration-500 overflow-hidden"
              >
                {/* Feature Image */}
                <div className="relative h-32 overflow-hidden">
                  <img 
                    src={feature.image} 
                    alt={feature.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f1a] via-[#0a0f1a]/50 to-transparent" />
                  <div className="absolute top-3 left-3 w-8 h-8 rounded-lg bg-black/50 backdrop-blur-sm flex items-center justify-center">
                    <feature.icon className="w-4 h-4 text-cyan-400" />
                  </div>
                </div>
                
                {/* Content */}
                <div className="p-4 relative">
                  {/* Animated gradient background on hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-primary/5 to-orange-500/5 opacity-0 group-hover:opacity-100 transition-all duration-500" />
                  
                  <div className="relative z-10">
                    <h4 className="text-base font-bold mb-1.5 text-white group-hover:text-cyan-300 transition-colors drop-shadow-[0_0_10px_rgba(34,211,238,0.3)]">{feature.title}</h4>
                    <p className="text-xs text-muted-foreground/80 leading-relaxed font-medium">{feature.description}</p>
                  </div>
                </div>

                {/* Top light bar */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                {/* Corner glow */}
                <div className="absolute -bottom-10 -right-10 w-20 h-20 bg-cyan-500/20 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Product Showcase Section */}
      <section className="py-12 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-orange-500/5 to-transparent" />
        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-8"
          >
            <div className="inline-flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-orange-400" />
              <span className="text-orange-400 text-xs uppercase tracking-widest">Showcase</span>
            </div>
            <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-2">
              产品案例展示
            </h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              开品宝已帮助众多企业完成产品设计，以下是部分案例
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {showcaseProducts.map((product, i) => (
              <motion.div
                key={product.title}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="group relative rounded-xl overflow-hidden aspect-[4/5] cursor-pointer"
              >
                <img 
                  src={product.image} 
                  alt={product.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-90 transition-opacity duration-300" />
                
                {/* Content */}
                <div className="absolute bottom-0 left-0 right-0 p-3 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                  <span className="text-[10px] text-cyan-400 uppercase tracking-wider">{product.category}</span>
                  <h4 className="text-sm font-semibold text-white">{product.title}</h4>
                </div>

                {/* Border glow on hover */}
                <div className="absolute inset-0 rounded-xl border border-transparent group-hover:border-orange-500/50 transition-colors duration-300" />
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
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-orange-400" />
              <span className="text-orange-400 text-xs uppercase tracking-widest">Target Audience</span>
            </div>
            <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-3">
              专为跨境电商打造
            </h3>
            <p className="text-sm text-muted-foreground max-w-lg mx-auto">
              开品宝是跨境开品的神器，让产品研发效率提升20倍
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="group relative p-6 rounded-2xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04] hover:border-cyan-500/20 transition-all duration-500 overflow-hidden"
            >
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-cyan-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <ShoppingCart className="w-6 h-6 text-cyan-400" />
                </div>
                <h4 className="text-xl font-bold mb-2 group-hover:text-cyan-400 transition-colors">跨境电商公司</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  快速验证市场机会，降低试错成本
                </p>
                <ul className="space-y-2 text-xs text-muted-foreground/70">
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
              className="group relative p-6 rounded-2xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04] hover:border-orange-500/20 transition-all duration-500 overflow-hidden"
            >
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-orange-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500/20 to-amber-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Factory className="w-6 h-6 text-orange-400" />
                </div>
                <h4 className="text-xl font-bold mb-2 group-hover:text-orange-400 transition-colors">外贸工厂</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  专业产品输出，提升开发效率
                </p>
                <ul className="space-y-2 text-xs text-muted-foreground/70">
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
      <footer className="border-t border-white/5 py-12 bg-[#080c14]">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <img src={logoImage} alt="开品宝" className="h-8" />
              <span className="font-semibold">开品宝</span>
              <span className="text-muted-foreground/60">— AI产品研发平台</span>
            </Link>
            <p className="text-sm text-muted-foreground/50">
              © 2025 开品宝. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
