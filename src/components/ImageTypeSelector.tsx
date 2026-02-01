import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Image, 
  Layers3,
  Puzzle, 
  Users, 
  Sparkles,
  Search,
  Scale,
  Palette,
  PenTool
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

export interface ImageType {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  customPrompt?: string;
}

export const IMAGE_TYPES: Omit<ImageType, 'customPrompt'>[] = [
  {
    id: "scene",
    label: "场景图",
    description: "产品在使用环境中的自然展示",
    icon: Image,
  },
  {
    id: "structure",
    label: "结构图",
    description: "展示产品内部结构与组件",
    icon: Layers3,
  },
  {
    id: "exploded",
    label: "爆炸图",
    description: "零部件分解展示",
    icon: Puzzle,
  },
  {
    id: "usage",
    label: "使用图",
    description: "用户使用产品的场景",
    icon: Users,
  },
  {
    id: "lifestyle",
    label: "生活方式图",
    description: "融入生活场景的品牌形象",
    icon: Sparkles,
  },
  {
    id: "detail",
    label: "细节特写",
    description: "产品细节放大展示",
    icon: Search,
  },
  {
    id: "comparison",
    label: "对比图",
    description: "与竞品或问题场景对比",
    icon: Scale,
  },
  {
    id: "custom",
    label: "自定义",
    description: "输入自定义描述生成",
    icon: PenTool,
  },
];

interface ImageTypeSelectorProps {
  selectedTypes: ImageType[];
  onTypesChange: (types: ImageType[]) => void;
}

export function ImageTypeSelector({
  selectedTypes,
  onTypesChange,
}: ImageTypeSelectorProps) {
  const [customPrompts, setCustomPrompts] = useState<Record<string, string>>({});

  const handleToggleType = (typeInfo: Omit<ImageType, 'customPrompt'>) => {
    const isSelected = selectedTypes.some(t => t.id === typeInfo.id);
    
    if (isSelected) {
      onTypesChange(selectedTypes.filter(t => t.id !== typeInfo.id));
    } else {
      const newType: ImageType = {
        ...typeInfo,
        customPrompt: customPrompts[typeInfo.id] || undefined,
      };
      onTypesChange([...selectedTypes, newType]);
    }
  };

  const handleCustomPromptChange = (typeId: string, prompt: string) => {
    setCustomPrompts(prev => ({ ...prev, [typeId]: prompt }));
    
    // Update in selected types if already selected
    onTypesChange(selectedTypes.map(t => 
      t.id === typeId ? { ...t, customPrompt: prompt } : t
    ));
  };

  const isTypeSelected = (typeId: string) => 
    selectedTypes.some(t => t.id === typeId);

  return (
    <Card className="glass border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Palette className="w-5 h-5 text-stage-2" />
            选择营销图片类型
          </CardTitle>
          {selectedTypes.length > 0 && (
            <Badge variant="secondary">
              已选 {selectedTypes.length} 种
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          选择您需要生成的图片类型，可多选
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {IMAGE_TYPES.map((type, index) => {
            const isSelected = isTypeSelected(type.id);
            const Icon = type.icon;
            
            return (
              <motion.div
                key={type.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <div
                  className={cn(
                    "relative rounded-lg border-2 p-4 cursor-pointer transition-all duration-300",
                    isSelected
                      ? "border-stage-2 bg-stage-2/10"
                      : "border-border hover:border-stage-2/50 hover:bg-muted/50"
                  )}
                  onClick={() => handleToggleType(type)}
                >
                  {/* Checkbox */}
                  <div className="absolute top-2 right-2">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => handleToggleType(type)}
                      className="data-[state=checked]:bg-stage-2 data-[state=checked]:border-stage-2"
                    />
                  </div>

                  {/* Icon & Content */}
                  <div className="space-y-2">
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center transition-colors",
                      isSelected ? "bg-stage-2/20" : "bg-muted"
                    )}>
                      <Icon className={cn(
                        "w-5 h-5 transition-colors",
                        isSelected ? "text-stage-2" : "text-muted-foreground"
                      )} />
                    </div>
                    <div>
                      <h4 className={cn(
                        "font-medium text-sm transition-colors",
                        isSelected && "text-stage-2"
                      )}>
                        {type.label}
                      </h4>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {type.description}
                      </p>
                    </div>
                  </div>

                  {/* Custom prompt input for 'custom' type */}
                  {type.id === "custom" && isSelected && (
                    <div className="mt-3" onClick={e => e.stopPropagation()}>
                      <Input
                        placeholder="输入自定义场景描述..."
                        value={customPrompts.custom || ""}
                        onChange={(e) => handleCustomPromptChange("custom", e.target.value)}
                        className="text-xs h-8"
                      />
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
