import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, ChevronRight, ArrowLeft, Sparkles } from "lucide-react";
import { MarketAnalysisPhase } from "@/components/MarketAnalysisPhase";
import { CompetitorResearch } from "@/components/CompetitorResearch";
import { AiProductManagerPanel } from "@/components/AiProductManagerPanel";
import { PrdDocumentPanel } from "@/components/PrdDocumentPanel";
import { PrdPhaseIndicator } from "@/components/PrdPhaseIndicator";
import { PrdData } from "@/components/PrdExtractionSidebar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  stage: number;
}

interface CompetitorProduct {
  id: string;
  product_title?: string;
  product_images?: string[];
  main_image?: string;
  price?: string;
  rating?: number;
}

interface PrdPhaseProps {
  projectId: string;
  onComplete: () => void;
  initialPhase?: 1 | 2 | 3 | 4;
  competitorResearchCompleted?: boolean;
}

export function PrdPhase({
  projectId,
  onComplete,
  initialPhase = 1,
  competitorResearchCompleted = false,
}: PrdPhaseProps) {
  const [currentPhase, setCurrentPhase] = useState<1 | 2 | 3 | 4>(initialPhase);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [prdData, setPrdData] = useState<PrdData | null>(null);
  const [competitorProducts, setCompetitorProducts] = useState<CompetitorProduct[]>([]);
  const [showTransition, setShowTransition] = useState(false);
  const [transitionTarget, setTransitionTarget] = useState<2 | 3 | 4>(2);
  const [showPrdReadyPrompt, setShowPrdReadyPrompt] = useState(false);
  const [phase1Completed, setPhase1Completed] = useState(false);
  const [phase2Completed, setPhase2Completed] = useState(competitorResearchCompleted);
  const [phase3Completed, setPhase3Completed] = useState(false);

  // Load initial data
  useEffect(() => {
    loadProjectData();
    loadMessages();
    loadCompetitorProducts();
  }, [projectId]);

  const loadProjectData = async () => {
    const { data } = await supabase
      .from("projects")
      .select("prd_data, competitor_research_completed")
      .eq("id", projectId)
      .single();

    if (data?.prd_data) {
      const prd = data.prd_data as PrdData & { initialMarketAnalysis?: unknown };
      setPrdData(prd);
      // Check if market analysis is completed
      if (prd.initialMarketAnalysis) {
        setPhase1Completed(true);
      }
    }
    if (data?.competitor_research_completed) {
      setPhase2Completed(true);
    }
  };

  const loadMessages = async () => {
    const { data } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: true });

    if (data) {
      setMessages(
        data.map((m) => ({
          id: m.id,
          role: m.role as "user" | "assistant",
          content: m.content,
          stage: m.stage,
        }))
      );
    }
  };

  const loadCompetitorProducts = async () => {
    const { data } = await supabase
      .from("competitor_products")
      .select("*")
      .eq("project_id", projectId)
      .eq("status", "completed");

    if (data) {
      setCompetitorProducts(
        data.map((p) => ({
          id: p.id,
          product_title: p.product_title || undefined,
          product_images: (p.product_images as string[]) || undefined,
          main_image: p.main_image || undefined,
          price: p.price || undefined,
          rating: p.rating ? Number(p.rating) : undefined,
        }))
      );
    }
  };

  // Handle market analysis completion (Phase 1 -> Phase 2)
  const handleMarketAnalysisComplete = () => {
    setPhase1Completed(true);
    setTransitionTarget(2);
    setShowTransition(true);
  };

  const handleMarketAnalysisSkip = () => {
    setPhase1Completed(true);
    setCurrentPhase(2);
  };

  // Handle competitor research completion (Phase 2 -> Phase 3)
  const handleCompetitorResearchComplete = async (hasResearch: boolean) => {
    await supabase
      .from("projects")
      .update({ competitor_research_completed: true })
      .eq("id", projectId);

    setPhase2Completed(true);
    await loadCompetitorProducts();
    
    // Show transition animation
    setTransitionTarget(3);
    setShowTransition(true);
  };

  const handleCompetitorResearchSkip = async () => {
    await supabase
      .from("projects")
      .update({ competitor_research_completed: true })
      .eq("id", projectId);

    setPhase2Completed(true);
    setCurrentPhase(3);
    startAiConversation();
  };

  // Start AI conversation
  const startAiConversation = async () => {
    if (messages.length > 0) return;

    setIsSending(true);
    setIsStreaming(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages: [{ role: "user", content: "开始PRD细化对话" }],
            projectId,
            currentStage: 1,
          }),
        }
      );

      if (!response.ok) throw new Error("AI请求失败");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = "";
      let assistantMsgId = crypto.randomUUID();

      setMessages([{ id: assistantMsgId, role: "assistant", content: "", stage: 1 }]);

      if (reader) {
        let textBuffer = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          textBuffer += decoder.decode(value, { stream: true });

          let newlineIndex: number;
          while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
            let line = textBuffer.slice(0, newlineIndex);
            textBuffer = textBuffer.slice(newlineIndex + 1);

            if (line.endsWith("\r")) line = line.slice(0, -1);
            if (line.startsWith(":") || line.trim() === "") continue;
            if (!line.startsWith("data: ")) continue;

            const jsonStr = line.slice(6).trim();
            if (jsonStr === "[DONE]") break;

            try {
              const parsed = JSON.parse(jsonStr);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                assistantContent += content;
                setMessages([
                  { id: assistantMsgId, role: "assistant", content: assistantContent, stage: 1 },
                ]);
              }
            } catch {
              textBuffer = line + "\n" + textBuffer;
              break;
            }
          }
        }
      }

      if (assistantContent) {
        await supabase.from("chat_messages").insert({
          project_id: projectId,
          role: "assistant",
          content: assistantContent,
          stage: 1,
        });
      }
    } catch (error) {
      console.error(error);
      toast.error("AI初始化失败，请刷新重试");
    } finally {
      setIsSending(false);
      setIsStreaming(false);
    }
  };

  // Handle sending message
  const handleSendMessage = async () => {
    if (!inputValue.trim() || isSending) return;

    const userMessage = inputValue.trim();
    setInputValue("");
    setIsSending(true);

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: userMessage,
      stage: 1,
    };
    setMessages((prev) => [...prev, userMsg]);

    await supabase.from("chat_messages").insert({
      project_id: projectId,
      role: "user",
      content: userMessage,
      stage: 1,
    });

    const chatHistory = [...messages, userMsg].map((m) => ({
      role: m.role,
      content: m.content,
    }));

    setIsStreaming(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages: chatHistory,
            projectId,
            currentStage: 1,
          }),
        }
      );

      if (!response.ok) throw new Error("AI请求失败");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = "";
      let assistantMsgId = crypto.randomUUID();

      setMessages((prev) => [
        ...prev,
        { id: assistantMsgId, role: "assistant", content: "", stage: 1 },
      ]);

      if (reader) {
        let textBuffer = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          textBuffer += decoder.decode(value, { stream: true });

          let newlineIndex: number;
          while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
            let line = textBuffer.slice(0, newlineIndex);
            textBuffer = textBuffer.slice(newlineIndex + 1);

            if (line.endsWith("\r")) line = line.slice(0, -1);
            if (line.startsWith(":") || line.trim() === "") continue;
            if (!line.startsWith("data: ")) continue;

            const jsonStr = line.slice(6).trim();
            if (jsonStr === "[DONE]") break;

            try {
              const parsed = JSON.parse(jsonStr);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                assistantContent += content;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMsgId ? { ...m, content: assistantContent } : m
                  )
                );
              }
            } catch {
              textBuffer = line + "\n" + textBuffer;
              break;
            }
          }
        }
      }

      if (assistantContent) {
        await supabase.from("chat_messages").insert({
          project_id: projectId,
          role: "assistant",
          content: assistantContent,
          stage: 1,
        });

        // Refetch project to get updated PRD data
        const { data: updatedProject } = await supabase
          .from("projects")
          .select("prd_data")
          .eq("id", projectId)
          .single();

        if (updatedProject?.prd_data) {
          setPrdData(updatedProject.prd_data as PrdData);
        }

        // Detect PRD_READY signal
        if (assistantContent.includes("[PRD_READY]")) {
          setPhase3Completed(true);
          setTimeout(() => {
            setShowPrdReadyPrompt(true);
          }, 1000);
        }
      }
    } catch (error) {
      console.error(error);
      toast.error("AI回复失败，请重试");
    } finally {
      setIsSending(false);
      setIsStreaming(false);
    }
  };

  // Direct send for suggestion clicks (submit immediately)
  const handleSendDirect = async (message: string) => {
    if (isSending) return;
    
    setIsSending(true);

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: message,
      stage: 1,
    };
    setMessages((prev) => [...prev, userMsg]);

    await supabase.from("chat_messages").insert({
      project_id: projectId,
      role: "user",
      content: message,
      stage: 1,
    });

    const chatHistory = [...messages, userMsg].map((m) => ({
      role: m.role,
      content: m.content,
    }));

    setIsStreaming(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages: chatHistory,
            projectId,
            currentStage: 1,
          }),
        }
      );

      if (!response.ok) throw new Error("AI请求失败");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = "";
      let assistantMsgId = crypto.randomUUID();

      setMessages((prev) => [
        ...prev,
        { id: assistantMsgId, role: "assistant", content: "", stage: 1 },
      ]);

      if (reader) {
        let textBuffer = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          textBuffer += decoder.decode(value, { stream: true });

          let newlineIndex: number;
          while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
            let line = textBuffer.slice(0, newlineIndex);
            textBuffer = textBuffer.slice(newlineIndex + 1);

            if (line.endsWith("\r")) line = line.slice(0, -1);
            if (line.startsWith(":") || line.trim() === "") continue;
            if (!line.startsWith("data: ")) continue;

            const jsonStr = line.slice(6).trim();
            if (jsonStr === "[DONE]") break;

            try {
              const parsed = JSON.parse(jsonStr);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                assistantContent += content;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMsgId ? { ...m, content: assistantContent } : m
                  )
                );
              }
            } catch {
              textBuffer = line + "\n" + textBuffer;
              break;
            }
          }
        }
      }

      if (assistantContent) {
        await supabase.from("chat_messages").insert({
          project_id: projectId,
          role: "assistant",
          content: assistantContent,
          stage: 1,
        });

        const { data: updatedProject } = await supabase
          .from("projects")
          .select("prd_data")
          .eq("id", projectId)
          .single();

        if (updatedProject?.prd_data) {
          setPrdData(updatedProject.prd_data as PrdData);
        }

        if (assistantContent.includes("[PRD_READY]")) {
          setPhase3Completed(true);
          setTimeout(() => {
            setShowPrdReadyPrompt(true);
          }, 1000);
        }
      }
    } catch (error) {
      console.error(error);
      toast.error("AI回复失败，请重试");
    } finally {
      setIsSending(false);
      setIsStreaming(false);
    }
  };

  const handlePhaseTransitionConfirm = () => {
    setShowTransition(false);
    setCurrentPhase(transitionTarget);
    if (transitionTarget === 3) {
      startAiConversation();
    }
  };

  const handlePrdComplete = () => {
    setShowPrdReadyPrompt(false);
    setTransitionTarget(4);
    setShowTransition(true);
  };

  const handleDismissPrdPrompt = () => {
    setShowPrdReadyPrompt(false);
  };

  const handleSavePrdData = async (data: PrdData) => {
    setPrdData(data);
    await supabase
      .from("projects")
      .update({ prd_data: JSON.parse(JSON.stringify(data)) })
      .eq("id", projectId);
  };

  const handleConfirmPrd = async () => {
    await supabase
      .from("projects")
      .update({ 
        prd_progress: { confirmed: true },
        current_stage: 2 
      })
      .eq("id", projectId);

    toast.success("🎉 PRD 已确认，进入视觉生成阶段！");
    onComplete();
  };

  const handlePhaseClick = (phase: 1 | 2 | 3 | 4) => {
    if (phase === 1) {
      setCurrentPhase(1);
    } else if (phase === 2 && phase1Completed) {
      setCurrentPhase(2);
    } else if (phase === 3 && phase2Completed) {
      setCurrentPhase(3);
      // Start AI conversation when entering phase 3 directly
      if (messages.length === 0) {
        startAiConversation();
      }
    } else if (phase === 4 && phase3Completed) {
      setCurrentPhase(4);
    }
  };

  const handleBackToPhase3 = () => {
    setCurrentPhase(3);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Phase Indicator */}
      <Card className="glass border-border/50 overflow-hidden mx-4 mt-4">
        <CardContent className="p-2">
          <PrdPhaseIndicator
            currentPhase={currentPhase}
            onPhaseClick={handlePhaseClick}
            phase1Completed={phase1Completed}
            phase2Completed={phase2Completed}
          />
        </CardContent>
      </Card>

      {/* Phase Transition Overlay */}
      <AnimatePresence>
        {showTransition && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/90 backdrop-blur-md z-50 flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="max-w-lg w-full"
            >
              <Card className="glass border-primary/50 overflow-hidden">
                <motion.div
                  className="absolute inset-0 pointer-events-none"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  {[...Array(12)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-2 h-2 rounded-full"
                      style={{
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                        backgroundColor: `hsl(${Math.random() * 60 + 180}, 70%, 60%)`,
                      }}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{
                        scale: [0, 1, 0.5],
                        opacity: [0, 1, 0],
                        y: [0, -30, -50],
                      }}
                      transition={{
                        duration: 1.5,
                        delay: i * 0.05,
                        repeat: Infinity,
                        repeatDelay: 2,
                      }}
                    />
                  ))}
                </motion.div>

                <CardContent className="p-8 text-center relative">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 25, delay: 0.1 }}
                    className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center"
                    style={{ boxShadow: "0 0 30px hsl(var(--primary) / 0.4)" }}
                  >
                    {transitionTarget === 2 ? (
                      <Sparkles className="w-10 h-10 text-primary-foreground" />
                    ) : transitionTarget === 3 ? (
                      <Sparkles className="w-10 h-10 text-primary-foreground" />
                    ) : (
                      <Check className="w-10 h-10 text-primary-foreground" />
                    )}
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <h3 className="text-xl font-bold mb-2">
                      {transitionTarget === 2
                        ? "🎯 市场分析完成！"
                        : transitionTarget === 3
                        ? "🎉 竞品分析完成！"
                        : "✅ PRD 信息收集完成！"}
                    </h3>
                    <p className="text-muted-foreground mb-6">
                      {transitionTarget === 2
                        ? "接下来添加 Amazon 竞品链接，获取真实用户反馈"
                        : transitionTarget === 3
                        ? `已分析 ${competitorProducts.length} 款竞品，AI 产品经理将基于这些数据与您对话`
                        : "您可以在文档页面查看详情并进行修改"}
                    </p>
                  </motion.div>

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setShowTransition(false)}
                      className="flex-1"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      返回修改
                    </Button>
                    <Button
                      onClick={handlePhaseTransitionConfirm}
                      className="flex-1 bg-gradient-to-r from-primary to-accent animate-glow-pulse"
                    >
                      {transitionTarget === 2
                        ? "进入竞品分析"
                        : transitionTarget === 3
                        ? "开始对话"
                        : "查看 PRD 文档"}
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Phase Content */}
      <div className="flex-1 overflow-hidden mt-4">
        <AnimatePresence mode="wait">
          {currentPhase === 1 && (
            <motion.div
              key="phase1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="h-full"
            >
              <MarketAnalysisPhase
                projectId={projectId}
                onComplete={handleMarketAnalysisComplete}
                onSkip={handleMarketAnalysisSkip}
              />
            </motion.div>
          )}

          {currentPhase === 2 && (
            <motion.div
              key="phase2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="h-full"
            >
              <CompetitorResearch
                projectId={projectId}
                onComplete={handleCompetitorResearchComplete}
                onSkip={handleCompetitorResearchSkip}
              />
            </motion.div>
          )}

          {currentPhase === 3 && (
            <motion.div
              key="phase3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="h-full"
            >
              <AiProductManagerPanel
                projectId={projectId}
                messages={messages}
                isStreaming={isStreaming}
                isSending={isSending}
                inputValue={inputValue}
                prdData={prdData}
                competitorProducts={competitorProducts}
                onInputChange={setInputValue}
                onSend={handleSendMessage}
                onSendDirect={handleSendDirect}
                onPrdComplete={handlePrdComplete}
                showPrdReadyPrompt={showPrdReadyPrompt}
                onDismissPrdPrompt={handleDismissPrdPrompt}
              />
            </motion.div>
          )}

          {currentPhase === 4 && (
            <motion.div
              key="phase4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="h-full"
            >
              <PrdDocumentPanel
                prdData={prdData}
                competitorProducts={competitorProducts}
                projectId={projectId}
                onSave={handleSavePrdData}
                onConfirm={handleConfirmPrd}
                onBack={handleBackToPhase3}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
