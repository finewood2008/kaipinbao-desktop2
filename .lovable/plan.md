# Amazon 抓取优化 - 已完成

## 实现摘要

### 已完成的功能

1. **数据库扩展**
   - `main_image` - 商品主图 URL
   - `review_summary` (jsonb) - 置顶评论摘要
   - `review_screenshot_url` - 评论页截图 URL（存储在 Supabase Storage）

2. **两步抓取策略**
   - 步骤1: 抓取产品页 → 提取主图、评论摘要、ASIN
   - 步骤2: 抓取评论页 `/product-reviews/{ASIN}` → 截图 + 真实评论

3. **Firecrawl 截图功能**
   - 使用 `formats: ["markdown", "screenshot"]`
   - 使用 `actions` 滚动加载更多评论
   - 截图上传到 Supabase Storage（不存 base64 到数据库）

4. **评论摘要提取**
   - 总体评分和评论数
   - 星级分布（5星 xx%，4星 xx%...）
   - 好评要点 / 差评痛点

5. **UI 更新**
   - CompetitorCard 显示商品主图（大图）
   - 显示评论摘要（星级分布、好评/差评要点）
   - 可展开查看评论页截图

## 技术细节

### 主图提取逻辑
- Amazon: 匹配 `_SL1500_` 或 `_AC_SL1500_` 等大尺寸图片
- 只取第一张（主图）

### 评论验证逻辑
- 过滤 URL 碎片（`reviews/R...`）
- 过滤 UI 元素（"Helpful", "Report"）
- 最小长度 30 字符，最大 3000 字符
