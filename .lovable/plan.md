
# PRD 阶段重构 - 市场分析与评论OCR方案

## 需求分析

### 当前问题
1. **AI产品经理页面**的PRD侧边栏包含"市场分析"维度，与新的"市场分析"板块概念冲突
2. 第一个板块叫"竞品分析"，需改名为"市场分析"并增加AI专家驱动的分析功能
3. Firecrawl无法可靠抓取Amazon评论（HTML/Markdown解析策略均不稳定）

### 解决方案概述
1. 移除PRD信息收集侧边栏的"市场分析"项目
2. 将第一板块从"竞品分析"改为"市场分析"，增加AI市场分析专家功能
3. 使用Firecrawl的**screenshot**功能截取评论区，再通过Gemini 3 Pro进行OCR提取

---

## 技术实现方案

### 第一部分：PRD侧边栏修改

**文件**: `src/components/PrdExtractionSidebar.tsx`

移除"市场分析"维度，保留以下4个核心收集项：
- 使用场景
- 目标用户
- 外观风格
- 核心功能

```text
修改前 progressItems:
1. 市场分析 (TrendingUp)
2. 使用场景 (MapPin)
3. 目标用户 (Users)
4. 外观风格 (Palette)
5. 核心功能 (Zap)

修改后 progressItems:
1. 使用场景 (MapPin)
2. 目标用户 (Users)
3. 外观风格 (Palette)
4. 核心功能 (Zap)
```

---

### 第二部分：第一板块重命名与功能增强

**文件**: `src/components/PrdPhaseIndicator.tsx`

```text
修改前: { id: 1, label: "竞品分析", icon: Search }
修改后: { id: 1, label: "市场分析", icon: TrendingUp }
```

**文件**: `src/components/CompetitorResearch.tsx`

主要改动：
1. 更新标题文案："竞品研究" → "市场分析"
2. 增加"开始市场分析"按钮功能
3. 完成竞品抓取后，自动触发AI市场分析
4. AI分析结果展示在页面上

新增流程：
```text
用户添加竞品链接 → 抓取产品信息+评论截图 → OCR提取评论 → AI市场专家分析 → 展示分析报告
```

---

### 第三部分：截图+OCR抓取评论（核心技术改动）

**文件**: `supabase/functions/scrape-competitor/index.ts`

#### 策略变更
- 放弃直接解析HTML/Markdown的评论提取
- 使用Firecrawl的`screenshot`格式截取评论页面
- 将截图发送给Gemini 3 Pro进行OCR+结构化提取

#### 具体实现

