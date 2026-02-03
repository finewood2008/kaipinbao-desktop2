
# 落地页版本管理与数据分析阶段分离 ✅ 已完成

## 概述

本次升级已实现三个核心功能：
1. ✅ **落地页版本管理**：重新生成落地页时创建新版本，保留历史版本供用户切换比较
2. ✅ **发布后流程锁定**：发布落地页后，整个流程结束，所有阶段变为只读模式
3. ✅ **数据分析阶段分离**：在落地页阶段后新增"数据分析"阶段（第5阶段），将原有的数据分析板块迁移至此

## 一、数据库架构调整

### 1.1 `landing_pages` 表修改

当前 `landing_pages` 表的关系是 `isOneToOne: true`（一对一），需要修改为一对多关系，支持多个版本：

```sql
-- 添加版本号字段
ALTER TABLE landing_pages ADD COLUMN version INTEGER DEFAULT 1;
-- 添加 is_active 字段标记当前活跃版本
ALTER TABLE landing_pages ADD COLUMN is_active BOOLEAN DEFAULT true;
-- 移除一对一约束（通过新建索引）
-- 创建唯一约束：每个项目只能有一个活跃版本
ALTER TABLE landing_pages 
  DROP CONSTRAINT IF EXISTS landing_pages_project_id_fkey,
  ADD CONSTRAINT landing_pages_project_id_fkey 
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;

CREATE UNIQUE INDEX landing_pages_project_active_idx 
  ON landing_pages(project_id) WHERE is_active = true;
```

### 1.2 `projects` 表修改

扩展阶段约束，支持第5阶段（数据分析）：

```sql
-- 更新 current_stage 约束范围：1-5
ALTER TABLE projects 
  DROP CONSTRAINT IF EXISTS projects_current_stage_check,
  ADD CONSTRAINT projects_current_stage_check CHECK (current_stage >= 1 AND current_stage <= 5);
```

## 二、阶段指示器升级

### 2.1 `StageIndicator.tsx` 修改

增加第5阶段"数据分析"：

```typescript
const stages = [
  { id: 1, name: "市场调研", icon: MessageSquare, description: "市场分析与竞品研究" },
  { id: 2, name: "产品定义", icon: MessageSquare, description: "AI产品经理与PRD" },
  { id: 3, name: "产品设计", icon: Palette, description: "AI图像生成与迭代" },
  { id: 4, name: "落地页", icon: Rocket, description: "营销页面生成" },
  { id: 5, name: "数据分析", icon: BarChart3, description: "市场验证与数据监控" }, // 新增
];
```

**阶段逻辑变更**：
- 落地页发布前：可在 1-4 阶段间切换
- 落地页发布后：自动进入第5阶段，所有阶段标记为完成（打勾），但仍可点击查看只读内容

### 2.2 完成状态样式增强

发布后所有阶段显示完成状态（绿色勾），并添加"已完成"徽章：

```typescript
// 当项目已发布时，所有阶段显示为完成
const isProjectCompleted = landingPage?.is_published;
const isCompleted = isProjectCompleted || currentStage > stage.id;
```

## 三、落地页版本管理

### 3.1 数据流设计

