import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Sparkles, ArrowRight, MessageSquare, Palette, Rocket, Loader2 } from "lucide-react";

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

  return (
    <div className="min-h-screen bg-gradient-dark overflow-hidden">
      {/* Hero Section */}
      <div className="relative">
        {/* Background glow effects */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute top-20 right-1/4 w-64 h-64 bg-accent/20 rounded-full blur-3xl" />

        <div className="container mx-auto px-4 py-20 relative z-10">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-3 mb-16"
          >
            <div className="w-14 h-14 rounded-2xl bg-gradient-primary flex items-center justify-center glow-primary">
              <Sparkles className="w-7 h-7 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold text-gradient">开品宝</span>
          </motion.div>

          {/* Headline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-center max-w-4xl mx-auto"
          >
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              <span className="text-gradient">AI驱动</span>
              <br />
              产品研发专家
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              面向跨境卖家/工厂的智能研发工具
              <br />
              从创意到市场测试，一站式完成
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-gradient-primary glow-primary text-lg px-8"
                onClick={() => navigate("/auth")}
              >
                立即开始 <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-8"
                onClick={() => navigate("/auth")}
              >
                了解更多
              </Button>
            </div>
          </motion.div>

          {/* Features */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid md:grid-cols-3 gap-6 mt-20"
          >
            {[
              {
                icon: MessageSquare,
                title: "阶段一：PRD细化",
                description: "AI通过对话挖掘产品细节，自动生成专业的产品定义文档",
                color: "from-primary to-primary/50",
              },
              {
                icon: Palette,
                title: "阶段二：视觉生成",
                description: "基于PRD生成产品渲染图，支持反复迭代直到满意",
                color: "from-stage-2 to-stage-2/50",
              },
              {
                icon: Rocket,
                title: "阶段三：营销落地",
                description: "一键生成营销落地页并发布，收集用户反馈验证市场",
                color: "from-stage-3 to-stage-3/50",
              },
            ].map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + i * 0.1 }}
                className="glass rounded-2xl p-6 hover:glow-card transition-all duration-300"
              >
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4`}
                >
                  <feature.icon className="w-6 h-6 text-primary-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8 mt-20">
        <div className="container mx-auto px-4 text-center text-muted-foreground text-sm">
          <p>© 2024 开品宝. AI驱动产品研发专家</p>
        </div>
      </footer>
    </div>
  );
}
