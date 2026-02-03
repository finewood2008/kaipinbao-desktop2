

# 增强PRD内容提取与用户参考图片上传 ✅ 已完成

## 概述

本次升级将实现三个核心功能：
1. **增强PRD数据提取**：特别是外观风格与核心功能方面，从AI对话中提取更丰富的信息
2. **用户参考图片上传**：支持用户上传参考图片，供产品设计阶段使用
3. **AI对话全选择题化**：确保AI给用户的每个问题都提供可选择的选项

## 一、数据库架构调整

### 1.1 `projects` 表 `prd_data` 字段扩展

当前 `prd_data` JSON 字段将新增以下内容：

```typescript
interface PrdData {
  // 现有字段...
  
  // 新增：增强的外观风格详情
  designStyleDetails?: {
    overallStyle?: string;           // 整体风格（如"北欧极简"）
    colorTone?: string;              // 色彩基调（如"冷色调"）
    surfaceTexture?: string;         // 表面质感（如"哑光磨砂"）
    shapeLanguage?: string;          // 造型语言（如"圆润流线"）
    inspirationKeywords?: string[];  // 灵感关键词
    materialPreference?: string[];   // 材质偏好
    avoidElements?: string[];        // 避免的元素
  } | null;
  
  // 新增：增强的核心功能详情
  coreFeaturesDetails?: {
    feature: string;
    description: string;          // 功能详细描述
    userBenefit: string;          // 用户收益
    technicalApproach?: string;   // 技术实现思路
    priority: "must-have" | "important" | "nice-to-have";
  }[] | null;
  
  // 新增：用户上传的参考图片
  referenceImages?: {
    id: string;
    url: string;
    description?: string;        // 用户对图片的说明
    uploadedAt: string;
  }[] | null;
}
```

## 二、AI对话系统升级

### 2.1 系统提示词改造 (`chat/index.ts`)

核心改动：**所有回复必须是选择题格式**

```typescript
const BASE_SYSTEM_PROMPT = `...

# 核心规则：纯选择题对话

**重要：你的每一个问题都必须是选择题！**

用户是产品创业者，不是产品专家。你不能问开放式问题，因为：
1. 用户没有专业知识来回答复杂问题
2. 选择题能大幅提高决策效率
3. 选项基于你的专业分析和竞品数据

## 选择题格式规范

每个问题必须遵循以下格式：

---

### 🎨 [问题标题]

[简短的问题说明，不超过2行]

**A. [选项A名称]**
[1-2句描述]

**B. [选项B名称]**
[1-2句描述]

**C. [选项C名称]**
[1-2句描述]

**D. 其他想法**
如果以上都不满意，请描述您的想法

[选A] | [选B] | [选C] | [选D]

---

## 外观风格提取规则（必须详细）

当用户选择外观风格时，你必须提取并记录：

1. **整体风格**：如"北欧极简"、"日式侘寂"、"赛博科技"
2. **色彩基调**：如"冷色调蓝灰系"、"暖色调木质系"
3. **表面质感**：如"哑光磨砂"、"镜面高光"、"天然纹理"
4. **造型语言**：如"圆润流线"、"硬朗几何"、"有机形态"
5. **材质偏好**：如"铝合金+硅胶"、"榉木+白色塑料"
6. **避免元素**：如"避免过多按钮"、"避免廉价塑料感"

在 prd-data 中记录为：

\`\`\`prd-data
{
  "designStyle": "北欧极简 × 科技质感",
  "designStyleDetails": {
    "overallStyle": "北欧极简风格",
    "colorTone": "冷色调，以白、灰、银为主",
    "surfaceTexture": "哑光磨砂质感，触感细腻",
    "shapeLanguage": "圆润边角，流线型轮廓",
    "inspirationKeywords": ["Apple", "Muji", "Bang & Olufsen"],
    "materialPreference": ["阳极氧化铝", "食品级硅胶", "钢化玻璃"],
    "avoidElements": ["过多装饰", "廉价塑料", "复杂按钮布局"]
  }
}
\`\`\`

## 核心功能提取规则（必须详细）

当用户选择核心功能时，每个功能必须记录：

1. **功能名称**：简洁的功能标题
2. **功能描述**：具体做什么、怎么工作
3. **用户收益**：解决什么痛点、带来什么价值
4. **技术实现思路**：建议的技术方案
5. **优先级**：must-have / important / nice-to-have

在 prd-data 中记录为：

\`\`\`prd-data
{
  "coreFeatures": ["快速加热", "智能温控", "便携设计"],
  "coreFeaturesDetails": [
    {
      "feature": "快速加热",
      "description": "采用PTC陶瓷加热技术，30秒内将水温提升至设定温度",
      "userBenefit": "无需等待，随时享用热水，节省用户时间",
      "technicalApproach": "PTC加热片 + 热敏电阻实时温度反馈",
      "priority": "must-have"
    },
    {
      "feature": "智能温控",
      "description": "支持40-100℃自由调节，记忆用户常用温度",
      "userBenefit": "不同饮品对应不同温度，提升使用体验",
      "technicalApproach": "NTC温度传感器 + MCU闭环控制算法",
      "priority": "must-have"
    }
  ]
}
\`\`\`

## 禁止的对话形式

❌ "您希望产品是什么风格？"
❌ "请描述一下您想要的功能"
❌ "有什么特别的要求吗？"
❌ 任何开放式问题

✅ 正确做法：永远提供选项让用户选择
`;
```

### 2.2 更细粒度的对话阶段

将原有3阶段扩展为更精细的对话流程：

```text
阶段1：方向探索
  └─ 提供 3-4 个产品方向选项

