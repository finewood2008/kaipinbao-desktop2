import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatMessage } from "@/components/ChatMessage";
import { CompetitorInsightCard } from "@/components/CompetitorInsightCard";

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

interface PrdChatPanelProps {
  messages: Message[];
  isStreaming: boolean;
  isSending: boolean;
  inputValue: string;
  competitorInsight?: CompetitorInsight | null;
  showInsightCard?: boolean;
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
  onInputChange,
  onSend,
  onSuggestionClick,
}: PrdChatPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  // Parse suggestions from AI response
  const parseSuggestions = (content: string): string[] => {
    const suggestionMatch = content.match(/\[([^\]]+)\]\s*\|\s*\[([^\]]+)\](?:\s*\|\s*\[([^\]]+)\])?(?:\s*\|\s*\[([^\]]+)\])?(?:\s*\|\s*\[([^\]]+)\])?/);
    if (suggestionMatch) {
      return suggestionMatch.slice(1).filter(Boolean);
    }
    return [];
  };

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Chat Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="max-w-3xl mx-auto space-y-4">
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
                开始PRD对话
              </h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                我将基于竞品分析数据，引导您完成产品需求定义。请描述您的产品想法，或让我先给出一些建议。
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
              <span className="text-sm">AI正在思考...</span>
            </motion.div>
          )}
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="border-t border-border/50 bg-background/50 backdrop-blur-sm p-4">
        <div className="max-w-3xl mx-auto">
          <Card className="flex items-center gap-2 p-2 bg-card/50 border-border/50">
            <Input
              placeholder="输入您的产品想法或回答问题..."
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
            按 Enter 发送 · AI将根据竞品数据给出专业建议
          </p>
        </div>
      </div>
    </div>
  );
}
