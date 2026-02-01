
# AI 广告投放专家 - 落地页生成系统重构计划

## 背景分析

当前落地页生成系统存在以下问题：
1. **AI 角色定位不清晰** - 目前只是简单地作为"产品营销专家"，没有专门针对广告投放和市场测试的专业设定
2. **策略生成过于基础** - 仅生成简单的文案和图片，缺乏专业广告投放视角
3. **核心目标不明确** - 落地页的核心目的是"测试市场接受度"，但当前逻辑没有体现这一点

## 解决方案

将 `generate-landing-page` 边缘函数中的 AI 重新定义为**"AI 广告投放专家"**，专注于：
- 根据 PRD 数据设计高转化率的广告落地页
- 以市场验证为核心目标，优化邮件收集转化
- 运用专业广告投放知识（A/B 测试思维、转化漏斗、用户心理等）

---

## 具体修改

### 文件：`supabase/functions/generate-landing-page/index.ts`

#### 1. 升级 AI 模型到 Gemini 3 Pro

```typescript
// 从
model: "google/gemini-2.5-flash"

// 改为
model: "google/gemini-3-pro-preview"
```

#### 2. 重新设计 System Prompt - 建立专业广告投放 AI 人设

```typescript
const SYSTEM_PROMPT = `你是一位世界顶级的 AI 广告投放专家，拥有 15 年跨境电商和 DTC 品牌广告投放经验。

## 你的专业背景
- 曾服务于 Meta、Google、TikTok 广告平台的核心投放团队
- 累计管理超过 5000 万美元广告预算
- 专精于新品市场验证和冷启动策略
- 深谙 Facebook/Instagram/Google Ads 的投放规则和最佳实践

## 核心任务
你正在为一个**全新产品**设计广告落地页。这个落地页的核心目的是：
**通过邮件订阅收集，验证市场对这个新产品的兴趣和接受度**

## 设计原则
1. **AIDA 模型**：Attention（吸引）→ Interest（兴趣）→ Desire（欲望）→ Action（行动）
2. **痛点共鸣**：用竞品差评挖掘的真实用户痛点引发共鸣
3. **差异化价值**：突出与竞品的核心差异
4. **紧迫感营造**：使用"限量"、"抢先"等词汇提升转化
5. **信任构建**：展示社会认证、专业背书
6. **简洁行动号召**：一个页面只有一个核心 CTA - 邮件订阅

## 文案风格
- 面向国际市场，所有文案必须是**英文**
- 简洁有力，每个句子都有明确目的
- 使用动词引导，创造画面感
- 数据驱动，用具体数字增强说服力`;
```

#### 3. 重构策略生成 Prompt

将现有的简单产品描述 prompt 改为专业广告策略分析：

```typescript
const strategyPrompt = `Based on the following product intelligence, design a high-converting landing page strategy.

## PRODUCT INTELLIGENCE
Product Name: ${prdData.name}
Product Description: ${prdData.description || "N/A"}
Target Market: ${targetMarket || "International"}
Target Audience: ${prdData.target_audience || "General consumers"}
Usage Scenario: ${prdData.usageScenario || "N/A"}
Design Style: ${prdData.designStyle || "Modern minimalist"}
Core Features: ${prdData.coreFeatures?.join(", ") || prdData.features?.join(", ") || "N/A"}
Pain Points (from PRD): ${prdData.pain_points?.join(", ") || "N/A"}
Selling Points: ${prdData.selling_points?.join(", ") || "N/A"}

${prdData.competitorInsights ? `
## COMPETITOR INTELLIGENCE
Competitor Strengths: ${prdData.competitorInsights.positivePoints?.join(", ") || "N/A"}
Competitor Weaknesses (Our Opportunities): ${prdData.competitorInsights.negativePoints?.join(", ") || "N/A"}
Differentiation Strategy: ${prdData.competitorInsights.differentiationStrategy || "N/A"}
` : ""}

${prdData.marketingAssets ? `
## VISUAL CONTEXT
Scene Description: ${prdData.marketingAssets.sceneDescription || "N/A"}
Structure Highlights: ${prdData.marketingAssets.structureHighlights?.join(", ") || "N/A"}
Lifestyle Context: ${prdData.marketingAssets.lifestyleContext || "N/A"}
` : ""}

## YOUR TASK
Design a landing page strategy optimized for EMAIL COLLECTION as the primary conversion goal.