**Step 1: 截取评论页截图**
```typescript
const reviewUrl = `https://www.amazon.com/product-reviews/${asin}/?sortBy=recent`;
const response = await fetch("https://api.firecrawl.dev/v1/scrape", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${FIRECRAWL_API_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    url: reviewUrl,
    formats: ["screenshot"],
    waitFor: 8000,
    actions: [
      { type: "wait", milliseconds: 3000 },
      { type: "scroll", direction: "down", amount: 800 },
      { type: "wait", milliseconds: 2000 },
    ],
  }),
});
```

**Step 2: Gemini 3 Pro OCR提取**
```typescript
const ocrResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${LOVABLE_API_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    model: "google/gemini-3-pro-preview",
    messages: [
      {
        role: "system",
        content: `你是一个专业的OCR和评论提取专家。从图片中提取所有用户评论。

返回JSON数组格式:
[
  { "text": "评论内容", "rating": 评分数字1-5, "title": "评论标题" },
  ...
]

只提取真实的用户评论，忽略广告、UI元素、产品描述等。`
      },
      {
        role: "user",
        content: [
          { type: "text", text: "请提取这张Amazon评论页截图中的所有用户评论：" },
          { type: "image_url", image_url: { url: screenshotBase64 } }
        ]
      }
    ],
    temperature: 0.2,
  }),
});
```

**Step 3: 多页抓取**
- 截取Recent排序第1、2页
- 截取Helpful排序第1页
- 合并去重评论数据

---

### 第四部分：新增市场分析AI专家

**新增文件**: `supabase/functions/market-analysis/index.ts`

功能：根据抓取的竞品数据，生成专业的市场分析报告

**AI角色设定**:
```typescript
const MARKET_ANALYST_PROMPT = `你是一位资深市场分析专家，拥有15年消费电子和跨境电商行业经验。

## 你的专业背景
- 曾任职于Nielsen、Euromonitor等顶级市场研究机构
- 专精于竞品分析、市场趋势预测、用户需求洞察
- 擅长从零散数据中提炼可执行的产品策略

## 分析任务
基于提供的竞品数据（产品信息、价格、评分、用户评论），生成一份全面的市场分析报告。

## 输出格式
### 📊 市场格局分析
- 竞品数量与分布
- 价格带分析（低/中/高端占比）
- 品牌集中度

### 💰 价格策略洞察
- 各价格带的产品特征
- 价格与评分的相关性
- 定价机会区间

### ⭐ 用户评价分析
- 评分分布趋势
- TOP好评点（频率排序）
- TOP差评点（频率排序）

### 🎯 差异化机会
- 市场空白点
- 未被满足的用户需求
- 建议的产品差异化方向

### 📈 市场趋势预测
- 基于数据的趋势判断
- 潜在风险提示
`;
```

**返回结构化数据**:
```typescript
{
  "marketOverview": {
    "competitorCount": number,
    "priceDistribution": { low: %, mid: %, high: % },
    "averageRating": number
  },
  "priceAnalysis": {
    "minPrice": string,
    "maxPrice": string,
    "sweetSpot": string,
    "opportunityGap": string
  },
  "reviewInsights": {
    "positiveHighlights": string[],
    "negativeHighlights": string[],
    "unmetNeeds": string[]
  },
  "differentiationOpportunities": string[],
  "marketTrends": string[],
  "strategicRecommendations": string[]
}
```

---

### 第五部分：前端市场分析展示

**文件**: `src/components/CompetitorResearch.tsx`

新增组件/功能：
1. "开始市场分析"按钮（竞品添加完成后显示）
2. 分析进度指示器
3. 市场分析报告卡片展示

**UI流程**:
```text
┌─────────────────────────────────────────┐
│ 📊 市场分析（可选）                       │
│                                         │
│ [添加Amazon竞品链接]                     │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ 竞品1: iPhone Case - $29.99 ⭐4.2   │ │
│ │ 竞品2: Phone Cover - $19.99 ⭐4.5   │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ [开始市场分析]  ← 新增按钮               │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ 📊 市场分析报告                      │ │
│ │ • 分析了3款竞品                      │ │
│ │ • 价格区间: $15-$35                  │ │
│ │ • 核心机会: 轻量化设计               │ │
│ │ [展开查看完整报告]                   │ │
│ └─────────────────────────────────────┘ │
│                                         │
│         [跳过] [进入AI产品经理]          │
└─────────────────────────────────────────┘
```

---

## 修改范围摘要

| 文件 | 修改类型 | 内容 |
|------|---------|------|
| `src/components/PrdExtractionSidebar.tsx` | 修改 | 移除"市场分析"维度 |
| `src/components/PrdPhaseIndicator.tsx` | 修改 | "竞品分析"→"市场分析"，更换图标 |
| `src/components/CompetitorResearch.tsx` | 修改 | 更新标题文案，添加市场分析按钮和报告展示 |
| `supabase/functions/scrape-competitor/index.ts` | 修改 | 使用截图+OCR策略替代HTML解析 |
| `supabase/functions/market-analysis/index.ts` | 新增 | AI市场分析专家边缘函数 |
| `supabase/config.toml` | 修改 | 添加market-analysis函数配置 |

---

## 技术细节

### 使用的AI模型
- **市场分析**: `google/gemini-3-pro-preview`
- **评论OCR提取**: `google/gemini-3-pro-preview`（支持多模态图像输入）

### 截图OCR优势
1. **可靠性高**：直接"看"页面内容，不依赖HTML结构
2. **反爬规避**：截图比解析更不容易触发反爬机制
3. **内容完整**：能捕获动态加载的内容

### 数据流
```text
用户添加竞品URL
    ↓
Firecrawl抓取产品页（基本信息+截图）
    ↓
Firecrawl抓取评论页（截图）
    ↓
Gemini 3 Pro OCR提取评论
    ↓
保存到数据库
    ↓
用户点击"开始市场分析"
    ↓
market-analysis函数分析数据
    ↓
返回结构化报告展示给用户
```

---

## 预期效果

| 改动 | 效果 |
|------|------|
| 移除PRD侧边栏的"市场分析" | AI产品经理专注产品定义，无概念冲突 |
| 第一板块改名"市场分析" | 更清晰的功能定位 |
| 截图+OCR抓取评论 | 大幅提高评论获取成功率 |
| AI市场分析专家 | 提供专业洞察，帮助用户理解市场格局 |

