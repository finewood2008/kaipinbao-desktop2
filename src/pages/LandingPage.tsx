import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Mail, CheckCircle } from "lucide-react";

interface LandingPageData {
  id: string;
  title: string;
  hero_image_url: string | null;
  pain_points: string[] | null;
  selling_points: string[] | null;
  trust_badges: string[] | null;
}

export default function LandingPage() {
  const { slug } = useParams<{ slug: string }>();
  const [landingPage, setLandingPage] = useState<LandingPageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <section className="pt-16 pb-12 px-4">
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
            className="text-4xl md:text-5xl font-bold text-gray-900 mb-6"
          >
            {landingPage.title}
          </motion.h1>
        </div>
      </section>

      {/* Pain Points */}
      {landingPage.pain_points && landingPage.pain_points.length > 0 && (
        <section className="py-12 px-4 bg-red-50/50">
          <div className="max-w-3xl mx-auto">
            <motion.h2
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              className="text-2xl font-bold text-center text-gray-800 mb-8"
            >
              您是否遇到这些问题？
            </motion.h2>
            <div className="space-y-4">
              {(landingPage.pain_points as string[]).map((point, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-start gap-3 bg-white p-4 rounded-lg shadow-sm"
                >
                  <span className="text-red-500 text-xl">✗</span>
                  <p className="text-gray-700">{point}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Selling Points */}
      {landingPage.selling_points && landingPage.selling_points.length > 0 && (
        <section className="py-12 px-4 bg-green-50/50">
          <div className="max-w-3xl mx-auto">
            <motion.h2
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              className="text-2xl font-bold text-center text-gray-800 mb-8"
            >
              我们的解决方案
            </motion.h2>
            <div className="space-y-4">
              {(landingPage.selling_points as string[]).map((point, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-start gap-3 bg-white p-4 rounded-lg shadow-sm"
                >
                  <span className="text-green-500 text-xl">✓</span>
                  <p className="text-gray-700">{point}</p>
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
            <div className="flex justify-center gap-4 flex-wrap">
              {(landingPage.trust_badges as string[]).map((badge, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className="text-sm text-gray-600 bg-gray-100 px-4 py-2 rounded-full"
                >
                  {badge}
                </motion.span>
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
                    "订阅"
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
