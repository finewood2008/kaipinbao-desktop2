-- Add template_style column to landing_pages table
ALTER TABLE public.landing_pages 
ADD COLUMN template_style text DEFAULT 'modern';

-- Add comment for the new column
COMMENT ON COLUMN public.landing_pages.template_style IS 'Template style for the landing page (modern, minimal, bold, elegant, tech)';