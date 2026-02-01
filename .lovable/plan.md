
# 落地页升级与评论抓取优化计划

## 项目概览

本次更新涵盖以下核心改进：
1. **评论抓取上限提升至100条** - 优化竞品研究数据收集
2. **落地页智能整合生成** - 基于PRD内容+视觉素材+视频内容自动生成专业广告落地页
3. **移除广告策略板块** - 简化落地页模块，专注于页面生成
4. **短域名发布机制** - 优化落地页URL呈现方式

---

## 第一部分：评论抓取上限优化

### 1.1 修改 scrape-competitor Edge Function

**文件**: `supabase/functions/scrape-competitor/index.ts`

**当前代码** (第108行):
```typescript
const reviewsToInsert = reviews.slice(0, 50).map((review) => ({
```

**修改为**:
```typescript
const reviewsToInsert = reviews.slice(0, 100).map((review) => ({
```

---

## 第二部分：落地页智能整合生成

### 2.1 数据库扩展

为 `landing_pages` 表新增存储字段：

| 字段名 | 类型 | 描述 |
|--------|------|------|
| `subheadline` | `text` | 副标题/价值主张 |
| `cta_text` | `text` | 行动号召按钮文案 |
| `product_images` | `jsonb` | 产品图片URL数组 |
| `marketing_images` | `jsonb` | 营销图片URL数组（场景图、使用图等） |
| `video_url` | `text` | 视频URL |
| `generated_images` | `jsonb` | AI补充生成的图片 |
| `color_scheme` | `jsonb` | 配色方案 |

### 2.2 重构 generate-landing-page Edge Function

**文件**: `supabase/functions/generate-landing-page/index.ts`

**核心改进**:

1. **接收完整PRD数据**
   - 使用场景 (usageScenario)
   - 目标用户 (targetAudience)  
   - 核心功能 (coreFeatures)
   - 设计风格 (designStyle)
   - 营销素材描述 (marketingAssets)
   - 视频场景定义 (videoAssets)
   - 竞品洞察 (competitorInsights)

2. **接收视觉资产**
   - 产品造型图 (selectedProductImage)
   - 营销图片数组 (marketingImages)
   - 视频URL (videoUrl)

3. **AI分析产品卖点**
   - 基于PRD数据提炼核心卖点
   - 结合竞品痛点形成差异化优势
   - 生成专业广告文案

4. **智能补充缺失图片**
   - 检测是否缺少必要图片类型
   - 自动调用AI生成补充图片
   - 图片类型：生活场景图、使用场景图、细节图

**新增数据流**:
```text
PRD数据 ─┬─> AI分析 ─┬─> 提炼卖点
         │           ├─> 生成文案  
         │           └─> 配色建议
         │
视觉素材 ─┼─> 整合    ─┬─> 检查完整性
         │           └─> 补充生成
         │
竞品洞察 ─┴─> 差异化  ─┬─> 痛点解决方案
                      └─> 信任背书
                              ↓
                        广告落地页
```

### 2.3 广告落地页设计标准

**页面结构**:

```text
┌────────────────────────────────────────────────────────┐
│ [Hero Section]                                         │
│ ┌─────────────────────────────────────────────────────┐│
│ │         主标题 (AI生成，突出核心卖点)                ││
│ │         副标题 (价值主张)                           ││
│ │    ┌─────────────────────────────┐                  ││
│ │    │      产品主图/视频           │                  ││
│ │    └─────────────────────────────┘                  ││
│ │         [CTA按钮]                                   ││
│ └─────────────────────────────────────────────────────┘│
├────────────────────────────────────────────────────────┤
│ [Pain Points Section] - 痛点共鸣                        │
│ • 痛点1 (基于竞品差评分析)                             │
│ • 痛点2                                               │
│ • 痛点3                                               │
├────────────────────────────────────────────────────────┤
│ [Solution Section] - 我们的解决方案                     │
│ ┌──────┐ ┌──────┐ ┌──────┐                           │
│ │卖点1 │ │卖点2 │ │卖点3 │  (基于PRD核心功能)         │
│ └──────┘ └──────┘ └──────┘                           │
├────────────────────────────────────────────────────────┤
│ [Visual Gallery] - 产品展示                            │
│ ┌────────────────────────────────────┐                │
│ │  [生活场景图]  [使用场景图]  [细节图] │                │
│ └────────────────────────────────────┘                │
├────────────────────────────────────────────────────────┤
│ [Video Section] - 视频展示 (如有)                       │
│ ┌────────────────────────────────────┐                │
│ │            [产品视频]               │                │
│ └────────────────────────────────────┘                │
├────────────────────────────────────────────────────────┤
│ [Trust Section] - 信任背书                             │
│ ✓ 30天无理由退款  ✓ 专业团队研发  ✓ 全球用户信赖         │
├────────────────────────────────────────────────────────┤
│ [CTA Section] - 邮箱收集                               │
│     "抢先体验 - 第一时间获取产品动态"                   │
│     [邮箱输入框]  [订阅按钮]                           │
├────────────────────────────────────────────────────────┤
│ [Footer] - Powered by 开品宝                           │
└────────────────────────────────────────────────────────┘
```

