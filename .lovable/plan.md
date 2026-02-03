
# 落地页模板取消与 AI 品牌策划专家重构计划

## 概述

取消现有的模板选择功能，让每个落地页都由 AI 根据完整产品定义动态生成。AI 将扮演专业品牌策划专家角色，生成适合电商广告投放的品牌落地页。

---

## 核心改动

### 一、移除模板选择 UI

**文件**: `src/components/LandingPageBuilder.tsx`

1. 删除 `TemplateSelect` 组件的导入和使用
2. 删除 `selectedTemplate` 状态管理
3. 更新生成请求，不再发送 `templateStyle` 参数
4. 页面生成 UI 简化为单一"AI 生成"按钮

### 二、重构 Edge Function - AI 品牌策划专家

**文件**: `supabase/functions/generate-landing-page/index.ts`

升级 AI 系统提示词为"品牌策划专家"角色：

```text
你是一位顶尖的品牌策划专家，拥有 15 年跨境电商与 DTC 品牌运营经验。

## 核心使命
基于完整的产品定义，策划一个可直接用于电商广告投放的品牌落地页。

## 设计原则
1. Hero 区：大图震撼展示，产品图或视频作为视觉焦点
2. 品牌故事：围绕痛点共鸣 → 解决方案 → 产品深度介绍展开
3. 卖点可视化：每个核心卖点配合图片进行说明
4. 场景代入：帮助用户想象自己使用产品的场景
5. 信任背书：技术规格、用户评价、FAQ 完整呈现
6. 转化导向：单一 CTA（邮件收集），紧迫感文案
```

### 三、AI 生成逻辑增强

1. **读取完整 PRD 数据**：从数据库获取项目完整的 `prd_data`
2. **动态样式决策**：AI 根据产品品类和目标用户自动选择配色方案
3. **图片补充逻辑**：AI 识别缺失的图片类型并生成补充素材

### 四、前端数据传递增强

**文件**: `src/components/LandingPageBuilder.tsx`

扩展传递给 Edge Function 的 PRD 数据：

```typescript
body: JSON.stringify({
  prdData: {
    // 基础信息
    name: projectName,
    productTagline: prdData?.productTagline,
    productCategory: prdData?.productCategory,
    
    // 核心定义
    usageScenario: prdData?.usageScenario,
    targetAudience: prdData?.target_audience,
    designStyle: prdData?.designStyle,
    designStyleDetails: prdData?.designStyleDetails,
    
    // 功能与卖点
    coreFeatures: prdData?.coreFeatures,
    coreFeaturesDetails: prdData?.coreFeaturesDetails,
    pain_points: prdData?.pain_points,
    selling_points: prdData?.selling_points,
    
    // 市场洞察
    competitorInsights: prdData?.competitorInsights,
    pricingStrategy: prdData?.pricingRange,
  },
  selectedImageUrl,
  visualAssets: {
    selectedProductImage: selectedImageUrl,
    marketingImages: marketingImages,
    videoUrl: videoUrl,
  },
}),
```

### 五、LandingPagePreview 样式动态化

**文件**: `src/components/LandingPagePreview.tsx`

1. 移除对 `templateStyle` prop 的依赖
2. 新增 `colorScheme` prop 接收 AI 生成的配色
3. 根据 AI 返回的配色方案动态应用样式

```typescript
interface LandingPagePreviewProps {
  // ... 现有 props
  colorScheme?: {
    primary: string;
    accent: string;
    background: string;
    mode: 'light' | 'dark';
  };
}
```

### 六、数据库 Schema 更新

修改 `landing_pages` 表，用 `color_scheme` 替代 `template_style`：

```sql
-- color_scheme 字段已存在，仅需确保正确使用
-- 移除对 template_style 的依赖，使用 color_scheme 存储 AI 决策的配色
```

---

## 涉及文件

| 文件 | 改动类型 | 说明 |
|------|---------|------|
| `src/components/LandingPageBuilder.tsx` | 重构 | 移除模板选择，简化生成流程 |
| `src/components/LandingPageTemplates.tsx` | 保留 | 保留 `getTemplateStyles` 函数作为样式工具 |
| `src/components/LandingPagePreview.tsx` | 优化 | 支持动态配色方案 |
| `supabase/functions/generate-landing-page/index.ts` | 重构 | 升级为品牌策划专家，增加样式决策 |

---

## 技术细节

### LandingPageBuilder.tsx 关键改动

```typescript
// 删除
import { TemplateSelect, type TemplateStyle } from "./LandingPageTemplates";
const [selectedTemplate, setSelectedTemplate] = useState<TemplateStyle>("modern");

// 删除模板选择 UI 部分（约 476-481 行）
<TemplateSelect 
  selectedTemplate={selectedTemplate}
  onSelect={setSelectedTemplate}
/>

// 修改 handleAIGenerateLandingPage 中的请求体
body: JSON.stringify({
  prdData: {
    // 完整 PRD 数据...
  },
  selectedImageUrl,
  visualAssets: { ... },
  // 移除 templateStyle 参数
}),

// 修改保存逻辑
// template_style: selectedTemplate, // 删除
// 使用 AI 返回的 color_scheme
```

### generate-landing-page Edge Function 关键改动

```typescript
// 更新系统提示词
const SYSTEM_PROMPT = `你是一位顶尖的品牌策划专家...

## 设计输出
除了内容策划外，你还需要为页面选择合适的视觉风格：

1. 分析产品品类和目标用户
2. 选择适合的配色模式（light/dark）
3. 确定主色调（primary）和强调色（accent）
4. 考虑品牌调性：科技感、奢华感、活力感、专业感等
`;

// AI 返回 JSON 增加字段
{
  // ... 现有字段
  "colorScheme": {
    "primary": "#3B82F6",
    "accent": "#8B5CF6", 
    "background": "#ffffff",
    "mode": "light"
  },
  "visualStyle": {
    "heroLayout": "split", // split | centered | fullscreen
    "cardStyle": "glass", // glass | solid | minimal
    "animationLevel": "moderate" // minimal | moderate | rich
  }
}
```

### LandingPagePreview.tsx 动态样式

```typescript
// 新增辅助函数：根据 AI 配色生成样式
function generateDynamicStyles(colorScheme?: ColorScheme) {
  const isDark = colorScheme?.mode === 'dark';
  const primary = colorScheme?.primary || '#3B82F6';
  const accent = colorScheme?.accent || '#8B5CF6';
  
  return {
    hero: {
      bg: isDark ? 'bg-slate-900' : 'bg-white',
      titleColor: isDark ? 'text-white' : 'text-gray-900',
      // 使用 CSS 变量或 inline style
    },
    // ... 其他区块样式
  };
}
```

---

## 用户体验变化

### 之前
1. 用户需要在 5 种模板中选择
2. 模板决定整体视觉风格
3. AI 仅负责内容生成

### 之后
1. 用户直接点击"AI 生成品牌落地页"
2. AI 分析产品定义后自动决策视觉风格
3. 生成结果为针对该产品定制的品牌页面
4. 每个页面都是独特的，与产品特性匹配

---

## 测试要点

1. 新建项目，完成 PRD，验证生成的落地页风格是否与产品匹配
2. 对比不同品类产品（科技/时尚/家居），验证 AI 是否选择不同配色
3. 验证 Hero 区大图展示效果
4. 验证营销图片与文案的配对展示
5. 发布后验证页面渲染正确

