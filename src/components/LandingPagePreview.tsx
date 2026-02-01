import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Mail, CheckCircle, Star, Shield, Truck } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface LandingPagePreviewProps {
  title: string;
  heroImageUrl?: string | null;
  painPoints?: string[] | null;
  sellingPoints?: string[] | null;
  trustBadges?: string[] | null;
  marketingImages?: {
    lifestyle?: string;
    multiAngle?: string[];
    usage?: string;
  };
  targetAudience?: string;
  landingPageId?: string;
  isInteractive?: boolean;
}

export function LandingPagePreview({
  title,
  heroImageUrl,
  painPoints,
  sellingPoints,
  trustBadges,
  marketingImages,
  targetAudience,
  landingPageId,
  isInteractive = false,
}: LandingPagePreviewProps) {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

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

  return (
    <div className="bg-white text-gray-900 overflow-hidden rounded-lg">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-slate-50 to-slate-100 py-16 px-8">
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
            className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent"
          >
            {title}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-gray-600 max-w-2xl mx-auto"
          >
            {targetAudience || "创新设计，为您带来全新体验"}
          </motion.p>
        </div>
      </section>

      {/* Pain Points Section */}
      {painPoints && painPoints.length > 0 && (
        <section className="py-16 px-8 bg-red-50">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-8 text-gray-800">
              😤 这些问题，你一定遇到过
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {painPoints.map((point, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white p-6 rounded-xl shadow-sm border border-red-100"
                >
                  <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center mb-4">
                    <span className="text-red-500 text-xl">✕</span>
                  </div>
                  <p className="text-gray-700">{point}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Lifestyle Image */}
      {marketingImages?.lifestyle && (
        <section className="py-16 px-8">
          <div className="max-w-4xl mx-auto">
            <img
              src={marketingImages.lifestyle}
              alt="产品使用场景"
              className="w-full rounded-2xl shadow-lg"
            />
          </div>
        </section>
      )}

      {/* Selling Points Section */}
      {sellingPoints && sellingPoints.length > 0 && (
        <section className="py-16 px-8 bg-gradient-to-br from-green-50 to-emerald-50">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-8 text-gray-800">
              ✨ 我们的解决方案
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {sellingPoints.map((point, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white p-6 rounded-xl shadow-sm border border-green-100"
                >
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mb-4">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  </div>
                  <p className="text-gray-700">{point}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Multi-angle Gallery */}
      {marketingImages?.multiAngle && marketingImages.multiAngle.length > 0 && (
        <section className="py-16 px-8 bg-slate-50">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-8 text-gray-800">
              📸 产品细节展示
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {marketingImages.multiAngle.map((img, i) => (
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
        <section className="py-12 px-8 border-t border-b border-gray-100">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-wrap justify-center gap-6">
              {trustBadges.map((badge, i) => (
                <div key={i} className="flex items-center gap-2 text-gray-600">
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
      <section className="py-16 px-8 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-lg mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h3 className="text-2xl font-bold mb-2">抢先体验</h3>
            <p className="text-blue-100 mb-6">留下邮箱，第一时间获取产品动态</p>
            
            {isSubscribed ? (
              <div className="bg-white/20 backdrop-blur rounded-lg p-6">
                <CheckCircle className="w-12 h-12 text-green-300 mx-auto mb-3" />
                <p className="text-lg font-medium">感谢订阅！</p>
                <p className="text-sm text-blue-100">我们会第一时间通知您</p>
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
                  className="bg-white text-blue-600 hover:bg-blue-50 px-6"
                >
                  {isSubmitting ? "..." : "订阅"}
                </Button>
              </div>
            ) : (
              <div className="flex gap-2 max-w-sm mx-auto">
                <div className="flex-1 px-4 py-3 rounded-lg bg-white/20 text-white/50 text-left">
                  your@email.com
                </div>
                <div className="bg-white text-blue-600 px-6 py-3 rounded-lg font-medium">
                  订阅
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-8 bg-gray-900 text-gray-400 text-center text-sm">
        <p>© 2024 {title}. 由开品宝提供技术支持</p>
      </footer>
    </div>
  );
}
