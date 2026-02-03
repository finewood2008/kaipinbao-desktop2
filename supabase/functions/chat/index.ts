import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Helper function to verify project ownership
async function verifyProjectOwnership(
  supabase: any,
  projectId: string,
  userId: string
): Promise<{ error?: string }> {
  const { data: project, error } = await supabase
    .from("projects")
    .select("user_id")
    .eq("id", projectId)
    .single();

  if (error || !project) {
    return { error: "Project not found" };
  }

  if (project.user_id !== userId) {
    return { error: "Forbidden: You don't have access to this project" };
  }

  return {};
}

// PRD data structure for extraction - Enhanced with rich product details
interface PrdData {
  // Core product definition
  usageScenario: string | null;
  targetAudience: string | null;
  designStyle: string | null;
  coreFeatures: string[] | null;
  pricingRange: string | null;
  
  // Enhanced product details
  productName: string | null;
  productTagline: string | null;
  productCategory: string | null;
  
  // Detailed specifications
  specifications: {
    dimensions: string | null;
    weight: string | null;
    materials: string[] | null;
    colors: string[] | null;
    powerSource: string | null;
    connectivity: string | null;
  } | null;
  
  // CMF (Color, Material, Finish)
  cmfDesign: {
    primaryColor: string | null;
    secondaryColor: string | null;
    accentColor: string | null;
    surfaceFinish: string | null;
    textureDetails: string | null;
    materialBreakdown: { material: string; percentage: number; location: string }[] | null;
  } | null;
  
  // User experience
  userExperience: {
    unboxingExperience: string | null;
    firstUseFlow: string[] | null;
    dailyUseScenarios: string[] | null;
    painPointsSolved: { painPoint: string; solution: string }[] | null;
  } | null;
  
  // Feature matrix with priority
  featureMatrix: {
    feature: string;
    priority: "must-have" | "important" | "nice-to-have";
    painPointAddressed: string;
    differentiator: string;
    implementationNote: string;
  }[] | null;
  
  // Market positioning
  marketPositioning: {
    priceTier: "budget" | "mid-range" | "premium" | "luxury";
    primaryCompetitors: string[] | null;
    uniqueSellingPoints: string[] | null;
    competitiveAdvantages: string[] | null;
    targetMarketSize: string | null;
  } | null;
  
  // Packaging & accessories
  packaging: {
    packageType: string | null;
    includedAccessories: string[] | null;
    specialPackagingFeatures: string | null;
    sustainabilityFeatures: string | null;
  } | null;
  
  // Original fields
  marketAnalysis: {
    competitorCount: number | null;
    priceRange: string | null;
    marketTrends: string[] | null;
    differentiationOpportunity: string | null;
  } | null;
  marketingAssets: {
    sceneDescription: string | null;
    structureHighlights: string[] | null;
    explodedComponents: string[] | null;
    usageScenarios: string[] | null;
    lifestyleContext: string | null;
  } | null;
  videoAssets: {
    storyLine: string | null;
    keyActions: string[] | null;
    emotionalTone: string | null;
  } | null;
  competitorInsights: {
    positivePoints: string[] | null;
    negativePoints: string[] | null;
    differentiationStrategy: string | null;
  } | null;
  
  // Dialogue phase tracking
  dialoguePhase: "direction-exploration" | "direction-confirmed" | "details-refinement" | "prd-ready";
  selectedDirection: string | null;
}

// OpenAI message format
interface OpenAIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

// Gemini content format
interface GeminiContent {
  role: "user" | "model";
  parts: { text: string }[];
}

// Convert OpenAI messages to Gemini format
function convertToGeminiFormat(messages: OpenAIMessage[], systemPrompt: string): {
  system_instruction: { parts: { text: string }[] };
  contents: GeminiContent[];
} {
  const contents: GeminiContent[] = [];
  
  for (const msg of messages) {
    if (msg.role === "system") {
      // System messages are handled separately
      continue;
    }
    
    contents.push({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }],
    });
  }
  
  return {
    system_instruction: {
      parts: [{ text: systemPrompt }],
    },
    contents,
  };
}

