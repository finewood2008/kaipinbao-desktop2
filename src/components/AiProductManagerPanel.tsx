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
          <ScrollArea className="h-full [&>div[data-radix-scroll-area-viewport]]:h-full">
            <div className="p-4 max-w-3xl mx-auto space-y-4">
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

              {/* Thinking Indicator */}
              {isSending && !isStreaming && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-2 text-muted-foreground p-4"
                >
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">产品经理正在分析...</span>
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
