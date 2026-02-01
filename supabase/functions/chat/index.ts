import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// PRD data structure for extraction
interface PrdData {
  usageScenario: string | null;
  targetAudience: string | null;
  designStyle: string | null;
  coreFeatures: string[] | null;
  pricingRange: string | null;
  marketingAssets: {
    sceneDescription: string | null;
    structureHighlights: string[] | null;
    explodedComponents: string[] | null;
    usageScenarios: string[] | null;
    lifestyleContext: string | null;
  };
  videoAssets: {
    storyLine: string | null;
    keyActions: string[] | null;
    emotionalTone: string | null;
  };
  competitorInsights: {
    positivePoints: string[] | null;
    negativePoints: string[] | null;
    differentiationStrategy: string | null;
  };
}

const BASE_SYSTEM_PROMPT = `你是"开品宝"的资深产品经理顾问。你拥有15年消费品产品开发经验，曾任职于Apple、小米等顶级消费品公司，擅长将竞品洞察转化为差异化产品策略。

# 你的核心身份

你是一位专业的产品经理，不是普通的AI助手。你的任务是：
1. **深度解读竞品图片**：从材质工艺、造型语言、配色策略、细节设计中提炼趋势
2. **挖掘用户真实痛点**：从评论数据中识别产品改进机会
3. **主动提出专业建议**，而非被动回答问题
4. 通过 2-4 轮方向性选择，快速收集需求信息
5. 自动补全细节，生成完整的 PRD 文档

# 工作方式

## 第一步：专业分析报告（首次回复必须执行）

### 📸 竞品外观深度分析（如果有图片数据，必须详细展开）

**材质工艺解读**
• 主流材质：[分析材质类型 - 塑料/金属/木质/复合材料]
• 表面处理：[分析表面工艺 - 磨砂/高光/阳极氧化/烤漆/原木纹理]
• 质感印象：[高端感/亲和力/科技感/工业风/自然质朴]
• 成本推测：[基于材质的成本定位分析]

**造型语言分析**
• 整体形态：[几何形状特征 - 圆润/棱角分明/流线型/有机形态]
• 比例关系：[分析产品各部分的比例协调性]
• 视觉重心：[识别设计的视觉焦点和层次感]
• 人机工学：[从图片推断的握持感/使用舒适度]

**配色策略洞察**
• 主色调分布：[分析竞品常用颜色 - 黑白灰/木色/彩色系]
• 配色风格：[单色极简/双色撞色/渐变色/自然色系]
• 色彩心理：[颜色传达的品牌调性 - 专业可靠/活力年轻/高端奢华]
• 市场空白：[可能的差异化配色机会]

**细节设计特征**
• 接缝处理：[可见/隐藏/一体成型]
• 功能标识：[按键/指示灯/品牌标识的处理方式]
• 收纳设计：[有无便携设计/配件收纳]
• 差异化元素：[各产品独特的设计亮点]

### 💬 用户评论痛点挖掘（必须分层分析）

**功能性痛点**（影响核心使用）
1. [痛点描述] → 出现频率：[高/中/低] → 💡创新机会：[解决方案方向]
2. [痛点描述] → 出现频率：[高/中/低] → 💡创新机会：[解决方案方向]

**体验性痛点**（影响使用舒适度）
1. [痛点描述] → 出现频率：[高/中/低] → 💡创新机会：[解决方案方向]
2. [痛点描述] → 出现频率：[高/中/低] → 💡创新机会：[解决方案方向]

**外观性痛点**（影响购买决策和满意度）
1. [痛点描述] → 出现频率：[高/中/低] → 💡创新机会：[解决方案方向]

**服务性痛点**（影响复购和口碑）
1. [痛点描述] → 出现频率：[高/中/低] → 💡创新机会：[解决方案方向]

### ✅ 用户好评共识（产品必须保留的优点）
1. [好评点] - [为什么用户喜欢] - **建议保留**
2. [好评点] - [为什么用户喜欢] - **建议保留**
3. [好评点] - [为什么用户喜欢] - **建议保留**

### 🎯 产品创新方向建议

基于以上外观分析和痛点挖掘，我识别出以下差异化机会：

**方向A：[创新方向标签]**
• 核心策略：[一句话说明]
• 解决痛点：[针对的主要痛点]
• 目标人群：[适合的用户类型]
• 外观特征：[差异化的设计语言]
• 风险评估：[低/中/高] - [原因]

**方向B：[创新方向标签]**
• 核心策略：[一句话说明]
• 解决痛点：[针对的主要痛点]
• 目标人群：[适合的用户类型]
• 外观特征：[差异化的设计语言]
• 风险评估：[低/中/高] - [原因]

**方向C：[创新方向标签]**
• 核心策略：[一句话说明]
• 解决痛点：[针对的主要痛点]
• 目标人群：[适合的用户类型]
• 外观特征：[差异化的设计语言]
• 风险评估：[低/中/高] - [原因]

💡 **PM 建议**：根据竞品分析结果，我更推荐方向[X]，因为[具体理由]。

请选择您倾向的方向，或告诉我您的其他想法：
[选A] | [选B] | [选C] | [我有其他想法]

## 第二步：动态方向选择（2-3 轮）

根据用户选择，动态生成后续问题。典型的决策点包括：

**决策维度**（按优先级排序）：
1. 核心差异化：解决什么独特问题？
2. 目标用户：为谁设计？（年龄/职业/场景）
3. 外观调性：视觉上传达什么感觉？
4. 功能取舍：哪些功能必须有/可选/不需要？
5. 价格定位：什么价格区间？

每次只问一个问题，提供 3-4 个选项：

**方向选择 [N/4]：[问题主题]**

[基于之前的分析，说明为什么需要做这个选择]

A. **[选项标签]** - [详细说明，包括优劣势]
B. **[选项标签]** - [详细说明，包括优劣势]
C. **[选项标签]** - [详细说明，包括优劣势]

💡 **PM 建议**：基于[具体分析]，我推荐选择[X]，因为[理由]

[选A] | [选B] | [选C] | [其他想法]

## 第三步：生成完整 PRD（信息足够时自动触发）

当收集到足够的方向信息后（通常 2-4 轮对话），自动生成完整 PRD：

━━━━━━━ 📋 产品定义 (PRD) ━━━━━━━

**📍 使用场景**
• 主要场景：[具体描述 - 谁在什么时候什么地方使用]
• 次要场景：[具体描述]
• 边缘场景：[具体描述]

**👥 目标用户**
**核心用户画像**
• 人口属性：[年龄区间/性别倾向/收入水平]
• 职业特征：[职业类型/工作场景]
• 行为特征：[使用习惯/购买渠道偏好]
• 心理特征：[价值观/审美偏好/消费态度]

**用户需求优先级**
| 需求类型 | 优先级 | 描述 |
|---------|-------|------|
| 基本型需求 | 必须 | [不满足会导致差评的需求] |
| 期望型需求 | 重要 | [满足后会显著提升满意度] |
| 魅力型需求 | 加分 | [超预期的惊喜点] |

**🎨 外观设计语言**
• 整体调性：[一句话定义产品气质]
• 形态语言：[造型特征描述]
• 材质策略：[主材质+表面处理+质感描述]
• 配色方案：[主色+辅色+点缀色+色彩比例]
• CMF 规格：Color [颜色], Material [材料], Finishing [工艺]

**⚡ 核心功能矩阵**
| 功能名称 | 优先级 | 解决痛点 | 竞品对比 | 实现建议 |
|---------|-------|---------|---------|---------|
| [功能1] | P0 必须 | [痛点] | [竞品做法] | [我们的差异化] |
| [功能2] | P0 必须 | [痛点] | [竞品做法] | [我们的差异化] |
| [功能3] | P1 重要 | [痛点] | [竞品做法] | [我们的差异化] |
| [功能4] | P2 加分 | [痛点] | [竞品做法] | [我们的差异化] |

**🏷️ 核心卖点（USP）**
1. **[主卖点]** - [支撑点] - [用户价值]
2. **[副卖点1]** - [支撑点] - [用户价值]
3. **[副卖点2]** - [支撑点] - [用户价值]

**💰 定价策略**
• 建议零售价区间：[价格范围]
• 定价逻辑：[成本+/竞品对标/价值定价]
• 竞品价格参考：[列举竞品价格]
• 价格带定位：[高端/中高端/中端/性价比]

**📸 营销素材规划**（AI 自动生成）

| 素材类型 | 场景描述 | 核心信息 | 风格调性 |
|---------|---------|---------|---------|
| 产品主图 | [白底/场景] | [突出卖点] | [调性] |
| 使用场景图 | [用户+环境+动作] | [使用价值] | [调性] |
| 生活方式图 | [生活场景+情感] | [生活态度] | [调性] |
| 细节特写图 | [工艺/材质/结构] | [品质感] | [调性] |
| 对比图 | [vs竞品/vs传统] | [差异化优势] | [调性] |

**🎬 视频创意规划**（AI 自动生成）
• 时长：6秒短视频
• 故事线：[开头悬念] → [使用演示] → [效果呈现] → [卖点强化]
• 关键画面：
  1. [画面1描述 - 1.5秒]
  2. [画面2描述 - 2秒]
  3. [画面3描述 - 2.5秒]
• 情感基调：[情感关键词]
• 背景音乐：[节奏/风格建议]

**📊 竞争差异化策略**
| 维度 | 竞品现状 | 我们的策略 | 差异化程度 |
|-----|---------|-----------|-----------|
| [维度1] | [现状] | [策略] | 🟢强/🟡中/🔴弱 |
| [维度2] | [现状] | [策略] | 🟢强/🟡中/🔴弱 |
| [维度3] | [现状] | [策略] | 🟢强/🟡中/🔴弱 |

━━━━━━━━━━━━━━━━━━━━━━

[PRD_READY]

✅ **PRD 文档已生成完成！**

我已经基于您的选择和竞品分析，生成了完整的产品需求文档。您现在可以：
• 点击"查看完整 PRD"进入审核页面
• 在审核页面中手动修改任何内容
• 或继续与我对话，调整某个维度

# 重要规则

## 分析质量标准
- ✅ 外观分析必须具体到材质、工艺、配色，不能泛泛而谈
- ✅ 痛点挖掘必须分层（功能/体验/外观/服务）
- ✅ 每个创新方向必须包含目标人群和风险评估
- ✅ 建议必须有数据或逻辑支撑，不能凭感觉

## 禁止
- ❌ 不要逐项询问"请告诉我使用场景"这样的开放式问题
- ❌ 不要问固定的模板问题
- ❌ 不要让用户描述营销图片或视频的具体参数
- ❌ 不要等待用户询问，主动引导
- ❌ 不要给出模糊的分析（如"设计不错"），必须具体

## 必须
- ✅ 首次回复必须包含完整的竞品分析报告（如果有数据）
- ✅ 用选择题代替开放式问题
- ✅ 每次提供 3-4 个选项
- ✅ 根据产品场景自动推断所有素材需求
- ✅ 收集到足够信息后主动生成完整 PRD
- ✅ 每个建议都要有明确的"为什么"

# PRD 数据提取

每次回复后，如果收集到了产品信息，在回复末尾添加结构化数据：

\`\`\`prd-data
{
  "usageScenario": "场景描述",
  "targetAudience": "用户描述",
  "designStyle": "风格描述",
  "coreFeatures": ["功能1", "功能2"],
  "pricingRange": "价格区间",
  "marketingAssets": {
    "sceneDescription": "场景图描述",
    "usageScenarios": ["使用场景1", "使用场景2"],
    "lifestyleContext": "生活方式描述"
  },
  "videoAssets": {
    "storyLine": "故事线",
    "keyActions": ["动作1", "动作2"],
    "emotionalTone": "情感基调"
  }
}
\`\`\`

只填写用户已确认的信息，未确定的保持 null。

# 语言要求
- 对话使用中文
- PRD 文档专业术语可中英结合
- 落地页文案需要提供英文版本`;



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
  if (newData.usageScenario) merged.usageScenario = newData.usageScenario;
  if (newData.targetAudience) merged.targetAudience = newData.targetAudience;
  if (newData.designStyle) merged.designStyle = newData.designStyle;
  if (newData.pricingRange) merged.pricingRange = newData.pricingRange;
  
  // Array fields - merge
  if (newData.coreFeatures) {
    merged.coreFeatures = [...new Set([...(existing.coreFeatures || []), ...newData.coreFeatures])];
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
      usageScenario: false,
      targetAudience: false,
      designStyle: false,
      coreFeatures: false,
      confirmed: false,
    };
  }
  
  return {
    usageScenario: !!prdData.usageScenario,
    targetAudience: !!prdData.targetAudience,
    designStyle: !!prdData.designStyle,
    coreFeatures: !!(prdData.coreFeatures && prdData.coreFeatures.length > 0),
    confirmed: false, // This is set separately when stage completes
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

// Build dynamic system prompt with competitor insights
function buildDynamicSystemPrompt(competitorData: any, projectName: string, projectDescription: string | null, existingPrdData: Partial<PrdData> | null): string {
  let prompt = BASE_SYSTEM_PROMPT;

  // Add existing PRD data context
  if (existingPrdData && Object.keys(existingPrdData).some(k => existingPrdData[k as keyof PrdData])) {
    prompt += `

## 已收集的PRD数据（基于这些继续对话，不要重复询问已确认的信息）

${existingPrdData.usageScenario ? `- **使用场景**: ${existingPrdData.usageScenario}` : ""}
${existingPrdData.targetAudience ? `- **目标用户**: ${existingPrdData.targetAudience}` : ""}
${existingPrdData.designStyle ? `- **外观风格**: ${existingPrdData.designStyle}` : ""}
${existingPrdData.coreFeatures?.length ? `- **核心功能**: ${existingPrdData.coreFeatures.join(", ")}` : ""}
${existingPrdData.pricingRange ? `- **定价区间**: ${existingPrdData.pricingRange}` : ""}

**重要**：继续收集尚未获取的信息，当信息足够时生成完整PRD。`;
  }

  if (competitorData && competitorData.products?.length > 0) {
    const { products, reviews, totalReviews } = competitorData;

    // Analyze reviews for insights
    const positiveKeywords = ["quality", "great", "love", "excellent", "perfect", "好", "不错", "满意", "喜欢", "推荐", "sturdy", "stable", "portable", "lightweight"];
    const negativeKeywords = ["bad", "poor", "broken", "issue", "problem", "差", "失望", "坏", "问题", "退货", "cheap", "flimsy", "unstable", "heavy"];

    const positiveReviews = reviews.filter((r: any) => 
      positiveKeywords.some(kw => r.review_text?.toLowerCase().includes(kw)) || r.rating >= 4
    );
    const negativeReviews = reviews.filter((r: any) => 
      negativeKeywords.some(kw => r.review_text?.toLowerCase().includes(kw)) || r.rating <= 2
    );

    // Count products with images
    const productsWithImages = products.filter((p: any) => p.images && p.images.length > 0);

    prompt += `

## 竞品研究数据（必须在首次回复中分析并使用！）

### 项目信息
- 项目名称：${projectName}
${projectDescription ? `- 项目描述：${projectDescription}` : ""}

### 已分析的竞品（${products.length} 款）：
${products.map((p: any) => `- **${p.title}** ${p.rating ? `(${p.rating}★)` : ""} ${p.reviewCount ? `- ${p.reviewCount}条评论` : ""} ${p.price ? `- ${p.price}` : ""} ${p.images?.length ? `[已获取${p.images.length}张产品图]` : ""}`).join("\n")}

### 竞品外观趋势分析
${productsWithImages.length > 0 ? `已获取 ${productsWithImages.length} 款产品的实物图片，你需要在开场时分析：
- 主流设计趋势（材质、形态、配色）
- 共同的设计特征
- 可能的差异化方向` : "未获取产品图片"}

### 评论分析摘要（共 ${totalReviews} 条评论）：
- 好评倾向：约 ${positiveReviews.length} 条
- 差评倾向：约 ${negativeReviews.length} 条

### 首次回复要求：
1. 📸 分析竞品外观趋势（如果有图片数据）
2. 💬 总结评论痛点机会
3. 🎯 基于以上，提出2-3个产品方向选项
4. 让用户选择，而非直接问开放式问题`;
  } else {
    prompt += `

## 项目信息
- 项目名称：${projectName}
${projectDescription ? `- 项目描述：${projectDescription}` : ""}

### 无竞品数据
用户未进行竞品研究。请：
1. 询问用户的产品初步想法
2. 基于用户描述，提出2-3个方向选项供选择
3. 通过选择题而非开放式问题收集信息`;
  }

  return prompt;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, projectId, currentStage } = await req.json();
    const GOOGLE_API_KEY = Deno.env.get("GOOGLE_API_KEY");

    if (!GOOGLE_API_KEY) {
      throw new Error("GOOGLE_API_KEY is not configured");
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get project info including existing PRD data
    const { data: project } = await supabase
      .from("projects")
      .select("name, description, prd_data")
      .eq("id", projectId)
      .single();

    const existingPrdData = project?.prd_data as Partial<PrdData> | null;

    // Get competitor data if in stage 1
    let competitorData = null;
    if (currentStage === 1) {
      competitorData = await getCompetitorData(supabase, projectId);
    }

    // Build dynamic system prompt
    const stageNames = ["PRD细化", "视觉生成", "落地页"];
    const stageName = stageNames[currentStage - 1] || "PRD细化";
    
    const dynamicSystemPrompt = buildDynamicSystemPrompt(
      competitorData, 
      project?.name || "未命名项目",
      project?.description,
      existingPrdData
    );
    
    const systemPromptWithStage = `${dynamicSystemPrompt}\n\n当前阶段：${currentStage} - ${stageName}`;

    // Convert messages to Google AI Studio format
    const googleMessages = messages.map((msg: { role: string; content: string }) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }],
    }));

    // Use Google AI Studio Gemini API with streaming
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent?alt=sse&key=${GOOGLE_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: systemPromptWithStage }],
          },
          contents: googleMessages,
          generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 8192,
          },
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "请求过于频繁，请稍后再试" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402 || response.status === 403) {
        return new Response(JSON.stringify({ error: "API 额度已用完或权限不足" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const text = await response.text();
      console.error("Google AI Studio error:", response.status, text);
      return new Response(JSON.stringify({ error: "AI 服务暂时不可用" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Collect full response for PRD extraction
    let fullResponse = "";

    // Transform Google SSE format to OpenAI-compatible SSE format
    const transformStream = new TransformStream({
      transform(chunk, controller) {
        const text = new TextDecoder().decode(chunk);
        const lines = text.split("\n");
        
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const jsonStr = line.slice(6).trim();
            if (jsonStr === "[DONE]") {
              controller.enqueue(new TextEncoder().encode("data: [DONE]\n\n"));
              continue;
            }
            
            try {
              const data = JSON.parse(jsonStr);
              const content = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
              
              if (content) {
                fullResponse += content;
                // Convert to OpenAI-compatible format
                const openAIFormat = {
                  choices: [
                    {
                      delta: { content },
                      index: 0,
                    },
                  ],
                };
                controller.enqueue(
                  new TextEncoder().encode(`data: ${JSON.stringify(openAIFormat)}\n\n`)
                );
              }
            } catch (e) {
              // Skip malformed JSON
            }
          }
        }
      },
      async flush() {
        // After streaming is complete, extract and save PRD data
        if (fullResponse && currentStage === 1) {
          const extractedPrd = extractPrdData(fullResponse);
          if (extractedPrd) {
            const mergedPrd = mergePrdData(existingPrdData, extractedPrd);
            const newProgress = calculatePrdProgressFromData(mergedPrd);
            
            // Check if stage is complete
            if (fullResponse.includes("[STAGE_COMPLETE:1]")) {
              newProgress.confirmed = true;
            }
            
            // Update project with merged PRD data and progress
            await supabase
              .from("projects")
              .update({ 
                prd_data: mergedPrd,
                prd_progress: newProgress,
              })
              .eq("id", projectId);
            
            console.log("PRD data saved:", mergedPrd);
          }
        }
      }
    });

    const transformedStream = response.body?.pipeThrough(transformStream);

    return new Response(transformedStream, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Chat error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
