import React, { useState, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Download,
  FileText,
  Tag,
  MapPin,
  Users,
  Palette,
  Zap,
  DollarSign,
  Check,
  Pencil,
  ChevronDown,
  ArrowRight,
  Sparkles,
  FileType,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { PrdData, DesignStyleDetails, CoreFeatureDetail } from "@/components/PrdExtractionSidebar";
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle, Table, TableRow, TableCell, WidthType } from "docx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { toast } from "sonner";

interface PrdDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  prdData: PrdData | null;
  projectName?: string;
  projectId: string;
  isReadOnly?: boolean;
  onConfirm?: () => Promise<void>;
  onDataUpdate?: (newData: PrdData) => Promise<void>;
}

// Section definition for the document
interface Section {
  key: string;
  label: string;
  icon: React.ElementType;
  getValue: (data: PrdData | null) => string | null;
  isMultiline?: boolean;
}

const sections: Section[] = [
  {
    key: "productName",
    label: "产品名称",
    icon: Tag,
    getValue: (d) => d?.productName || null,
  },
  {
    key: "usageScenario",
    label: "使用场景",
    icon: MapPin,
    getValue: (d) => d?.usageScenario || null,
  },
  {
    key: "targetAudience",
    label: "目标用户",
    icon: Users,
    getValue: (d) => d?.targetAudience || null,
  },
  {
    key: "designStyle",
    label: "外观风格",
    icon: Palette,
    getValue: (d) => d?.designStyle || null,
    isMultiline: true,
  },
  {
    key: "coreFeatures",
    label: "核心功能",
    icon: Zap,
    getValue: (d) => d?.coreFeatures?.join("\n") || null,
    isMultiline: true,
  },
  {
    key: "pricingRange",
    label: "定价策略",
    icon: DollarSign,
    getValue: (d) => d?.pricingRange || null,
  },
];

