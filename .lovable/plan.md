

# 修复首页自动跳转问题

## 问题分析

当前 `Index.tsx` 首页组件中存在一个 `useEffect`，会在检测到用户已登录时自动执行 `navigate("/dashboard")`，导致：

1. 用户点击 LOGO 返回首页时，如果已登录，会立刻被重定向回工作台
2. 已登录用户无法浏览首页内容

## 解决方案

移除首页的自动跳转逻辑，改为：

1. **删除** `useEffect` 中的自动跳转代码
2. **保留** 首页按钮的导航功能，已登录用户点击"开始设计"后进入工作台
3. **更新** 头部按钮显示逻辑：
   - 未登录：显示"登录 / 注册"，点击跳转到 `/auth`
   - 已登录：显示"进入工作台"，点击跳转到 `/dashboard`

## 涉及修改

| 位置 | 修改内容 |
|------|----------|
| 第 29-33 行 | 删除自动跳转的 `useEffect` |
| 第 127-132 行 | 更新头部按钮，根据登录状态显示不同文案和跳转目标 |
| 第 209-217 行 | 更新 CTA 按钮，已登录用户直接进入工作台 |

## 代码实现

### 删除自动跳转

```tsx
// 删除这段代码
useEffect(() => {
  if (!isLoading && user) {
    navigate("/dashboard");
  }
}, [user, isLoading, navigate]);
```

### 更新头部按钮

```tsx
<Button 
  className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 text-foreground border border-white/10 rounded-full px-5"
  onClick={() => navigate(user ? "/dashboard" : "/auth")}
>
  {user ? "进入工作台" : "登录 / 注册"}
</Button>
```

### 更新 CTA 按钮

```tsx
<Button
  className="..."
  onClick={() => navigate(user ? "/dashboard" : "/auth")}
>
  <Sparkles className="w-4 h-4 mr-1.5" />
  {user ? "进入工作台" : "开始设计"}
  <ArrowRight className="w-4 h-4 ml-1.5" />
</Button>
```

## 预期行为

| 场景 | 当前行为 | 修改后行为 |
|------|----------|------------|
| 已登录用户访问首页 | 自动跳转到工作台 | 停留在首页，可自由浏览 |
| 已登录用户点击 LOGO | 跳转首页后又被重定向 | 正常停留在首页 |
| 已登录用户点击头部按钮 | 显示"登录/注册" | 显示"进入工作台"，点击后进入 |
| 未登录用户点击按钮 | 跳转到登录页 | 跳转到登录页（不变） |

