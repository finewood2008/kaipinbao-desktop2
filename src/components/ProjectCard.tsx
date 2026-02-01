import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Calendar, MessageSquare, Palette, Rocket } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";

interface ProjectCardProps {
  id: string;
  name: string;
  description?: string;
  currentStage: number;
  status: string;
  createdAt: string;
  coverImage?: string;
  onClick: () => void;
}

const stageInfo = [
  { label: "PRD细化", icon: MessageSquare, color: "bg-stage-1" },
  { label: "视觉生成", icon: Palette, color: "bg-stage-2" },
  { label: "落地页", icon: Rocket, color: "bg-stage-3" },
];

export function ProjectCard({
  name,
  description,
  currentStage,
  status,
  createdAt,
  coverImage,
  onClick,
}: ProjectCardProps) {
  // Get initials for placeholder
  const initials = name.slice(0, 2).toUpperCase();
  const stage = stageInfo[currentStage - 1];
  const StageIcon = stage?.icon || MessageSquare;

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card
        className="glass cursor-pointer transition-all duration-300 hover:glow-card group"
        onClick={onClick}
      >
        <CardHeader className="pb-2">
          <div className="flex gap-4">
            {/* Cover Image / Placeholder */}
            <div className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5">
              {coverImage ? (
                <img 
                  src={coverImage} 
                  alt={name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/30 to-accent/30">
                  <span className="text-2xl font-bold text-primary/70">{initials}</span>
                </div>
              )}
            </div>
            
            {/* Title and Badge */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-lg font-semibold line-clamp-1">{name}</CardTitle>
                <Badge
                  variant={status === "completed" ? "default" : "secondary"}
                  className={cn(
                    "flex-shrink-0",
                    status === "completed" && "bg-stage-3",
                    status === "active" && "bg-primary"
                  )}
                >
                  {status === "completed" ? "已完成" : status === "active" ? "进行中" : "已归档"}
                </Badge>
              </div>
              {description && (
                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                  {description}
                </p>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={cn("p-1.5 rounded-md", stage?.color || "bg-muted")}>
                <StageIcon className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="text-sm text-muted-foreground">
                阶段 {currentStage}: {stage?.label}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            >
              继续 <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
          <div className="flex items-center gap-1 mt-3 text-xs text-muted-foreground">
            <Calendar className="w-3 h-3" />
            <span>
              {format(new Date(createdAt), "yyyy年MM月dd日", { locale: zhCN })}
            </span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
