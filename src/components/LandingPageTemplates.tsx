import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Check, Sparkles } from "lucide-react";

export type TemplateStyle = "modern" | "minimal" | "bold" | "elegant" | "tech";

export interface TemplateConfig {
  id: TemplateStyle;
  name: string;
  description: string;
  preview: {
    heroGradient: string;
    painBg: string;
    solutionBg: string;
    ctaBg: string;
    accentColor: string;
  };
}

export const templates: TemplateConfig[] = [
  {
    id: "modern",
    name: "现代简约",
    description: "干净明快的设计，适合科技产品",
    preview: {
      heroGradient: "from-slate-50 to-slate-100",
      painBg: "bg-red-50",
      solutionBg: "bg-green-50",
      ctaBg: "from-blue-600 to-purple-600",
      accentColor: "blue",
    },
  },
  {
    id: "minimal",
    name: "极简主义",
    description: "黑白灰为主，强调内容本身",
    preview: {
      heroGradient: "from-white to-gray-50",
      painBg: "bg-gray-100",
      solutionBg: "bg-gray-50",
      ctaBg: "from-gray-900 to-gray-800",
      accentColor: "gray",
    },
  },
  {
    id: "bold",
    name: "大胆活力",
    description: "鲜明对比色，适合年轻品牌",
    preview: {
      heroGradient: "from-orange-50 to-rose-50",
      painBg: "bg-rose-100",
      solutionBg: "bg-orange-50",
      ctaBg: "from-orange-500 to-rose-500",
      accentColor: "orange",
    },
  },
  {
    id: "elegant",
    name: "优雅奢华",
    description: "金色点缀，适合高端产品",
    preview: {
      heroGradient: "from-stone-100 to-amber-50",
      painBg: "bg-stone-100",
      solutionBg: "bg-amber-50",
      ctaBg: "from-amber-600 to-stone-700",
      accentColor: "amber",
    },
  },
  {
    id: "tech",
    name: "科技未来",
    description: "深色背景，霓虹效果",
    preview: {
      heroGradient: "from-slate-900 to-indigo-900",
      painBg: "bg-slate-800",
      solutionBg: "bg-indigo-900",
      ctaBg: "from-cyan-500 to-violet-500",
      accentColor: "cyan",
    },
  },
];

interface TemplateCardProps {
  template: TemplateConfig;
  isSelected: boolean;
  onClick: () => void;
}

function TemplateCard({ template, isSelected, onClick }: TemplateCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "relative cursor-pointer rounded-xl overflow-hidden border-2 transition-all",
        isSelected
          ? "border-primary ring-2 ring-primary/20"
          : "border-border/50 hover:border-border"
      )}
    >
      {/* Template Preview */}
      <div className="aspect-[4/3] relative">
        {/* Hero section preview */}
        <div className={cn("h-2/5 bg-gradient-to-br", template.preview.heroGradient)}>
          <div className="p-3">
            <div className="w-8 h-8 rounded-lg bg-white/30 mx-auto mb-2" />
            <div className="h-2 w-16 bg-black/10 rounded mx-auto mb-1" />
            <div className="h-1.5 w-12 bg-black/5 rounded mx-auto" />
          </div>
        </div>
        
        {/* Content sections preview */}
        <div className={cn("h-1/5", template.preview.painBg)}>
          <div className="flex justify-center gap-2 p-2">
            <div className="w-4 h-4 rounded bg-red-200" />
            <div className="w-4 h-4 rounded bg-red-200" />
            <div className="w-4 h-4 rounded bg-red-200" />
          </div>
        </div>
        
        <div className={cn("h-1/5", template.preview.solutionBg)}>
          <div className="flex justify-center gap-2 p-2">
            <div className="w-4 h-4 rounded bg-green-200" />
            <div className="w-4 h-4 rounded bg-green-200" />
            <div className="w-4 h-4 rounded bg-green-200" />
          </div>
        </div>
        
        {/* CTA section preview */}
        <div className={cn("h-1/5 bg-gradient-to-r", template.preview.ctaBg)}>
          <div className="flex justify-center items-center h-full">
            <div className="w-12 h-3 rounded-full bg-white/30" />
          </div>
        </div>
        
        {/* Selected indicator */}
        {isSelected && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-2 right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center"
          >
            <Check className="w-4 h-4 text-primary-foreground" />
          </motion.div>
        )}
      </div>
      
      {/* Template info */}
      <div className="p-3 bg-card">
        <h4 className="font-medium text-sm">{template.name}</h4>
        <p className="text-xs text-muted-foreground">{template.description}</p>
      </div>
    </motion.div>
  );
}

interface TemplateSelectProps {
  selectedTemplate: TemplateStyle;
  onSelect: (template: TemplateStyle) => void;
}

export function TemplateSelect({ selectedTemplate, onSelect }: TemplateSelectProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-primary" />
        <h3 className="font-semibold">选择页面风格</h3>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {templates.map((template) => (
          <TemplateCard
            key={template.id}
            template={template}
            isSelected={selectedTemplate === template.id}
            onClick={() => onSelect(template.id)}
          />
        ))}
      </div>
    </div>
  );
}

