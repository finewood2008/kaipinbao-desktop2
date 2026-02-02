import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, ChevronRight, ArrowLeft, Sparkles, MessageSquare, FileText } from "lucide-react";
import { AiProductManagerPanel } from "@/components/AiProductManagerPanel";
import { PrdDocumentPanel } from "@/components/PrdDocumentPanel";
import { PrdData } from "@/components/PrdExtractionSidebar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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
  isReadOnly?: boolean;
}

const subPhases = [
  { id: 1 as const, label: "AI产品经理", icon: MessageSquare },
  { id: 2 as const, label: "产品PRD文档", icon: FileText },
];

export function PrdPhase({
  projectId,
  onComplete,
  isReadOnly = false,
}: PrdPhaseProps) {
  const [currentSubPhase, setCurrentSubPhase] = useState<1 | 2>(1);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [prdData, setPrdData] = useState<PrdData | null>(null);
  const [competitorProducts, setCompetitorProducts] = useState<CompetitorProduct[]>([]);
  const [showTransition, setShowTransition] = useState(false);
  const [showPrdReadyPrompt, setShowPrdReadyPrompt] = useState(false);
  const [phase1Completed, setPhase1Completed] = useState(false);

  // Load initial data
  useEffect(() => {
    loadProjectData();
    loadMessages();
    loadCompetitorProducts();
  }, [projectId]);

  // Start AI conversation on mount if no messages exist
  useEffect(() => {
    if (messages.length === 0 && currentSubPhase === 1 && !isReadOnly) {
      const timer = setTimeout(() => {
        startAiConversation();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [messages.length, currentSubPhase, isReadOnly]);

  const loadProjectData = async () => {
    const { data } = await supabase
      .from("projects")
      .select("prd_data")
      .eq("id", projectId)
      .single();

    if (data?.prd_data) {
      setPrdData(data.prd_data as PrdData);
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

        // Extract and save PRD data from initial AI response
        const prdDataMatch = assistantContent.match(/```prd-data\s*([\s\S]*?)\s*```/);
        if (prdDataMatch) {
          try {
            const extractedPrdData = JSON.parse(prdDataMatch[1]);
            
            const { data: existingProject } = await supabase
              .from("projects")
              .select("prd_data")
              .eq("id", projectId)
              .single();
            
            const existingPrdData = (existingProject?.prd_data as Record<string, unknown>) || {};
            const mergedPrdData = {
              ...existingPrdData,
              ...extractedPrdData,
            };
            
            await supabase
              .from("projects")
              .update({ prd_data: mergedPrdData })
              .eq("id", projectId);
            
            setPrdData(mergedPrdData as PrdData);
          } catch (parseError) {
            console.error("Failed to parse initial PRD data:", parseError);
          }
        }
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

        // Extract and save PRD data from AI response
        const prdDataMatch = assistantContent.match(/```prd-data\s*([\s\S]*?)\s*```/);
        if (prdDataMatch) {
          try {
            const extractedPrdData = JSON.parse(prdDataMatch[1]);
            
            const { data: existingProject } = await supabase
              .from("projects")
              .select("prd_data")
              .eq("id", projectId)
              .single();
            
            const existingPrdData = (existingProject?.prd_data as Record<string, unknown>) || {};
            const mergedPrdData = {
              ...existingPrdData,
              ...extractedPrdData,
            };
            
            await supabase
              .from("projects")
              .update({ prd_data: mergedPrdData })
              .eq("id", projectId);
            
            setPrdData(mergedPrdData as PrdData);
          } catch (parseError) {
            console.error("Failed to parse PRD data:", parseError);
          }
        } else {
          const { data: updatedProject } = await supabase
            .from("projects")
            .select("prd_data")
            .eq("id", projectId)
            .single();

          if (updatedProject?.prd_data) {
            setPrdData(updatedProject.prd_data as PrdData);
          }
        }

        // Detect PRD_READY signal
        if (assistantContent.includes("[PRD_READY]")) {
          setPhase1Completed(true);
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

  // Direct send for suggestion clicks
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

        // Extract PRD data
        const prdDataMatch = assistantContent.match(/```prd-data\s*([\s\S]*?)\s*```/);
        if (prdDataMatch) {
          try {
            const extractedPrdData = JSON.parse(prdDataMatch[1]);
            
            const { data: existingProject } = await supabase
              .from("projects")
              .select("prd_data")
              .eq("id", projectId)
              .single();
            
            const existingPrdData = (existingProject?.prd_data as Record<string, unknown>) || {};
            const mergedPrdData = {
              ...existingPrdData,
              ...extractedPrdData,
            };
            
            await supabase
              .from("projects")
              .update({ prd_data: mergedPrdData })
              .eq("id", projectId);
            
            setPrdData(mergedPrdData as PrdData);
          } catch (parseError) {
            console.error("Failed to parse PRD data:", parseError);
          }
        }

        // Detect PRD_READY signal
        if (assistantContent.includes("[PRD_READY]")) {
          setPhase1Completed(true);
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

  const handleTransitionConfirm = () => {
    setShowTransition(false);
    setCurrentSubPhase(2);
  };

  const handlePrdComplete = () => {
    setShowPrdReadyPrompt(false);
    setPhase1Completed(true);
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
        current_stage: 3 
      })
      .eq("id", projectId);

    toast.success("🎉 PRD 已确认，进入视觉生成阶段！");
    onComplete();
  };

  const handleSubPhaseClick = (phase: 1 | 2) => {
    if (phase === 1) {
      setCurrentSubPhase(1);
    } else if (phase === 2 && phase1Completed) {
      setCurrentSubPhase(2);
    }
  };

  const handleBackToPhase1 = () => {
    setCurrentSubPhase(1);
  };

  const isCompleted = (phase: number) => {
    if (phase === 1) return phase1Completed;
    return false;
  };

  const canNavigate = (phase: number) => {
    if (phase === 1) return true;
    if (phase === 2) return phase1Completed;
    return false;
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      {/* Read-only Mode Banner */}
      {isReadOnly && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-4 mt-4 p-3 bg-muted/50 border border-border/50 rounded-lg flex items-center justify-between"
        >
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="w-2 h-2 rounded-full bg-accent" />
            <span>只读模式 - 产品定义阶段已完成，您正在查看历史记录</span>
          </div>
        </motion.div>
      )}

      {/* Sub-phase Indicator */}
      <div className="flex items-center justify-center gap-1 p-3 border-b border-border/50 mx-4 mt-4">
        {subPhases.map((phase, index) => {
          const Icon = phase.icon;
          const completed = isCompleted(phase.id);
          const isCurrent = currentSubPhase === phase.id;
          const canClick = canNavigate(phase.id) && !isCurrent;

          return (
            <div key={phase.id} className="flex items-center">
              <motion.button
                onClick={() => canClick && handleSubPhaseClick(phase.id)}
                disabled={!canClick}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all duration-300 text-xs",
                  isCurrent
                    ? "bg-gradient-to-r from-primary to-accent text-primary-foreground"
                    : completed
                    ? "bg-primary/20 text-primary cursor-pointer hover:bg-primary/30"
                    : "bg-muted text-muted-foreground cursor-not-allowed"
                )}
                whileHover={canClick ? { scale: 1.02 } : {}}
                whileTap={canClick ? { scale: 0.98 } : {}}
              >
                {completed && !isCurrent ? (
                  <Check className="w-3.5 h-3.5" />
                ) : (
                  <Icon className="w-3.5 h-3.5" />
                )}
                <span className="font-medium">{phase.label}</span>
              </motion.button>

              {index < subPhases.length - 1 && (
                <div className="mx-2 flex items-center">
                  <motion.div
                    className={cn(
                      "h-0.5 w-6 rounded-full",
                      isCompleted(phase.id) ? "bg-primary" : "bg-border"
                    )}
                    initial={false}
                    animate={{
                      backgroundColor: isCompleted(phase.id)
                        ? "hsl(var(--primary))"
                        : "hsl(var(--border))",
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

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
                      className="absolute w-2 h-2 rounded-full bg-primary/60"
                      style={{
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
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
                    <Check className="w-10 h-10 text-primary-foreground" />
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <h3 className="text-xl font-bold mb-2">✅ PRD 信息收集完成！</h3>
                    <p className="text-muted-foreground mb-6">
                      您可以在文档页面查看详情并进行修改
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
                      onClick={handleTransitionConfirm}
                      className="flex-1 bg-gradient-to-r from-primary to-accent animate-glow-pulse"
                    >
                      查看 PRD 文档
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
      <div className="flex-1 min-h-0 overflow-hidden mt-4">
        <AnimatePresence mode="wait">
          {currentSubPhase === 1 && (
            <motion.div
              key="subphase1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="h-full min-h-0"
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
                isReadOnly={isReadOnly}
              />
            </motion.div>
          )}

          {currentSubPhase === 2 && (
            <motion.div
              key="subphase2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
              className="h-full min-h-0"
            >
              <PrdDocumentPanel
                prdData={prdData}
                competitorProducts={competitorProducts}
                projectId={projectId}
                onSave={handleSavePrdData}
                onConfirm={handleConfirmPrd}
                onBack={handleBackToPhase1}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
