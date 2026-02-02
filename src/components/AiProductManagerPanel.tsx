import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Loader2, Sparkles, ChevronDown, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { ChatMessage } from "@/components/ChatMessage";
import { PrdExtractionSidebar, PrdData } from "@/components/PrdExtractionSidebar";
import { PrdCompletionCard } from "@/components/PrdCompletionCard";
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
}

interface AiProductManagerPanelProps {
  projectId: string;
  messages: Message[];
  isStreaming: boolean;
  isSending: boolean;
  inputValue: string;
  prdData: PrdData | null;
  competitorProducts?: CompetitorProduct[];
  onInputChange: (value: string) => void;
  onSend: () => void;
  onSendDirect: (message: string) => void;
  onPrdComplete: () => void;
  showPrdReadyPrompt: boolean;
  onDismissPrdPrompt: () => void;
}

export function AiProductManagerPanel({
  projectId,
  messages,
  isStreaming,
  isSending,
  inputValue,
  prdData,
  competitorProducts = [],
  onInputChange,
  onSend,
  onSendDirect,
  onPrdComplete,
  showPrdReadyPrompt,
  onDismissPrdPrompt,
}: AiProductManagerPanelProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [showScrollButton, setShowScrollButton] = useState(false);

  // Scroll to bottom function
  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  }, []);

  // Auto-scroll when new messages arrive or streaming
  useEffect(() => {
    if (isAtBottom || isStreaming) {
      scrollToBottom(isStreaming ? "auto" : "smooth");
    }
  }, [messages, isStreaming, isAtBottom, scrollToBottom]);

  // Detect if user is at bottom
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsAtBottom(entry.isIntersecting);
        setShowScrollButton(!entry.isIntersecting && messages.length > 2);
      },
      { threshold: 0.1 }
    );

    if (messagesEndRef.current) {
      observer.observe(messagesEndRef.current);
    }

    return () => observer.disconnect();
  }, [messages.length]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  // Parse suggestions from AI response
  const parseSuggestions = (content: string): string[] => {
    // Match patterns like [选项A] | [选项B] | [选项C]
    const suggestionMatch = content.match(
      /\[([^\]]+)\]\s*\|\s*\[([^\]]+)\](?:\s*\|\s*\[([^\]]+)\])?(?:\s*\|\s*\[([^\]]+)\])?(?:\s*\|\s*\[([^\]]+)\])?/
    );
    if (suggestionMatch) {
      return suggestionMatch.slice(1).filter(Boolean);
    }

    // Also match A. B. C. options
    const optionMatches = content.match(/[A-D]\.\s+([^\n]+)/g);
    if (optionMatches && optionMatches.length >= 2) {
      return optionMatches.map((opt) =>
        opt
          .replace(/^[A-D]\.\s+/, "")
          .split(" - ")[0]
          .trim()
      );
    }

    return [];
  };

  return (
    <div className="flex-1 flex h-full overflow-hidden">
      {/* Left Sidebar - PRD Extraction */}
      <PrdExtractionSidebar
        prdData={prdData}
        competitorProducts={competitorProducts}
        className="w-[280px] flex-shrink-0 hidden md:flex"
      />

      {/* Right - Chat Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border/50 bg-card/30">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Bot className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">AI 产品经理</h3>
            <p className="text-xs text-muted-foreground">
              基于竞品分析，帮您定义理想产品
            </p>
          </div>
          <Badge variant="outline" className="ml-auto bg-background/50">
            <Sparkles className="w-3 h-3 mr-1" />
            产品顾问
          </Badge>
        </div>

        {/* PRD Completion Modal */}
        <AnimatePresence>
          {showPrdReadyPrompt && (
            <PrdCompletionCard
              onViewPrd={onPrdComplete}
              onContinueChat={onDismissPrdPrompt}
              autoNavigateDelay={5}
            />
          )}
        </AnimatePresence>

        {/* Chat Messages */}
        <div className="flex-1 min-h-0 overflow-hidden relative">
          <ScrollArea className="h-full [&>div[data-radix-scroll-area-viewport]]:h-full [&>div[data-radix-scroll-area-viewport]]:!block">
            <div className="p-5 max-w-3xl mx-auto space-y-5">
              {/* Empty State */}
              {messages.length === 0 && !isSending && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center py-12"
                >
                  <div className="w-16 h-16 mx-auto bg-primary/20 rounded-full flex items-center justify-center mb-4">
                    <Bot className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    AI 产品经理已就绪
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    我将分析您的竞品研究数据，通过方向性选择帮您快速定义产品需求。
                  </p>
                </motion.div>
              )}

              {/* Messages */}
              <AnimatePresence initial={false}>
                {messages.map((message, index) => {
                  const isLastAssistant =
                    message.role === "assistant" && index === messages.length - 1;
                  const suggestions =
                    isLastAssistant && !isStreaming
                      ? parseSuggestions(message.content)
                      : [];

                  return (
                    <ChatMessage
                      key={message.id}
                      role={message.role}
                      content={message.content}
                      isStreaming={
                        isStreaming && message === messages[messages.length - 1]
                      }
                      suggestions={suggestions}
                      onSuggestionClick={(suggestion) => onSendDirect(suggestion)}
                      showPmBadge={message.role === "assistant" && index === 0}
                    />
                  );
                })}
              </AnimatePresence>

              {/* Enhanced AI Thinking Indicator with Step Progress */}
              {isSending && !isStreaming && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col gap-4 p-6 rounded-2xl bg-gradient-to-br from-secondary/70 to-secondary/40 border border-primary/20 shadow-lg shadow-primary/5"
                >
                  {/* Header */}
                  <div className="flex items-center gap-3">
                    <motion.div 
                      className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-md"
                      animate={{ 
                        scale: [1, 1.08, 1],
                        boxShadow: [
                          "0 4px 14px 0 rgba(var(--primary), 0.25)",
                          "0 4px 20px 0 rgba(var(--primary), 0.4)",
                          "0 4px 14px 0 rgba(var(--primary), 0.25)"
                        ]
                      }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <Sparkles className="w-6 h-6 text-primary-foreground" />
                    </motion.div>
                    <div className="flex-1">
                      <p className="text-base font-semibold text-foreground">AI 产品经理正在思考</p>
                      <p className="text-sm text-muted-foreground">结合竞品数据生成专业建议，预计 10-15 秒...</p>
                    </div>
                  </div>
                  
                  {/* Enhanced Progress Bar */}
                  <div className="space-y-2">
                    <div className="relative h-2.5 bg-muted/60 rounded-full overflow-hidden">
                      <motion.div
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary via-accent to-primary rounded-full"
                        initial={{ width: "0%" }}
                        animate={{ width: ["5%", "35%", "65%", "85%", "95%"] }}
                        transition={{ 
                          duration: 12,
                          times: [0, 0.2, 0.5, 0.8, 1],
                          ease: "easeOut"
                        }}
                      />
                      {/* Shimmer effect */}
                      <motion.div
                        className="absolute inset-y-0 w-24 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                        animate={{ x: ["-100%", "500%"] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      />
                    </div>
                  </div>
                  
                  {/* Step Indicators */}
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: "分析数据", icon: "📊", delay: 0 },
                      { label: "整合洞察", icon: "🔍", delay: 3 },
                      { label: "生成提案", icon: "✨", delay: 6 }
                    ].map((step, index) => (
                      <motion.div
                        key={step.label}
                        className="flex flex-col items-center gap-2 p-3 rounded-xl bg-background/50 border border-border/50"
                        initial={{ opacity: 0.4, scale: 0.95 }}
                        animate={{ 
                          opacity: [0.4, 1, 0.7],
                          scale: [0.95, 1, 0.98],
                          borderColor: ["rgba(var(--border), 0.5)", "rgba(var(--primary), 0.5)", "rgba(var(--border), 0.5)"]
                        }}
                        transition={{ 
                          duration: 4,
                          delay: step.delay,
                          repeat: Infinity,
                          repeatDelay: 8
                        }}
                      >
                        <motion.span 
                          className="text-xl"
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 1, delay: step.delay, repeat: Infinity, repeatDelay: 11 }}
                        >
                          {step.icon}
                        </motion.span>
                        <span className="text-xs font-medium text-muted-foreground">{step.label}</span>
                        <motion.div 
                          className="w-full h-1 bg-muted/50 rounded-full overflow-hidden"
                        >
                          <motion.div
                            className="h-full bg-primary rounded-full"
                            initial={{ width: "0%" }}
                            animate={{ width: "100%" }}
                            transition={{ duration: 4, delay: step.delay, ease: "easeOut" }}
                          />
                        </motion.div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Scroll anchor */}
              <div ref={messagesEndRef} className="h-1" />
            </div>
          </ScrollArea>

          {/* Scroll to bottom button */}
          <AnimatePresence>
            {showScrollButton && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute bottom-4 right-4"
              >
                <Button
                  size="sm"
                  variant="secondary"
                  className="rounded-full shadow-lg gap-1"
                  onClick={() => scrollToBottom()}
                >
                  <ChevronDown className="w-4 h-4" />
                  回到底部
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Input Area */}
        <div className="border-t border-border/50 bg-background/50 backdrop-blur-sm p-4 flex-shrink-0">
          <div className="max-w-3xl mx-auto">
            <Card className="flex items-center gap-2 p-2 bg-card/50 border-border/50">
              <Input
                placeholder="输入您的想法，或点击上方选项快速选择..."
                value={inputValue}
                onChange={(e) => onInputChange(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isSending}
                className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
              />
              <Button
                size="icon"
                onClick={onSend}
                disabled={!inputValue.trim() || isSending}
                className="bg-gradient-primary glow-primary flex-shrink-0"
              >
                <Send className="w-4 h-4" />
              </Button>
            </Card>
            <p className="text-xs text-muted-foreground text-center mt-2">
              按 Enter 发送 · AI 产品经理将根据竞品数据给出专业建议
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