const BASE_SYSTEM_PROMPT = `你是"开品宝"的资深产品经理顾问，一位真正的产品设计专家。你拥有15年消费品产品开发经验，曾任职于Apple、小米、Dyson等顶级消费品公司，擅长从零散信息中洞察产品机会并设计差异化产品方案。

# 核心规则：纯选择题对话

**绝对要求：你的每一个问题都必须是选择题！**

用户是产品创业者，不是产品专家。你不能问开放式问题，因为：
1. 用户没有专业知识来回答复杂问题
2. 选择题能大幅提高决策效率
3. 选项基于你的专业分析和竞品数据

## 选择题格式规范（必须严格遵循）

每个问题必须遵循以下格式：

---

### 🎨 [问题标题]

[简短的问题说明，不超过2行]

**A. [选项A名称]**
[1-2句描述]

**B. [选项B名称]**
[1-2句描述]

**C. [选项C名称]**
[1-2句描述]

**D. 其他想法**
如果以上都不满意，请描述您的想法

[选A] | [选B] | [选C] | [选D]

---

## 禁止的对话形式

❌ "您希望产品是什么风格？"
❌ "请描述一下您想要的功能"
❌ "有什么特别的要求吗？"
❌ 任何开放式问题

✅ 正确做法：永远提供A/B/C/D选项让用户选择

# 对话分六个阶段

## 阶段一：方向探索（首次回复）

当用户发送"开始PRD细化对话"或任何开场消息时，你必须：

1. **快速总结竞品洞察**（简洁版）
2. **提出3-4个产品创新方向**，每个方向包含：
   - 方向名称
   - 核心理念（一句话）
   - 目标用户（简要）
   - 差异化策略（核心卖点）
   - 预估价格带

---

### 首次回复模板

## 🔍 竞品洞察速览

基于 [X] 款竞品分析，我发现：

**市场痛点**：
- 🔴 [核心痛点1]
- 🟠 [核心痛点2]
- 🟡 [核心痛点3]

**设计趋势**：[一句话总结当前主流设计语言]

**价格分布**：[价格区间和空白点]

---

## 🎯 我为您设计了 4 个创新方向

### 方向A：[方向名称]
**理念**：[一句话核心理念]
**目标用户**：[用户画像简述]
**差异点**：[核心卖点]
**价格带**：[预估价格]

### 方向B：[方向名称]
**理念**：[一句话核心理念]
**目标用户**：[用户画像简述]
**差异点**：[核心卖点]
**价格带**：[预估价格]

### 方向C：[方向名称]
**理念**：[一句话核心理念]
**目标用户**：[用户画像简述]
**差异点**：[核心卖点]
**价格带**：[预估价格]

### 方向D：[方向名称]
**理念**：[一句话核心理念]
**目标用户**：[用户画像简述]
**差异点**：[核心卖点]
**价格带**：[预估价格]

💡 请选择您最感兴趣的方向：

[选择方向A] | [选择方向B] | [选择方向C] | [选择方向D]

\`\`\`prd-data
{
  "dialoguePhase": "direction-exploration",
  "marketAnalysis": {
    "competitorCount": [数量],
    "priceRange": "[价格区间]",
    "marketTrends": ["[趋势1]", "[趋势2]"],
    "differentiationOpportunity": "[差异化机会总结]"
  },
  "competitorInsights": {
    "positivePoints": ["[好评点1]", "[好评点2]"],
    "negativePoints": ["[痛点1]", "[痛点2]"],
    "differentiationStrategy": null
  }
}
\`\`\`

---

## 阶段二：方向确认

用户选择方向后，确认理解并提供使用场景选择：

## ✅ 收到！您选择了 [方向名称]

让我确认一下：您希望打造一款 **[核心理念描述]** 的产品，主打 **[核心差异点]**，面向 **[目标用户]**。

---

### 📍 决策1：主要使用场景

**A. [场景A]**
[场景描述]

**B. [场景B]**
[场景描述]

**C. [场景C]**
[场景描述]

**D. 多场景组合**
我的产品需要同时覆盖多个场景

[选A] | [选B] | [选C] | [选D]

\`\`\`prd-data
{
  "dialoguePhase": "direction-confirmed",
  "selectedDirection": "[用户选择的方向名称]"
}
\`\`\`

---

## 阶段三：外观风格确认（必须详细）

分2-3个问题详细确认外观风格：

### 问题1：整体设计语言

**A. 北欧极简**
简约线条、纯净色彩、功能优先

**B. 日式侘寂**
自然材质、低调质感、禅意美学

**C. 科技未来**
流线造型、金属质感、智能感

**D. 复古经典**
怀旧元素、温暖色调、情感连接

[选A] | [选B] | [选C] | [选D]

### 问题2：材质与质感

**A. 金属 + 硅胶**
高端触感、现代科技感

**B. 木质 + 塑料**
自然温暖、环保亲和

**C. 玻璃 + 金属**
晶莹剔透、精密工艺

**D. 工程塑料 + 橡胶**
轻便耐用、性价比高

[选A] | [选B] | [选C] | [选D]

### 问题3：色彩基调

**A. 冷色系（白、灰、银、蓝）**
冷静专业、科技感强

**B. 暖色系（米白、木色、金色）**
温馨亲和、自然舒适

**C. 高饱和彩色**
年轻活力、个性张扬

**D. 黑色系**
神秘高端、商务质感

[选A] | [选B] | [选C] | [选D]

\`\`\`prd-data
{
  "designStyle": "[综合描述，如：北欧极简 × 科技质感]",
  "designStyleDetails": {
    "overallStyle": "[整体风格]",
    "colorTone": "[色彩基调]",
    "surfaceTexture": "[表面质感]",
    "shapeLanguage": "[造型语言]",
    "inspirationKeywords": ["[灵感1]", "[灵感2]", "[灵感3]"],
    "materialPreference": ["[材质1]", "[材质2]"],
    "avoidElements": ["[避免元素1]", "[避免元素2]"]
  }
}
\`\`\`

---

## 阶段四：核心功能确认（必须详细）

### ⚡ 核心功能选择

基于 [产品方向] 和竞品痛点分析，以下功能可以帮助您的产品脱颖而出：

**A. [功能包A名称] - 基础实用型**
- [功能1]：[简述]
- [功能2]：[简述]
- [功能3]：[简述]
适合：追求性价比的用户

**B. [功能包B名称] - 进阶智能型**
- [功能1]：[简述]
- [功能2]：[简述]
- [功能3]：[简述]
- [功能4]：[简述]
适合：追求便利的用户

**C. [功能包C名称] - 旗舰全能型**
- [功能1]：[简述]
- [功能2]：[简述]
- [功能3]：[简述]
- [功能4]：[简述]
- [功能5]：[简述]
适合：追求极致体验的用户

**D. 自定义组合**
从以上功能中挑选组合

[选A] | [选B] | [选C] | [选D]

\`\`\`prd-data
{
  "coreFeatures": ["[功能1]", "[功能2]", "[功能3]"],
  "coreFeaturesDetails": [
    {
      "feature": "[功能名称]",
      "description": "[详细描述]",
      "userBenefit": "[用户收益]",
      "technicalApproach": "[技术实现思路]",
      "priority": "must-have"
    }
  ]
}
\`\`\`

---

## 阶段五：定价策略

### 💰 定价区间确认

基于产品定位和功能配置，我推荐以下定价策略：

**A. 入门价位：¥[低价] - ¥[中低价]**
- 成本控制优先，功能精简
- 适合价格敏感市场

**B. 中端价位：¥[中价] - ¥[中高价]**
- 性价比平衡，功能完整
- 适合大众消费市场

**C. 高端价位：¥[高价] - ¥[更高价]**
- 品质优先，体验极致
- 适合追求品质的用户

**D. 奢侈定位：¥[最高价]+**
- 限量/定制，身份象征
- 适合高净值用户

[选A] | [选B] | [选C] | [选D]

\`\`\`prd-data
{
  "pricingRange": "[价格区间]",
  "marketPositioning": {
    "priceTier": "[budget/mid-range/premium/luxury]"
  }
}
\`\`\`

---

## 阶段六：生成完整PRD

当以下6个字段全部确认后：
1. selectedDirection - 产品方向
2. usageScenario - 使用场景
3. targetAudience - 目标用户
4. designStyle - 外观风格
5. coreFeatures - 核心功能（至少1个）
6. pricingRange - 定价策略

生成完整PRD文档：

━━━━━━━ 📋 产品需求文档 (PRD) ━━━━━━━

## 📌 产品概述

**产品名称建议**：[中文名] / [英文名]
**产品标语**：[一句话卖点]
**产品类别**：[品类]
**目标价格**：[价格区间]

---

## 📍 使用场景

**主要场景**：
[详细描述主要使用场景，包含时间、地点、用户状态]

**次要场景**：
- [场景1]
- [场景2]
- [场景3]

---

## 👥 目标用户画像

**核心用户**：
- 年龄：[年龄段]
- 职业：[职业类型]
- 收入：[收入水平]
- 生活方式：[生活方式描述]
- 购买动机：[为什么会购买]
- 决策因素：[影响购买决策的因素]

---

## 🎨 CMF 设计规格

**整体调性**：[设计调性]

**颜色方案**：
| 元素 | 颜色 | 比例 | 说明 |
|------|------|------|------|
| 主色 | [颜色名 + 色值参考] | [%] | [应用位置] |
| 辅色 | [颜色名 + 色值参考] | [%] | [应用位置] |
| 点缀色 | [颜色名 + 色值参考] | [%] | [应用位置] |

**材质规格**：
| 部位 | 材质 | 工艺 | 质感描述 |
|------|------|------|----------|
| [部位1] | [材质] | [表面处理] | [触感/视觉描述] |
| [部位2] | [材质] | [表面处理] | [触感/视觉描述] |

**造型语言**：[圆润流线/硬朗几何/有机形态等]

**避免元素**：[列出应避免的设计元素]

---

## ⚡ 功能规格矩阵

| 功能 | 优先级 | 解决痛点 | 我们的创新点 | 实现建议 |
|------|--------|----------|-------------|----------|
| [功能1] | ⭐⭐⭐ Must-have | [痛点] | [差异化] | [技术方案] |
| [功能2] | ⭐⭐⭐ Must-have | [痛点] | [差异化] | [技术方案] |
| [功能3] | ⭐⭐ Important | [痛点] | [差异化] | [技术方案] |

---

## 📦 产品规格

**尺寸**：[长 x 宽 x 高] mm
**重量**：[重量] g
**供电方式**：[电源类型]
**包装内容**：
- [主产品]
- [配件1]
- [配件2]
- [说明书/保修卡]

---

## 🎯 竞争策略

**定价逻辑**：
[为什么定这个价格，与竞品的对比]

**核心卖点（USP）**：
1. [卖点1]
2. [卖点2]
3. [卖点3]

---

## 📸 营销素材规划

**主图场景**：
[详细的场景图描述，供AI生成图片使用]

**使用场景图**：
1. [场景1描述]
2. [场景2描述]
3. [场景3描述]

**生活方式图**：
[生活方式场景描述]

━━━━━━━━━━━━━━━━━━━━━━

[DESIGN_READY]

✅ **产品定义已完成！** 您可以进入产品设计阶段，让AI为您生成产品外观和营销素材。

\`\`\`prd-data
{
  "dialoguePhase": "prd-ready",
  "selectedDirection": "[最终确定的方向]",
  "productName": "[产品名称]",
  "productTagline": "[产品标语]",
  "productCategory": "[产品类别]",
  "usageScenario": "[详细使用场景]",
  "targetAudience": "[详细目标用户画像]",
  "designStyle": "[CMF设计调性]",
  "designStyleDetails": {
    "overallStyle": "[整体风格]",
    "colorTone": "[色彩基调]",
    "surfaceTexture": "[表面质感]",
    "shapeLanguage": "[造型语言]",
    "inspirationKeywords": ["[灵感1]", "[灵感2]"],
    "materialPreference": ["[材质1]", "[材质2]"],
    "avoidElements": ["[避免元素1]", "[避免元素2]"]
  },
  "coreFeatures": ["[功能1]", "[功能2]", "[功能3]"],
  "coreFeaturesDetails": [
    {
      "feature": "[功能名称]",
      "description": "[详细描述]",
      "userBenefit": "[用户收益]",
      "technicalApproach": "[技术实现思路]",
      "priority": "must-have"
    }
  ],
  "pricingRange": "[价格区间]",
  "specifications": {
    "dimensions": "[尺寸]",
    "weight": "[重量]",
    "materials": ["[材质1]", "[材质2]"],
    "colors": ["[颜色1]", "[颜色2]"]
  },
  "cmfDesign": {
    "primaryColor": "[主色]",
    "secondaryColor": "[辅色]",
    "accentColor": "[点缀色]",
    "surfaceFinish": "[表面处理]",
    "textureDetails": "[质感描述]"
  },
  "marketingAssets": {
    "sceneDescription": "[主图场景描述]",
    "usageScenarios": ["[使用场景1]", "[使用场景2]"],
    "lifestyleContext": "[生活方式描述]"
  }
}
\`\`\`

---

# 对话规则总结

## 必须

- ✅ 每个问题都必须是选择题格式（A/B/C/D）
- ✅ 每个阶段的选项都要提供 [选X] 快捷按钮
- ✅ 每个回复都包含 prd-data JSON 记录当前进度
- ✅ 外观风格必须收集详细信息（设计语言、材质、色彩、造型语言）
- ✅ 核心功能必须收集详细信息（描述、收益、技术方案、优先级）
- ✅ 通过5-6轮对话逐步深入
- ✅ PRD要包含丰富的CMF细节

## 禁止

- ❌ 问开放式问题
- ❌ 首次对话就给完整PRD
- ❌ 生成内容空洞的PRD
- ❌ 跳过对话阶段

# 完成检测规则

当以下6个字段全部通过对话确认后，必须：
1. 在回复末尾添加 [DESIGN_READY] 标记
2. 生成完整PRD文档

必填字段：
1. selectedDirection - 产品方向
2. usageScenario - 使用场景
3. targetAudience - 目标用户
4. designStyle - 外观风格
5. coreFeatures - 核心功能（至少1个）
6. pricingRange - 定价策略

# 语言要求
- 对话使用中文
- PRD文档专业术语中英结合
- 产品名称/标语需同时提供中英文版本`;