阶段2：方向确认
  └─ 确认用户选择的方向

阶段3：外观风格确认（细化）
  ├─ 问题1：整体设计语言 [A/B/C/D]
  ├─ 问题2：色彩基调 [A/B/C/D]
  ├─ 问题3：材质偏好 [A/B/C/D]
  └─ 问题4：造型语言 [A/B/C/D]

阶段4：核心功能确认（细化）
  ├─ 问题1：必备功能选择 [多选]
  ├─ 问题2：功能优先级排序
  └─ 问题3：差异化功能确认

阶段5：定价与包装
  ├─ 问题1：定价区间 [A/B/C]
  └─ 问题2：包装档次 [A/B/C]

阶段6：生成完整PRD
  └─ [DESIGN_READY] 标记
```

## 三、用户参考图片上传

### 3.1 `PrdChatPanel.tsx` 增强

添加图片上传按钮到输入区域：

```typescript
interface PrdChatPanelProps {
  // 现有 props...
  referenceImages?: ReferenceImage[];
  onImageUpload?: (file: File) => Promise<void>;
  onImageRemove?: (imageId: string) => void;
}

// 在输入框左侧添加上传按钮
<div className="flex items-center gap-2">
  <label className="cursor-pointer">
    <input 
      type="file" 
      accept="image/*"
      className="hidden"
      onChange={handleImageUpload}
      disabled={isSending}
    />
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="hover:bg-primary/10"
      asChild
    >
      <span>
        <ImagePlus className="w-5 h-5 text-muted-foreground" />
      </span>
    </Button>
  </label>
  <Input ... />
  <Button ... />
</div>
```

### 3.2 `PrdExtractionSidebar.tsx` 增加参考图片展示区

```typescript
interface PrdExtractionSidebarProps {
  // 现有 props...
  referenceImages?: ReferenceImage[];
  onImageRemove?: (imageId: string) => void;
}

