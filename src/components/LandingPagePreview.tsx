import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { 
  Mail, 
  CheckCircle, 
  Star, 
  Shield, 
  Truck, 
  Play, 
  Pause, 
  ChevronDown,
  Sparkles,
  Zap,
  Target,
  Award
} from "lucide-react";
import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { getTemplateStyles, type TemplateStyle } from "./LandingPageTemplates";
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
  avatar?: string;
}

interface LandingPagePreviewProps {
  title: string;
  subheadline?: string | null;
  heroImageUrl?: string | null;
  painPoints?: string[] | null;
  sellingPoints?: string[] | null;
  trustBadges?: string[] | null;
  marketingImages?: Record<string, string | string[]> | null;
  marketingImagesWithCopy?: MarketingImageWithCopy[] | null;
  videoUrl?: string | null;
  ctaText?: string | null;
  targetAudience?: string;
  landingPageId?: string;
  isInteractive?: boolean;
  templateStyle?: TemplateStyle;
  faqItems?: FaqItem[] | null;
  specifications?: string[] | null;
  usageScenarios?: string[] | null;
  socialProofItems?: SocialProofItem[] | null;
  urgencyMessage?: string | null;
}

export function LandingPagePreview({
  title,
  subheadline,
  heroImageUrl,
  painPoints,
  sellingPoints,
  trustBadges,
  marketingImages,
  marketingImagesWithCopy,
  videoUrl,
  ctaText = "Get Early Access",
  targetAudience,
  landingPageId,
  isInteractive = false,
  templateStyle = "modern",
  faqItems,
  specifications,
  usageScenarios,
  socialProofItems,
  urgencyMessage,
}: LandingPagePreviewProps) {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const styles = getTemplateStyles(templateStyle);

  const handleSubmitEmail = async () => {
    if (!email.trim() || !landingPageId) return;
    
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("email_submissions")
        .insert({
          landing_page_id: landingPageId,
          email: email.trim(),
        });

      if (error) throw error;

      setIsSubscribed(true);
      toast.success("订阅成功！我们会第一时间通知您");
    } catch (error) {
      toast.error("订阅失败，请重试");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isDarkTheme = styles.hero.isDark;

  // Get image type label
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

  return (
    <div className={cn("overflow-hidden rounded-lg", isDarkTheme ? "bg-slate-900 text-white" : "bg-white text-gray-900")}>
      {/* Hero Section with Video Background */}
      <section className="relative min-h-[80vh] overflow-hidden">
        {/* Video Background */}
        {videoUrl && (
          <video
            ref={videoRef}
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          >
            <source src={videoUrl} type="video/mp4" />
          </video>
        )}
        
        {/* Gradient Background (fallback or overlay) */}
        <div className={cn(
          "absolute inset-0",
          videoUrl 
            ? "bg-black/60" 
            : `bg-gradient-to-br ${styles.hero.gradient}`
        )} />
        
        {/* Hero Content */}
        <div className="relative z-10 flex flex-col items-center justify-center min-h-[80vh] px-8 py-16 text-center">
          {heroImageUrl && !videoUrl && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <img
                src={heroImageUrl}
                alt={title}
                className="max-w-md mx-auto rounded-2xl shadow-2xl"
              />
            </motion.div>
          )}
          
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={cn(
              "text-4xl md:text-6xl lg:text-7xl font-bold mb-6 max-w-4xl",
              videoUrl 
                ? "text-white" 
                : `bg-gradient-to-r bg-clip-text text-transparent ${styles.hero.titleGradient}`
            )}
          >
            {title}
          </motion.h1>
          
          {subheadline && (
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className={cn(
                "text-xl md:text-2xl mb-8 max-w-2xl",
                videoUrl ? "text-white/90" : styles.hero.subtitleColor
              )}
            >
              {subheadline}
            </motion.p>
          )}

          {/* Urgency Message */}
          {urgencyMessage && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.25 }}
              className="mb-6 px-4 py-2 bg-red-500/90 text-white rounded-full text-sm font-medium"
            >
              🔥 {urgencyMessage}
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
              {ctaText}
            </Button>
          </motion.div>

          {/* Scroll Indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, y: [0, 10, 0] }}
            transition={{ delay: 1, duration: 2, repeat: Infinity }}
            className="absolute bottom-8"
          >
            <ChevronDown className={cn("w-8 h-8", videoUrl ? "text-white/60" : "text-gray-400")} />
          </motion.div>
        </div>
      </section>

      {/* Pain Points Section */}
      {painPoints && painPoints.length > 0 && (
        <section className={cn("py-20 px-8", styles.painPoints.bg)}>
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
              {painPoints.map((point, i) => (
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
      {marketingImagesWithCopy && marketingImagesWithCopy.length > 0 && (
        <section className={cn("py-20 px-8", isDarkTheme ? "bg-slate-800" : "bg-white")}>
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

      {/* Selling Points / Solution Section */}
      {sellingPoints && sellingPoints.length > 0 && (
        <section className={cn("py-20 px-8", styles.solutions.bg)}>
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
              <p className={cn("text-lg", isDarkTheme ? "text-gray-400" : "text-gray-600")}>
                Built to address your real needs
              </p>
            </motion.div>
            <div className="grid md:grid-cols-3 gap-8">
              {sellingPoints.map((point, i) => (
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
      {usageScenarios && usageScenarios.length > 0 && (
        <section className={cn("py-20 px-8", isDarkTheme ? "bg-slate-900" : "bg-gray-50")}>
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
      {specifications && specifications.length > 0 && (
        <section className={cn("py-20 px-8", isDarkTheme ? "bg-slate-800" : "bg-white")}>
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
      {socialProofItems && socialProofItems.length > 0 && (
        <section className={cn("py-20 px-8", isDarkTheme ? "bg-slate-900" : "bg-gray-50")}>
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
      {faqItems && faqItems.length > 0 && (
        <section className={cn("py-20 px-8", isDarkTheme ? "bg-slate-800" : "bg-white")}>
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
      {trustBadges && trustBadges.length > 0 && (
        <section className={cn("py-12 px-8 border-t border-b", isDarkTheme ? "border-slate-700" : "border-gray-100")}>
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-wrap justify-center gap-8">
              {trustBadges.map((badge, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className={cn("flex items-center gap-2", isDarkTheme ? "text-gray-300" : "text-gray-600")}
                >
                  {i === 0 && <Shield className="w-5 h-5 text-blue-500" />}
                  {i === 1 && <Award className="w-5 h-5 text-yellow-500" />}
                  {i === 2 && <Truck className="w-5 h-5 text-green-500" />}
                  <span className="text-sm font-medium">{badge}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Final CTA Section */}
      <section className={cn("py-24 px-8 bg-gradient-to-r text-white", styles.cta.gradient)}>
        <div className="max-w-lg mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Sparkles className="w-12 h-12 mx-auto mb-6 opacity-80" />
            <h3 className="text-3xl md:text-4xl font-bold mb-4">Get Early Access</h3>
            <p className="text-white/80 mb-8 text-lg">
              Be the first to experience the future. Limited spots available.
            </p>
            
            {isSubscribed ? (
              <div className="bg-white/20 backdrop-blur rounded-2xl p-8">
                <CheckCircle className="w-16 h-16 text-green-300 mx-auto mb-4" />
                <p className="text-xl font-semibold">You're In!</p>
                <p className="text-white/70 mt-2">We'll notify you as soon as we launch</p>
              </div>
            ) : isInteractive ? (
              <div className="space-y-4">
                <div className="flex gap-3 max-w-md mx-auto">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="flex-1 px-5 py-4 rounded-xl bg-white/20 backdrop-blur border border-white/30 placeholder-white/50 text-white focus:outline-none focus:ring-2 focus:ring-white/50 text-lg"
                  />
                  <Button
                    onClick={handleSubmitEmail}
                    disabled={isSubmitting || !email.trim()}
                    className={cn("px-8 py-4 text-lg h-auto", styles.cta.buttonBg, styles.cta.buttonText, "hover:opacity-90")}
                  >
                    {isSubmitting ? "..." : ctaText || "Subscribe"}
                  </Button>
                </div>
                <p className="text-white/60 text-sm">
                  🔒 We respect your privacy. Unsubscribe anytime.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex gap-3 max-w-md mx-auto">
                  <div className="flex-1 px-5 py-4 rounded-xl bg-white/20 text-white/50 text-left text-lg">
                    your@email.com
                  </div>
                  <div className={cn("px-8 py-4 rounded-xl font-semibold text-lg", styles.cta.buttonBg, styles.cta.buttonText)}>
                    {ctaText || "Subscribe"}
                  </div>
                </div>
                <p className="text-white/60 text-sm">
                  🔒 We respect your privacy. Unsubscribe anytime.
                </p>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className={cn("py-8 px-8 text-center text-sm", styles.footer.bg, "text-gray-400")}>
        <p>© 2024 {title}. Powered by 开品宝</p>
      </footer>
    </div>
  );
}
