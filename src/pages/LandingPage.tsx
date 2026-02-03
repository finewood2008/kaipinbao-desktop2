import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Loader2, 
  Mail, 
  CheckCircle, 
  Shield, 
  Star, 
  Truck, 
  ChevronDown,
  Target,
  Zap,
  Award,
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getTemplateStyles, type TemplateStyle } from "@/components/LandingPageTemplates";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface MarketingImageWithCopy {
  id: string;
  image_url: string;
  image_type: string;
  marketing_copy?: string;
}

interface FaqItem {
  question: string;
  answer: string;
}

interface SocialProofItem {
  name: string;
  role: string;
  content: string;
}

interface LandingPageData {
  id: string;
  title: string;
  hero_image_url: string | null;
  pain_points: string[] | null;
  selling_points: string[] | null;
  trust_badges: string[] | null;
  subheadline: string | null;
  cta_text: string | null;
  video_url: string | null;
  marketing_images: Record<string, string | string[]> | null;
  marketing_images_with_copy: MarketingImageWithCopy[] | null;
  product_images: string[] | null;
  template_style: string | null;
  faq_items: FaqItem[] | null;
  specifications: string[] | null;
  usage_scenarios: string[] | null;
  social_proof_items: SocialProofItem[] | null;
  urgency_message: string | null;
}

