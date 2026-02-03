

# 项目卡片重新设计方案

## 设计目标

重新设计工作台的项目卡片，使每个项目占据完整一行，展示更多图片和落地页信息，并支持删除项目功能。

## 核心改进点

### 1. 布局变更

| 元素 | 当前实现 | 新实现 |
|------|----------|--------|
| 卡片排列 | 双列网格 (`grid-cols-2`) | 单列全宽 |
| 图片展示 | 2张（产品图+落地页Hero图） | 4-5张（产品图+营销图+落地页全貌） |
| 落地页预览 | 仅显示Hero图 | 显示整体缩略图（网页截图风格） |
| 删除功能 | 无 | 支持删除项目（带确认弹窗） |

### 2. 新卡片布局设计

```text
┌────────────────────────────────────────────────────────────────────────────┐
│  项目卡片（全宽）                                                            │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  ┌──────────┬──────────┬──────────┬──────────┐  ┌──────────────────────┐  │
│  │ 产品图1  │ 产品图2  │ 产品图3  │ 产品图4  │  │                      │  │
│  │          │          │          │          │  │    落地页缩略图      │  │
│  │ (主图)   │ (可选)   │ (可选)   │ (可选)   │  │    (网页预览风格)    │  │
│  └──────────┴──────────┴──────────┴──────────┘  │                      │  │
│                                                  │  ┌──────────────┐    │  │
│  ┌─────────────────────────────────────────┐    │  │  Hero 区域   │    │  │
│  │ 项目名称              [状态] [删除按钮]  │    │  ├──────────────┤    │  │
│  │ 项目描述文字...                          │    │  │  内容区域    │    │  │
│  │                                         │    │  └──────────────┘    │  │
│  │ ┌───────────────┐  ┌───────────────┐    │    └──────────────────────┘  │
│  │ │ 阶段: 视觉生成 │  │ 创建: 2025-02 │    │                              │
│  │ └───────────────┘  └───────────────┘    │    ┌──────────────────────┐  │
│  │                                         │    │ 👁 1,234 · 📧 56     │  │
│  │ [落地页状态: 已发布] [访问] [复制链接]   │    │ 转化率: 4.5%         │  │
│  └─────────────────────────────────────────┘    └──────────────────────┘  │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

### 3. 功能增强

**图片展示增强：**
- 从 `generated_images` 表获取多张产品图（最多4张）
- 支持图片类型：产品图、营销图、场景图
- 无图时显示占位符

**落地页缩略图：**
- 模拟网页预览风格（带浏览器边框效果）
- 显示 Hero 图作为缩略图主体
- 底部叠加半透明数据卡片

**删除项目功能：**
- 卡片右上角添加删除按钮（悬浮显示）
- 点击触发确认弹窗（AlertDialog）
- 确认后删除项目及关联数据
- 删除成功后刷新列表

## 技术实现

### Dashboard.tsx 修改

1. **修改查询**：获取更多 generated_images 数据
2. **修改布局**：从 `grid-cols-2` 改为 `grid-cols-1`
3. **添加删除逻辑**：
```tsx
const handleDeleteProject = async (projectId: string) => {
  const { error } = await supabase
    .from("projects")
    .delete()
    .eq("id", projectId);
  
  if (error) {
    toast.error("删除项目失败");
  } else {
    toast.success("项目已删除");
    fetchProjects(); // 刷新列表
  }
};
```

### ProjectCard.tsx 重构

1. **新增 Props**：
```tsx
interface ProjectCardProps {
  // ... 现有 props
  productImages?: string[];           // 多张产品图
  marketingImages?: string[];         // 营销图
  onDelete?: () => void;              // 删除回调
}
```

2. **新布局结构**：
```tsx
<Card className="flex flex-row">
  {/* 左侧：图片网格 */}
  <div className="w-1/3 grid grid-cols-2 gap-2">
    {productImages.slice(0, 4).map(img => (
      <div className="aspect-square rounded-lg overflow-hidden">
        <img src={img} className="w-full h-full object-cover" />
      </div>
    ))}
  </div>
  
  {/* 中间：项目信息 */}
  <div className="flex-1 p-4">
    <div className="flex justify-between">
      <h3>{name}</h3>
      <div className="flex gap-2">
        <Badge>{status}</Badge>
        <Button variant="ghost" size="icon" onClick={onDelete}>
          <Trash2 className="w-4 h-4 text-destructive" />
        </Button>
      </div>
    </div>
    {/* ... 其他信息 */}
  </div>
  
  {/* 右侧：落地页预览 */}
  <div className="w-1/4 p-2">
    <div className="browser-frame rounded-lg border shadow-lg">
      <div className="browser-toolbar h-6 bg-muted rounded-t-lg flex items-center px-2 gap-1">
        <div className="w-2 h-2 rounded-full bg-red-500" />
        <div className="w-2 h-2 rounded-full bg-yellow-500" />
        <div className="w-2 h-2 rounded-full bg-green-500" />
      </div>
      <div className="aspect-[9/16] overflow-hidden">
        <img src={landingPage.heroImageUrl} className="w-full h-full object-cover object-top" />
      </div>
    </div>
    {/* 数据指标 */}
    <div className="mt-2 p-2 rounded-lg bg-muted/30">
      <div className="flex items-center gap-4 text-sm">
        <span><Eye /> {viewCount}</span>
        <span><Mail /> {emailCount}</span>
        <span><TrendingUp /> {conversionRate}%</span>
      </div>
    </div>
  </div>
</Card>
```

3. **删除确认弹窗**：
```tsx
<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button variant="ghost" size="icon">
      <Trash2 className="w-4 h-4 text-destructive" />
    </Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>确认删除项目？</AlertDialogTitle>
      <AlertDialogDescription>
        此操作将永久删除该项目及其所有相关数据（包括落地页、生成的图片等），且无法恢复。
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>取消</AlertDialogCancel>
      <AlertDialogAction onClick={handleDelete} className="bg-destructive">
        确认删除
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

## 涉及文件修改

| 文件 | 修改内容 |
|------|----------|
| `src/components/ProjectCard.tsx` | 重构为全宽横向布局，增加图片展示，添加删除按钮 |
| `src/pages/Dashboard.tsx` | 修改网格布局为单列，扩展数据查询，添加删除处理函数 |

## 预期效果

1. **信息密度提升**：每个项目展示更多内容，一目了然
2. **视觉层次清晰**：左侧产品图、中间信息、右侧落地页预览
3. **操作便捷**：直接在卡片上删除项目，减少跳转
4. **数据可视化**：落地页关键指标直观展示

