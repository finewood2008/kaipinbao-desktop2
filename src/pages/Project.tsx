import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StageIndicator } from "@/components/StageIndicator";
import { StageTransitionPrompt } from "@/components/StageTransitionPrompt";
import { ChatMessage } from "@/components/ChatMessage";
import { ImageGallery } from "@/components/ImageGallery";
import { LandingPageBuilder } from "@/components/LandingPageBuilder";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Send, Loader2, Sparkles, MessageSquare, Image, Globe } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  stage: number;
  suggestions?: string[];
}

interface GeneratedImage {
  id: string;
  image_url: string;
  prompt: string;
  is_selected: boolean;
  feedback: string | null;
}

interface LandingPageData {
  id: string;
  title: string;
  slug: string;
  hero_image_url: string | null;
  pain_points: string[] | null;
  selling_points: string[] | null;
  trust_badges: string[] | null;
  is_published: boolean;
  view_count: number;
}

interface Project {
  id: string;
  name: string;
  description: string | null;
  current_stage: number;
  status: string;
  prd_data: unknown;
  visual_data: unknown;
  landing_page_data: unknown;
}

export default function ProjectPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [landingPage, setLandingPage] = useState<LandingPageData | null>(null);
  const [activeTab, setActiveTab] = useState("chat");
  const [showTransitionPrompt, setShowTransitionPrompt] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (id) {
      fetchProject();
      fetchMessages();
      fetchImages();
      fetchLandingPage();
    }
  }, [id]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    // Auto-switch tabs based on stage
    if (project) {
      if (project.current_stage === 1) {
        setActiveTab("chat");
      } else if (project.current_stage === 2) {
        setActiveTab("images");
      } else if (project.current_stage === 3) {
        setActiveTab("landing");
      }
    }
  }, [project?.current_stage]);

  const fetchProject = async () => {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      toast.error("获取项目失败");
      navigate("/dashboard");
    } else {
      setProject(data);
      // If no messages yet, add welcome message
      if (!messages.length) {
        initializeConversation(data);
      }
    }
    setIsLoading(false);
  };

  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("project_id", id)
      .order("created_at", { ascending: true });

    if (!error && data) {
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

  const fetchImages = async () => {
    const { data, error } = await supabase
      .from("generated_images")
      .select("*")
      .eq("project_id", id)
      .order("created_at", { ascending: true });

    if (!error && data) {
      setGeneratedImages(data as GeneratedImage[]);
    }
  };

  const fetchLandingPage = async () => {
    const { data, error } = await supabase
      .from("landing_pages")
      .select("*")
      .eq("project_id", id)
      .single();

    if (!error && data) {
      setLandingPage(data as unknown as LandingPageData);
    }
  };

  const initializeConversation = async (proj: Project) => {
    const welcomeMessage = `[当前阶段：PRD细化]

你好！我是开品宝，您的AI产品研发专家。我将带领您完成从创意到市场测试的全过程。

**项目：${proj.name}**
${proj.description ? `\n${proj.description}\n` : ""}

让我们开始 **阶段一：ID探索与PRD细化**。我需要了解更多关于您产品的信息。

首先，请告诉我：
1. 这个产品的**主要使用场景**是什么？（室内/户外/特定环境）
2. 它解决什么**核心痛点**？

请详细描述，我会根据您的回答进一步追问。`;

    const { error } = await supabase.from("chat_messages").insert({
      project_id: id,
      role: "assistant",
      content: welcomeMessage,
      stage: 1,
    });

    if (!error) {
      setMessages([
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: welcomeMessage,
          stage: 1,
        },
      ]);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isSending) return;

    const userMessage = inputValue.trim();
    setInputValue("");
    setIsSending(true);

    // Add user message immediately
    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: userMessage,
      stage: project?.current_stage || 1,
    };
    setMessages((prev) => [...prev, userMsg]);

    // Save user message to DB
    await supabase.from("chat_messages").insert({
      project_id: id,
      role: "user",
      content: userMessage,
      stage: project?.current_stage || 1,
    });

    // Prepare messages for AI
    const chatHistory = [...messages, userMsg].map((m) => ({
      role: m.role,
      content: m.content,
    }));

    // Call AI edge function
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
            projectId: id,
            currentStage: project?.current_stage || 1,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("AI请求失败");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = "";
      let assistantMsgId = crypto.randomUUID();

      // Add empty assistant message
      setMessages((prev) => [
        ...prev,
        { id: assistantMsgId, role: "assistant", content: "", stage: project?.current_stage || 1 },
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

      // Save assistant message to DB
      if (assistantContent) {
        await supabase.from("chat_messages").insert({
          project_id: id,
          role: "assistant",
          content: assistantContent,
          stage: project?.current_stage || 1,
        });

        // Check if AI is suggesting to move to next stage - more intelligent detection
        const stageCompleteSignal = detectStageCompletion(assistantContent, project?.current_stage || 1);
        if (stageCompleteSignal) {
          setTimeout(() => {
            setShowTransitionPrompt(true);
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const advanceStage = async (targetStage?: number) => {
    if (!project) return;
    
    const newStage = targetStage || project.current_stage + 1;
    if (newStage > 3) return;
    
    const { error } = await supabase
      .from("projects")
      .update({ current_stage: newStage })
      .eq("id", id);

    if (error) {
      toast.error("阶段更新失败");
    } else {
      setProject((prev) => prev ? { ...prev, current_stage: newStage } : null);
      setShowTransitionPrompt(false);
      toast.success(`🎉 进入阶段 ${newStage}`);
    }
  };

  const handleStageTransitionConfirm = () => {
    advanceStage();
  };

  // Intelligent stage completion detection
  const detectStageCompletion = (content: string, currentStage: number): boolean => {
    if (currentStage === 1) {
      // Check for explicit completion signal
      if (content.includes("[STAGE_COMPLETE:1]")) {
        return true;
      }
      
      // Check for natural language indicators of PRD completion
      const completionIndicators = [
        "PRD细化已完成",
        "PRD信息收集已完成",
        "进入视觉生成阶段",
        "开始视觉生成",
        "开始生成产品渲染",
        "我已经充分了解",
        "信息已经足够",
        "可以进入下一阶段",
        "准备进入视觉生成"
      ];
      
      // Check for summary + confirmation pattern
      const hasSummary = content.includes("总结") || content.includes("汇总") || content.includes("确认以下信息");
      const hasNextStepHint = completionIndicators.some(indicator => content.includes(indicator));
      
      return hasNextStepHint || (hasSummary && content.includes("视觉"));
    }
    
    // Stage 2 is handled by image selection in the gallery
    // Stage 3 completion is handled by landing page publishing
    
    return false;
  };

  // Parse suggestions from AI response
  const parseSuggestions = (content: string): string[] => {
    // Look for pattern: [建议1] | [建议2] | [建议3]
    const suggestionMatch = content.match(/\[([^\]]+)\]\s*\|\s*\[([^\]]+)\](?:\s*\|\s*\[([^\]]+)\])?(?:\s*\|\s*\[([^\]]+)\])?(?:\s*\|\s*\[([^\]]+)\])?/);
    if (suggestionMatch) {
      return suggestionMatch.slice(1).filter(Boolean);
    }
    return [];
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
  };

  const handleImageSelectionConfirm = () => {
    const selectedImage = generatedImages.find((img) => img.is_selected);
    if (selectedImage) {
      setShowTransitionPrompt(true);
    }
  };

  const handleImageSelectionTransition = () => {
    advanceStage(3);
  };

  const getSelectedImageUrl = () => {
    const selected = generatedImages.find((img) => img.is_selected);
    return selected?.image_url;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-dark flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">加载项目中...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-dark flex flex-col">
      {/* Stage Transition Prompt */}
      <StageTransitionPrompt
        isVisible={showTransitionPrompt}
        currentStage={project?.current_stage || 1}
        onConfirm={
          project?.current_stage === 2 
            ? handleImageSelectionTransition 
            : handleStageTransitionConfirm
        }
        onDismiss={() => setShowTransitionPrompt(false)}
      />

      {/* Header */}
      <header className="border-b border-border/50 glass sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="flex items-center gap-2">
                <motion.div 
                  className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center"
                  whileHover={{ scale: 1.05, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  <Sparkles className="w-5 h-5 text-primary-foreground" />
                </motion.div>
                <div>
                  <h1 className="font-semibold">{project?.name}</h1>
                  <p className="text-xs text-muted-foreground">产品研发项目</p>
                </div>
              </div>
            </div>
          </div>
          <StageIndicator currentStage={project?.current_stage || 1} />
        </div>
      </header>

      {/* Content Area with Tabs */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <div className="border-b border-border/50 px-4">
            <TabsList className="bg-transparent">
              <TabsTrigger value="chat" className="data-[state=active]:bg-muted gap-2">
                <MessageSquare className="w-4 h-4" />
                对话
              </TabsTrigger>
              <TabsTrigger 
                value="images" 
                className="data-[state=active]:bg-muted gap-2"
                disabled={project?.current_stage === 1}
              >
                <Image className="w-4 h-4" />
                视觉生成
                {project?.current_stage === 1 && (
                  <span className="text-xs text-muted-foreground ml-1">(完成对话解锁)</span>
                )}
              </TabsTrigger>
              <TabsTrigger 
                value="landing" 
                className="data-[state=active]:bg-muted gap-2"
                disabled={project?.current_stage !== 3}
              >
                <Globe className="w-4 h-4" />
                落地页
                {project?.current_stage !== 3 && (
                  <span className="text-xs text-muted-foreground ml-1">(选择设计解锁)</span>
                )}
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Chat Tab */}
          <TabsContent value="chat" className="flex-1 flex flex-col overflow-hidden m-0">
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
              <div className="max-w-3xl mx-auto space-y-4">
                <AnimatePresence initial={false}>
                  {messages.map((message, index) => {
                    const isLastAssistant = message.role === "assistant" && index === messages.length - 1;
                    const suggestions = isLastAssistant && !isStreaming ? parseSuggestions(message.content) : [];
                    
                    return (
                      <ChatMessage
                        key={message.id}
                        role={message.role}
                        content={message.content}
                        isStreaming={isStreaming && message === messages[messages.length - 1]}
                        suggestions={suggestions}
                        onSuggestionClick={handleSuggestionClick}
                      />
                    );
                  })}
                </AnimatePresence>
                {isSending && !isStreaming && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-2 text-muted-foreground"
                  >
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">AI正在思考...</span>
                  </motion.div>
                )}
              </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="border-t border-border/50 glass p-4">
              <div className="max-w-3xl mx-auto">
                <Card className="flex items-center gap-2 p-2 bg-secondary/50">
                  <Input
                    placeholder="输入您的回复..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isSending}
                    className="border-0 bg-transparent focus-visible:ring-0"
                  />
                  <Button
                    size="icon"
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim() || isSending}
                    className="bg-gradient-primary glow-primary"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </Card>
                <p className="text-xs text-muted-foreground text-center mt-2">
                  按 Enter 发送，Shift + Enter 换行
                </p>
              </div>
            </div>
          </TabsContent>

          {/* Images Tab */}
          <TabsContent value="images" className="flex-1 overflow-auto p-4 m-0">
            <div className="max-w-5xl mx-auto">
              <ImageGallery
                projectId={id || ""}
                images={generatedImages}
                onImagesChange={setGeneratedImages}
                onConfirmSelection={handleImageSelectionConfirm}
                prdSummary={project?.name}
              />
            </div>
          </TabsContent>

          {/* Landing Page Tab */}
          <TabsContent value="landing" className="flex-1 overflow-auto p-4 m-0">
            <div className="max-w-5xl mx-auto">
              <LandingPageBuilder
                projectId={id || ""}
                projectName={project?.name || ""}
                selectedImageUrl={getSelectedImageUrl()}
                landingPage={landingPage}
                onLandingPageChange={setLandingPage}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
