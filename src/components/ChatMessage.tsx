import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";
import { Bot, User, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
  suggestions?: string[];
  onSuggestionClick?: (suggestion: string) => void;
  showPmBadge?: boolean;
}

export function ChatMessage({ 
  role, 
  content, 
  isStreaming, 
  suggestions,
  onSuggestionClick,
  showPmBadge = true,
}: ChatMessageProps) {
  const isAssistant = role === "assistant";
  
  // Clean content: remove prd-data blocks from display
  const displayContent = content.replace(/```prd-data[\s\S]*?```/g, "").trim();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex gap-3 p-4 rounded-lg",
        isAssistant ? "bg-secondary/50" : "bg-card"
      )}
    >
      <div className="flex-shrink-0">
        <div
          className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center",
            isAssistant ? "bg-gradient-primary" : "bg-muted"
          )}
        >
          {isAssistant ? (
            <Briefcase className="w-4 h-4 text-primary-foreground" />
          ) : (
            <User className="w-4 h-4 text-foreground" />
          )}
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        {/* PM Badge for assistant */}
        {isAssistant && showPmBadge && (
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-primary/20">
              <Briefcase className="w-3 h-3 mr-1" />
              产品经理顾问
            </Badge>
          </div>
        )}
        <div className="prose prose-sm prose-invert max-w-none">
          <ReactMarkdown
            components={{
              p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
              ul: ({ children }) => <ul className="list-disc pl-4 mb-2">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal pl-4 mb-2">{children}</ol>,
              li: ({ children }) => <li className="mb-1">{children}</li>,
              strong: ({ children }) => <strong className="text-primary font-semibold">{children}</strong>,
              code: ({ children }) => (
                <code className="bg-muted px-1.5 py-0.5 rounded text-sm">{children}</code>
              ),
            }}
          >
            {displayContent}
          </ReactMarkdown>
        </div>
        {isStreaming && (
          <motion.span
            className="inline-block w-2 h-4 bg-primary ml-1"
            animate={{ opacity: [1, 0] }}
            transition={{ duration: 0.5, repeat: Infinity }}
          />
        )}
        
        {/* Suggestion Chips */}
        {isAssistant && suggestions && suggestions.length > 0 && !isStreaming && (
          <motion.div 
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-4 flex flex-wrap gap-2"
          >
            {suggestions.map((suggestion, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                className="text-xs bg-background/50 hover:bg-primary/20 hover:border-primary/50 transition-all"
                onClick={() => onSuggestionClick?.(suggestion)}
              >
                {suggestion}
              </Button>
            ))}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
