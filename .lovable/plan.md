

# 项目加载优化 + 产品主图更换重置逻辑

## 一、Dashboard 项目缓存优化

### 问题
每次导航到 `/dashboard` 都会触发 `fetchProjects()`，造成重新加载。

### 方案
使用 React Query (`@tanstack/react-query`) 替代手动 `useState + useEffect` 管理项目数据。React Query 自带缓存和后台刷新，返回 Dashboard 时直接展示缓存数据，同时在后台静默更新。

**文件**: `src/pages/Dashboard.tsx`

- 将 `fetchProjects` 改为 React Query 的 `useQuery`
- `staleTime: 2 * 60 * 1000`（2 分钟内不重新请求）
- 删除 `isLoading`、`loadError`、`projects` 的手动 state
- 本地更新操作（删除/编辑/归档）使用 `queryClient.setQueryData` 做乐观更新
- 保留手动 `refetch` 按钮供用户刷新

```typescript
const { data: projects = [], isLoading, error: loadError, refetch } = useQuery({
  queryKey: ['projects'],
  queryFn: fetchProjectsData, // 原 fetchProjects 逻辑提取为纯函数
  staleTime: 2 * 60 * 1000,
});
```

## 二、产品主图更换时重置营销图 + 落地页

### 问题
用户在产品设计阶段切换回产品造型、重新选择主图后，已生成的营销图和落地页应被重置，并给予明确提示。

### 当前状态
`VisualGenerationPhase.tsx` 已有 `handleDesignChange` 逻辑，会弹出确认框并清除营销图片。但：
1. 没有同时重置落地页数据
2. 提示信息不够完整（未提及落地页影响）

### 方案

**文件**: `src/components/VisualGenerationPhase.tsx`

1. 新增 `onLandingPageReset` prop，由父组件传入
2. 在 `confirmDesignChange` 中，除了清除营销图片，还调用 `onLandingPageReset()` 清除落地页
3. 确认弹窗文案增加"落地页也将被重置"的提示

```typescript
interface VisualGenerationPhaseProps {
  // ...existing
  onLandingPageReset?: () => void;
}
```

确认弹窗文案更新：
```
更换产品造型后，以下关联内容将被清除：
- 已生成的营销素材图片
- 已创建的落地页
确定要更换吗？
```

**文件**: `src/pages/Project.tsx`

1. 新增 `handleLandingPageReset` 函数，删除数据库中该项目的落地页并清空前端状态
2. 将该函数通过 `onLandingPageReset` prop 传给 `VisualGenerationPhase`

```typescript
const handleLandingPageReset = async () => {
  if (landingPage) {
    await supabase.from("landing_pages").delete().eq("project_id", id);
    setLandingPage(null);
  }
};
```

## 涉及文件

| 文件 | 改动 |
|------|------|
| `src/pages/Dashboard.tsx` | 用 React Query 替代手动数据获取 |
| `src/components/VisualGenerationPhase.tsx` | 新增 `onLandingPageReset` prop，更新确认弹窗 |
| `src/pages/Project.tsx` | 传递 `onLandingPageReset` 给 VisualGenerationPhase |

## 技术细节

### Dashboard.tsx React Query 改造

核心改动是将 `fetchProjects` 内部逻辑提取为独立异步函数，然后用 `useQuery` 包裹：

```typescript
import { useQuery, useQueryClient } from "@tanstack/react-query";

const queryClient = useQueryClient();

const fetchProjectsData = async (): Promise<Project[]> => {
  // 原 fetchProjects 中的数据获取和组装逻辑
  // 返回 projectsWithData 数组
};

const { data: projects = [], isLoading, error, refetch } = useQuery({
  queryKey: ['dashboard-projects'],
  queryFn: fetchProjectsData,
  staleTime: 2 * 60 * 1000,
  refetchOnWindowFocus: false,
});

// 乐观更新示例（删除项目）
const handleDeleteProject = async (projectId: string) => {
  const { error } = await supabase.from("projects").delete().eq("id", projectId);
  if (!error) {
    queryClient.setQueryData(['dashboard-projects'], (old: Project[] | undefined) =>
      (old || []).filter(p => p.id !== projectId)
    );
  }
};
```

### VisualGenerationPhase.tsx 确认弹窗改进

```typescript
// confirmDesignChange 函数增加落地页重置
const confirmDesignChange = async () => {
  // ...existing cleanup logic...
  
  // 清除落地页
  if (onLandingPageReset) {
    await onLandingPageReset();
  }
  
  toast.success("已清除旧造型的营销素材和落地页，请重新生成");
  resolve(true);
};
```

弹窗 UI 增加警告列表：
```typescript
<AlertDialogDescription>
  更换产品造型后，以下关联内容将被清除并需要重新生成：
  <ul>
    <li>已生成的 {marketingImages.length} 张营销素材</li>
    {hasLandingPage && <li>已创建的落地页</li>}
  </ul>
  此操作不可撤销，确定要更换吗？
</AlertDialogDescription>
```

## 测试要点

1. 从项目页返回 Dashboard，验证不再重新加载（立即显示缓存数据）
2. 在产品设计阶段重新选择主图，验证弹窗提示完整（含落地页重置提示）
3. 确认更换后，验证营销图片和落地页均被清除
4. 取消更换时，验证所有数据保持不变