// Extract PRD data from AI response
function extractPrdData(content: string): Partial<PrdData> | null {
  const prdMatch = content.match(/```prd-data\s*([\s\S]*?)\s*```/);
  if (!prdMatch) return null;
  
  try {
    const prdJson = JSON.parse(prdMatch[1]);
    return prdJson;
  } catch (e) {
    console.error("Failed to parse PRD data:", e);
    return null;
  }
}

// Merge new PRD data with existing
function mergePrdData(existing: Partial<PrdData> | null, newData: Partial<PrdData>): Partial<PrdData> {
  if (!existing) return newData;
  
  const merged: Partial<PrdData> = { ...existing };
  
  // Simple fields - overwrite if new data exists
  const simpleFields: (keyof PrdData)[] = [
    'usageScenario', 'targetAudience', 'designStyle', 'pricingRange',
    'productName', 'productTagline', 'productCategory', 'dialoguePhase', 'selectedDirection'
  ];
  
  for (const field of simpleFields) {
    if (newData[field] !== undefined) {
      (merged as any)[field] = newData[field];
    }
  }
  
  // Array fields - merge
  if (newData.coreFeatures) {
    merged.coreFeatures = [...new Set([...(existing.coreFeatures || []), ...newData.coreFeatures])];
  }
  
  // Complex nested objects - deep merge
  if (newData.specifications) {
    merged.specifications = { ...existing.specifications, ...newData.specifications };
  }
  
  if (newData.cmfDesign) {
    merged.cmfDesign = { ...existing.cmfDesign, ...newData.cmfDesign };
  }
  
  if (newData.userExperience) {
    merged.userExperience = { ...existing.userExperience, ...newData.userExperience };
  }
  
  if (newData.featureMatrix) {
    merged.featureMatrix = newData.featureMatrix;
  }
  
  if (newData.marketPositioning) {
    merged.marketPositioning = { ...existing.marketPositioning, ...newData.marketPositioning };
  }
  
  if (newData.packaging) {
    merged.packaging = { ...existing.packaging, ...newData.packaging };
  }
  
  // Market analysis - deep merge
  if (newData.marketAnalysis) {
    merged.marketAnalysis = {
      competitorCount: newData.marketAnalysis.competitorCount ?? existing.marketAnalysis?.competitorCount ?? null,
      priceRange: newData.marketAnalysis.priceRange || existing.marketAnalysis?.priceRange || null,
      marketTrends: newData.marketAnalysis.marketTrends 
        ? [...new Set([...(existing.marketAnalysis?.marketTrends || []), ...newData.marketAnalysis.marketTrends])]
        : existing.marketAnalysis?.marketTrends || null,
      differentiationOpportunity: newData.marketAnalysis.differentiationOpportunity || existing.marketAnalysis?.differentiationOpportunity || null,
    };
  }
  
  // Nested objects - deep merge
  if (newData.marketingAssets) {
    merged.marketingAssets = {
      sceneDescription: newData.marketingAssets.sceneDescription || existing.marketingAssets?.sceneDescription || null,
      structureHighlights: newData.marketingAssets.structureHighlights 
        ? [...new Set([...(existing.marketingAssets?.structureHighlights || []), ...newData.marketingAssets.structureHighlights])]
        : existing.marketingAssets?.structureHighlights || null,
      explodedComponents: newData.marketingAssets.explodedComponents
        ? [...new Set([...(existing.marketingAssets?.explodedComponents || []), ...newData.marketingAssets.explodedComponents])]
        : existing.marketingAssets?.explodedComponents || null,
      usageScenarios: newData.marketingAssets.usageScenarios
        ? [...new Set([...(existing.marketingAssets?.usageScenarios || []), ...newData.marketingAssets.usageScenarios])]
        : existing.marketingAssets?.usageScenarios || null,
      lifestyleContext: newData.marketingAssets.lifestyleContext || existing.marketingAssets?.lifestyleContext || null,
    };
  }
  
  if (newData.videoAssets) {
    merged.videoAssets = {
      storyLine: newData.videoAssets.storyLine || existing.videoAssets?.storyLine || null,
      keyActions: newData.videoAssets.keyActions
        ? [...new Set([...(existing.videoAssets?.keyActions || []), ...newData.videoAssets.keyActions])]
        : existing.videoAssets?.keyActions || null,
      emotionalTone: newData.videoAssets.emotionalTone || existing.videoAssets?.emotionalTone || null,
    };
  }
  
  if (newData.competitorInsights) {
    merged.competitorInsights = {
      positivePoints: newData.competitorInsights.positivePoints || existing.competitorInsights?.positivePoints || null,
      negativePoints: newData.competitorInsights.negativePoints || existing.competitorInsights?.negativePoints || null,
      differentiationStrategy: newData.competitorInsights.differentiationStrategy || existing.competitorInsights?.differentiationStrategy || null,
    };
  }
  
  return merged;
}

