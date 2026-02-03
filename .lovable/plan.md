
# 落地页生成模块优化计划

## 目标概述

根据您的需求，优化落地页生成模块以达成以下目标：
1. **读取产品定义文档**：充分利用 PRD 数据（使用场景、目标用户、核心功能、设计风格等）
2. **融合视觉素材**：将产品设计阶段生成的营销图片和营销文案整合到落地页
3. **视频作为 Hero 背景**：将生成的视频作为 Hero 区域的背景自动播放
4. **电商测品标准**：打造符合电商测品标准的高转化落地页
5. **UI 美观 + 内容丰富**：确保页面视觉效果专业，内容充实以验证市场接受度

---

## 一、核心改进策略

### 1.1 视频作为 Hero 背景

将产品视频改为 Hero 区域的全屏背景视频，自动静音循环播放：

```text
┌─────────────────────────────────────────────────────────────┐
│  [全屏视频背景 - 自动播放、静音、循环]                         │
│                                                             │
│     ┌─────────────────────────────────────────┐             │
│     │    PRODUCT HEADLINE                     │             │
│     │    Subheadline value proposition        │             │
│     │                                         │             │
│     │    [  Get Early Access  ]               │             │
│     └─────────────────────────────────────────┘             │
│                                                             │
│   半透明叠加层确保文字可读性                                   │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 营销图片 + 文案融合

将视觉生成阶段产出的营销图片及其配套文案整合为落地页的核心内容板块：

```text
┌─────────────────────────────────────────────────────────────┐
│  📸 产品特色展示                                             │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐   ┌──────────────────┐                │
│  │  [场景图]         │   │  [使用图]         │                │
│  │                  │   │                  │                │
│  │  营销文案...      │   │  营销文案...      │                │
│  └──────────────────┘   └──────────────────┘                │
│                                                             │
│  ┌──────────────────┐   ┌──────────────────┐                │
│  │  [结构图]         │   │  [细节图]         │                │
│  │                  │   │                  │                │
│  │  营销文案...      │   │  营销文案...      │                │
│  └──────────────────┘   └──────────────────┘                │
└─────────────────────────────────────────────────────────────┘
```

### 1.3 新增内容板块（电商测品标准）

按照高转化电商落地页最佳实践，新增以下板块：

| 板块 | 目的 | 内容来源 |
|------|------|----------|
| **Hero 视频区** | 吸引注意力 | 生成的产品视频 |
| **痛点共鸣** | 建立同理心 | PRD 痛点 + 竞品差评 |
| **产品特色展示** | 展示差异化 | 营销图片 + 营销文案 |
| **使用场景** | 帮助用户想象 | PRD 使用场景 + 场景图 |
| **产品规格** | 建立信任 | PRD 核心功能 |
| **社会证明** | 降低决策风险 | AI 生成的预期反馈 |
| **FAQ 区** | 消除疑虑 | 基于 PRD 自动生成 |
| **CTA 区** | 转化收集 | 邮箱订阅表单 |

---

## 二、技术实现细节

### 2.1 数据流增强

**Project.tsx 传递完整数据**：

```typescript
// 当前传递的数据
prdData: {
  usageScenarios, targetAudience, coreFeatures, designStyle, selectedDirection
}

// 需要增强为
prdData: {
  ...现有字段,
  painPoints: [],           // 用户痛点
  sellingPoints: [],        // 卖点
  pricingStrategy: "",      // 定价策略
  competitorInsights: {},   // 竞品洞察
  marketingAssets: {},      // 营销资产描述
}
```

**LandingPageBuilder 接收营销图片的 marketing_copy**：

```typescript
interface MarketingImage {
  id: string;
  image_url: string;
  image_type: string;
  marketing_copy?: string; // 新增：每张图的营销文案
}
```

### 2.2 LandingPage 页面组件重构

**新的页面结构**：

```text
1. Hero Section (视频背景)
   - 全屏视频背景，静音自动循环
   - 半透明深色叠加层
   - 产品标题 + 副标题
   - 主 CTA 按钮

2. Pain Points Section
   - 3-4 个痛点卡片
   - 从 PRD 或竞品差评提取

3. Product Features Section (营销图片画廊)
   - 网格展示营销图片
   - 每张图配套营销文案
   - 图片类型标签

4. Usage Scenarios Section
   - 场景图 + 场景描述
   - 来自 PRD 的使用场景

5. Specifications Section
   - 核心功能列表
   - 设计风格亮点

6. Social Proof Section
   - 预期用户反馈
   - 信任徽章

7. FAQ Section
   - 常见问题自动生成
   - 基于产品特点

8. Final CTA Section
   - 邮箱订阅表单
   - 紧迫感文案
```

### 2.3 Edge Function 优化

**generate-landing-page/index.ts 增强**：

```typescript
// 新增生成内容
{
  // 现有字段...
  
  // 新增字段
  faqItems: [
    { question: "...", answer: "..." }
  ],
  specificationHighlights: [...],
  usageScenarioDescriptions: [...],
  socialProofStatements: [...],
  urgencyMessage: "...",
}
```

### 2.4 视频背景 Hero 实现

```tsx
// Hero Section with Video Background
<section className="relative h-screen overflow-hidden">
  {/* Video Background */}
  {videoUrl && (
    <video
      autoPlay
      muted
      loop
      playsInline
      className="absolute inset-0 w-full h-full object-cover"
    >
      <source src={videoUrl} type="video/mp4" />
    </video>
  )}
  
  {/* Dark Overlay */}
  <div className="absolute inset-0 bg-black/50" />
  
  {/* Content */}
  <div className="relative z-10 flex flex-col items-center justify-center h-full text-center text-white px-4">
    <h1 className="text-5xl md:text-7xl font-bold mb-4">{headline}</h1>
    <p className="text-xl md:text-2xl mb-8 max-w-2xl">{subheadline}</p>
    <Button size="lg" className="px-8 py-6 text-lg">
      {ctaText}
    </Button>
  </div>
