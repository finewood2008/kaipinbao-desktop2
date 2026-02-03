import { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
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
import { LogOut, Plus, Search, Sparkles, Loader2, Globe, Eye, Mail, Filter } from "lucide-react";
import logoImage from "@/assets/logo.png";
import { cn } from "@/lib/utils";

interface LandingPageData {
  id: string;
  slug: string;
  is_published: boolean;
  hero_image_url: string | null;
  view_count: number;
}

interface Project {
  id: string;
  name: string;
  description: string | null;
  current_stage: number;
  status: string;
  created_at: string;
  cover_image_url: string | null;
  product_images: string[];
  landing_page: LandingPageData | null;
  email_count: number;
}

type StageFilter = "all" | 1 | 2 | 3 | 4;
type StatusFilter = "all" | "active" | "completed" | "archived";

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [stageFilter, setStageFilter] = useState<StageFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    // Fetch projects with landing pages, email counts, and all generated images
    const { data, error } = await supabase
      .from("projects")
      .select(`
        *,
        landing_pages (
          id,
          slug,
          is_published,
          hero_image_url,
          view_count
        ),
        generated_images (
          image_url,
          image_type,
          is_selected
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("获取项目失败");
      console.error(error);
      setIsLoading(false);
      return;
    }

    // Fetch email counts for all landing pages
    const landingPageIds = (data || [])
      .filter((p: any) => p.landing_pages)
      .map((p: any) => p.landing_pages.id);

    let emailCounts: Record<string, number> = {};
    if (landingPageIds.length > 0) {
      const { data: emailData } = await supabase
        .from("email_submissions")
        .select("landing_page_id")
        .in("landing_page_id", landingPageIds);

      if (emailData) {
        emailCounts = emailData.reduce((acc: Record<string, number>, item) => {
          acc[item.landing_page_id] = (acc[item.landing_page_id] || 0) + 1;
          return acc;
        }, {});
      }
    }

    // Map projects with all data
    const projectsWithData: Project[] = (data || []).map((p: any) => {
      // Get all product images, prioritizing selected ones
      const allImages = p.generated_images || [];
      const selectedImages = allImages
        .filter((img: any) => img.is_selected)
        .map((img: any) => img.image_url);
      const otherImages = allImages
        .filter((img: any) => !img.is_selected && img.image_type === 'product')
        .map((img: any) => img.image_url);
      const productImages = [...selectedImages, ...otherImages].slice(0, 4);

      return {
        id: p.id,
        name: p.name,
        description: p.description,
        current_stage: p.current_stage,
        status: p.status,
        created_at: p.created_at,
        cover_image_url: p.cover_image_url || productImages[0] || null,
        product_images: productImages,
        landing_page: p.landing_pages || null,
        email_count: p.landing_pages ? (emailCounts[p.landing_pages.id] || 0) : 0,
      };
    });

    setProjects(projectsWithData);
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

  const handleDeleteProject = async (projectId: string) => {
    const { error } = await supabase
      .from("projects")
      .delete()
      .eq("id", projectId);

    if (error) {
      toast.error("删除项目失败");
      console.error(error);
    } else {
      toast.success("项目已删除");
      // Remove from local state
      setProjects(prev => prev.filter(p => p.id !== projectId));
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  // Calculate stats
  const stats = useMemo(() => {
    const totalViews = projects.reduce((sum, p) => sum + (p.landing_page?.view_count || 0), 0);
    const totalEmails = projects.reduce((sum, p) => sum + p.email_count, 0);
    const publishedPages = projects.filter(p => p.landing_page?.is_published).length;
    
    return {
      total: projects.length,
      active: projects.filter(p => p.status === "active").length,
      completed: projects.filter(p => p.status === "completed").length,
      archived: projects.filter(p => p.status === "archived").length,
      publishedPages,
      totalViews,
      totalEmails,
    };
  }, [projects]);

  // Filter projects
  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      const matchesSearch = 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStage = stageFilter === "all" || p.current_stage === stageFilter;
      const matchesStatus = statusFilter === "all" || p.status === statusFilter;
      
      return matchesSearch && matchesStage && matchesStatus;
    });
  }, [projects, searchQuery, stageFilter, statusFilter]);

  const stageFilters = [
    { value: "all" as const, label: "全部阶段" },
    { value: 1 as const, label: "市场调研" },
    { value: 2 as const, label: "产品定义" },
    { value: 3 as const, label: "视觉生成" },
    { value: 4 as const, label: "落地页" },
  ];

  const statusFilters = [
    { value: "all" as const, label: "全部状态" },
    { value: "active" as const, label: "进行中" },
    { value: "completed" as const, label: "已完成" },
    { value: "archived" as const, label: "已归档" },
  ];

  return (
    <div className="min-h-screen bg-gradient-dark">
      {/* Header */}
      <header className="border-b border-border/50 glass sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <img src={logoImage} alt="开品宝" className="h-10" />
            <span className="text-xl font-bold text-foreground">开品宝</span>
            <span className="text-xs text-muted-foreground hidden md:block">产品研发工作台</span>
          </Link>
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
        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8"
        >
          {[
            { label: "全部项目", value: stats.total, icon: null },
            { label: "进行中", value: stats.active, icon: null },
            { label: "已完成", value: stats.completed, icon: null },
            { label: "已归档", value: stats.archived, icon: null },
            { label: "已发布落地页", value: stats.publishedPages, icon: Globe },
            { label: "总访问量", value: stats.totalViews, icon: Eye },
            { label: "邮件订阅", value: stats.totalEmails, icon: Mail },
          ].map((stat, i) => (
            <div key={stat.label} className="p-4 rounded-xl glass">
              <div className="flex items-center gap-2">
                {stat.icon && <stat.icon className="w-4 h-4 text-muted-foreground" />}
                <motion.p
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="text-2xl font-bold text-gradient"
                >
                  {stat.value}
                </motion.p>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
            </div>
          ))}
        </motion.div>

        {/* Filters and Actions */}
        <div className="flex flex-col gap-4 mb-8">
          {/* Search and Create */}
          <div className="flex flex-col md:flex-row gap-4">
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

          {/* Filter Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 text-muted-foreground mr-2">
              <Filter className="w-4 h-4" />
              <span className="text-sm">筛选:</span>
            </div>
            
            {/* Stage Filters */}
            <div className="flex gap-1 p-1 rounded-lg bg-muted/30">
              {stageFilters.map((filter) => (
                <Button
                  key={filter.value}
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-7 text-xs px-3 rounded-md transition-colors",
                    stageFilter === filter.value 
                      ? "bg-primary text-primary-foreground" 
                      : "hover:bg-muted"
                  )}
                  onClick={() => setStageFilter(filter.value)}
                >
                  {filter.label}
                </Button>
              ))}
            </div>

            <div className="w-px h-6 bg-border mx-2 hidden sm:block" />

            {/* Status Filters */}
            <div className="flex gap-1 p-1 rounded-lg bg-muted/30">
              {statusFilters.map((filter) => (
                <Button
                  key={filter.value}
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-7 text-xs px-3 rounded-md transition-colors",
                    statusFilter === filter.value 
                      ? "bg-primary text-primary-foreground" 
                      : "hover:bg-muted"
                  )}
                  onClick={() => setStatusFilter(filter.value)}
                >
                  {filter.label}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Projects List - Single Column */}
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
              {searchQuery || stageFilter !== "all" || statusFilter !== "all" 
                ? "未找到匹配的项目" 
                : "还没有项目"}
            </h3>
            <p className="text-muted-foreground mb-6">
              {searchQuery || stageFilter !== "all" || statusFilter !== "all"
                ? "尝试调整筛选条件" 
                : "点击「新建项目」开始您的产品研发之旅"}
            </p>
          </motion.div>
        ) : (
          <div className="flex flex-col gap-6">
            {filteredProjects.map((project, i) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <ProjectCard
                  id={project.id}
                  name={project.name}
                  description={project.description || undefined}
                  currentStage={project.current_stage}
                  status={project.status}
                  createdAt={project.created_at}
                  coverImage={project.cover_image_url || undefined}
                  productImages={project.product_images}
                  landingPage={project.landing_page ? {
                    slug: project.landing_page.slug,
                    isPublished: project.landing_page.is_published,
                    heroImageUrl: project.landing_page.hero_image_url || undefined,
                    viewCount: project.landing_page.view_count,
                    emailCount: project.email_count,
                  } : undefined}
                  onClick={() => navigate(`/project/${project.id}`)}
                  onDelete={() => handleDeleteProject(project.id)}
                />
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