```text
┌──────────────────────────────────────────────────────────────┐
│                    落地页版本管理                              │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│   [版本 1]  ←→  [版本 2]  ←→  [版本 3 (当前)]               │
│                                                              │
│   ┌─────────────────────────────────────────────────────┐   │
│   │  切换版本时：                                         │   │
│   │  1. 更新原 is_active = false                         │   │
│   │  2. 更新目标 is_active = true                        │   │
│   │  3. 刷新前端状态                                      │   │
│   └─────────────────────────────────────────────────────┘   │
│                                                              │
│   ┌─────────────────────────────────────────────────────┐   │
│   │  重新生成时：                                         │   │
│   │  1. 将当前版本 is_active = false                     │   │
│   │  2. 创建新版本 version = max(version) + 1           │   │
│   │  3. 新版本 is_active = true                          │   │
│   └─────────────────────────────────────────────────────┘   │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### 3.2 `LandingPageBuilder.tsx` 改造

**新增状态**：

```typescript
const [allVersions, setAllVersions] = useState<LandingPageData[]>([]);
const [currentVersionIndex, setCurrentVersionIndex] = useState(0);
```

**新增版本切换 UI**：

```typescript
{allVersions.length > 1 && !landingPage.is_published && (
  <Card className="glass border-border/50">
    <CardHeader>
      <CardTitle className="text-lg flex items-center gap-2">
        <History className="w-5 h-5" />
        版本历史
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="flex gap-2 flex-wrap">
        {allVersions.map((version, index) => (
          <Button
            key={version.id}
            variant={version.is_active ? "default" : "outline"}
            size="sm"
            onClick={() => handleSwitchVersion(version)}
          >
            版本 {version.version}
            {version.is_active && <Badge className="ml-2">当前</Badge>}
          </Button>
        ))}
      </div>
    </CardContent>
  </Card>
)}
```

**重新生成逻辑改造**：

```typescript
const handleRegenerate = async () => {
  // 1. 将当前版本设为非活跃
  await supabase
    .from("landing_pages")
    .update({ is_active: false })
    .eq("id", landingPage.id);

  // 2. 获取最大版本号
  const { data: versions } = await supabase
    .from("landing_pages")
    .select("version")
    .eq("project_id", projectId)
    .order("version", { ascending: false })
    .limit(1);

  const nextVersion = (versions?.[0]?.version || 0) + 1;

  // 3. 生成新版本（复用 handleAIGenerateLandingPage 但传入版本号）
  await generateNewVersion(nextVersion);
};
```

### 3.3 版本切换逻辑

```typescript
const handleSwitchVersion = async (targetVersion: LandingPageData) => {
  // 1. 将当前活跃版本设为非活跃
  await supabase
    .from("landing_pages")
    .update({ is_active: false })
    .eq("project_id", projectId)
    .eq("is_active", true);

  // 2. 将目标版本设为活跃
  await supabase
    .from("landing_pages")
    .update({ is_active: true })
    .eq("id", targetVersion.id);

  // 3. 更新本地状态
  onLandingPageChange({ ...targetVersion, is_active: true });
  
  toast.success(`已切换到版本 ${targetVersion.version}`);
};
```

## 四、发布后流程锁定

### 4.1 发布逻辑改造

`handlePublish` 函数中增加阶段推进：

```typescript
const handlePublish = async () => {
  if (!landingPage) return;
  
  setIsPublishing(true);
  try {
    // 1. 更新落地页为已发布
    await supabase
      .from("landing_pages")
      .update({ is_published: true })
      .eq("id", landingPage.id);

    // 2. 将项目推进到第5阶段（数据分析）
    await supabase
      .from("projects")
      .update({ current_stage: 5 })
      .eq("id", projectId);

    onLandingPageChange({ ...landingPage, is_published: true });
    onStageAdvance?.(5); // 通知父组件更新阶段
    
    toast.success("落地页发布成功！进入数据监控阶段");
  } catch (error) {
    toast.error("发布失败");
  } finally {
    setIsPublishing(false);
  }
};
```

### 4.2 只读模式传递

`Project.tsx` 中传递只读状态：

```typescript
// 判断项目是否已完成（落地页已发布）
const isProjectCompleted = landingPage?.is_published;

// 所有阶段组件接收只读状态
<MarketResearchPhase
  isReadOnly={project?.current_stage !== 1 || isProjectCompleted}
/>
<PrdPhase
  isReadOnly={project?.current_stage !== 2 || isProjectCompleted}
/>
<VisualGenerationPhase
  isReadOnly={project?.current_stage !== 3 || isProjectCompleted}
/>
<LandingPageBuilder
  isReadOnly={isProjectCompleted} // 发布后隐藏重新生成按钮