// Calculate PRD progress based on collected data
function calculatePrdProgressFromData(prdData: Partial<PrdData> | null): Record<string, boolean> {
  if (!prdData) {
    return {
      marketAnalysis: false,
      usageScenario: false,
      targetAudience: false,
      designStyle: false,
      coreFeatures: false,
      confirmed: false,
    };
  }
  
  return {
    marketAnalysis: !!(prdData.marketAnalysis && (
      prdData.marketAnalysis.competitorCount ||
      prdData.marketAnalysis.differentiationOpportunity ||
      prdData.marketAnalysis.priceRange
    )),
    usageScenario: !!prdData.usageScenario,
    targetAudience: !!prdData.targetAudience,
    designStyle: !!prdData.designStyle,
    coreFeatures: !!(prdData.coreFeatures && prdData.coreFeatures.length > 0),
    confirmed: prdData.dialoguePhase === 'prd-ready',
  };
}

// Fetch competitor research data
async function getCompetitorData(supabase: any, projectId: string) {
  try {
    // Get competitor products including images
    const { data: products, error: productsError } = await supabase
      .from("competitor_products")
      .select("*")
      .eq("project_id", projectId)
      .eq("status", "completed");

    if (productsError || !products?.length) {
      return null;
    }

    // Get reviews for these products
    const productIds = products.map((p: any) => p.id);
    const { data: reviews, error: reviewsError } = await supabase
      .from("competitor_reviews")
      .select("*")
      .in("competitor_product_id", productIds);

    if (reviewsError) {
      console.error("Failed to fetch reviews:", reviewsError);
    }

    return {
      products: products.map((p: any) => ({
        title: p.product_title || "Unknown Product",
        price: p.price,
        rating: p.rating,
        reviewCount: p.review_count || 0,
        url: p.url,
        images: p.product_images || [],
      })),
      reviews: reviews || [],
      totalReviews: reviews?.length || 0,
    };
  } catch (error) {
    console.error("Error fetching competitor data:", error);
    return null;
  }
}

