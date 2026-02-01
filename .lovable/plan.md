

# Amazon 抓取优化计划

## 问题诊断

### 当前问题
1. **评论抓取不完整** - Amazon 产品页评论是动态加载的，Firecrawl 默认只能获取部分预览
2. **图片抓取过多** - 当前抓取了太多图片（广告、缩略图等），只需要商品主图
3. **缺少置顶评论摘要** - Amazon 商品页顶部有"客户评论摘要"（Customer Review Summary），是最有价值的评论洞察

### 优化目标
1. 通过 Firecrawl 截图功能获取评论页面视觉信息
2. 抓取 Amazon 置顶的产品综合评论摘要
3. 只抓取商品主图（第一张大图）

---

## 解决方案

### 方案一：截图 + 评论页抓取

```
┌────────────────────────────────────────────────────────────────┐
│                    两步抓取策略                                 │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  步骤1: 抓取产品页                                              │
│  ├─ 获取产品标题、价格、评分                                    │
│  ├─ 提取商品主图（仅第一张）                                    │
│  └─ 提取置顶评论摘要（Review Summary）                          │
│                                                                │
│  步骤2: 抓取评论页 + 截图                                       │
│  ├─ 构建评论页 URL: /product-reviews/{ASIN}                    │
│  ├─ 使用 Firecrawl screenshot 格式获取截图                      │
│  ├─ 使用 actions 滚动页面加载更多评论                           │
│  └─ 存储截图用于 AI 视觉分析                                    │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## 技术实现

### 1. 修改 scrape-competitor Edge Function

**文件**：`supabase/functions/scrape-competitor/index.ts`

#### 1.1 新增 ASIN 提取函数

```typescript
function extractAsin(url: string): string | null {
  // 匹配 Amazon URL 中的 ASIN
  // 格式: /dp/B0CFQ7BGPT/ 或 /gp/product/B0CFQ7BGPT/
  const patterns = [
    /\/dp\/([A-Z0-9]{10})/i,
    /\/gp\/product\/([A-Z0-9]{10})/i,
    /\/product\/([A-Z0-9]{10})/i,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}
```

#### 1.2 修改主图抓取逻辑

只抓取商品主图（Amazon 主图通常是第一张大尺寸图片）：

```typescript
function extractMainProductImage(markdown: string, url: string): string | null {
  // Amazon 主图特征：
  // 1. 包含 m.media-amazon.com 或 images-amazon.com
  // 2. 尺寸标识为 _SL1500_ 或 _SL1200_ 等大尺寸
  // 3. 通常是第一张出现的产品图
  
  const amazonImagePattern = /https?:\/\/m\.media-amazon\.com\/images\/I\/[^"'\s]+(?:_SL\d{3,4}_|_AC_SL\d{3,4}_)[^"'\s]*/gi;
  const matches = markdown.match(amazonImagePattern);
  
  if (matches && matches.length > 0) {
    // 返回第一张（主图）
    return matches[0];
  }
  return null;
}
```

#### 1.3 新增置顶评论摘要提取

Amazon 产品页有 "Customer reviews" 置顶摘要区域：

```typescript
function extractReviewSummary(markdown: string): {
  overallRating: number | null;
  totalReviews: number | null;
  ratingBreakdown: { stars: number; percentage: number }[];
  topPositives: string[];
  topNegatives: string[];
} {
  // 提取总体评分和评论数
  // 提取星级分布（5星 xx%，4星 xx%...）
  // 提取 "Customers say" 或 "Top positive/critical reviews" 摘要
}
```

#### 1.4 新增评论页截图抓取

使用 Firecrawl 的 `screenshot` 格式 + `actions` 滚动：

```typescript
async function scrapeReviewsWithScreenshot(asin: string, apiKey: string) {
  const reviewUrl = `https://www.amazon.com/product-reviews/${asin}/?sortBy=recent`;
  
  const response = await fetch("https://api.firecrawl.dev/v1/scrape", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url: reviewUrl,
      formats: ["markdown", "screenshot"],
      waitFor: 5000,
      actions: [
        { type: "wait", milliseconds: 2000 },
        { type: "scroll", direction: "down" },
        { type: "wait", milliseconds: 1000 },
        { type: "scroll", direction: "down" },
        { type: "wait", milliseconds: 1000 },
      ],
    }),
  });
  
  const data = await response.json();
  
  return {
    markdown: data.data?.markdown,
    screenshot: data.data?.screenshot, // base64 编码的截图
  };
}
```

### 2. 数据库更新

新增字段存储截图和评论摘要：

| 表 | 字段 | 类型 | 描述 |
|---|------|------|------|
| `competitor_products` | `review_screenshot` | `text` | 评论页截图（base64） |
| `competitor_products` | `review_summary` | `jsonb` | 置顶评论摘要数据 |
| `competitor_products` | `main_image` | `text` | 商品主图 URL |

### 3. 改进评论提取逻辑

从评论页 markdown 提取真实评论：

```typescript
function extractReviewsFromReviewPage(markdown: string): Review[] {
  const reviews: Review[] = [];
  
  // 评论页格式更规范，通常包含：
  // - "X out of 5 stars"
  // - "Reviewed in [country] on [date]"
  // - "Verified Purchase"
  // - 评论正文
  
  const reviewBlockPattern = /(\d)\s*out of\s*5\s*stars[\s\S]*?Reviewed in[\s\S]*?(?=\d\s*out of\s*5\s*stars|$)/gi;
  
  let match;
  while ((match = reviewBlockPattern.exec(markdown)) !== null) {
    const rating = parseInt(match[1], 10);
    const block = match[0];
    
    // 提取评论标题和正文
    const textMatch = block.match(/Verified Purchase\s*\n+([\s\S]+?)(?:\n\n|Helpful|Report)/i);
    if (textMatch && textMatch[1].length > 30) {
      reviews.push({
        text: textMatch[1].trim(),
        rating,
      });
    }
  }
  
  return reviews;
}
```

---

## 完整抓取流程

```
用户提交 Amazon URL
        │
        ▼
