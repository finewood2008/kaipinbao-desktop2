
# PRD 阶段架构重构 - 市场分析与竞品研究分离

## 需求理解

用户希望将 PRD 阶段重新架构为三个独立模块：

1. **市场分析（第一模块）**：基于项目立项信息，使用 Gemini 3 Pro 进行市场分析
2. **竞品分析（第二模块）**：独立的竞品抓取模块，专注于 Amazon 竞品信息和评论
3. **AI 产品经理（第三模块）**：读取前两个模块数据，与用户沟通产品定义，生成 PRD

---

## 当前问题

1. **市场分析与竞品分析混合**：当前 `CompetitorResearch` 组件同时处理竞品抓取和市场分析，定位不清晰
2. **阶段指示器只有3个阶段**：需要调整为"市场分析 → 竞品分析 → AI产品经理 → PRD文档"
3. **AI 产品经理未读取市场分析数据**：当前 chat 函数未主动获取项目立项信息进行市场分析
4. **评论抓取问题**：Amazon 评论页需要登录，需要优化抓取策略

---

## 技术实现方案

### 第一部分：阶段结构重构

**文件**: `src/components/PrdPhaseIndicator.tsx`

将阶段从 3 个扩展为 4 个：

```text
修改前:
1. 市场分析 (TrendingUp) - 包含竞品抓取
2. AI产品经理 (MessageSquare)
3. 产品PRD文档 (FileText)

修改后:
1. 市场分析 (TrendingUp) - 纯市场分析
2. 竞品分析 (Search) - 独立竞品抓取
3. AI产品经理 (MessageSquare)
4. 产品PRD文档 (FileText)
```

### 第二部分：市场分析模块（新建）

**新建文件**: `src/components/MarketAnalysisPhase.tsx`

功能：
- 显示项目立项时提供的基本信息（名称、描述）
- 点击"开始市场分析"按钮
- 调用 AI（Gemini 3 Pro）基于项目描述进行市场分析
- 分析内容包括：市场规模、目标用户画像、竞争格局、定价策略建议
- 分析结果保存到 `projects.prd_data.initialMarketAnalysis`

**新建文件**: `supabase/functions/initial-market-analysis/index.ts`

```typescript
// AI 市场分析专家角色
const SYSTEM_PROMPT = `你是一位资深市场分析专家，拥有15年消费电子和跨境电商行业经验。

基于用户提供的产品概念和描述，进行专业的市场分析。

## 分析维度
1. **市场规模评估**：估算目标市场的规模和增长趋势
2. **目标用户画像**：分析核心用户群体特征
3. **竞争格局预判**：基于产品类型推断主要竞争对手类型
4. **定价策略建议**：基于市场定位给出价格区间建议
5. **差异化方向**：基于产品描述提出差异化机会

## 输出格式
返回 JSON 结构化数据...`;
```

### 第三部分：竞品分析模块（从 CompetitorResearch 中拆分）

**修改文件**: `src/components/CompetitorResearch.tsx`

改动：
- 移除"市场分析"相关功能和按钮
- 专注于竞品链接添加和抓取
- 标题改为"竞品分析"
- 移除 `MarketAnalysisReport` 组件的引用
- 保留评论分析摘要（ReviewAnalysisSummary）

**评论抓取优化** - `supabase/functions/scrape-competitor/index.ts`：
- 当前策略：从产品主页获取评论摘要
- 增强策略：尝试从产品页底部截图进行 OCR 提取更多评论
- 保留产品基本信息、价格、评分、主图

### 第四部分：AI 产品经理模块增强

**修改文件**: `supabase/functions/chat/index.ts`

增强 AI 产品经理读取数据的能力：

```typescript
// 获取初始市场分析数据
async function getInitialMarketAnalysis(supabase: any, projectId: string) {
  const { data: project } = await supabase
    .from("projects")
    .select("name, description, prd_data")
    .eq("id", projectId)
    .single();

  return {
    projectName: project?.name,
    projectDescription: project?.description,
    initialMarketAnalysis: project?.prd_data?.initialMarketAnalysis,
  };
}
```

更新系统提示词，让 AI 在首次回复时整合：
1. 项目立项信息
2. 初始市场分析结果
3. 竞品分析数据（产品、评论）

### 第五部分：PrdPhase 组件流程调整

**修改文件**: `src/components/PrdPhase.tsx`

```typescript
// 新的阶段类型
type Phase = 1 | 2 | 3 | 4;

// 阶段对应
// Phase 1: 市场分析 (MarketAnalysisPhase)
// Phase 2: 竞品分析 (CompetitorResearch - 简化版)
// Phase 3: AI产品经理 (AiProductManagerPanel)
// Phase 4: PRD文档 (PrdDocumentPanel)
```

---

## 修改范围摘要

| 文件 | 修改类型 | 内容 |
|------|---------|------|
| `src/components/PrdPhaseIndicator.tsx` | 修改 | 扩展为 4 个阶段 |
| `src/components/MarketAnalysisPhase.tsx` | 新建 | 市场分析模块 UI |
| `supabase/functions/initial-market-analysis/index.ts` | 新建 | 初始市场分析 AI |
| `src/components/CompetitorResearch.tsx` | 修改 | 移除市场分析功能，专注竞品抓取 |
| `src/components/PrdPhase.tsx` | 修改 | 调整为 4 阶段流程 |
| `supabase/functions/chat/index.ts` | 修改 | 读取初始市场分析 + 竞品数据 |
| `supabase/config.toml` | 修改 | 添加 initial-market-analysis 函数 |

---

## 数据流

```text
1. 用户创建项目（输入名称、描述）
   ↓
2. 市场分析阶段
   - 用户点击"开始市场分析"
   - AI 基于项目描述生成市场分析报告
   - 保存到 prd_data.initialMarketAnalysis
   ↓
3. 竞品分析阶段
   - 用户添加 Amazon 竞品链接
   - 系统抓取产品信息和评论
   - 保存到 competitor_products 表
   ↓
4. AI 产品经理阶段
   - AI 读取：项目信息 + 市场分析 + 竞品数据
   - 主动呈现产品设计提案
   - 与用户进行 2-3 轮方向确认
   - 生成完整 PRD
   ↓
5. PRD 文档阶段
   - 展示完整 PRD
   - 支持编辑和 AI 重新生成
```

---

## 技术细节

### 使用的 AI 模型
- **初始市场分析**: `google/gemini-3-pro-preview`
- **AI 产品经理**: `google/gemini-3-pro-preview`（已配置）
- **评论 OCR**: `google/gemini-2.5-pro`（视觉任务）

### 评论抓取策略优化
由于 Amazon 评论详情页需要登录，当前方案：
1. 从产品主页抓取评论摘要（评分分布、Top 好评/差评）
2. 尝试截图产品页底部的评论区域进行 OCR
3. 将提取的信息保存到 `competitor_products.review_summary`

### 数据结构扩展

```typescript
// projects.prd_data 扩展
{
  initialMarketAnalysis: {
    marketSize: string,
    targetUserProfile: string,
    competitionLandscape: string,
    pricingStrategy: string,
    differentiationOpportunities: string[],
    generatedAt: string,
  },
  // 现有的其他字段...
}
```

---

## 预期效果

| 改动 | 效果 |
|------|------|
| 市场分析独立 | 用户在添加竞品前先看到市场全景 |
| 竞品分析专注 | 模块职责清晰，用户体验更好 |
| AI 产品经理整合数据 | 能基于完整信息给出更专业的产品设计提案 |
| 4 阶段流程 | 更清晰的进度感知 |