function generateMarkdownContent(prdData: PrdData | null, projectName?: string): string {
  if (!prdData) return "";

  const name = prdData.productName || projectName || "产品";
  const lines: string[] = [];

  lines.push(`# ${name} - 产品定义文档\n`);

  if (prdData.productTagline) {
    lines.push(`> ${prdData.productTagline}\n`);
  }

  lines.push(`## 📍 使用场景`);
  lines.push(prdData.usageScenario || "待补充");
  lines.push("");

  lines.push(`## 👥 目标用户`);
  lines.push(prdData.targetAudience || "待补充");
  lines.push("");

  lines.push(`## 🎨 外观风格`);
  if (prdData.designStyleDetails) {
    const d = prdData.designStyleDetails;
    lines.push("");
    lines.push("| 维度 | 描述 |");
    lines.push("|------|------|");
    if (d.overallStyle) lines.push(`| 整体风格 | ${d.overallStyle} |`);
    if (d.colorTone) lines.push(`| 色彩基调 | ${d.colorTone} |`);
    if (d.surfaceTexture) lines.push(`| 表面质感 | ${d.surfaceTexture} |`);
    if (d.shapeLanguage) lines.push(`| 造型语言 | ${d.shapeLanguage} |`);
    if (d.materialPreference?.length) lines.push(`| 材质偏好 | ${d.materialPreference.join("、")} |`);
    if (d.avoidElements?.length) lines.push(`| 避免元素 | ${d.avoidElements.join("、")} |`);
  } else {
    lines.push(prdData.designStyle || "待补充");
  }
  lines.push("");

  lines.push(`## ⚡ 核心功能`);
  lines.push("");
  if (prdData.coreFeaturesDetails?.length) {
    prdData.coreFeaturesDetails.forEach((f, i) => {
      const priority = f.priority === "must-have" ? "⭐ 必备" : f.priority === "important" ? "重要" : "可选";
      lines.push(`### ${i + 1}. ${f.feature} ${priority}`);
      lines.push(`- **描述**：${f.description}`);
      lines.push(`- **用户收益**：${f.userBenefit}`);
      if (f.technicalApproach) lines.push(`- **技术方案**：${f.technicalApproach}`);
      lines.push("");
    });
  } else if (prdData.coreFeatures?.length) {
    prdData.coreFeatures.forEach((f, i) => {
      lines.push(`${i + 1}. ${f}`);
    });
  } else {
    lines.push("待补充");
  }
  lines.push("");

  lines.push(`## 💰 定价策略`);
  lines.push(prdData.pricingRange || "待补充");
  lines.push("");

  lines.push("---");
  lines.push(`*文档生成时间：${new Date().toLocaleDateString("zh-CN")}*`);

  return lines.join("\n");
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Generate Word document using docx library
async function generateWordDocument(prdData: PrdData | null, projectName?: string): Promise<Blob> {
  if (!prdData) throw new Error("No PRD data");

  const name = prdData.productName || projectName || "产品";
  
  const children: Paragraph[] = [];

  // Title
  children.push(
    new Paragraph({
      text: `${name} - 产品定义文档`,
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    })
  );

  // Tagline
  if (prdData.productTagline) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: prdData.productTagline,
            italics: true,
            color: "666666",
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
      })
    );
  }

  // Usage Scenario
  children.push(
    new Paragraph({
      text: "📍 使用场景",
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 400, after: 200 },
    }),
    new Paragraph({
      text: prdData.usageScenario || "待补充",
      spacing: { after: 300 },
    })
  );

  // Target Audience
  children.push(
    new Paragraph({
      text: "👥 目标用户",
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 400, after: 200 },
    })
  );
  
  const audienceText = typeof prdData.targetAudience === "string" 
    ? prdData.targetAudience 
    : JSON.stringify(prdData.targetAudience, null, 2);
  children.push(
    new Paragraph({
      text: audienceText || "待补充",
      spacing: { after: 300 },
    })
  );

  // Design Style
  children.push(
    new Paragraph({
      text: "🎨 外观风格",
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 400, after: 200 },
    })
  );

  if (prdData.designStyleDetails) {
    const d = prdData.designStyleDetails;
    const styleItems = [
      d.overallStyle && `整体风格: ${d.overallStyle}`,
      d.colorTone && `色彩基调: ${d.colorTone}`,
      d.surfaceTexture && `表面质感: ${d.surfaceTexture}`,
      d.shapeLanguage && `造型语言: ${d.shapeLanguage}`,
      d.materialPreference?.length && `材质偏好: ${d.materialPreference.join("、")}`,
      d.avoidElements?.length && `避免元素: ${d.avoidElements.join("、")}`,
    ].filter(Boolean);

    styleItems.forEach((item) => {
      children.push(
        new Paragraph({
          text: `• ${item}`,
          spacing: { after: 100 },
        })
      );
    });
  } else {
    children.push(
      new Paragraph({
        text: prdData.designStyle || "待补充",
        spacing: { after: 300 },
      })
    );
  }

  // Core Features
  children.push(
    new Paragraph({
      text: "⚡ 核心功能",
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 400, after: 200 },
    })
  );

  if (prdData.coreFeaturesDetails?.length) {
    prdData.coreFeaturesDetails.forEach((f, i) => {
      const priority = f.priority === "must-have" ? "⭐ 必备" : f.priority === "important" ? "重要" : "可选";
      children.push(
        new Paragraph({
          text: `${i + 1}. ${f.feature} [${priority}]`,
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 200, after: 100 },
        }),
        new Paragraph({
          text: `描述：${f.description}`,
          spacing: { after: 50 },
        }),
        new Paragraph({
          text: `用户收益：${f.userBenefit}`,
          spacing: { after: 50 },
        })
      );
      if (f.technicalApproach) {
        children.push(
          new Paragraph({
            text: `技术方案：${f.technicalApproach}`,
            spacing: { after: 200 },
          })
        );
      }
    });
  } else if (prdData.coreFeatures?.length) {
    prdData.coreFeatures.forEach((f, i) => {
      children.push(
        new Paragraph({
          text: `${i + 1}. ${f}`,
          spacing: { after: 100 },
        })
      );
    });
  } else {
    children.push(
      new Paragraph({
        text: "待补充",
        spacing: { after: 300 },
      })
    );
  }

  // Pricing
  children.push(
    new Paragraph({
      text: "💰 定价策略",
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 400, after: 200 },
    }),
    new Paragraph({
      text: prdData.pricingRange || "待补充",
      spacing: { after: 300 },
    })
  );

  // Footer
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "─".repeat(50),
          color: "CCCCCC",
        }),
      ],
      spacing: { before: 400, after: 100 },
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: `文档生成时间：${new Date().toLocaleDateString("zh-CN")}`,
          italics: true,
          color: "999999",
          size: 20,
        }),
      ],
    })
  );

  const doc = new Document({
    sections: [
      {
        children,
      },
    ],
  });

  return await Packer.toBlob(doc);
}