</section>
```

---

## 三、修改文件清单

| 文件 | 操作 | 修改内容 |
|------|------|----------|
| `src/pages/Project.tsx` | 修改 | 传递完整 prdData 和带 marketing_copy 的营销图片 |
| `src/components/LandingPageBuilder.tsx` | 修改 | 更新 props 接口，传递完整数据到 Edge Function |
| `src/components/LandingPagePreview.tsx` | 重构 | 视频背景 Hero、营销图片画廊、新增 FAQ 等板块 |
| `src/pages/LandingPage.tsx` | 重构 | 公开落地页同步更新，支持视频背景和新板块 |
| `src/components/LandingPageTemplates.tsx` | 修改 | 新增视频背景相关样式配置 |
| `supabase/functions/generate-landing-page/index.ts` | 修改 | 生成 FAQ、规格亮点、场景描述等新内容 |
| 数据库迁移 | 新增 | landing_pages 表新增 faq_items、specifications 等字段 |

---

## 四、数据库更改

```sql
ALTER TABLE landing_pages 
ADD COLUMN IF NOT EXISTS faq_items JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS specifications JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS usage_scenarios JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS social_proof_items JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS urgency_message TEXT,
ADD COLUMN IF NOT EXISTS marketing_images_with_copy JSONB DEFAULT '[]';
```

---

## 五、新的落地页视觉效果

### 5.1 Hero 区域（视频背景）

```text
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃                                                             ┃
┃   ▶️ [产品视频背景 - 自动播放 / 静音 / 循环]                  ┃
┃                                                             ┃
┃         ╔═══════════════════════════════════════╗           ┃
┃         ║                                       ║           ┃
┃         ║   REVOLUTIONARY PRODUCT               ║           ┃
┃         ║   THAT CHANGES EVERYTHING             ║           ┃
┃         ║                                       ║           ┃
┃         ║   Experience the future of [category] ║           ┃
┃         ║                                       ║           ┃
┃         ║       [ GET EARLY ACCESS ]            ║           ┃
┃         ║                                       ║           ┃
┃         ╚═══════════════════════════════════════╝           ┃
┃                                                             ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
```

### 5.2 产品特色展示（营销图片 + 文案）

```text
╭──────────────────────────────────────────────────────────────╮
│                    ✨ Product Highlights                     │
├──────────────────────────────────────────────────────────────┤
│  ┌─────────────────────┐    ┌─────────────────────┐          │
│  │                     │    │                     │          │
│  │    [场景图]          │    │    [使用图]          │          │
│  │                     │    │                     │          │
│  ├─────────────────────┤    ├─────────────────────┤          │
│  │ 📍 SCENE            │    │ 👆 USAGE            │          │
│  │                     │    │                     │          │
│  │ "Perfect for your   │    │ "Intuitive design   │          │
│  │ outdoor adventures, │    │ that requires no    │          │
│  │ this product..."    │    │ learning curve..."  │          │
│  └─────────────────────┘    └─────────────────────┘          │
│                                                              │
│  ┌─────────────────────┐    ┌─────────────────────┐          │
│  │                     │    │                     │          │
│  │    [结构图]          │    │    [细节图]          │          │
│  │                     │    │                     │          │
│  ├─────────────────────┤    ├─────────────────────┤          │
│  │ 🔧 STRUCTURE        │    │ 🔍 DETAIL           │          │
│  │                     │    │                     │          │
│  │ "Built with premium │    │ "Every detail is    │          │
│  │ materials for..."   │    │ carefully crafted..." │        │
│  └─────────────────────┘    └─────────────────────┘          │
╰──────────────────────────────────────────────────────────────╯
```

### 5.3 FAQ 区域

```text
╭──────────────────────────────────────────────────────────────╮
│                    ❓ Frequently Asked                       │
├──────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────────┐  │
│  │ ▸ What makes this product different?                  │  │
│  │   Our product combines [feature1] with [feature2]...  │  │
│  └────────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ ▸ When will the product be available?                 │  │
│  │   We're launching to early subscribers first...       │  │
│  └────────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ ▸ Is there a money-back guarantee?                    │  │
│  │   Yes! We offer a 30-day satisfaction guarantee...    │  │
│  └────────────────────────────────────────────────────────┘  │
╰──────────────────────────────────────────────────────────────╯
```

---

## 六、用户体验流程

```text
1. 用户完成产品设计阶段，生成了：
   - 选定的产品造型图
   - 多张营销图片（场景图、使用图、结构图等）+ 每张的营销文案
   - 产品展示视频

2. 用户进入落地页阶段

3. 选择页面模板风格

4. 点击"AI 生成落地页"

5. 系统自动：
   - 读取完整 PRD 数据
   - 整合所有营销图片和文案
   - 将视频设为 Hero 背景
   - 生成 FAQ、规格亮点等补充内容
   - 组装成完整的高转化落地页

6. 预览并发布

7. 收集邮箱验证市场兴趣
```

---

## 七、技术注意事项

1. **视频加载优化**：视频背景使用 `preload="metadata"` 和渐进式加载，避免影响页面性能
2. **移动端适配**：Hero 视频在移动端可降级为静态图片背景，减少流量消耗
3. **无视频降级**：如果没有视频，Hero 区域使用产品主图 + 渐变背景
4. **图片懒加载**：营销图片画廊使用 Intersection Observer 实现懒加载
5. **SEO 考虑**：确保关键文案内容可被搜索引擎抓取

