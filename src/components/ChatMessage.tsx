import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";
import { Bot, User } from "lucide-react";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
}

export function ChatMessage({ role, content, isStreaming }: ChatMessageProps) {
  const isAssistant = role === "assistant";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex gap-3 p-4 rounded-lg",
        isAssistant ? "bg-secondary/50" : "bg-card"
      )}
    >
      <div
        className={cn(
          "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
          isAssistant ? "bg-gradient-primary" : "bg-muted"
        )}
      >
        {isAssistant ? (
          <Bot className="w-4 h-4 text-primary-foreground" />
        ) : (
          <User className="w-4 h-4 text-foreground" />
        )}
      </div>
      <div className="flex-1 overflow-hidden">
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
            {content}
          </ReactMarkdown>
        </div>
        {isStreaming && (
          <motion.span
            className="inline-block w-2 h-4 bg-primary ml-1"
            animate={{ opacity: [1, 0] }}
            transition={{ duration: 0.5, repeat: Infinity }}
          />
        )}
      </div>
    </motion.div>
  );
}
