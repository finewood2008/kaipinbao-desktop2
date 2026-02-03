-- Extend landing_pages schema for richer landing page content
ALTER TABLE public.landing_pages
  ADD COLUMN IF NOT EXISTS faq_items jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS specifications jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS usage_scenarios jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS social_proof_items jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS urgency_message text,
  ADD COLUMN IF NOT EXISTS marketing_images_with_copy jsonb NOT NULL DEFAULT '[]'::jsonb;