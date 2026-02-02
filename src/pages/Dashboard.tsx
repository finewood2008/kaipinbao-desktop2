import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ProjectCard } from "@/components/ProjectCard";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { LogOut, Plus, Search, Sparkles, Loader2 } from "lucide-react";
import logoImage from "@/assets/logo.png";

interface Project {
  id: string;
  name: string;
  description: string | null;
  current_stage: number;
  status: string;
  created_at: string;
  cover_image_url: string | null;
}

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    // Fetch projects with cover images
    const { data, error } = await supabase
      .from("projects")
      .select(`
        *,
        generated_images!generated_images_project_id_fkey (
          image_url
        )
      `)
      .eq("generated_images.is_selected", true)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("获取项目失败");
      console.error(error);
    } else {
      // Map projects with cover images
      const projectsWithCovers: Project[] = (data || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        current_stage: p.current_stage,
        status: p.status,
        created_at: p.created_at,
        cover_image_url: p.cover_image_url || p.generated_images?.[0]?.image_url || null,
      }));
      setProjects(projectsWithCovers);
    }
    setIsLoading(false);
  };

  const handleCreateProject = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsCreating(true);
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;

    const { data, error } = await supabase
      .from("projects")
      .insert({
        name,
        description: description || null,
        user_id: user?.id,
      })
      .select()
      .single();

    setIsCreating(false);

    if (error) {
      toast.error("创建项目失败");
      console.error(error);
    } else {
      toast.success("项目创建成功！");
      setIsDialogOpen(false);
      navigate(`/project/${data.id}`);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const filteredProjects = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-dark">
      {/* Header */}
      <header className="border-b border-border/50 glass sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logoImage} alt="KAI Logo" className="h-10" />
            <p className="text-xs text-muted-foreground">产品研发工作台</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden md:block">
              {user?.email}
            </span>
            <Button variant="ghost" size="icon" onClick={handleSignOut}>
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
        >
          {[
            { label: "全部项目", value: projects.length },
            { label: "进行中", value: projects.filter((p) => p.status === "active").length },
            { label: "已完成", value: projects.filter((p) => p.status === "completed").length },
            { label: "已归档", value: projects.filter((p) => p.status === "archived").length },
          ].map((stat, i) => (
            <div key={stat.label} className="p-4 rounded-xl glass">
              <motion.p
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className="text-2xl font-bold text-gradient"
              >
                {stat.value}
              </motion.p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </motion.div>

        {/* Actions */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="搜索项目..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-primary glow-primary">
                <Plus className="w-4 h-4 mr-2" />
                新建项目
              </Button>
            </DialogTrigger>
            <DialogContent className="glass">
              <DialogHeader>
                <DialogTitle>创建新产品项目</DialogTitle>
                <DialogDescription>
                  开始您的产品研发之旅，AI将引导您完成从创意到市场测试的全过程
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateProject} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">项目名称</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="例如：智能保温杯"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">简要描述（可选）</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="简单描述您想要开发的产品..."
                    rows={3}
                  />
                </div>
                <Button type="submit" className="w-full bg-gradient-primary" disabled={isCreating}>
                  {isCreating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  开始研发
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Projects Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredProjects.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">
              {searchQuery ? "未找到匹配的项目" : "还没有项目"}
            </h3>
            <p className="text-muted-foreground mb-6">
              {searchQuery ? "尝试其他关键词" : "点击「新建项目」开始您的产品研发之旅"}
            </p>
          </motion.div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project, i) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <ProjectCard
                  id={project.id}
                  name={project.name}
                  description={project.description || undefined}
                  currentStage={project.current_stage}
                  status={project.status}
                  createdAt={project.created_at}
                  coverImage={project.cover_image_url || undefined}
                  onClick={() => navigate(`/project/${project.id}`)}
                />
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