Return a JSON object with these fields:
{
  "headline": "Compelling headline (max 8 words) - use power words, create curiosity",
  "subheadline": "Value proposition that addresses the #1 pain point",
  "painPoints": ["3 customer pain points - from competitor reviews, real user language"],
  "sellingPoints": ["3 key differentiators - specific, measurable benefits"],
  "trustBadges": ["✓ Trust signal 1", "✓ Trust signal 2", "✓ Trust signal 3"],
  "ctaText": "Action-oriented CTA (e.g., 'Get Early Access', 'Join Waitlist')",
  "urgencyMessage": "Scarcity/urgency message (e.g., 'Limited spots for beta testers')",
  "socialProof": "Social proof statement (e.g., 'Join 1,000+ who signed up this week')",
  "benefitStatement": "One-liner benefit that removes friction for signing up",
  "imagePrompts": {
    "hero": "Hero image prompt - lifestyle setting showing product in use",
    "lifestyle": "Secondary lifestyle image prompt",
    "detail": "Product detail close-up prompt"
  },
  "colorScheme": {
    "primary": "Primary brand color hex",
    "accent": "CTA button color hex (high contrast)",
    "background": "Background color hex"
  },
  "pageFlow": [
    {"section": "hero", "purpose": "Grab attention, state value prop"},
    {"section": "pain_points", "purpose": "Build empathy"},
    {"section": "solution", "purpose": "Present product as answer"},
    {"section": "benefits", "purpose": "Highlight key features"},
    {"section": "social_proof", "purpose": "Build trust"},
    {"section": "cta", "purpose": "Drive email signup"}
  ]
}

CRITICAL: All text content MUST be in English. Focus on conversion, not description.`;
```

#### 4. 增强输出结构

在返回结果中增加更多广告专业字段：

```typescript
return new Response(
  JSON.stringify({
    strategy,
    marketingImages: allMarketingImages,
    generatedImages,
    heroImageUrl: selectedImageUrl || visualAssets?.selectedProductImage,
    videoUrl: visualAssets?.videoUrl,
    productImages: existingImages.filter(img => img.image_type === "product").map(img => img.image_url),
    // 新增字段
    conversionOptimization: {
      primaryCta: strategy?.ctaText || "Get Early Access",
      urgencyMessage: strategy?.urgencyMessage || "Limited spots available",
      socialProof: strategy?.socialProof || "",
      benefitStatement: strategy?.benefitStatement || "",
    },
  }),
  {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  }
);
```

#### 5. 添加错误处理（402/429）

```typescript
if (strategyResponse.status === 429) {
  return new Response(JSON.stringify({ error: "AI 请求频率过高，请稍后重试" }), {
    status: 429,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
if (strategyResponse.status === 402) {
  return new Response(JSON.stringify({ error: "AI 额度已用完，请充值后再试" }), {
    status: 402,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
```

---

## 前端配合修改（可选增强）

### 文件：`src/components/LandingPageBuilder.tsx`

更新 UI 文案以体现"市场测试"核心目标：

```typescript
// 标题更新
<h3 className="text-2xl font-bold mb-2">AI 广告落地页生成</h3>
<p className="text-muted-foreground mb-6 max-w-md mx-auto">
  基于专业广告投放策略，生成高转化率的落地页，
  通过邮件收集验证市场对新产品的接受度
</p>
```

### 文件：`src/components/LandingPagePreview.tsx`

增加对新字段的渲染支持（urgencyMessage、socialProof 等）

---

## 修改范围摘要

| 文件 | 修改内容 |
|------|----------|
| `supabase/functions/generate-landing-page/index.ts` | 升级模型、重构 AI 人设、优化 prompt、增强输出 |
| `src/components/LandingPageBuilder.tsx` | 更新 UI 文案（可选） |
| `src/components/LandingPagePreview.tsx` | 支持新字段渲染（可选） |

---

## 技术细节

### AI 模型选择：`google/gemini-3-pro-preview`

选用 Google 最先进的 LLM，具备：
- 超强的长文本理解能力，能深度分析 PRD 和竞品数据
- 优秀的英文文案生成能力
- 复杂任务的推理规划能力

### 核心设计理念

这个落地页系统的核心是**市场验证**，而非产品销售。因此：
- CTA 统一为邮件收集（非购买）
- 强调"抢先体验"、"限量名额"等预热型文案
- 通过邮件订阅数量来衡量市场兴趣

