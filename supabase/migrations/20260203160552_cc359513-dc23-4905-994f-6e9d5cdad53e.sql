-- Add screenshot_url column to landing_pages table for storing real webpage screenshots
ALTER TABLE public.landing_pages 
ADD COLUMN IF NOT EXISTS screenshot_url text;

-- Add comment for clarity
COMMENT ON COLUMN public.landing_pages.screenshot_url IS 'URL of the captured screenshot of the published landing page';