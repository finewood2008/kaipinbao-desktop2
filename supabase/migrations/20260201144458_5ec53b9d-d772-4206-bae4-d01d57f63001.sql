-- Add new fields to landing_pages table for enhanced landing page content
ALTER TABLE public.landing_pages
ADD COLUMN IF NOT EXISTS subheadline text,
ADD COLUMN IF NOT EXISTS cta_text text DEFAULT '立即订阅',
ADD COLUMN IF NOT EXISTS product_images jsonb,
ADD COLUMN IF NOT EXISTS marketing_images jsonb,
ADD COLUMN IF NOT EXISTS video_url text,
ADD COLUMN IF NOT EXISTS generated_images jsonb,
ADD COLUMN IF NOT EXISTS color_scheme jsonb;