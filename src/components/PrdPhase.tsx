import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, ChevronRight, ArrowRight, Sparkles } from "lucide-react";
import { AiProductManagerPanel } from "@/components/AiProductManagerPanel";
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
  isReadOnly?: boolean;
}

// Required fields for product definition
const REQUIRED_FIELDS = [
  'selectedDirection',
  'usageScenario',
  'targetAudience',
  'designStyle',
  'coreFeatures',
  'pricingRange'
] as const;

function checkAllRequiredFilled(prdData: PrdData | null): boolean {
  if (!prdData) return false;
  
  return REQUIRED_FIELDS.every(field => {
    if (field === 'coreFeatures') {
      return prdData.coreFeatures && prdData.coreFeatures.length > 0;
    }
    return !!prdData[field as keyof PrdData];
  });
}

export function PrdPhase({
  projectId,
  onComplete,
  isReadOnly = false,
}: PrdPhaseProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [prdData, setPrdData] = useState<PrdData | null>(null);
  const [competitorProducts, setCompetitorProducts] = useState<CompetitorProduct[]>([]);
  const [showDesignReadyPrompt, setShowDesignReadyPrompt] = useState(false);

  const getUserAccessToken = async () => {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    const token = data.session?.access_token;
    if (!token) throw new Error("No active session");
    return token;
  };

  // Load initial data
  useEffect(() => {
    loadProjectData();
    loadMessages();
    loadCompetitorProducts();
  }, [projectId]);

  // Start AI conversation on mount if no messages exist
  useEffect(() => {
    if (messages.length === 0 && !isReadOnly) {
      const timer = setTimeout(() => {
        startAiConversation();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [messages.length, isReadOnly]);

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
      const accessToken = await getUserAccessToken();
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
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
        await processAiResponse(assistantContent);
      }
    } catch (error) {
      console.error(error);
      toast.error("AI初始化失败，请刷新重试");
    } finally {
      setIsSending(false);
      setIsStreaming(false);
    }
  };

  // Process AI response - extract PRD data and check for signals
  const processAiResponse = async (content: string) => {
    const prdDataMatch = content.match(/```prd-data\s*([\s\S]*?)\s*```/);
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
        
        // Check if all required fields are filled
        if (checkAllRequiredFilled(mergedPrdData as PrdData)) {
          setTimeout(() => {
            setShowDesignReadyPrompt(true);
          }, 1000);
        }
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
        const newPrdData = updatedProject.prd_data as PrdData;
        setPrdData(newPrdData);
        
        // Check for DESIGN_READY signal or if all required fields are filled
        if (content.includes("[DESIGN_READY]") || checkAllRequiredFilled(newPrdData)) {
          setTimeout(() => {
            setShowDesignReadyPrompt(true);
          }, 1000);
        }
      }
    }

    // Also check for DESIGN_READY signal directly
    if (content.includes("[DESIGN_READY]")) {
      setTimeout(() => {
        setShowDesignReadyPrompt(true);
      }, 1000);
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
      const accessToken = await getUserAccessToken();
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
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

        await processAiResponse(assistantContent);
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
      const accessToken = await getUserAccessToken();
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
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

        await processAiResponse(assistantContent);
      }
    } catch (error) {
      console.error(error);
      toast.error("AI回复失败，请重试");
    } finally {
      setIsSending(false);
      setIsStreaming(false);
    }
  };

  // Handle field edit from sidebar
  const handleFieldEdit = async (field: string, value: unknown) => {
    const updatedPrdData = {
      ...prdData,
      [field]: value,
    } as PrdData;
    
    setPrdData(updatedPrdData);
    
    await supabase
      .from("projects")
      .update({ prd_data: JSON.parse(JSON.stringify(updatedPrdData)) })
      .eq("id", projectId);

    toast.success("已保存修改");
    
    // Check if all required fields are now filled
    if (checkAllRequiredFilled(updatedPrdData)) {
      setTimeout(() => {
        setShowDesignReadyPrompt(true);
      }, 500);
    }
  };

  // Handle proceed to design phase
  const handleProceedToDesign = async () => {
    setShowDesignReadyPrompt(false);
    
    await supabase
      .from("projects")
      .update({ 
        prd_progress: { confirmed: true },
        current_stage: 3 
      })
      .eq("id", projectId);

    toast.success("🎉 产品定义完成，进入产品设计阶段！");
    onComplete();
  };

  const handleDismissDesignPrompt = () => {
    setShowDesignReadyPrompt(false);
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

      {/* Design Ready Transition Overlay */}
      <AnimatePresence>
        {showDesignReadyPrompt && (
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
                    <h3 className="text-xl font-bold mb-2 flex items-center justify-center gap-2">
                      <Sparkles className="w-5 h-5 text-primary" />
                      🎉 产品定义已完成！
                    </h3>
                    <p className="text-muted-foreground mb-6">
                      所有核心字段已填写完成。您可以进入产品设计阶段，
                      或继续与 AI 对话完善更多细节。
                    </p>
                  </motion.div>

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={handleDismissDesignPrompt}
                      className="flex-1"
                    >
                      继续完善
                    </Button>
                    <Button
                      onClick={handleProceedToDesign}
                      className="flex-1 bg-gradient-to-r from-primary to-accent animate-glow-pulse"
                    >
                      进入产品设计
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content - AI Product Manager Panel with Sidebar */}
      <div className="flex-1 min-h-0 overflow-hidden mt-4">
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
          onPrdComplete={handleProceedToDesign}
          showPrdReadyPrompt={false}
          onDismissPrdPrompt={handleDismissDesignPrompt}
          isReadOnly={isReadOnly}
          onFieldEdit={handleFieldEdit}
          onProceedToDesign={handleProceedToDesign}
        />
      </div>
    </div>
  );
}