┌───────────────────────────────────────┐
│  步骤1: 抓取产品页                     │
│  ─────────────────────────────────    │
│  • 产品标题、价格、总评分              │
│  • 商品主图（仅第一张）                │
│  • 置顶评论摘要（Rating Breakdown）    │
│  • 提取 ASIN                          │
└───────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────┐
│  步骤2: 抓取评论页                     │
│  ─────────────────────────────────    │
│  URL: /product-reviews/{ASIN}         │
│  • 启用 screenshot 格式               │
│  • 使用 actions 滚动加载评论           │
│  • 提取完整评论文本                    │
│  • 保存页面截图                        │
└───────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────┐
│  保存数据                              │
│  ─────────────────────────────────    │
│  competitor_products:                 │
│  • main_image: 主图 URL               │
│  • review_summary: 评论摘要 JSON       │
│  • review_screenshot: base64 截图     │
│                                       │
│  competitor_reviews:                  │
│  • 真实评论文本 + 星级                 │
└───────────────────────────────────────┘
```

---

## 截图的用途

### 为什么需要截图？

1. **AI 视觉分析** - 截图可以发送给 AI（如 Gemini Pro Vision）进行视觉分析
2. **评论布局理解** - 截图能捕获评论的完整视觉布局，包括：
   - 星级分布图表
   - 置顶好评/差评卡片
   - 用户头像和验证标识
3. **备用数据源** - 当文本提取失败时，可以通过截图进行 OCR 或视觉分析

### 截图存储方式

- 方案A：存储 base64 到数据库（简单，但占空间）
- 方案B：上传到 Supabase Storage，存储 URL（推荐）

---

## 文件变更清单

| 文件路径 | 操作 | 描述 |
|---------|------|------|
| 数据库迁移 | 新建 | 添加 main_image, review_summary, review_screenshot 字段 |
| `supabase/functions/scrape-competitor/index.ts` | 修改 | 实现两步抓取、截图、主图提取 |
| `src/components/CompetitorCard.tsx` | 修改 | 显示主图和评论摘要 |

---

## 预期效果

1. **准确的评论数据** - 从评论专页抓取真实评论内容，而非 URL 碎片
2. **商品主图清晰** - 只抓取一张主图，用于 PRD 参考
3. **评论摘要可视化** - 置顶评论摘要包含好评/差评要点，一目了然
4. **截图备用分析** - 评论页截图可用于 AI 视觉分析，提取更丰富的洞察