// Build dynamic system prompt with competitor insights and initial market analysis
function buildDynamicSystemPrompt(
  competitorData: any, 
  projectName: string, 
  projectDescription: string | null, 
  existingPrdData: Partial<PrdData> | null,
  initialMarketAnalysis: any | null
): string {
  let prompt = BASE_SYSTEM_PROMPT;

  // Add initial market analysis context if available
  if (initialMarketAnalysis) {
    prompt += `

## 初始市场分析报告（已通过AI市场专家生成）

请基于这份市场分析报告来制定产品策略：

**市场规模评估**：${initialMarketAnalysis.marketSize || "暂无"}

**目标用户画像**：${initialMarketAnalysis.targetUserProfile || "暂无"}

**竞争格局预判**：${initialMarketAnalysis.competitionLandscape || "暂无"}

**定价策略建议**：${initialMarketAnalysis.pricingStrategy || "暂无"}

**差异化机会**：
${initialMarketAnalysis.differentiationOpportunities?.map((opp: string) => `- ${opp}`).join("\n") || "暂无"}

**重要**：在方向探索中，结合这份市场分析报告的洞察，让用户感受到数据驱动的专业性。`;
  }

  // Add existing PRD data context
  if (existingPrdData && Object.keys(existingPrdData).some(k => existingPrdData[k as keyof PrdData])) {
    prompt += `

## 已收集的PRD数据（基于这些继续对话）

**当前对话阶段**：${existingPrdData.dialoguePhase || "direction-exploration"}
${existingPrdData.selectedDirection ? `**已选择方向**：${existingPrdData.selectedDirection}` : ""}
${existingPrdData.usageScenario ? `- **使用场景**: ${existingPrdData.usageScenario}` : ""}
${existingPrdData.targetAudience ? `- **目标用户**: ${existingPrdData.targetAudience}` : ""}
${existingPrdData.designStyle ? `- **外观风格**: ${existingPrdData.designStyle}` : ""}
${existingPrdData.coreFeatures?.length ? `- **核心功能**: ${existingPrdData.coreFeatures.join(", ")}` : ""}
${existingPrdData.pricingRange ? `- **定价区间**: ${existingPrdData.pricingRange}` : ""}

**重要**：根据当前阶段继续推进对话。`;
  }

  if (competitorData && competitorData.products?.length > 0) {
    prompt += `

## 当前项目竞品数据

**项目名称**：${projectName}
${projectDescription ? `**项目描述**：${projectDescription}` : ""}

**已收录竞品**（共 ${competitorData.products.length} 款）：
${competitorData.products.map((p: any, i: number) => `
### 竞品 ${i + 1}：${p.title}
- 价格：${p.price || "未知"}
- 评分：${p.rating ? `⭐ ${p.rating}` : "未知"}
- 评论数：${p.reviewCount}
- 产品图片数量：${p.images?.length || 0}张
`).join("")}

**用户评论分析**（共收集 ${competitorData.totalReviews} 条）：

**好评要点**：
${competitorData.reviews
  .filter((r: any) => r.is_positive)
  .slice(0, 5)
  .map((r: any) => `- "${r.review_text?.slice(0, 100)}..." ${r.key_points ? `【关键点：${r.key_points.join(", ")}】` : ""}`)
  .join("\n") || "暂无好评数据"}

**差评要点（重要痛点）**：
${competitorData.reviews
  .filter((r: any) => !r.is_positive)
  .slice(0, 8)
  .map((r: any) => `- "${r.review_text?.slice(0, 100)}..." ${r.key_points ? `【痛点：${r.key_points.join(", ")}】` : ""}`)
  .join("\n") || "暂无差评数据"}

**重要**：在对话中必须引用这些具体的竞品数据和用户评论来支撑你的分析和建议。`;
  } else {
    prompt += `

## 当前项目信息

**项目名称**：${projectName}
${projectDescription ? `**项目描述**：${projectDescription}` : ""}

注意：尚未添加竞品数据，请基于项目描述和市场分析进行探讨。`;
  }

  return prompt;
}

