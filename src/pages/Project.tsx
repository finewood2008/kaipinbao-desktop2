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
import { VisualGenerationPhase } from "@/components/VisualGenerationPhase";
import { LandingPageBuilder } from "@/components/LandingPageBuilder";
import { PrdPhase } from "@/components/PrdPhase";
import { PrdData } from "@/components/PrdExtractionSidebar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Sparkles, MessageSquare, Image, Globe } from "lucide-react";

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
  image_type?: string;
  phase?: number;
  parent_image_id?: string | null;
}

interface GeneratedVideo {
  id: string;
  video_url: string | null;
  prompt: string;
  scene_description: string | null;
  duration_seconds: number;
  status: string;
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
  competitor_research_completed?: boolean;
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
  const [productImages, setProductImages] = useState<GeneratedImage[]>([]);
  const [marketingImages, setMarketingImages] = useState<GeneratedImage[]>([]);
  const [videos, setVideos] = useState<GeneratedVideo[]>([]);
  const [landingPage, setLandingPage] = useState<LandingPageData | null>(null);
  const [activeTab, setActiveTab] = useState("chat");
  const [showTransitionPrompt, setShowTransitionPrompt] = useState(false);
  const [prdData, setPrdData] = useState<PrdData | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (id) {
      fetchProject();
      fetchMessages();
      fetchImages();
      fetchVideos();
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
      const projectData: Project = {
        id: data.id,
        name: data.name,
        description: data.description,
        current_stage: data.current_stage,
        status: data.status,
        prd_data: data.prd_data,
        visual_data: data.visual_data,
        landing_page_data: data.landing_page_data,
        competitor_research_completed: data.competitor_research_completed,
      };
      
      // Parse PRD data
      if (data.prd_data && typeof data.prd_data === 'object') {
        setPrdData(data.prd_data as PrdData);
      }
      
      setProject(projectData);
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
      const phase1Images = data.filter((img: any) => (img.phase || 1) === 1);
      const phase2Images = data.filter((img: any) => img.phase === 2);
      setProductImages(phase1Images as GeneratedImage[]);
      setMarketingImages(phase2Images as GeneratedImage[]);
    }
  };

  const fetchVideos = async () => {
    const { data, error } = await supabase
      .from("generated_videos")
      .select("*")
      .eq("project_id", id)
      .order("created_at", { ascending: true });

    if (!error && data) {
      setVideos(data as GeneratedVideo[]);
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

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isSending) return;

    const userMessage = inputValue.trim();
    setInputValue("");
    setIsSending(true);

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: userMessage,
      stage: project?.current_stage || 1,
    };
    setMessages((prev) => [...prev, userMsg]);

    await supabase.from("chat_messages").insert({
      project_id: id,
      role: "user",
      content: userMessage,
      stage: project?.current_stage || 1,
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

      if (assistantContent) {
        await supabase.from("chat_messages").insert({
          project_id: id,
          role: "assistant",
          content: assistantContent,
          stage: project?.current_stage || 1,
        });

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

  const detectStageCompletion = (content: string, currentStage: number): boolean => {
    if (currentStage === 1) {
      if (content.includes("[STAGE_COMPLETE:1]")) {
        return true;
      }
      
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
      
      const hasSummary = content.includes("总结") || content.includes("汇总") || content.includes("确认以下信息");
      const hasNextStepHint = completionIndicators.some(indicator => content.includes(indicator));
      
      return hasNextStepHint || (hasSummary && content.includes("视觉"));
    }
    
    return false;
  };

  const handlePrdPhaseComplete = async () => {
    // Refetch project to get updated stage
    await fetchProject();
    setActiveTab("images");
  };

  const handleVisualPhaseConfirm = () => {
    advanceStage(3);
  };

  const getSelectedImageUrl = () => {
    const selected = productImages.find((img) => img.is_selected);
    return selected?.image_url;
  };

  const getPrdData = () => {
    const data = project?.prd_data as any;
    return {
      usageScenarios: data?.usageScenarios || [],
      targetAudience: data?.targetAudience || "",
      coreFeatures: data?.coreFeatures || [],
    };
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
        onConfirm={handleStageTransitionConfirm}
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
          <StageIndicator 
            currentStage={project?.current_stage || 1} 
            onStageClick={(stageId) => {
              if (stageId === 1) setActiveTab("chat");
              else if (stageId === 2) setActiveTab("images");
              else if (stageId === 3) setActiveTab("landing");
            }}
          />
        </div>
      </header>

      {/* Content Area with Tabs */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">

          {/* PRD Tab - Using new PrdPhase component */}
          <TabsContent value="chat" className="flex-1 flex min-h-0 overflow-hidden m-0">
            <PrdPhase
              projectId={id || ""}
              onComplete={handlePrdPhaseComplete}
              competitorResearchCompleted={project?.competitor_research_completed}
              isReadOnly={project?.current_stage !== 1}
            />
          </TabsContent>

          {/* Images Tab */}
          <TabsContent value="images" className="flex-1 overflow-auto p-4 m-0">
            <div className="max-w-5xl mx-auto">
              <VisualGenerationPhase
                projectId={id || ""}
                productImages={productImages}
                marketingImages={marketingImages}
                videos={videos}
                onProductImagesChange={setProductImages}
                onMarketingImagesChange={setMarketingImages}
                onVideosChange={setVideos}
                onConfirmAndProceed={handleVisualPhaseConfirm}
                prdSummary={project?.name}
                prdData={getPrdData()}
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
                prdData={prdData ? {
                  pain_points: prdData.painPoints || [],
                  selling_points: prdData.sellingPoints || [],
                  target_audience: prdData.targetAudience || undefined,
                  usageScenario: prdData.usageScenario || undefined,
                  designStyle: prdData.designStyle || undefined,
                  coreFeatures: prdData.coreFeatures || [],
                  marketingAssets: prdData.marketingAssets ? {
                    sceneDescription: prdData.marketingAssets.sceneDescription || undefined,
                    structureHighlights: prdData.marketingAssets.structureHighlights || [],
                    lifestyleContext: prdData.marketingAssets.lifestyleContext || undefined,
                  } : undefined,
                  competitorInsights: prdData.competitorInsights ? {
                    positivePoints: prdData.competitorInsights.positivePoints || [],
                    negativePoints: prdData.competitorInsights.negativePoints || [],
                    differentiationStrategy: prdData.competitorInsights.differentiationStrategy || undefined,
                  } : undefined,
                } : undefined}
                marketingImages={marketingImages.map(img => ({
                  id: img.id,
                  image_url: img.image_url,
                  image_type: img.image_type || 'marketing',
                }))}
                videoUrl={videos.find(v => v.video_url)?.video_url || undefined}
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
