-- Add new fields for optimized Amazon scraping
-- main_image: Only the primary product image
-- review_summary: JSON containing rating breakdown and top review insights
-- review_screenshot_url: URL to screenshot stored in Supabase Storage (NOT base64)

ALTER TABLE public.competitor_products 
ADD COLUMN IF NOT EXISTS main_image text,
ADD COLUMN IF NOT EXISTS review_summary jsonb DEFAULT NULL,
ADD COLUMN IF NOT EXISTS review_screenshot_url text;

-- Add comment for documentation
COMMENT ON COLUMN public.competitor_products.main_image IS 'Primary product image URL (first large image)';
COMMENT ON COLUMN public.competitor_products.review_summary IS 'JSON containing overall rating, rating breakdown, top positives/negatives';
COMMENT ON COLUMN public.competitor_products.review_screenshot_url IS 'URL to review page screenshot stored in Supabase Storage';

-- Create storage bucket for review screenshots
INSERT INTO storage.buckets (id, name, public)
VALUES ('review-screenshots', 'review-screenshots', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policy for review screenshots - anyone can view
CREATE POLICY "Review screenshots are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'review-screenshots');

-- Create storage policy - service role can upload
CREATE POLICY "Service role can upload review screenshots"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'review-screenshots');