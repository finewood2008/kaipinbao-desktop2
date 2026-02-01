import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { 
  Video, 
  Loader2, 
  Play, 
  RefreshCw, 
  Trash2,
  Plus,
  Sparkles,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface GeneratedVideo {
  id: string;
  video_url: string | null;
  prompt: string;
  scene_description: string | null;
  duration_seconds: number;
  status: string;
}

interface VideoGenerationSectionProps {
  projectId: string;
  parentImageId?: string;
  parentImageUrl?: string;
  videos: GeneratedVideo[];
  onVideosChange: (videos: GeneratedVideo[]) => void;
  usageScenarios?: string[];
}

export function VideoGenerationSection({
  projectId,
  parentImageId,
  parentImageUrl,
  videos,
  onVideosChange,
  usageScenarios = [],
}: VideoGenerationSectionProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState<string>("");
  const [customScenario, setCustomScenario] = useState("");
  const [generationProgress, setGenerationProgress] = useState(0);

  // Poll for video status updates
  useEffect(() => {
    const pendingVideos = videos.filter(v => v.status === "pending" || v.status === "processing");
    if (pendingVideos.length === 0) return;

    const interval = setInterval(async () => {
      const { data, error } = await supabase
        .from("generated_videos")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: true });

      if (!error && data) {
        onVideosChange(data as GeneratedVideo[]);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [videos, projectId, onVideosChange]);

  const generateVideo = async () => {
    const scenario = customScenario || selectedScenario;
    if (!scenario.trim()) {
      toast.error("请选择或输入使用场景描述");
      return;
    }

    if (!parentImageId) {
      toast.error("请先选择产品造型");
      return;
    }

    setIsGenerating(true);
    setGenerationProgress(0);

    // Simulate progress while generating
    const progressInterval = setInterval(() => {
      setGenerationProgress(prev => Math.min(prev + 10, 90));
    }, 2000);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-video`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            projectId,
            sceneDescription: scenario,
            parentImageId,
            parentImageUrl,
            duration: 6,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "视频生成失败");
      }

      const data = await response.json();

      // Add new video to list
      onVideosChange([...videos, data.video as GeneratedVideo]);
      
      setGenerationProgress(100);
      toast.success("视频生成任务已创建，请等待生成完成");
      setCustomScenario("");
      setSelectedScenario("");
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "视频生成失败");
    } finally {
      clearInterval(progressInterval);
      setIsGenerating(false);
      setGenerationProgress(0);
    }
  };

  const deleteVideo = async (videoId: string) => {
    const { error } = await supabase
      .from("generated_videos")
      .delete()
      .eq("id", videoId);

    if (error) {
      toast.error("删除失败");
    } else {
      onVideosChange(videos.filter(v => v.id !== videoId));
      toast.success("视频已删除");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="secondary" className="gap-1">
            <Clock className="w-3 h-3" />
            等待中
          </Badge>
        );
      case "processing":
        return (
          <Badge variant="secondary" className="gap-1 bg-stage-2/20 text-stage-2">
            <Loader2 className="w-3 h-3 animate-spin" />
            生成中
          </Badge>
        );
      case "completed":
        return (
          <Badge variant="secondary" className="gap-1 bg-green-500/20 text-green-500">
            <CheckCircle className="w-3 h-3" />
            已完成
          </Badge>
        );
      case "failed":
        return (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="w-3 h-3" />
            失败
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <Card className="glass border-border/50">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Video className="w-5 h-5 text-stage-2" />
          视频生成
          <Badge variant="outline" className="ml-2 font-normal">
            6秒产品视频
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Scenario Selection */}
        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-2 flex items-center gap-2">
              选择使用场景
              <span className="text-xs text-muted-foreground font-normal">
                (基于PRD中的场景定义)
              </span>
            </h4>
            
            {usageScenarios.length > 0 ? (
              <div className="flex flex-wrap gap-2 mb-3">
                {usageScenarios.map((scenario, index) => (
                  <Button
                    key={index}
                    variant={selectedScenario === scenario ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setSelectedScenario(scenario);
                      setCustomScenario("");
                    }}
                    className={cn(
                      "transition-all",
                      selectedScenario === scenario && "bg-stage-2 hover:bg-stage-2/90"
                    )}
                  >
                    {scenario}
                  </Button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground mb-3">
                暂无PRD场景定义，请在下方输入自定义场景
              </p>
            )}
          </div>

          <div>
            <h4 className="font-medium mb-2">或自定义场景描述</h4>
            <Textarea
              placeholder="例如：展示用户在办公室使用产品的场景，产品放在桌面上，用户自然地与产品互动..."
              value={customScenario}
              onChange={(e) => {
                setCustomScenario(e.target.value);
                setSelectedScenario("");
              }}
              rows={3}
            />
          </div>

          {/* Generate Button */}
          <Button
            onClick={generateVideo}
            disabled={isGenerating || (!selectedScenario && !customScenario.trim())}
            className="w-full bg-gradient-to-r from-stage-2 to-accent"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                正在生成视频...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                生成6秒产品视频
              </>
            )}
          </Button>

          {/* Generation Progress */}
          {isGenerating && (
            <div className="space-y-2">
              <Progress value={generationProgress} className="h-2" />
              <p className="text-xs text-muted-foreground text-center">
                视频生成中，这可能需要几分钟...
              </p>
            </div>
          )}
        </div>

        {/* Generated Videos */}
        {videos.length > 0 && (
          <div className="space-y-4">
            <h4 className="font-medium flex items-center gap-2">
              已生成的视频
              <Badge variant="outline">{videos.length}</Badge>
            </h4>
            
            <div className="grid gap-4">
              <AnimatePresence mode="popLayout">
                {videos.map((video) => (
                  <motion.div
                    key={video.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <Card className="overflow-hidden">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          {/* Video Preview / Placeholder */}
                          <div className="w-40 aspect-video bg-muted rounded-lg overflow-hidden relative flex-shrink-0">
                            {video.status === "completed" && video.video_url ? (
                              <video
                                src={video.video_url}
                                className="w-full h-full object-cover"
                                controls
                              />
                            ) : (
                              <div className="absolute inset-0 flex items-center justify-center">
                                {video.status === "processing" ? (
                                  <Loader2 className="w-8 h-8 text-stage-2 animate-spin" />
                                ) : video.status === "pending" ? (
                                  <Clock className="w-8 h-8 text-muted-foreground" />
                                ) : (
                                  <AlertCircle className="w-8 h-8 text-destructive" />
                                )}
                              </div>
                            )}
                          </div>

                          {/* Video Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              {getStatusBadge(video.status)}
                              <span className="text-sm text-muted-foreground">
                                {video.duration_seconds}秒
                              </span>
                            </div>
                            <p className="text-sm line-clamp-2 mb-2">
                              {video.scene_description || video.prompt}
                            </p>
                          </div>

                          {/* Actions */}
                          <div className="flex flex-col gap-2">
                            {video.status === "completed" && video.video_url && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => window.open(video.video_url!, "_blank")}
                              >
                                <Play className="w-4 h-4 mr-1" />
                                播放
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive hover:text-destructive"
                              onClick={() => deleteVideo(video.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* Empty State */}
        {videos.length === 0 && !isGenerating && (
          <div className="text-center py-8 text-muted-foreground">
            <Video className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>选择场景后生成产品展示视频</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
