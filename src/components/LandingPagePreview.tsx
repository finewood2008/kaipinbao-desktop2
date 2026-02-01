import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Mail, CheckCircle, Star, Shield, Truck, Play, Pause } from "lucide-react";
import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { getTemplateStyles, type TemplateStyle } from "./LandingPageTemplates";

interface LandingPagePreviewProps {
  title: string;
  subheadline?: string | null;
  heroImageUrl?: string | null;
  painPoints?: string[] | null;
  sellingPoints?: string[] | null;
  trustBadges?: string[] | null;
  marketingImages?: Record<string, string | string[]> | null;
  videoUrl?: string | null;
  ctaText?: string | null;
  targetAudience?: string;
  landingPageId?: string;
  isInteractive?: boolean;
  templateStyle?: TemplateStyle;
}

export function LandingPagePreview({
  title,
  subheadline,
  heroImageUrl,
  painPoints,
  sellingPoints,
  trustBadges,
  marketingImages,
  videoUrl,
  ctaText = "立即订阅",
  targetAudience,
  landingPageId,
  isInteractive = false,
  templateStyle = "modern",
}: LandingPagePreviewProps) {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
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

  const toggleVideo = () => {
    if (videoRef.current) {
      if (isVideoPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsVideoPlaying(!isVideoPlaying);
    }
  };

  // Get marketing images
  const lifestyleImage = typeof marketingImages?.lifestyle === 'string' ? marketingImages.lifestyle : null;
  const usageImage = typeof marketingImages?.usage === 'string' ? marketingImages.usage : null;
  const multiAngleImages = Array.isArray(marketingImages?.multiAngle) ? marketingImages.multiAngle : [];
  const detailImage = typeof marketingImages?.detail === 'string' ? marketingImages.detail : null;

  const isDarkTheme = styles.hero.isDark;

  return (
    <div className={cn("overflow-hidden rounded-lg", isDarkTheme ? "bg-slate-900 text-white" : "bg-white text-gray-900")}>
      {/* Hero Section */}
      <section className={cn("relative py-16 px-8 bg-gradient-to-br", styles.hero.gradient)}>
        <div className="max-w-4xl mx-auto text-center">
          {heroImageUrl && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <img
                src={heroImageUrl}
                alt={title}
                className="max-w-sm mx-auto rounded-2xl shadow-2xl"
              />
            </motion.div>
          )}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={cn(
              "text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r bg-clip-text text-transparent",
              styles.hero.titleGradient
            )}
          >
            {title}
          </motion.h1>
          {subheadline && (
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className={cn("text-xl mb-6 max-w-2xl mx-auto", styles.hero.subtitleColor)}
            >
              {subheadline}
            </motion.p>
          )}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={cn("text-lg max-w-2xl mx-auto", isDarkTheme ? "text-gray-400" : "text-gray-500")}
          >
            {targetAudience || "创新设计，为您带来全新体验"}
          </motion.p>
          
          {/* Hero CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-8"
          >
            <Button 
              size="lg" 
              className={cn(
                "px-8 py-6 text-lg bg-gradient-to-r hover:opacity-90 text-white",
                styles.cta.gradient
              )}
            >
              {ctaText}
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Pain Points Section */}
      {painPoints && painPoints.length > 0 && (
        <section className={cn("py-16 px-8", styles.painPoints.bg)}>
          <div className="max-w-4xl mx-auto">
            <h2 className={cn("text-2xl font-bold text-center mb-8", styles.painPoints.isDark ? "text-white" : "text-gray-800")}>
              😤 Sound Familiar?
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {painPoints.map((point, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={cn("p-6 rounded-xl shadow-sm border", styles.painPoints.cardBg, styles.painPoints.cardBorder)}
                >
                  <div className={cn("w-10 h-10 rounded-full flex items-center justify-center mb-4", styles.painPoints.iconBg)}>
                    <span className={cn("text-xl", styles.painPoints.iconColor)}>✕</span>
                  </div>
                  <p className={styles.painPoints.isDark ? "text-gray-200" : "text-gray-700"}>{point}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Lifestyle Image */}
      {lifestyleImage && (
        <section className={cn("py-16 px-8", isDarkTheme ? "bg-slate-800" : "bg-white")}>
          <div className="max-w-4xl mx-auto">
            <img
              src={lifestyleImage}
              alt="产品使用场景"
              className="w-full rounded-2xl shadow-lg"
            />
          </div>
        </section>
      )}

      {/* Selling Points Section */}
      {sellingPoints && sellingPoints.length > 0 && (
        <section className={cn("py-16 px-8", styles.solutions.bg)}>
          <div className="max-w-4xl mx-auto">
            <h2 className={cn("text-2xl font-bold text-center mb-8", styles.solutions.isDark ? "text-white" : "text-gray-800")}>
              ✨ Our Solution
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {sellingPoints.map((point, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={cn("p-6 rounded-xl shadow-sm border", styles.solutions.cardBg, styles.solutions.cardBorder)}
                >
                  <div className={cn("w-10 h-10 rounded-full flex items-center justify-center mb-4", styles.solutions.iconBg)}>
                    <CheckCircle className={cn("w-5 h-5", styles.solutions.iconColor)} />
                  </div>
                  <p className={styles.solutions.isDark ? "text-gray-200" : "text-gray-700"}>{point}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Usage Image */}
      {usageImage && (
        <section className={cn("py-16 px-8", isDarkTheme ? "bg-slate-900" : "bg-slate-50")}>
          <div className="max-w-4xl mx-auto">
            <h2 className={cn("text-2xl font-bold text-center mb-8", isDarkTheme ? "text-white" : "text-gray-800")}>
              🎯 Simple & Intuitive
            </h2>
            <img
              src={usageImage}
              alt="产品使用演示"
              className="w-full rounded-2xl shadow-lg"
            />
          </div>
        </section>
      )}

      {/* Video Section */}
      {videoUrl && (
        <section className={cn("py-16 px-8", styles.video.bg)}>
          <div className="max-w-4xl mx-auto">
            <h2 className={cn("text-2xl font-bold text-center mb-8", styles.video.titleColor)}>
              🎬 See It In Action
            </h2>
            <div className="relative rounded-2xl overflow-hidden shadow-2xl">
              <video
                ref={videoRef}
                src={videoUrl}
                className="w-full"
                loop
                playsInline
                onPlay={() => setIsVideoPlaying(true)}
                onPause={() => setIsVideoPlaying(false)}
              />
              <button
                onClick={toggleVideo}
                className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors"
              >
                {isVideoPlaying ? (
                  <Pause className="w-16 h-16 text-white" />
                ) : (
                  <Play className="w-16 h-16 text-white" />
                )}
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Multi-angle Gallery */}
      {(multiAngleImages.length > 0 || detailImage) && (
        <section className={cn("py-16 px-8", isDarkTheme ? "bg-slate-800" : "bg-slate-50")}>
          <div className="max-w-4xl mx-auto">
            <h2 className={cn("text-2xl font-bold text-center mb-8", isDarkTheme ? "text-white" : "text-gray-800")}>
              📸 Every Detail Matters
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {detailImage && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="aspect-square rounded-xl overflow-hidden shadow-md col-span-2"
                >
                  <img src={detailImage} alt="产品细节" className="w-full h-full object-cover" />
                </motion.div>
              )}
              {multiAngleImages.map((img, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className="aspect-square rounded-xl overflow-hidden shadow-md"
                >
                  <img src={img} alt={`产品角度 ${i + 1}`} className="w-full h-full object-cover" />
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Trust Badges */}
      {trustBadges && trustBadges.length > 0 && (
        <section className={cn("py-12 px-8 border-t border-b", isDarkTheme ? "border-slate-700" : "border-gray-100")}>
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-wrap justify-center gap-6">
              {trustBadges.map((badge, i) => (
                <div key={i} className={cn("flex items-center gap-2", isDarkTheme ? "text-gray-300" : "text-gray-600")}>
                  {i === 0 && <Shield className="w-5 h-5 text-blue-500" />}
                  {i === 1 && <Star className="w-5 h-5 text-yellow-500" />}
                  {i === 2 && <Truck className="w-5 h-5 text-green-500" />}
                  <span className="text-sm">{badge}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className={cn("py-16 px-8 bg-gradient-to-r text-white", styles.cta.gradient)}>
        <div className="max-w-lg mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h3 className="text-2xl font-bold mb-2">Get Early Access</h3>
            <p className="text-white/70 mb-6">Be the first to know when we launch</p>
            
            {isSubscribed ? (
              <div className="bg-white/20 backdrop-blur rounded-lg p-6">
                <CheckCircle className="w-12 h-12 text-green-300 mx-auto mb-3" />
                <p className="text-lg font-medium">You're In!</p>
                <p className="text-sm text-white/70">We'll notify you as soon as we launch</p>
              </div>
            ) : isInteractive ? (
              <div className="flex gap-2 max-w-sm mx-auto">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="flex-1 px-4 py-3 rounded-lg bg-white/20 backdrop-blur border border-white/30 placeholder-white/50 text-white focus:outline-none focus:ring-2 focus:ring-white/50"
                />
                <Button
                  onClick={handleSubmitEmail}
                  disabled={isSubmitting || !email.trim()}
                  className={cn("px-6", styles.cta.buttonBg, styles.cta.buttonText, "hover:opacity-90")}
                >
                  {isSubmitting ? "..." : ctaText || "订阅"}
                </Button>
              </div>
            ) : (
              <div className="flex gap-2 max-w-sm mx-auto">
                <div className="flex-1 px-4 py-3 rounded-lg bg-white/20 text-white/50 text-left">
                  your@email.com
                </div>
                <div className={cn("px-6 py-3 rounded-lg font-medium", styles.cta.buttonBg, styles.cta.buttonText)}>
                  {ctaText || "订阅"}
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className={cn("py-8 px-8 text-center text-sm", styles.footer.bg, "text-gray-400")}>
        <p>© 2024 {title}. 由开品宝提供技术支持</p>
      </footer>
    </div>
  );
}
