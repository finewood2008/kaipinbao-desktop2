-- 为营销图片添加文案字段
ALTER TABLE generated_images 
ADD COLUMN IF NOT EXISTS marketing_copy TEXT;