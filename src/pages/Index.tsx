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
  Rocket
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
    { value: "20m", label: "极速设计", icon: Zap },
    { value: "90%", label: "降低成本", icon: TrendingDown },
    { value: "20x", label: "效率提升", icon: Rocket },
  ];

  return (
    <div className="min-h-screen bg-gradient-dark overflow-hidden">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/30">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logoImage} alt="开品宝" className="h-10" />
            <span className="text-xl font-bold text-foreground">开品宝</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => navigate("/auth")}>
              登录
            </Button>
            <Button className="bg-gradient-primary glow-primary" onClick={() => navigate("/auth")}>
              注册
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20">
        {/* Background glow effects */}
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute top-40 right-1/4 w-64 h-64 bg-accent/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/10 rounded-full blur-3xl" />

        <div className="container mx-auto px-4 relative z-10">
          {/* Top tag */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-center mb-8"
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-sm text-muted-foreground">
              ✨ AI 产品研发平台
            </span>
          </motion.div>

          {/* Main headline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-center max-w-4xl mx-auto"
          >
            <h1 className="text-5xl md:text-7xl font-bold mb-4">
              开品宝
            </h1>
            <h2 className="text-3xl md:text-5xl font-bold text-gradient mb-6">
              您的第二开发部
            </h2>
            <p className="text-lg text-muted-foreground mb-4">
              市场调研 · 竞品分析 · 产品设计 · ID生成 · 落地页
            </p>
            <p className="text-xl text-foreground/80 mb-10">
              开品从来没有这么简单
            </p>

            {/* CTA Button */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Button
                size="lg"
                className="bg-gradient-primary glow-primary text-lg px-10 py-6 h-auto"
                onClick={() => navigate("/auth")}
              >
                开始使用 <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </motion.div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap justify-center gap-6 md:gap-12 mt-16"
          >
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + i * 0.1 }}
                className="flex flex-col items-center p-6 rounded-2xl glass min-w-[140px]"
              >
                <stat.icon className="w-6 h-6 text-primary mb-2" />
                <span className="text-3xl md:text-4xl font-bold text-gradient">{stat.value}</span>
                <span className="text-sm text-muted-foreground mt-1">{stat.label}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 relative">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h3 className="text-3xl md:text-4xl font-bold mb-4">
              💡 核心能力
            </h3>
            <p className="text-muted-foreground">
              五大AI能力，助您高效完成产品研发全流程
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-6 rounded-2xl glass hover:glow-card transition-all duration-300 group"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-6 h-6 text-primary-foreground" />
                </div>
                <h4 className="text-lg font-semibold mb-2">{feature.title}</h4>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Target Audience Section */}
      <section className="py-20 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h3 className="text-3xl md:text-4xl font-bold mb-4">
              🎯 专为电商打造
            </h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              面向跨境电商公司与外贸工厂的一站式产品研发解决方案
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="p-8 rounded-2xl glass hover:glow-card transition-all duration-300"
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-primary flex items-center justify-center mb-6">
                <ShoppingCart className="w-7 h-7 text-primary-foreground" />
              </div>
              <h4 className="text-2xl font-bold mb-3">电商公司</h4>
              <p className="text-muted-foreground mb-4">
                快速验证市场机会，降低试错成本
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  快速生成产品方案
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  AI驱动市场分析
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  一键生成营销素材
                </li>
              </ul>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="p-8 rounded-2xl glass hover:glow-card transition-all duration-300"
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-accent flex items-center justify-center mb-6">
                <Factory className="w-7 h-7 text-accent-foreground" />
              </div>
              <h4 className="text-2xl font-bold mb-3">外贸工厂</h4>
              <p className="text-muted-foreground mb-4">
                专业产品输出，提升开发效率
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                  专业PRD文档生成
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                  产品渲染图自动生成
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                  降低研发沟通成本
                </li>
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <img src={logoImage} alt="开品宝" className="h-8" />
              <span className="font-semibold">开品宝</span>
              <span className="text-muted-foreground">- AI产品研发平台</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2025 开品宝. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
