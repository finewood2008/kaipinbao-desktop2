import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";
import { Bot, User, Briefcase, Sparkles } from "lucide-react";
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
      initial={{ opacity: 0, y: 15, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={cn(
        "flex gap-4 p-5 rounded-2xl transition-all duration-200",
        isAssistant 
          ? "bg-gradient-to-br from-secondary/60 to-secondary/30 border border-border/30 shadow-sm" 
          : "bg-card/80 border border-border/20"
      )}
    >
      <div className="flex-shrink-0">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 500 }}
          className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center shadow-md",
            isAssistant 
              ? "bg-gradient-to-br from-primary to-accent" 
              : "bg-gradient-to-br from-muted to-muted/50"
          )}
        >
          {isAssistant ? (
            <Briefcase className="w-5 h-5 text-primary-foreground" />
          ) : (
            <User className="w-5 h-5 text-foreground" />
          )}
        </motion.div>
      </div>
      <div className="flex-1 min-w-0">
        {/* PM Badge for assistant */}
        {isAssistant && showPmBadge && (
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-2 mb-3"
          >
            <Badge variant="secondary" className="text-xs bg-primary/15 text-primary border-primary/25 px-2.5 py-1">
              <Sparkles className="w-3 h-3 mr-1.5" />
              产品经理顾问
            </Badge>
          </motion.div>
        )}
        <div className="prose prose-sm prose-invert max-w-none leading-relaxed">
          <ReactMarkdown
            components={{
              p: ({ children }) => (
                <p className="mb-3 last:mb-0 text-foreground/90 leading-7">{children}</p>
              ),
              ul: ({ children }) => (
                <ul className="list-none pl-0 mb-4 space-y-2">{children}</ul>
              ),
              ol: ({ children }) => (
                <ol className="list-decimal pl-5 mb-4 space-y-2">{children}</ol>
              ),
              li: ({ children }) => (
                <li className="mb-1.5 text-foreground/85 leading-6 flex items-start gap-2">
                  <span className="text-primary mt-1.5 text-xs">●</span>
                  <span>{children}</span>
                </li>
              ),
              strong: ({ children }) => (
                <strong className="text-primary font-semibold">{children}</strong>
              ),
              h1: ({ children }) => (
                <h1 className="text-xl font-bold text-foreground mb-4 mt-6 first:mt-0">{children}</h1>
              ),
              h2: ({ children }) => (
                <h2 className="text-lg font-semibold text-foreground mb-3 mt-5 first:mt-0 flex items-center gap-2">
                  <span className="w-1 h-5 bg-primary rounded-full" />
                  {children}
                </h2>
              ),
              h3: ({ children }) => (
                <h3 className="text-base font-semibold text-foreground/90 mb-2 mt-4 first:mt-0">{children}</h3>
              ),
              blockquote: ({ children }) => (
                <blockquote className="border-l-3 border-primary/50 pl-4 py-2 my-4 bg-primary/5 rounded-r-lg italic text-foreground/80">
                  {children}
                </blockquote>
              ),
              code: ({ children }) => (
                <code className="bg-muted/80 px-2 py-1 rounded-md text-sm font-mono text-primary">{children}</code>
              ),
              hr: () => (
                <hr className="my-6 border-border/50" />
              ),
            }}
          >
            {displayContent}
          </ReactMarkdown>
        </div>
        {isStreaming && (
          <motion.div className="flex items-center gap-2 mt-3">
            <motion.span
              className="inline-block w-2 h-5 bg-primary rounded-sm"
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 0.8, repeat: Infinity }}
            />
            <span className="text-xs text-muted-foreground">正在输入...</span>
          </motion.div>
        )}
        
        {/* Suggestion Chips */}
        {isAssistant && suggestions && suggestions.length > 0 && !isStreaming && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-5 pt-4 border-t border-border/30 flex flex-wrap gap-2"
          >
            {suggestions.map((suggestion, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 + index * 0.1 }}
              >
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs bg-background/60 hover:bg-primary/20 hover:border-primary/50 hover:text-primary transition-all duration-200 rounded-full px-4"
                  onClick={() => onSuggestionClick?.(suggestion)}
                >
                  {suggestion}
                </Button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
