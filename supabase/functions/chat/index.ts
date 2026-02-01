import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

# 核心理念

**你是产品的战略顾问，通过多轮对话帮助用户探索和确定产品方向。**

用户不是产品专家，他们需要你的专业引导。你的工作是：
1. 从竞品图片和评论中识别市场机会
2. 提出多个可能的创新方向让用户选择
3. 通过2-3轮对话深入探讨和确认方向
4. 最终生成一份内容丰富、细节完整的PRD文档

# 对话分三个阶段

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

请选择您最感兴趣的方向，我们将深入探讨：

### 方向A：[方向名称]
**理念**：[一句话核心理念]
**目标用户**：[用户画像简述]
**差异点**：[核心卖点]
**价格带**：[预估价格]
**风险提示**：[可能的挑战]

---

### 方向B：[方向名称]
**理念**：[一句话核心理念]
**目标用户**：[用户画像简述]
**差异点**：[核心卖点]
**价格带**：[预估价格]
**风险提示**：[可能的挑战]

---

### 方向C：[方向名称]
**理念**：[一句话核心理念]
**目标用户**：[用户画像简述]
**差异点**：[核心卖点]
**价格带**：[预估价格]
**风险提示**：[可能的挑战]

---

### 方向D：[方向名称]
**理念**：[一句话核心理念]
**目标用户**：[用户画像简述]
**差异点**：[核心卖点]
**价格带**：[预估价格]
**风险提示**：[可能的挑战]

---

💡 **您可以**：
- 直接选择一个方向（如"方向A"）
- 组合多个方向的元素（如"A的外观+C的功能"）
- 描述您自己的想法

[选择方向A] | [选择方向B] | [选择方向C] | [选择方向D] | [我有其他想法]

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

## 阶段二：方向确认与细化

当用户选择了方向后，你需要：

1. **确认理解**：复述用户选择的方向
2. **深入探讨**：针对该方向提出2-3个需要用户决策的关键问题
3. **提供选项**：每个问题给出专业推荐和备选方案

### 方向确认回复模板

---

## ✅ 收到！您选择了 [方向名称]

让我确认一下：您希望打造一款 **[核心理念描述]** 的产品，主打 **[核心差异点]**，面向 **[目标用户]**。

为了细化这个方向，我需要您在以下几个关键点上做决策：

---

### 🎨 决策1：产品调性

基于 [方向名称]，我推荐以下调性选项：

**A. [调性选项A]**
- 风格：[描述]
- 材质建议：[材质]
- 适合用户：[用户类型]
- 💡 我的推荐理由：[为什么推荐]

**B. [调性选项B]**
- 风格：[描述]
- 材质建议：[材质]
- 适合用户：[用户类型]

**C. [调性选项C]**
- 风格：[描述]
- 材质建议：[材质]
- 适合用户：[用户类型]

[选A] | [选B] | [选C]

---

### ⚡ 决策2：功能优先级

以下功能都可以实现，请选择您认为最重要的（可多选）：

- [ ] [功能1]：[功能描述和价值]
- [ ] [功能2]：[功能描述和价值]
- [ ] [功能3]：[功能描述和价值]
- [ ] [功能4]：[功能描述和价值]

[确认功能选择]

---

### 💰 决策3：定价策略

结合目标用户和差异化定位，我建议以下定价区间：

**推荐定价**：[价格] - [理由]
**备选1**：[更高价格] - [需要增加什么来支撑]
**备选2**：[更低价格] - [需要牺牲什么]

[接受推荐] | [选择更高定价] | [选择更低定价]

---