// 在侧边栏底部添加参考图片区域
{referenceImages && referenceImages.length > 0 && (
  <>
    <Separator className="my-4" />
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <ImageIcon className="w-3.5 h-3.5 text-muted-foreground" />
        <h4 className="text-xs font-medium text-muted-foreground">我的参考图片</h4>
        <Badge variant="secondary" className="text-xs">{referenceImages.length}</Badge>
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        {referenceImages.map((img) => (
          <div key={img.id} className="relative group aspect-square rounded-md overflow-hidden">
            <img src={img.url} className="w-full h-full object-cover" />
            <button
              onClick={() => onImageRemove?.(img.id)}
              className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 bg-destructive rounded-full p-1"
            >
              <X className="w-3 h-3 text-white" />
            </button>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        这些图片将作为产品设计的参考
      </p>
    </div>
  </>
)}
```

### 3.3 `PrdPhase.tsx` 图片上传逻辑

```typescript
const handleImageUpload = async (file: File) => {
  if (!file.type.startsWith('image/')) {
    toast.error("请上传图片文件");
    return;
  }

  try {
    // 1. 上传到 Supabase Storage
    const fileName = `${projectId}/${crypto.randomUUID()}-${file.name}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("reference-images")
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    // 2. 获取公开 URL
    const { data: { publicUrl } } = supabase.storage
      .from("reference-images")
      .getPublicUrl(uploadData.path);

    // 3. 更新 prd_data 中的 referenceImages 数组
    const newImage = {
      id: crypto.randomUUID(),
      url: publicUrl,
      uploadedAt: new Date().toISOString(),
    };

    const updatedReferenceImages = [...(prdData?.referenceImages || []), newImage];

    await supabase
      .from("projects")
      .update({
        prd_data: {
          ...prdData,
          referenceImages: updatedReferenceImages,
        },
      })
      .eq("id", projectId);

    setPrdData({ ...prdData, referenceImages: updatedReferenceImages });
    toast.success("参考图片上传成功");
  } catch (error) {
    console.error(error);
    toast.error("图片上传失败");
  }
};
```

### 3.4 数据库 Storage Bucket 创建

```sql
-- 创建参考图片存储桶
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('reference-images', 'reference-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

-- RLS 策略
CREATE POLICY "Users can upload reference images"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'reference-images' AND auth.uid() IS NOT NULL);

CREATE POLICY "Reference images are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'reference-images');

CREATE POLICY "Users can delete their reference images"
ON storage.objects
FOR DELETE
USING (bucket_id = 'reference-images' AND auth.uid() IS NOT NULL);
```

## 四、产品设计阶段对接

### 4.1 `ProductDesignGallery.tsx` 接收参考图片

```typescript
interface ProductDesignGalleryProps {
  // 现有 props...
  referenceImages?: ReferenceImage[];  // 新增
}

// 在生成图片时将参考图片作为上下文传入
const generateImage = async (prompt: string) => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/generate-image`, {
    body: JSON.stringify({
      prompt,
      projectId,
      imageType: "product",
      phase: 1,
      referenceImageUrls: referenceImages?.map(img => img.url) || [],  // 传入参考图片
    }),
  });
};
```

### 4.2 `generate-image` Edge Function 改造

```typescript
// 接收参考图片 URL
const { referenceImageUrls } = await req.json();

// 在提示词中融入参考图片说明
if (referenceImageUrls && referenceImageUrls.length > 0) {
  promptContext += `\n\n用户提供了 ${referenceImageUrls.length} 张参考图片作为设计参考。`;
  
  // 如果需要图片输入，可以将参考图片作为视觉上下文传入模型
  // （需要使用支持图片输入的模型如 gemini-2.5-pro）
}
```

### 4.3 `Project.tsx` 数据传递

```typescript
// 从 prdData 中提取参考图片传给产品设计阶段
<VisualGenerationPhase
  projectId={projectId}
  prdData={prdData}
  referenceImages={prdData?.referenceImages || []}  // 新增
  isReadOnly={isProjectCompleted}
/>
```

## 五、涉及文件清单

| 文件路径 | 修改类型 | 说明 |
|----------|----------|------|
| 数据库迁移 | 新建 | 创建 reference-images 存储桶 |
| `supabase/functions/chat/index.ts` | 修改 | 更新系统提示词，强制选择题，增强提取规则 |
| `src/components/PrdChatPanel.tsx` | 修改 | 添加图片上传按钮 |
| `src/components/PrdExtractionSidebar.tsx` | 修改 | 添加参考图片展示区，增强字段展示 |
| `src/components/PrdPhase.tsx` | 修改 | 添加图片上传逻辑 |
| `src/components/ProductDesignGallery.tsx` | 修改 | 接收并使用参考图片 |
| `src/pages/Project.tsx` | 修改 | 传递参考图片到产品设计阶段 |
| `supabase/functions/generate-image/index.ts` | 修改 | 接收参考图片参数 |

## 六、用户体验流程

### PRD对话流程

```text
用户进入产品定义阶段
        ↓
AI 提供 4 个产品方向选项 [A/B/C/D]
        ↓
用户点击选项（一键选择，无需打字）
        ↓
AI 确认方向，提供外观风格选项 [A/B/C/D]
        ↓
用户选择风格
        ↓
AI 进一步追问材质/色彩/造型 [A/B/C/D]
        ↓
用户逐一选择
        ↓
AI 提供核心功能选项 [多选]
        ↓
用户勾选需要的功能
        ↓
AI 提供定价策略选项 [A/B/C]
        ↓
[所有选择完成]
        ↓
AI 生成完整 PRD + [DESIGN_READY]
```

### 参考图片上传流程

```text
用户点击输入框旁的📎图标
        ↓
选择本地图片文件
        ↓
图片上传到 Supabase Storage
        ↓
图片缩略图显示在侧边栏"我的参考图片"区域
        ↓
图片 URL 保存到 prd_data.referenceImages
        ↓
进入产品设计阶段时，参考图片传入 AI 生成流程
```

## 七、预期效果

1. **PRD内容更丰富**：外观风格和核心功能的描述更加详细专业
2. **用户交互更简单**：100%选择题，无需用户思考如何表达
3. **设计参考更精准**：用户上传的参考图片直接影响AI生成结果
4. **数据完整性提升**：所有关键信息都以结构化方式存储

