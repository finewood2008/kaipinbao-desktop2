import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Loader2, Sparkles, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatMessage } from "@/components/ChatMessage";
import { CompetitorInsightCard } from "@/components/CompetitorInsightCard";
import { ChatProgressIndicator } from "@/components/ChatProgressIndicator";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  stage: number;
}

interface CompetitorInsight {
  positivePoints: string[];
  negativePoints: string[];
  totalReviews: number;
  productsAnalyzed: number;
  products?: Array<{
    title: string;
    rating: number;
    reviewCount: number;
  }>;
}

interface PrdData {
  usageScenario?: string | null;
  targetAudience?: string | null;
  designStyle?: string | null;
  coreFeatures?: string[] | null;
}

interface PrdChatPanelProps {
  messages: Message[];
  isStreaming: boolean;
  isSending: boolean;
  inputValue: string;
  competitorInsight?: CompetitorInsight | null;
  showInsightCard?: boolean;
  prdData?: PrdData | null;
  onInputChange: (value: string) => void;
  onSend: () => void;
  onSuggestionClick: (suggestion: string) => void;
}

export function PrdChatPanel({
  messages,
  isStreaming,
  isSending,
  inputValue,
  competitorInsight,
  showInsightCard = true,
  prdData,
  onInputChange,
  onSend,
  onSuggestionClick,
}: PrdChatPanelProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [showScrollButton, setShowScrollButton] = useState(false);

  // Calculate progress stages
  const progressStages = [
    { name: "产品定位", completed: !!prdData?.usageScenario },
    { name: "用户画像", completed: !!prdData?.targetAudience },
    { name: "风格选择", completed: !!prdData?.designStyle },
    { name: "核心功能", completed: !!(prdData?.coreFeatures?.length) },
  ];
  const currentProgressStage = progressStages.findIndex((s) => !s.completed);

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
    const suggestionMatch = content.match(/\[([^\]]+)\]\s*\|\s*\[([^\]]+)\](?:\s*\|\s*\[([^\]]+)\])?(?:\s*\|\s*\[([^\]]+)\])?(?:\s*\|\s*\[([^\]]+)\])?/);
    if (suggestionMatch) {
      return suggestionMatch.slice(1).filter(Boolean);
    }
    
    // Also match A. B. C. options
    const optionMatches = content.match(/[A-D]\.\s+([^\n]+)/g);
    if (optionMatches && optionMatches.length >= 2) {
      return optionMatches.map(opt => opt.replace(/^[A-D]\.\s+/, "").split(" - ")[0].trim());
    }
    
    return [];
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Progress Indicator */}
      {messages.length > 0 && (
        <ChatProgressIndicator
          stages={progressStages}
          currentStage={currentProgressStage >= 0 ? currentProgressStage : progressStages.length}
        />
      )}

      {/* Chat Messages - Scrollable Container */}
      <div className="flex-1 overflow-hidden relative">
        <ScrollArea className="h-full" ref={scrollContainerRef}>
          <div className="p-4 max-w-3xl mx-auto space-y-4">
            {/* Competitor Insight Card - shown at the beginning if available */}
            {showInsightCard && competitorInsight && competitorInsight.productsAnalyzed > 0 && messages.length <= 2 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6"
              >
                <CompetitorInsightCard insight={competitorInsight} />
              </motion.div>
            )}

            {/* Empty State */}
            {messages.length === 0 && !isSending && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-12"
              >
                <div className="w-16 h-16 mx-auto bg-primary/20 rounded-full flex items-center justify-center mb-4">
                  <Sparkles className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  开始 PRD 对话
                </h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  我是您的产品经理顾问，将基于竞品分析数据，通过 2-4 轮方向性选择，快速帮您生成完整的产品需求文档。
                </p>
              </motion.div>
            )}

            {/* Messages */}
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
                    onSuggestionClick={onSuggestionClick}
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
            按 Enter 发送 · 产品经理将根据竞品数据给出专业方向建议
          </p>
        </div>
      </div>
    </div>
  );
}
