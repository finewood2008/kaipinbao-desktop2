
# 修复仪表盘项目列表不显示问题

## 问题诊断

在上一次更新中，我们将 `landing_pages` 表从一对一关系改为一对多关系（支持多版本）。这导致 Dashboard 页面的查询出现问题：

1. **数据结构变化**：Supabase 关联查询 `landing_pages` 现在返回**数组**而不是**单个对象**
2. **代码未适配**：Dashboard 中仍按单对象方式处理 `p.landing_pages.id`，导致错误
3. **查询超时**：由于处理错误，导致数据库查询超时

## 修复方案

### 修改 `src/pages/Dashboard.tsx`

**问题代码（第 113-115 行）**：
```typescript
const landingPageIds = (data || [])
  .filter((p: any) => p.landing_pages)
  .map((p: any) => p.landing_pages.id);  // ❌ landing_pages 现在是数组
```

**问题代码（第 153-154 行）**：
```typescript
landing_page: p.landing_pages || null,  // ❌ 返回的是数组
email_count: p.landing_pages ? (emailCounts[p.landing_pages.id] || 0) : 0,  // ❌ 错误访问
```

### 修复方案

1. 在查询中添加过滤条件，只获取活跃版本：
```typescript
landing_pages!inner (
  id,
  slug,
  is_published,
  hero_image_url,
  screenshot_url,
  view_count,
  is_active
)
```

2. 处理返回的数组，取第一个活跃版本：
```typescript
// 获取活跃的落地页版本
const activeLandingPage = Array.isArray(p.landing_pages) 
  ? p.landing_pages.find((lp: any) => lp.is_active) || p.landing_pages[0]
  : p.landing_pages;
```

3. 更新 email counts 获取逻辑以处理数组

## 涉及文件

| 文件 | 修改内容 |
|------|----------|
| `src/pages/Dashboard.tsx` | 修复 landing_pages 数组处理逻辑 |

## 技术细节

```typescript
// 修改后的处理逻辑
const projectsWithData: Project[] = (data || []).map((p: any) => {
  // 获取活跃的落地页版本（现在是数组，取 is_active=true 的版本）
  const landingPagesArray = p.landing_pages || [];
  const activeLandingPage = landingPagesArray.find((lp: any) => lp.is_active) 
    || landingPagesArray[0] 
    || null;

  return {
    // ...其他字段
    landing_page: activeLandingPage,
    email_count: activeLandingPage ? (emailCounts[activeLandingPage.id] || 0) : 0,
  };
});
```