export function PrdDocumentModal({
  isOpen,
  onClose,
  prdData,
  projectName,
  projectId,
  isReadOnly = false,
  onConfirm,
  onDataUpdate,
}: PrdDocumentModalProps) {
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isExporting, setIsExporting] = useState<"word" | "pdf" | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const displayName = prdData?.productName || projectName || "产品定义文档";

  const handleExportMarkdown = () => {
    const content = generateMarkdownContent(prdData, projectName);
    downloadFile(content, `${displayName}-PRD.md`, "text/markdown");
  };

  const handleExportJson = () => {
    const content = JSON.stringify(prdData, null, 2);
    downloadFile(content, `${displayName}-PRD.json`, "application/json");
  };

  const handleExportWord = async () => {
    if (isExporting) return;
    setIsExporting("word");
    try {
      const blob = await generateWordDocument(prdData, projectName);
      saveAs(blob, `${displayName}-PRD.docx`);
      toast.success("Word 文档导出成功");
    } catch (error) {
      console.error("Word export error:", error);
      toast.error("导出失败，请重试");
    } finally {
      setIsExporting(null);
    }
  };

  const handleExportPdf = async () => {
    if (isExporting || !contentRef.current) return;
    setIsExporting("pdf");
    try {
      const element = contentRef.current;
      
      // Create canvas from HTML content
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/png");
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      const pdf = new jsPDF("p", "mm", "a4");
      let heightLeft = imgHeight;
      let position = 0;

      // Add first page
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add additional pages if needed
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`${displayName}-PRD.pdf`);
      toast.success("PDF 导出成功");
    } catch (error) {
      console.error("PDF export error:", error);
      toast.error("导出失败，请重试");
    } finally {
      setIsExporting(null);
    }
  };

  const handleStartEdit = (sectionKey: string) => {
    if (isReadOnly) return;
    const section = sections.find((s) => s.key === sectionKey);
    if (!section) return;
    const value = section.getValue(prdData);
    setEditValue(value || "");
    setEditingSection(sectionKey);
  };

  const handleSaveEdit = async () => {
    if (!editingSection || !onDataUpdate) return;

    setIsSaving(true);
    try {
      let newValue: unknown = editValue.trim();

      // Handle array fields
      if (editingSection === "coreFeatures") {
        newValue = editValue
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean);
      }

      const updatedData = {
        ...prdData,
        [editingSection]: newValue,
      } as PrdData;

      await onDataUpdate(updatedData);
      setEditingSection(null);
      setEditValue("");
    } catch (error) {
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingSection(null);
    setEditValue("");
  };

  const handleConfirm = async () => {
    if (!onConfirm) return;
    setIsConfirming(true);
    try {
      await onConfirm();
    } finally {
      setIsConfirming(false);
    }
  };

  // Helper to safely convert any value to a displayable string
  const safeStringify = (value: unknown): string => {
    if (value === null || value === undefined) return "";
    if (typeof value === "string") return value;
    if (typeof value === "number" || typeof value === "boolean") return String(value);
    if (Array.isArray(value)) {
      return value.map(safeStringify).filter(Boolean).join("、");
    }
    if (typeof value === "object") {
      // Handle object with known user profile fields
      const obj = value as Record<string, unknown>;
      const parts: string[] = [];
      if (obj.age) parts.push(`年龄: ${obj.age}`);
      if (obj.occupation) parts.push(`职业: ${obj.occupation}`);
      if (obj.income) parts.push(`收入: ${obj.income}`);
      if (obj.lifestyle) parts.push(`生活方式: ${obj.lifestyle}`);
      if (obj.purchaseMotivation) parts.push(`购买动机: ${obj.purchaseMotivation}`);
      if (obj.decisionFactors) parts.push(`决策因素: ${obj.decisionFactors}`);
      
      // If we got known fields, return formatted
      if (parts.length > 0) return parts.join("；");
      
      // Otherwise try to stringify all values
      return Object.entries(obj)
        .map(([k, v]) => `${k}: ${safeStringify(v)}`)
        .join("；");
    }
    return String(value);
  };

  // Render target audience - handles both string and object formats
  const renderTargetAudience = () => {
    const audience = prdData?.targetAudience;
    
    if (!audience) {
      return <p className="text-muted-foreground">待补充</p>;
    }
    
    // If it's already a string, render directly
    if (typeof audience === "string") {
      return <p className="text-foreground">{audience}</p>;
    }
    
    // If it's an object (AI returned detailed user profile)
    if (typeof audience === "object") {
      const obj = audience as Record<string, unknown>;
      const items = [
        { label: "年龄", value: safeStringify(obj.age) },
        { label: "职业", value: safeStringify(obj.occupation) },
        { label: "收入", value: safeStringify(obj.income) },
        { label: "生活方式", value: safeStringify(obj.lifestyle) },
        { label: "购买动机", value: safeStringify(obj.purchaseMotivation) },
        { label: "决策因素", value: safeStringify(obj.decisionFactors) },
      ].filter((i) => i.value);
      
      if (items.length === 0) {
        return <p className="text-foreground">{safeStringify(audience)}</p>;
      }
      
      return (
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.label} className="flex gap-2 text-sm">
              <span className="text-muted-foreground flex-shrink-0">{item.label}:</span>
              <span className="text-foreground">{item.value}</span>
            </div>
          ))}
        </div>
      );
    }
    
    return <p className="text-foreground">{safeStringify(audience)}</p>;
  };

  // Render design style details
  const renderDesignStyleDetails = () => {
    const details = prdData?.designStyleDetails;
    const styleValue = safeStringify(prdData?.designStyle);
    
    if (!details) {
      return <p className="text-foreground">{styleValue || "待补充"}</p>;
    }

    const items = [
      { label: "整体风格", value: safeStringify(details.overallStyle) },
      { label: "色彩基调", value: safeStringify(details.colorTone) },
      { label: "表面质感", value: safeStringify(details.surfaceTexture) },
      { label: "造型语言", value: safeStringify(details.shapeLanguage) },
      { label: "材质偏好", value: details.materialPreference?.join("、") },
      { label: "避免元素", value: details.avoidElements?.join("、") },
    ].filter((i) => i.value);

    if (items.length === 0) {
      return <p className="text-foreground">{styleValue || "待补充"}</p>;
    }

    return (
      <div className="space-y-2">
        {styleValue && (
          <p className="text-foreground mb-3">{styleValue}</p>
        )}
        <div className="grid grid-cols-2 gap-2">
          {items.map((item) => (
            <div key={item.label} className="flex gap-2 text-sm">
              <span className="text-muted-foreground flex-shrink-0">{item.label}:</span>
              <span className="text-foreground">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render core features details
  const renderCoreFeaturesDetails = () => {
    const details = prdData?.coreFeaturesDetails;
    const basicFeatures = prdData?.coreFeatures;

    if (details?.length) {
      return (
        <div className="space-y-4">
          {details.map((f, i) => (
            <div
              key={i}
              className="p-3 rounded-lg bg-muted/30 border border-border/50"
            >
              <div className="flex items-center gap-2 mb-2">
                <Check className="w-4 h-4 text-primary" />
                <span className="font-medium text-foreground">{f.feature}</span>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-xs",
                    f.priority === "must-have" && "bg-primary/10 text-primary border-primary/30",
                    f.priority === "important" && "bg-accent/10 text-accent border-accent/30"
                  )}
                >
                  {f.priority === "must-have" ? "必备" : f.priority === "important" ? "重要" : "可选"}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-1">{f.description}</p>
              {f.userBenefit && (
                <p className="text-xs text-muted-foreground">
                  用户收益：{f.userBenefit}
                </p>
              )}
            </div>
          ))}
        </div>
      );
    }

    if (basicFeatures?.length) {
      return (
        <ul className="space-y-2">
          {basicFeatures.map((f, i) => (
            <li key={i} className="flex items-center gap-2">
              <Check className="w-4 h-4 text-primary flex-shrink-0" />
              <span className="text-foreground">{f}</span>
            </li>
          ))}
        </ul>
      );
    }

    return <p className="text-muted-foreground">待补充</p>;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0 gap-0 print:max-w-full print:h-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">产品定义文档</h2>
              <p className="text-sm text-muted-foreground">{displayName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Export Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  导出
                  <ChevronDown className="w-3 h-3 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleExportWord} disabled={isExporting === "word"}>
                  {isExporting === "word" ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <FileType className="w-4 h-4 mr-2" />
                  )}
                  导出 Word (.docx)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportPdf} disabled={isExporting === "pdf"}>
                  {isExporting === "pdf" ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <FileText className="w-4 h-4 mr-2" />
                  )}
                  导出 PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportMarkdown}>
                  <FileText className="w-4 h-4 mr-2" />
                  导出 Markdown
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportJson}>
                  <FileText className="w-4 h-4 mr-2" />
                  导出 JSON
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1">
          <div ref={contentRef} className="p-6 space-y-6 print:space-y-4 bg-background">
            {/* Product Name Section */}
            <DocumentSection
              icon={Tag}
              label="产品名称"
              isEditing={editingSection === "productName"}
              isReadOnly={isReadOnly}
              onEdit={() => handleStartEdit("productName")}
            >
              {editingSection === "productName" ? (
                <EditField
                  value={editValue}
                  onChange={setEditValue}
                  onSave={handleSaveEdit}
                  onCancel={handleCancelEdit}
                  isSaving={isSaving}
                />
              ) : (
                <div>
                  <p className="text-xl font-semibold text-foreground">
                    {prdData?.productName || "待命名"}
                  </p>
                  {prdData?.productTagline && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {prdData.productTagline}
                    </p>
                  )}
                </div>
              )}
            </DocumentSection>

            <Separator />

            {/* Usage Scenario */}
            <DocumentSection
              icon={MapPin}
              label="使用场景"
              isEditing={editingSection === "usageScenario"}
              isReadOnly={isReadOnly}
              onEdit={() => handleStartEdit("usageScenario")}
            >
              {editingSection === "usageScenario" ? (
                <EditField
                  value={editValue}
                  onChange={setEditValue}
                  onSave={handleSaveEdit}
                  onCancel={handleCancelEdit}
                  isSaving={isSaving}
                />
              ) : (
                <p className="text-foreground">
                  {prdData?.usageScenario || "待补充"}
                </p>
              )}
            </DocumentSection>

            <Separator />

            {/* Target Audience */}
            <DocumentSection
              icon={Users}
              label="目标用户"
              isEditing={editingSection === "targetAudience"}
              isReadOnly={isReadOnly}
              onEdit={() => handleStartEdit("targetAudience")}
            >
              {editingSection === "targetAudience" ? (
                <EditField
                  value={editValue}
                  onChange={setEditValue}
                  onSave={handleSaveEdit}
                  onCancel={handleCancelEdit}
                  isSaving={isSaving}
                />
              ) : (
                renderTargetAudience()
              )}
            </DocumentSection>

            <Separator />

            {/* Design Style */}
            <DocumentSection
              icon={Palette}
              label="外观风格"
              isEditing={editingSection === "designStyle"}
              isReadOnly={isReadOnly}
              onEdit={() => handleStartEdit("designStyle")}
            >
              {editingSection === "designStyle" ? (
                <EditField
                  value={editValue}
                  onChange={setEditValue}
                  onSave={handleSaveEdit}
                  onCancel={handleCancelEdit}
                  isSaving={isSaving}
                  multiline
                />
              ) : (
                renderDesignStyleDetails()
              )}
            </DocumentSection>

            <Separator />

            {/* Core Features */}
            <DocumentSection
              icon={Zap}
              label="核心功能"
              isEditing={editingSection === "coreFeatures"}
              isReadOnly={isReadOnly}
              onEdit={() => handleStartEdit("coreFeatures")}
            >
              {editingSection === "coreFeatures" ? (
                <EditField
                  value={editValue}
                  onChange={setEditValue}
                  onSave={handleSaveEdit}
                  onCancel={handleCancelEdit}
                  isSaving={isSaving}
                  multiline
                  placeholder="每行输入一个功能"
                />
              ) : (
                renderCoreFeaturesDetails()
              )}
            </DocumentSection>

            <Separator />

            {/* Pricing Range */}
            <DocumentSection
              icon={DollarSign}
              label="定价策略"
              isEditing={editingSection === "pricingRange"}
              isReadOnly={isReadOnly}
              onEdit={() => handleStartEdit("pricingRange")}
            >
              {editingSection === "pricingRange" ? (
                <EditField
                  value={editValue}
                  onChange={setEditValue}
                  onSave={handleSaveEdit}
                  onCancel={handleCancelEdit}
                  isSaving={isSaving}
                />
              ) : (
                <p className="text-foreground">
                  {prdData?.pricingRange || "待补充"}
                </p>
              )}
            </DocumentSection>
          </div>
        </ScrollArea>

        {/* Footer */}
        {!isReadOnly && onConfirm && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-border/50 bg-muted/30 print:hidden">
            <p className="text-sm text-muted-foreground">
              确认后将进入产品设计阶段
            </p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={onClose}>
                继续完善
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={isConfirming}
                className="bg-gradient-to-r from-primary to-accent"
              >
                {isConfirming ? (
                  <>
                    <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                    处理中...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    确认并进入产品设计
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Read-only Footer */}
        {isReadOnly && (
          <div className="flex items-center justify-center px-6 py-4 border-t border-border/50 bg-muted/30 print:hidden">
            <p className="text-sm text-muted-foreground">
              📖 只读模式 - 仅可查看和导出
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Document Section Component
interface DocumentSectionProps {
  icon: React.ElementType;
  label: string;
  children: React.ReactNode;
  isEditing?: boolean;
  isReadOnly?: boolean;
  onEdit?: () => void;
}

function DocumentSection({
  icon: Icon,
  label,
  children,
  isEditing,
  isReadOnly,
  onEdit,
}: DocumentSectionProps) {
  return (
    <div className="group">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-medium text-muted-foreground">{label}</h3>
        </div>
        {!isReadOnly && !isEditing && onEdit && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={onEdit}
          >
            <Pencil className="w-3 h-3 mr-1" />
            编辑
          </Button>
        )}
      </div>
      <div className="pl-6">{children}</div>
    </div>
  );
}

// Edit Field Component
interface EditFieldProps {
  value: string;
  onChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  isSaving?: boolean;
  multiline?: boolean;
  placeholder?: string;
}

function EditField({
  value,
  onChange,
  onSave,
  onCancel,
  isSaving,
  multiline,
  placeholder,
}: EditFieldProps) {
  return (
    <div className="space-y-3">
      {multiline ? (
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={4}
          className="resize-none"
          autoFocus
        />
      ) : (
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoFocus
        />
      )}
      <div className="flex gap-2">
        <Button size="sm" onClick={onSave} disabled={isSaving}>
          <Check className="w-3 h-3 mr-1" />
          保存
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel} disabled={isSaving}>
          <X className="w-3 h-3 mr-1" />
          取消
        </Button>
      </div>
    </div>
  );
}