export default function LandingPage() {
  const { slug } = useParams<{ slug: string }>();
  const [landingPage, setLandingPage] = useState<LandingPageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    fetchLandingPage();
  }, [slug]);

  const fetchLandingPage = async () => {
    if (!slug) return;

    const { data, error } = await supabase
      .from("landing_pages")
      .select("*")
      .eq("slug", slug)
      .eq("is_published", true)
      .single();

    if (error || !data) {
      setError("页面不存在或未发布");
    } else {
      setLandingPage(data as unknown as LandingPageData);
      // Increment view count
      await supabase
        .from("landing_pages")
        .update({ view_count: (data.view_count || 0) + 1 })
        .eq("id", data.id);
    }
    setIsLoading(false);
  };

  const handleSubmitEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !landingPage) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("email_submissions").insert({
        landing_page_id: landingPage.id,
        email: email.trim(),
      });

      if (error) {
        if (error.code === "23505") {
          toast.error("该邮箱已订阅");
        } else {
          throw error;
        }
      } else {
        setIsSubmitted(true);
        toast.success("订阅成功！");
      }
    } catch (error) {
      toast.error("提交失败，请重试");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getImageTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      scene: "📍 Scene",
      usage: "👆 Usage",
      structure: "🔧 Structure",
      detail: "🔍 Detail",
      lifestyle: "🌟 Lifestyle",
      multi_angle: "📐 Multi-Angle",
    };
    return labels[type] || "📸 Product";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error || !landingPage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">页面未找到</h1>
          <p className="text-gray-500">{error || "该落地页不存在或尚未发布"}</p>
        </div>
      </div>
    );
  }

  // Get template styles
  const templateStyle = (landingPage.template_style as TemplateStyle) || "modern";
  const styles = getTemplateStyles(templateStyle);
  const isDarkTheme = styles.hero.isDark;

  // Marketing images with copy
  const marketingImagesWithCopy = landingPage.marketing_images_with_copy || [];
  const faqItems = landingPage.faq_items || [];
  const specifications = landingPage.specifications || [];
  const usageScenarios = landingPage.usage_scenarios || [];
  const socialProofItems = landingPage.social_proof_items || [];

  return (
    <div className={cn("min-h-screen", isDarkTheme ? "bg-slate-900" : "bg-gradient-to-b from-gray-50 to-white")}>
      {/* Hero Section with Video Background */}
      <section className="relative min-h-screen overflow-hidden">
        {/* Video Background */}
        {landingPage.video_url && (
          <video
            ref={videoRef}
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          >
            <source src={landingPage.video_url} type="video/mp4" />
          </video>
        )}
        
        {/* Gradient Background (fallback or overlay) */}
        <div className={cn(
          "absolute inset-0",
          landingPage.video_url 
            ? "bg-black/60" 
            : `bg-gradient-to-br ${styles.hero.gradient}`
        )} />
        
        {/* Hero Content */}
        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-16 text-center">
          {landingPage.hero_image_url && !landingPage.video_url && (
            <motion.img
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              src={landingPage.hero_image_url}
              alt={landingPage.title}
              className="w-full max-w-lg mx-auto rounded-2xl shadow-2xl mb-8"
            />
          )}
          
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={cn(
              "text-4xl md:text-6xl lg:text-7xl font-bold mb-6 max-w-4xl",
              landingPage.video_url 
                ? "text-white" 
                : `bg-gradient-to-r bg-clip-text text-transparent ${styles.hero.titleGradient}`
            )}
          >
            {landingPage.title}
          </motion.h1>
          
          {landingPage.subheadline && (
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className={cn(
                "text-xl md:text-2xl mb-8 max-w-2xl",
                landingPage.video_url ? "text-white/90" : styles.hero.subtitleColor
              )}
            >
              {landingPage.subheadline}
            </motion.p>
          )}

          {/* Urgency Message */}
          {landingPage.urgency_message && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.25 }}
              className="mb-6 px-4 py-2 bg-red-500/90 text-white rounded-full text-sm font-medium"
            >
              🔥 {landingPage.urgency_message}
            </motion.div>
          )}
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Button 
              size="lg" 
              className={cn(
                "px-10 py-7 text-lg font-semibold bg-gradient-to-r hover:opacity-90 text-white shadow-xl",
                styles.cta.gradient
              )}
            >
              {landingPage.cta_text || "Get Early Access"}
            </Button>
          </motion.div>

          {/* Scroll Indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, y: [0, 10, 0] }}
            transition={{ delay: 1, duration: 2, repeat: Infinity }}
            className="absolute bottom-8"
          >
            <ChevronDown className={cn("w-8 h-8", landingPage.video_url ? "text-white/60" : "text-gray-400")} />
          </motion.div>
        </div>
      </section>

      {/* Pain Points */}
      {landingPage.pain_points && landingPage.pain_points.length > 0 && (
        <section className={cn("py-20 px-4", styles.painPoints.bg)}>
          <div className="max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className={cn("text-3xl md:text-4xl font-bold mb-4", styles.painPoints.isDark ? "text-white" : "text-gray-800")}>
                😤 Sound Familiar?
              </h2>
              <p className={cn("text-lg", isDarkTheme ? "text-gray-400" : "text-gray-600")}>
                We understand your frustrations
              </p>
            </motion.div>
            <div className="grid md:grid-cols-3 gap-8">
              {(landingPage.pain_points as string[]).map((point, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className={cn("p-8 rounded-2xl shadow-lg border", styles.painPoints.cardBg, styles.painPoints.cardBorder)}
                >
                  <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-6", styles.painPoints.iconBg)}>
                    <span className={cn("text-2xl", styles.painPoints.iconColor)}>✕</span>
                  </div>
                  <p className={cn("text-lg", styles.painPoints.isDark ? "text-gray-200" : "text-gray-700")}>{point}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Marketing Images with Copy Section */}
      {marketingImagesWithCopy.length > 0 && (
        <section className={cn("py-20 px-4", isDarkTheme ? "bg-slate-800" : "bg-white")}>
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className={cn("text-3xl md:text-4xl font-bold mb-4", isDarkTheme ? "text-white" : "text-gray-800")}>
                ✨ Product Highlights
              </h2>
              <p className={cn("text-lg", isDarkTheme ? "text-gray-400" : "text-gray-600")}>
                Discover what makes us different
              </p>
            </motion.div>
            <div className="grid md:grid-cols-2 gap-8">
              {marketingImagesWithCopy.map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className={cn(
                    "rounded-2xl overflow-hidden shadow-xl border",
                    isDarkTheme ? "bg-slate-700/50 border-slate-600" : "bg-white border-gray-100"
                  )}
                >
                  <div className="aspect-[16/10] relative overflow-hidden">
                    <img
                      src={item.image_url}
                      alt={item.image_type}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-6">
                    <span className={cn(
                      "inline-block px-3 py-1 rounded-full text-xs font-medium mb-3",
                      isDarkTheme ? "bg-slate-600 text-gray-300" : "bg-gray-100 text-gray-600"
                    )}>
                      {getImageTypeLabel(item.image_type)}
                    </span>
                    {item.marketing_copy && (
                      <p className={cn(
                        "text-lg leading-relaxed",
                        isDarkTheme ? "text-gray-200" : "text-gray-700"
                      )}>
                        "{item.marketing_copy}"
                      </p>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Selling Points */}
      {landingPage.selling_points && landingPage.selling_points.length > 0 && (
        <section className={cn("py-20 px-4", styles.solutions.bg)}>
          <div className="max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className={cn("text-3xl md:text-4xl font-bold mb-4", styles.solutions.isDark ? "text-white" : "text-gray-800")}>
                ✨ The Solution You've Been Waiting For
              </h2>
            </motion.div>
            <div className="grid md:grid-cols-3 gap-8">
              {(landingPage.selling_points as string[]).map((point, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className={cn("p-8 rounded-2xl shadow-lg border", styles.solutions.cardBg, styles.solutions.cardBorder)}
                >
                  <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-6", styles.solutions.iconBg)}>
                    <CheckCircle className={cn("w-7 h-7", styles.solutions.iconColor)} />
                  </div>
                  <p className={cn("text-lg", styles.solutions.isDark ? "text-gray-200" : "text-gray-700")}>{point}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Usage Scenarios Section */}
      {usageScenarios.length > 0 && (
        <section className={cn("py-20 px-4", isDarkTheme ? "bg-slate-900" : "bg-gray-50")}>
          <div className="max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className={cn("text-3xl md:text-4xl font-bold mb-4", isDarkTheme ? "text-white" : "text-gray-800")}>
                🎯 Perfect For Every Scenario
              </h2>
            </motion.div>
            <div className="grid md:grid-cols-2 gap-6">
              {usageScenarios.map((scenario, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className={cn(
                    "flex items-center gap-4 p-6 rounded-xl",
                    isDarkTheme ? "bg-slate-800" : "bg-white shadow-md"
                  )}
                >
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0",
                    isDarkTheme ? "bg-cyan-500/20" : "bg-blue-100"
                  )}>
                    <Target className={cn("w-6 h-6", isDarkTheme ? "text-cyan-400" : "text-blue-600")} />
                  </div>
                  <p className={isDarkTheme ? "text-gray-200" : "text-gray-700"}>{scenario}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Specifications Section */}
      {specifications.length > 0 && (
        <section className={cn("py-20 px-4", isDarkTheme ? "bg-slate-800" : "bg-white")}>
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className={cn("text-3xl md:text-4xl font-bold mb-4", isDarkTheme ? "text-white" : "text-gray-800")}>
                ⚡ Key Features
              </h2>
            </motion.div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {specifications.map((spec, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className={cn(
                    "flex items-center gap-3 p-4 rounded-lg",
                    isDarkTheme ? "bg-slate-700" : "bg-gray-50"
                  )}
                >
                  <Zap className={cn("w-5 h-5 flex-shrink-0", isDarkTheme ? "text-cyan-400" : "text-blue-600")} />
                  <span className={isDarkTheme ? "text-gray-200" : "text-gray-700"}>{spec}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Social Proof Section */}
      {socialProofItems.length > 0 && (
        <section className={cn("py-20 px-4", isDarkTheme ? "bg-slate-900" : "bg-gray-50")}>
          <div className="max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className={cn("text-3xl md:text-4xl font-bold mb-4", isDarkTheme ? "text-white" : "text-gray-800")}>
                ⭐ What Early Adopters Say
              </h2>
            </motion.div>
            <div className="grid md:grid-cols-3 gap-6">
              {socialProofItems.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className={cn(
                    "p-6 rounded-2xl",
                    isDarkTheme ? "bg-slate-800" : "bg-white shadow-lg"
                  )}
                >
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(5)].map((_, j) => (
                      <Star key={j} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className={cn("mb-4 italic", isDarkTheme ? "text-gray-300" : "text-gray-600")}>
                    "{item.content}"
                  </p>
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center font-semibold",
                      isDarkTheme ? "bg-slate-700 text-gray-300" : "bg-gray-200 text-gray-600"
                    )}>
                      {item.name.charAt(0)}
                    </div>
                    <div>
                      <p className={cn("font-medium", isDarkTheme ? "text-white" : "text-gray-800")}>{item.name}</p>
                      <p className={cn("text-sm", isDarkTheme ? "text-gray-400" : "text-gray-500")}>{item.role}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FAQ Section */}
      {faqItems.length > 0 && (
        <section className={cn("py-20 px-4", isDarkTheme ? "bg-slate-800" : "bg-white")}>
          <div className="max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className={cn("text-3xl md:text-4xl font-bold mb-4", isDarkTheme ? "text-white" : "text-gray-800")}>
                ❓ Frequently Asked Questions
              </h2>
            </motion.div>
            <Accordion type="single" collapsible className="space-y-4">
              {faqItems.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <AccordionItem
                    value={`item-${i}`}
                    className={cn(
                      "rounded-xl px-6 border",
                      isDarkTheme ? "bg-slate-700 border-slate-600" : "bg-gray-50 border-gray-200"
                    )}
                  >
                    <AccordionTrigger className={cn(
                      "text-left font-medium",
                      isDarkTheme ? "text-white" : "text-gray-800"
                    )}>
                      {item.question}
                    </AccordionTrigger>
                    <AccordionContent className={isDarkTheme ? "text-gray-300" : "text-gray-600"}>
                      {item.answer}
                    </AccordionContent>
                  </AccordionItem>
                </motion.div>
              ))}
            </Accordion>
          </div>
        </section>
      )}

      {/* Trust Badges */}
      {landingPage.trust_badges && landingPage.trust_badges.length > 0 && (
        <section className={cn("py-12 px-4", isDarkTheme ? "bg-slate-800" : "bg-white")}>
          <div className="max-w-4xl mx-auto">
            <div className="flex justify-center gap-8 flex-wrap">
              {(landingPage.trust_badges as string[]).map((badge, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-full",
                    isDarkTheme ? "bg-slate-700 text-gray-300" : "bg-gray-100 text-gray-600"
                  )}
                >
                  {i === 0 && <Shield className="w-4 h-4 text-blue-500" />}
                  {i === 1 && <Award className="w-4 h-4 text-yellow-500" />}
                  {i === 2 && <Truck className="w-4 h-4 text-green-500" />}
                  <span className="text-sm font-medium">{badge}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className={cn("py-24 px-4", isDarkTheme ? "bg-slate-900" : "bg-white")}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className={cn("max-w-xl mx-auto bg-gradient-to-r rounded-3xl p-10 text-center text-white shadow-2xl", styles.cta.gradient)}
        >
          {isSubmitted ? (
            <div className="py-6">
              <CheckCircle className="w-20 h-20 mx-auto mb-6 text-green-300" />
              <h3 className="text-3xl font-bold mb-3">You're In!</h3>
              <p className="opacity-90 text-lg">We'll notify you as soon as we launch</p>
            </div>
          ) : (
            <>
              <Sparkles className="w-12 h-12 mx-auto mb-6 opacity-80" />
              <h3 className="text-3xl font-bold mb-3">Get Early Access</h3>
              <p className="opacity-90 mb-8 text-lg">Be the first to experience the future</p>
              <form onSubmit={handleSubmitEmail} className="space-y-4">
                <div className="flex gap-3">
                  <Input
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-white/20 border-white/30 text-white placeholder:text-white/60 focus:bg-white/30 text-lg py-6"
                  />
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className={cn("shrink-0 px-8 h-auto", styles.cta.buttonBg, styles.cta.buttonText, "hover:opacity-90")}
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      landingPage.cta_text || "Subscribe"
                    )}
                  </Button>
                </div>
                <p className="text-sm text-white/60">
                  🔒 We respect your privacy. Unsubscribe anytime.
                </p>
              </form>
            </>
          )}
        </motion.div>
      </section>

      {/* Footer */}
      <footer className={cn("py-8 text-center text-sm", styles.footer.bg, "text-gray-400")}>
        <p>Powered by 开品宝</p>
      </footer>
    </div>
  );
}
