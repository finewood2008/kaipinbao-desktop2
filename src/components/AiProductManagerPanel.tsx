import React, { useState, useRef, useEffect, useCallback, forwardRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, ChevronDown, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatMessage } from "@/components/ChatMessage";
import { PrdExtractionSidebar, PrdData, ReferenceImage } from "@/components/PrdExtractionSidebar";
import { PrdCompletionCard } from "@/components/PrdCompletionCard";
import { AiThinkingIndicator } from "@/components/AiThinkingIndicator";
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
  referenceImages?: ReferenceImage[];
  isUploadingImage?: boolean;
  onInputChange: (value: string) => void;
  onSend: () => void;
  onSendDirect: (message: string) => void;
  onPrdComplete: () => void;
  showPrdReadyPrompt: boolean;
  onDismissPrdPrompt: () => void;
  isReadOnly?: boolean;
  onFieldEdit?: (field: string, value: unknown) => void;
  onProceedToDesign?: () => void;
  onOpenPrdDocument?: () => void;
  onImageRemove?: (imageId: string) => void;
}

export const AiProductManagerPanel = forwardRef<HTMLDivElement, AiProductManagerPanelProps>(
  function AiProductManagerPanel(
    {
      projectId,
      messages,
      isStreaming,
      isSending,
      inputValue,
      prdData,
      competitorProducts = [],
      referenceImages = [],
      isUploadingImage = false,
      onInputChange,
      onSend,
      onSendDirect,
      onPrdComplete,
      showPrdReadyPrompt,
      onDismissPrdPrompt,
      isReadOnly = false,
      onFieldEdit,
      onProceedToDesign,
      onOpenPrdDocument,
      onImageRemove,
    },
    ref
  ) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [showScrollButton, setShowScrollButton] = useState(false);

  // Scroll to bottom function
  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior });
    }
  }, []);

  // Auto-scroll when new messages arrive or streaming
  useEffect(() => {
    if (isAtBottom || isStreaming) {
      scrollToBottom(isStreaming ? "auto" : "smooth");
    }
  }, [messages, isStreaming, isAtBottom, scrollToBottom]);

  // Detect if user is at bottom using IntersectionObserver
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
    <div ref={ref} className="h-full grid grid-cols-1 md:grid-cols-[260px_1fr] overflow-hidden">
      {/* Left Sidebar - PRD Extraction */}
      <PrdExtractionSidebar
        prdData={prdData}
        competitorProducts={competitorProducts}
        referenceImages={referenceImages}
        className="hidden md:flex"
        isEditable={!isReadOnly}
        onFieldEdit={onFieldEdit}
        onProceedToDesign={onProceedToDesign}
        onOpenPrdDocument={onOpenPrdDocument}
        onImageRemove={onImageRemove}
      />

      {/* Right - Chat Area */}
      <div className="flex flex-col h-full min-h-0 overflow-hidden">
        {/* Header - Compact */}
        <div className="flex-shrink-0 h-12 flex items-center gap-2.5 px-4 border-b border-border/50 bg-card/20">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Bot className="w-4 h-4 text-primary-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-foreground truncate">AI 产品经理</h3>
          </div>
          <Badge variant="outline" className="flex-shrink-0 bg-background/50 text-xs">
            <Sparkles className="w-3 h-3 mr-1" />
            顾问
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

        {/* Messages Container - Scrollable with absolute positioning */}
        <div className="flex-1 min-h-0 relative">
          <div className="absolute inset-0 flex flex-col">
            <ScrollArea ref={scrollAreaRef} className="h-full w-full">
              <div className="p-4 max-w-2xl mx-auto space-y-4">
                {/* Empty State - Compact */}
                {messages.length === 0 && !isSending && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-8"
                  >
                    <div className="w-12 h-12 mx-auto bg-primary/20 rounded-xl flex items-center justify-center mb-3">
                      <Bot className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="text-base font-semibold text-foreground mb-1">
                      AI 产品经理已就绪
                    </h3>
                    <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                      通过对话帮您定义产品需求
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

                {/* AI Thinking Indicator */}
                <AnimatePresence>
                  {isSending && !isStreaming && <AiThinkingIndicator />}
                </AnimatePresence>

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
                  className="absolute bottom-4 right-4 z-10"
                >
                  <Button
                    size="sm"
                    variant="secondary"
                    className="rounded-full shadow-lg gap-1.5 bg-primary/90 hover:bg-primary text-primary-foreground"
                    onClick={() => scrollToBottom()}
                  >
                    <ChevronDown className="w-4 h-4" />
                    回到底部
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Input Area - Compact */}
        {!isReadOnly ? (
          <div className="flex-shrink-0 border-t border-border/50 bg-background/50 backdrop-blur-sm p-3">
            <div className="max-w-2xl mx-auto">
              <Card className="flex items-center gap-2 p-1.5 bg-card/50 border-border/50">
                <Input
                  placeholder="输入您的想法..."
                  value={inputValue}
                  onChange={(e) => onInputChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isSending}
                  className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 h-9 text-sm"
                />
                <Button
                  size="icon"
                  onClick={onSend}
                  disabled={!inputValue.trim() || isSending}
                  className="bg-gradient-primary glow-primary flex-shrink-0 h-8 w-8"
                >
                  <Send className="w-3.5 h-3.5" />
                </Button>
              </Card>
              <p className="text-[10px] text-muted-foreground text-center mt-1.5">
                按 Enter 发送 · 在左侧边栏上传参考图片
              </p>
            </div>
          </div>
        ) : (
          <div className="flex-shrink-0 border-t border-border/50 bg-muted/30 p-3">
            <div className="max-w-2xl mx-auto text-center">
              <p className="text-xs text-muted-foreground">
                📖 只读模式 - 产品定义阶段已完成
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

AiProductManagerPanel.displayName = "AiProductManagerPanel";