// Export template styles for LandingPagePreview
export function getTemplateStyles(style: TemplateStyle) {
  switch (style) {
    case "minimal":
      return {
        hero: {
          bg: "bg-white",
          gradient: "from-white to-gray-50",
          titleGradient: "from-gray-900 to-gray-700",
          subtitleColor: "text-gray-500",
          // New immersive hero styles
          blurOverlay: "from-white/40 via-white/60 to-white/80",
          glowColor: "from-gray-300/30 to-transparent",
          glassCard: "bg-white/60 border-gray-200/50",
        },
        painPoints: {
          bg: "bg-gray-100",
          cardBg: "bg-white",
          cardBorder: "border-gray-200",
          iconBg: "bg-gray-200",
          iconColor: "text-gray-600",
        },
        solutions: {
          bg: "bg-gray-50",
          cardBg: "bg-white",
          cardBorder: "border-gray-200",
          iconBg: "bg-gray-200",
          iconColor: "text-gray-600",
        },
        cta: {
          gradient: "from-gray-900 to-gray-800",
          buttonBg: "bg-white",
          buttonText: "text-gray-900",
        },
        video: {
          bg: "bg-gray-50",
          titleColor: "text-gray-900",
        },
        footer: {
          bg: "bg-gray-900",
        },
      };
    case "bold":
      return {
        hero: {
          bg: "bg-white",
          gradient: "from-orange-50 to-rose-50",
          titleGradient: "from-orange-600 to-rose-600",
          subtitleColor: "text-rose-600",
          // New immersive hero styles
          blurOverlay: "from-rose-900/30 via-orange-900/50 to-rose-950/70",
          glowColor: "from-orange-500/40 to-transparent",
          glassCard: "bg-white/10 border-white/20",
        },
        painPoints: {
          bg: "bg-rose-100",
          cardBg: "bg-white",
          cardBorder: "border-rose-200",
          iconBg: "bg-rose-200",
          iconColor: "text-rose-600",
        },
        solutions: {
          bg: "bg-orange-50",
          cardBg: "bg-white",
          cardBorder: "border-orange-200",
          iconBg: "bg-orange-200",
          iconColor: "text-orange-600",
        },
        cta: {
          gradient: "from-orange-500 to-rose-500",
          buttonBg: "bg-white",
          buttonText: "text-rose-600",
        },
        video: {
          bg: "bg-rose-900",
          titleColor: "text-white",
        },
        footer: {
          bg: "bg-rose-950",
        },
      };
    case "elegant":
      return {
        hero: {
          bg: "bg-white",
          gradient: "from-stone-100 to-amber-50",
          titleGradient: "from-stone-800 to-amber-700",
          subtitleColor: "text-amber-700",
          // New immersive hero styles
          blurOverlay: "from-stone-900/30 via-amber-900/50 to-stone-950/70",
          glowColor: "from-amber-500/40 to-transparent",
          glassCard: "bg-white/10 border-amber-200/30",
        },
        painPoints: {
          bg: "bg-stone-100",
          cardBg: "bg-white",
          cardBorder: "border-stone-200",
          iconBg: "bg-stone-200",
          iconColor: "text-stone-600",
        },
        solutions: {
          bg: "bg-amber-50",
          cardBg: "bg-white",
          cardBorder: "border-amber-200",
          iconBg: "bg-amber-200",
          iconColor: "text-amber-700",
        },
        cta: {
          gradient: "from-amber-600 to-stone-700",
          buttonBg: "bg-amber-100",
          buttonText: "text-stone-800",
        },
        video: {
          bg: "bg-stone-900",
          titleColor: "text-amber-100",
        },
        footer: {
          bg: "bg-stone-950",
        },
      };
    case "tech":
      return {
        hero: {
          bg: "bg-slate-900",
          gradient: "from-slate-900 to-indigo-900",
          titleGradient: "from-cyan-400 to-violet-400",
          subtitleColor: "text-cyan-300",
          isDark: true,
          // New immersive hero styles
          blurOverlay: "from-slate-950/40 via-indigo-950/60 to-slate-950/80",
          glowColor: "from-cyan-500/40 to-transparent",
          glassCard: "bg-slate-900/40 border-cyan-500/30",
        },
        painPoints: {
          bg: "bg-slate-800",
          cardBg: "bg-slate-700/50",
          cardBorder: "border-red-500/30",
          iconBg: "bg-red-500/20",
          iconColor: "text-red-400",
          isDark: true,
        },
        solutions: {
          bg: "bg-indigo-900",
          cardBg: "bg-indigo-800/50",
          cardBorder: "border-cyan-500/30",
          iconBg: "bg-cyan-500/20",
          iconColor: "text-cyan-400",
          isDark: true,
        },
        cta: {
          gradient: "from-cyan-500 to-violet-500",
          buttonBg: "bg-white",
          buttonText: "text-indigo-900",
        },
        video: {
          bg: "bg-slate-900",
          titleColor: "text-cyan-300",
        },
        footer: {
          bg: "bg-black",
        },
      };
    default: // modern
      return {
        hero: {
          bg: "bg-white",
          gradient: "from-slate-50 to-slate-100",
          titleGradient: "from-slate-900 to-slate-700",
          subtitleColor: "text-gray-600",
          // New immersive hero styles
          blurOverlay: "from-slate-900/30 via-slate-900/50 to-slate-950/70",
          glowColor: "from-blue-500/40 to-transparent",
          glassCard: "bg-white/10 border-white/20",
        },
        painPoints: {
          bg: "bg-red-50",
          cardBg: "bg-white",
          cardBorder: "border-red-100",
          iconBg: "bg-red-100",
          iconColor: "text-red-500",
        },
        solutions: {
          bg: "bg-gradient-to-br from-green-50 to-emerald-50",
          cardBg: "bg-white",
          cardBorder: "border-green-100",
          iconBg: "bg-green-100",
          iconColor: "text-green-500",
        },
        cta: {
          gradient: "from-blue-600 to-purple-600",
          buttonBg: "bg-white",
          buttonText: "text-blue-600",
        },
        video: {
          bg: "bg-gray-900",
          titleColor: "text-white",
        },
        footer: {
          bg: "bg-gray-900",
        },
      };
  }
}