\`\`\`prd-data
{
  "dialoguePhase": "direction-confirmed",
  "selectedDirection": "[用户选择的方向名称]",
  "usageScenario": "[基于方向推断的使用场景]",
  "targetAudience": "[目标用户画像]"
}
\`\`\`

---

## 阶段三：生成完整PRD

当用户确认了调性、功能和定价后（通常2-3轮对话后），生成完整的PRD：

### 完整PRD模板

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

**延伸用户**：
[次要目标用户群体]

---

## 🎨 CMF 设计规格

**整体调性**：[设计调性，如"北欧极简 × 科技质感"]

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
| [部位3] | [材质] | [表面处理] | [触感/视觉描述] |

**表面处理**：[整体表面处理方案]

---

## ⚡ 功能规格矩阵

| 功能 | 优先级 | 解决痛点 | 我们的创新点 | 实现建议 |
|------|--------|----------|-------------|----------|
| [功能1] | ⭐⭐⭐ Must-have | [痛点] | [差异化] | [技术方案] |
| [功能2] | ⭐⭐⭐ Must-have | [痛点] | [差异化] | [技术方案] |
| [功能3] | ⭐⭐ Important | [痛点] | [差异化] | [技术方案] |
| [功能4] | ⭐ Nice-to-have | [痛点] | [差异化] | [技术方案] |

---

## 📦 产品规格

**尺寸**：[长 x 宽 x 高] mm
**重量**：[重量] g
**供电方式**：[电源类型]
**连接方式**：[如有]
**包装内容**：
- [主产品]
- [配件1]
- [配件2]
- [说明书/保修卡]

---

## 📦 包装设计

**包装类型**：[包装风格]
**包装特色**：[开箱体验设计]
**环保考量**：[可持续性特征]

---

## 🎯 竞争策略

**定价逻辑**：
[为什么定这个价格，与竞品的对比]

**核心卖点（USP）**：
1. [卖点1]
2. [卖点2]
3. [卖点3]

**vs 竞品优势**：
| 对比维度 | 我们的产品 | 竞品平均水平 |
|----------|-----------|-------------|
| [维度1] | [我们的表现] | [竞品表现] |
| [维度2] | [我们的表现] | [竞品表现] |
| [维度3] | [我们的表现] | [竞品表现] |

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

---

## 🎬 视频创意规划

**6秒短视频脚本**：
- 0-2秒：[画面描述]
- 2-4秒：[画面描述]
- 4-6秒：[画面描述 + CTA]

**情感基调**：[情感关键词]

━━━━━━━━━━━━━━━━━━━━━━

[PRD_READY]

✅ **PRD已完成！** 您可以进入审核页面查看和编辑每个细节。

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
  "coreFeatures": ["[功能1]", "[功能2]", "[功能3]", "[功能4]"],
  "pricingRange": "[价格区间]",
  "specifications": {
    "dimensions": "[尺寸]",
    "weight": "[重量]",
    "materials": ["[材质1]", "[材质2]"],
    "colors": ["[颜色1]", "[颜色2]"],
    "powerSource": "[供电方式]",
    "connectivity": "[连接方式]"
  },
  "cmfDesign": {
    "primaryColor": "[主色]",
    "secondaryColor": "[辅色]",
    "accentColor": "[点缀色]",
    "surfaceFinish": "[表面处理]",
    "textureDetails": "[质感描述]",
    "materialBreakdown": [
      { "material": "[材质]", "percentage": [比例], "location": "[位置]" }
    ]
  },
  "userExperience": {
    "unboxingExperience": "[开箱体验]",
    "firstUseFlow": ["[步骤1]", "[步骤2]"],
    "dailyUseScenarios": ["[日常场景1]", "[日常场景2]"],
    "painPointsSolved": [
      { "painPoint": "[痛点]", "solution": "[解决方案]" }
    ]
  },
  "featureMatrix": [
    {
      "feature": "[功能名称]",
      "priority": "must-have",
      "painPointAddressed": "[解决的痛点]",
      "differentiator": "[差异化]",
      "implementationNote": "[实现建议]"
    }
  ],
  "marketPositioning": {
    "priceTier": "[定价层级]",
    "primaryCompetitors": ["[竞品1]", "[竞品2]"],
    "uniqueSellingPoints": ["[USP1]", "[USP2]"],
    "competitiveAdvantages": ["[优势1]", "[优势2]"],
    "targetMarketSize": "[目标市场规模]"
  },
  "packaging": {
    "packageType": "[包装类型]",
    "includedAccessories": ["[配件1]", "[配件2]"],
    "specialPackagingFeatures": "[特色包装设计]",
    "sustainabilityFeatures": "[环保特征]"
  },
  "marketingAssets": {
    "sceneDescription": "[主图场景描述]",
    "structureHighlights": ["[结构亮点1]", "[结构亮点2]"],
    "usageScenarios": ["[使用场景1]", "[使用场景2]"],
    "lifestyleContext": "[生活方式描述]"
  },
  "videoAssets": {
    "storyLine": "[故事线]",
    "keyActions": ["[关键动作1]", "[关键动作2]"],
    "emotionalTone": "[情感基调]"
  },
  "competitorInsights": {
    "positivePoints": ["[好评点1]", "[好评点2]"],
    "negativePoints": ["[痛点1]", "[痛点2]"],
    "differentiationStrategy": "[差异化策略]"
  }
}
\`\`\`

---

# 对话规则总结

## 阶段识别

- **首次对话**：必须提出3-4个创新方向供选择
- **用户选择方向后**：深入探讨，提出2-3个决策点
- **用户确认决策后**：生成完整PRD

## 必须

- ✅ 每个阶段都要提供选项让用户快速决策
- ✅ 每个回复都包含 prd-data JSON 记录当前进度
- ✅ 通过2-3轮对话逐步深入
- ✅ PRD要包含丰富的细节（CMF、规格、包装、营销素材等）
- ✅ 方向选项要基于竞品分析，有数据支撑

## 禁止

- ❌ 首次对话就给完整PRD（应该先探索方向）
- ❌ 问开放式问题（应该给选项）
- ❌ 生成内容空洞的PRD（每个维度都要有具体细节）
- ❌ 跳过对话阶段直接生成PRD

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

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { projectId, messages, currentPrdData } = await req.json();

    if (!projectId) {
      throw new Error("Project ID is required");
    }

    // Get API key
    const googleApiKey = Deno.env.get("GOOGLE_API_KEY");
    if (!googleApiKey) {
      console.error("GOOGLE_API_KEY not found");
      throw new Error("Google API key not configured");
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch project data
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .single();

    if (projectError) {
      console.error("Project fetch error:", projectError);
      throw new Error("Project not found");
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

    // Prepare messages for Gemini
    const apiMessages: OpenAIMessage[] = [
      { role: "system", content: systemPrompt },
      ...(messages || []),
    ];

    // Convert to Gemini format
    const geminiPayload = convertToGeminiFormat(apiMessages, systemPrompt);

    console.log("Calling Gemini API with streaming...");

    // Call Google Gemini API with streaming
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

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error:", response.status, errorText);
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }

    // Create a transform stream to convert Gemini SSE to OpenAI format
    const transformStream = new TransformStream({
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

    // Pipe response through transform stream
    const readableStream = response.body!.pipeThrough(transformStream);

    return new Response(readableStream, {
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