/>
```

### 4.3 UI 变化

发布后的落地页阶段显示：
- 隐藏"重新生成"按钮
- 隐藏版本切换 UI
- 显示"已发布"徽章
- 显示"查看数据分析"按钮引导跳转

## 五、数据分析阶段

### 5.1 `Project.tsx` 新增 Tab

```typescript
// 新增 analytics Tab
<TabsContent value="analytics" className="flex-1 overflow-auto p-4 m-0">
  <div className="max-w-5xl mx-auto">
    {landingPage ? (
      <LandingPageAnalytics
        landingPageId={landingPage.id}
        landingPageSlug={landingPage.slug}
        landingPageTitle={landingPage.title}
        viewCount={landingPage.view_count}
        isReadOnly={true}
      />
    ) : (
      <Card className="glass border-border/50">
        <CardContent className="p-8 text-center">
          <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">暂无数据</h3>
          <p className="text-muted-foreground">
            请先发布落地页以开始收集市场数据
          </p>
        </CardContent>
      </Card>
    )}
  </div>
</TabsContent>
```

### 5.2 阶段切换逻辑更新

```typescript
useEffect(() => {
  if (project) {
    if (project.current_stage === 1) setActiveTab("research");
    else if (project.current_stage === 2) setActiveTab("prd");
    else if (project.current_stage === 3) setActiveTab("images");
    else if (project.current_stage === 4) setActiveTab("landing");
    else if (project.current_stage === 5) setActiveTab("analytics"); // 新增
  }
}, [project?.current_stage]);
```

### 5.3 StageIndicator 点击处理更新

```typescript
<StageIndicator 
  currentStage={project?.current_stage || 1}
  isProjectCompleted={landingPage?.is_published}
  onStageClick={(stageId) => {
    if (stageId === 1) setActiveTab("research");
    else if (stageId === 2) setActiveTab("prd");
    else if (stageId === 3) setActiveTab("images");
    else if (stageId === 4) setActiveTab("landing");
    else if (stageId === 5) setActiveTab("analytics");
  }}
/>
```

### 5.4 `LandingPageAnalytics.tsx` 改造

移除返回按钮（因为现在是独立阶段），调整 props：

```typescript
interface LandingPageAnalyticsProps {
  landingPageId: string;
  landingPageSlug: string;
  landingPageTitle: string;
  viewCount: number;
  // 移除 onBackToEdit，因为不再需要返回
  isReadOnly?: boolean; // 新增
}
```

## 六、涉及文件清单

| 文件路径 | 修改类型 | 说明 |
|----------|----------|------|
| 数据库迁移 | 新建 | 添加 version、is_active 字段，更新阶段约束 |
| `src/components/StageIndicator.tsx` | 修改 | 添加第5阶段，支持完成状态样式 |
| `src/pages/Project.tsx` | 修改 | 添加 analytics Tab，更新阶段切换逻辑 |
| `src/components/LandingPageBuilder.tsx` | 修改 | 版本管理UI，发布后锁定，只读模式 |
| `src/components/LandingPageAnalytics.tsx` | 修改 | 移除返回按钮，作为独立阶段 |

## 七、用户流程变化

### 发布前

```text
市场调研 → 产品定义 → 产品设计 → 落地页
                                    ↓
                              [生成落地页]
                                    ↓
                         [版本 1] ←→ [版本 2] ←→ ...
                                    ↓
                              [选择版本]
                                    ↓
                              [发布落地页]
```

### 发布后

```text
✓ 市场调研 → ✓ 产品定义 → ✓ 产品设计 → ✓ 落地页 → ✓ 数据分析
                                                      ↓
                                            [实时数据监控]
                                            [AI 市场分析]
                                            [邮箱导出]

（所有阶段可点击查看，但均为只读模式）
```

## 八、技术细节

### 8.1 版本获取

```typescript
const fetchAllVersions = async () => {
  const { data, error } = await supabase
    .from("landing_pages")
    .select("*")
    .eq("project_id", projectId)
    .order("version", { ascending: true });

  if (!error && data) {
    setAllVersions(data);
    // 设置当前活跃版本
    const activeVersion = data.find(v => v.is_active);
    if (activeVersion) {
      onLandingPageChange(activeVersion);
    }
  }
};
```

### 8.2 版本比较UI

可选增强 - 双栏对比视图：

```typescript
{isComparing && (
  <div className="grid grid-cols-2 gap-4">
    <div>
      <h4>版本 {compareVersion1.version}</h4>
      <LandingPagePreview {...compareVersion1} />
    </div>
    <div>
      <h4>版本 {compareVersion2.version}</h4>
      <LandingPagePreview {...compareVersion2} />
    </div>
  </div>
)}
```
