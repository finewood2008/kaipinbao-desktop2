-- Add product_images column to competitor_products table
ALTER TABLE public.competitor_products 
ADD COLUMN IF NOT EXISTS product_images jsonb DEFAULT '[]'::jsonb;