// Call Google Gemini API directly (Primary)
async function callGoogleDirect(
  messages: OpenAIMessage[],
  systemPrompt: string
): Promise<Response> {
  const googleApiKey = Deno.env.get("GOOGLE_API_KEY");
  if (!googleApiKey) {
    throw new Error("GOOGLE_API_KEY not configured");
  }

  // Convert to Gemini format
  const geminiPayload = convertToGeminiFormat(messages, systemPrompt);

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": googleApiKey,
      },
      body: JSON.stringify({
        ...geminiPayload,
        generationConfig: {
          temperature: 0.85,
          maxOutputTokens: 16384,
        },
      }),
    }
  );

  return response;
}

// Call Lovable AI Gateway (Fallback)
async function callLovableAI(
  messages: OpenAIMessage[],
  systemPrompt: string
): Promise<Response> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) {
    throw new Error("LOVABLE_API_KEY not configured");
  }

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages.filter(m => m.role !== "system"),
      ],
      stream: true,
      temperature: 0.85,
      max_tokens: 16384,
    }),
  });

  return response;
}

// Transform Gemini SSE to OpenAI format
function createGeminiToOpenAITransformer(): TransformStream {
  return new TransformStream({
    transform(chunk, controller) {
      const text = new TextDecoder().decode(chunk);
      const lines = text.split("\n");

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6);
          
          if (data === "[DONE]") {
            controller.enqueue(new TextEncoder().encode("data: [DONE]\n\n"));
            continue;
          }

          try {
            const parsed = JSON.parse(data);
            
            // Extract text from Gemini format
            const content = parsed.candidates?.[0]?.content?.parts?.[0]?.text || "";
            
            if (content) {
              // Convert to OpenAI format
              const openAIChunk = {
                choices: [{
                  index: 0,
                  delta: { content },
                }],
              };
              controller.enqueue(
                new TextEncoder().encode(`data: ${JSON.stringify(openAIChunk)}\n\n`)
              );
            }

            // Check for finish reason
            if (parsed.candidates?.[0]?.finishReason) {
              controller.enqueue(new TextEncoder().encode("data: [DONE]\n\n"));
            }
          } catch (e) {
            // Skip malformed JSON
            console.warn("Failed to parse SSE chunk:", data);
          }
        }
      }
    },
  });
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // Create client with user's auth token for verification
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Verify user token and get claims
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claimsData.claims.sub;
    if (!userId) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { projectId, messages, currentPrdData } = await req.json();

    if (!projectId) {
      throw new Error("Project ID is required");
    }

    // Initialize Supabase client with service role
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch project data and verify ownership
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .single();

    if (projectError || !project) {
      console.error("Project fetch error:", projectError);
      throw new Error("Project not found");
    }

    // Verify project ownership
    if (project.user_id !== userId) {
      return new Response(
        JSON.stringify({ error: "Forbidden: You don't have access to this project" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch competitor data
    const competitorData = await getCompetitorData(supabase, projectId);

    // Get existing PRD data from database or use provided current data
    const existingPrdData = currentPrdData || (project.prd_data as Partial<PrdData>) || null;

    // Get initial market analysis from project (check both locations)
    const initialMarketAnalysis = project.prd_data?.initialMarketAnalysis || project.landing_page_data?.initialMarketAnalysis || null;

    // Build dynamic system prompt
    const systemPrompt = buildDynamicSystemPrompt(
      competitorData,
      project.name,
      project.description,
      existingPrdData,
      initialMarketAnalysis
    );

    // Prepare messages for API
    const apiMessages: OpenAIMessage[] = [
      { role: "system", content: systemPrompt },
      ...(messages || []),
    ];

    console.log("Chat: Attempting Google Direct API...");

    // Primary: Google Direct API
    let response: Response;
    let usedFallback = false;

    try {
      response = await callGoogleDirect(apiMessages, systemPrompt);
      
      // Check for rate limit or errors
      if (response.status === 429 || response.status === 402 || response.status >= 500) {
        console.log(`Chat: Google returned ${response.status}, falling back to Lovable AI...`);
        usedFallback = true;
        response = await callLovableAI(apiMessages, systemPrompt);
      }
    } catch (googleError) {
      console.warn("Chat: Google API failed, switching to Lovable AI...", googleError);
      usedFallback = true;
      response = await callLovableAI(apiMessages, systemPrompt);
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI API error:", response.status, errorText);
      throw new Error(`AI API error: ${response.status} - ${errorText}`);
    }

    // If using primary (Google direct), transform the response
    if (!usedFallback) {
      const transformStream = createGeminiToOpenAITransformer();
      const readableStream = response.body!.pipeThrough(transformStream);

      return new Response(readableStream, {
        headers: {
          ...corsHeaders,
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
        },
      });
    }

    // Lovable AI already returns OpenAI-compatible format
    return new Response(response.body, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error) {
    console.error("Chat function error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error",
        details: error instanceof Error ? error.stack : undefined,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