---

## 第三部分：移除广告策略板块

### 3.1 删除相关代码

**文件**: `src/components/LandingPageBuilder.tsx`

移除以下内容：
- `AdStrategyPanel` 组件导入
- `Megaphone` 图标导入  
- 第523-541行的广告策略展示区域

### 3.2 删除 Edge Function

**删除文件**: `supabase/functions/generate-ad-strategy/`

### 3.3 删除组件文件

**删除文件**: `src/components/AdStrategyPanel.tsx`

---

## 第四部分：短域名发布机制

### 4.1 优化 Slug 生成

**当前**: `product-name-1234567890`
**优化为**: `p-xxxx` (短ID格式)

```typescript
const generateSlug = () => {
  // 生成6位短ID (基于时间戳+随机数)
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let shortId = '';
  for (let i = 0; i < 6; i++) {
    shortId += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `p-${shortId}`;
};
```

### 4.2 URL展示

发布后的URL格式：
```
https://kaipinbao.lovable.app/lp/p-abc123
```

展示时自动复制短域名格式。

---

## 第五部分：更新前端组件

### 5.1 更新 LandingPageBuilder

**文件**: `src/components/LandingPageBuilder.tsx`

核心改动：
1. 接收完整PRD数据和视觉素材作为props
2. 传递给 `generate-landing-page` 的数据包括：
   - PRD全量数据
   - 选中的产品图
   - 营销图片数组
   - 视频URL
3. 移除广告策略相关代码
4. 优化Slug生成逻辑

### 5.2 更新 LandingPagePreview

**文件**: `src/components/LandingPagePreview.tsx`

增强预览组件：
1. 支持视频展示
2. 支持多图展示（轮播/网格）
3. 更专业的广告落地页样式
4. 响应式设计优化

### 5.3 更新 LandingPage 页面

**文件**: `src/pages/LandingPage.tsx`

增强公开访问页面：
1. 读取新增字段（视频、多图等）
2. 更专业的广告页面设计
3. 添加视频播放支持
4. 优化移动端体验

### 5.4 更新 Project.tsx 数据传递

**文件**: `src/pages/Project.tsx`

确保向 `LandingPageBuilder` 传递：
- 完整PRD数据 (`prdData`)
- 选中的产品图 (`selectedImageUrl`)
- 营销图片数组 (`marketingImages`)
- 视频URL (`videoUrl`)

---

## 技术实现清单

| 文件路径 | 操作 | 描述 |
|---------|------|------|
| `supabase/functions/scrape-competitor/index.ts` | 修改 | 评论上限改为100 |
| 数据库迁移 | 新建 | landing_pages表新增字段 |
| `supabase/functions/generate-landing-page/index.ts` | 重构 | 整合PRD+视觉+视频生成 |
| `src/components/LandingPageBuilder.tsx` | 修改 | 移除广告策略，优化数据传递 |
| `src/components/LandingPagePreview.tsx` | 修改 | 增强预览，支持视频多图 |
| `src/pages/LandingPage.tsx` | 修改 | 增强公开页面 |
| `src/pages/Project.tsx` | 修改 | 传递完整数据给落地页组件 |
| `supabase/functions/generate-ad-strategy/` | 删除 | 移除广告策略功能 |
| `src/components/AdStrategyPanel.tsx` | 删除 | 移除广告策略组件 |

---

## 预期效果

1. **评论数据更丰富** - 每个竞品最多抓取100条评论，分析更全面
2. **落地页更专业** - 基于PRD数据和视觉素材自动整合生成广告级落地页
3. **内容更完整** - AI自动补充缺失的营销图片
4. **界面更简洁** - 移除广告策略板块，专注核心功能
5. **链接更短** - 使用6位短ID格式的URL，便于分享
