import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Mail, CheckCircle, Shield, Star, Truck, Play, Pause } from "lucide-react";

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
  product_images: string[] | null;
}

export default function LandingPage() {
  const { slug } = useParams<{ slug: string }>();
  const [landingPage, setLandingPage] = useState<LandingPageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
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

  // Get marketing images
  const lifestyleImage = typeof landingPage.marketing_images?.lifestyle === 'string' ? landingPage.marketing_images.lifestyle : null;
  const usageImage = typeof landingPage.marketing_images?.usage === 'string' ? landingPage.marketing_images.usage : null;
  const detailImage = typeof landingPage.marketing_images?.detail === 'string' ? landingPage.marketing_images.detail : null;
  const multiAngleImages = Array.isArray(landingPage.marketing_images?.multiAngle) ? landingPage.marketing_images.multiAngle : [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <section className="pt-16 pb-12 px-4 bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="max-w-4xl mx-auto text-center">
          {landingPage.hero_image_url && (
            <motion.img
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              src={landingPage.hero_image_url}
              alt={landingPage.title}
              className="w-full max-w-lg mx-auto rounded-2xl shadow-2xl mb-8"
            />
          )}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold text-gray-900 mb-4"
          >
            {landingPage.title}
          </motion.h1>
          {landingPage.subheadline && (
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="text-xl text-gray-600 mb-6 max-w-2xl mx-auto"
            >
              {landingPage.subheadline}
            </motion.p>
          )}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90 text-white px-8 py-6 text-lg">
              {landingPage.cta_text || "立即订阅"}
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Pain Points */}
      {landingPage.pain_points && landingPage.pain_points.length > 0 && (
        <section className="py-16 px-4 bg-red-50/50">
          <div className="max-w-4xl mx-auto">
            <motion.h2
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              className="text-2xl font-bold text-center text-gray-800 mb-8"
            >
              😤 您是否遇到这些问题？
            </motion.h2>
            <div className="grid md:grid-cols-3 gap-6">
              {(landingPage.pain_points as string[]).map((point, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-start gap-3 bg-white p-6 rounded-xl shadow-sm border border-red-100"
                >
                  <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
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
      {lifestyleImage && (
        <section className="py-16 px-4">
          <div className="max-w-4xl mx-auto">
            <img
              src={lifestyleImage}
              alt="产品使用场景"
              className="w-full rounded-2xl shadow-lg"
            />
          </div>
        </section>
      )}

      {/* Selling Points */}
      {landingPage.selling_points && landingPage.selling_points.length > 0 && (
        <section className="py-16 px-4 bg-gradient-to-br from-green-50 to-emerald-50">
          <div className="max-w-4xl mx-auto">
            <motion.h2
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              className="text-2xl font-bold text-center text-gray-800 mb-8"
            >
              ✨ 我们的解决方案
            </motion.h2>
            <div className="grid md:grid-cols-3 gap-6">
              {(landingPage.selling_points as string[]).map((point, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-start gap-3 bg-white p-6 rounded-xl shadow-sm border border-green-100"
                >
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  </div>
                  <p className="text-gray-700">{point}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Usage Image */}
      {usageImage && (
        <section className="py-16 px-4 bg-slate-50">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-center text-gray-800 mb-8">🎯 简单易用</h2>
            <img
              src={usageImage}
              alt="产品使用演示"
              className="w-full rounded-2xl shadow-lg"
            />
          </div>
        </section>
      )}

      {/* Video Section */}
      {landingPage.video_url && (
        <section className="py-16 px-4 bg-gray-900">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-center text-white mb-8">🎬 产品展示</h2>
            <div className="relative rounded-2xl overflow-hidden shadow-2xl">
              <video
                ref={videoRef}
                src={landingPage.video_url}
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

      {/* Gallery */}
      {(multiAngleImages.length > 0 || detailImage) && (
        <section className="py-16 px-4 bg-slate-50">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-center text-gray-800 mb-8">📸 产品细节展示</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {detailImage && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  className="aspect-square rounded-xl overflow-hidden shadow-md col-span-2"
                >
                  <img src={detailImage} alt="产品细节" className="w-full h-full object-cover" />
                </motion.div>
              )}
              {multiAngleImages.map((img, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
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
      {landingPage.trust_badges && landingPage.trust_badges.length > 0 && (
        <section className="py-8 px-4">
          <div className="max-w-3xl mx-auto">
            <div className="flex justify-center gap-6 flex-wrap">
              {(landingPage.trust_badges as string[]).map((badge, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-center gap-2 text-gray-600 bg-gray-100 px-4 py-2 rounded-full"
                >
                  {i === 0 && <Shield className="w-4 h-4 text-blue-500" />}
                  {i === 1 && <Star className="w-4 h-4 text-yellow-500" />}
                  {i === 2 && <Truck className="w-4 h-4 text-green-500" />}
                  <span className="text-sm">{badge}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-16 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="max-w-xl mx-auto bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-center text-white shadow-xl"
        >
          {isSubmitted ? (
            <div className="py-4">
              <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-300" />
              <h3 className="text-2xl font-bold mb-2">订阅成功！</h3>
              <p className="opacity-90">我们会在产品发布时第一时间通知您</p>
            </div>
          ) : (
            <>
              <Mail className="w-12 h-12 mx-auto mb-4 opacity-80" />
              <h3 className="text-2xl font-bold mb-2">抢先体验</h3>
              <p className="opacity-90 mb-6">留下邮箱，第一时间获取产品动态和独家优惠</p>
              <form onSubmit={handleSubmitEmail} className="flex gap-2">
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-white/20 border-white/30 text-white placeholder:text-white/60 focus:bg-white/30"
                />
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-white text-blue-600 hover:bg-gray-100 shrink-0"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    landingPage.cta_text || "订阅"
                  )}
                </Button>
              </form>
              <p className="text-xs mt-4 opacity-70">
                我们尊重您的隐私，绝不会发送垃圾邮件
              </p>
            </>
          )}
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-8 text-center text-gray-400 text-sm">
        <p>Powered by 开品宝</p>
      </footer>
    </div>
  );
}
