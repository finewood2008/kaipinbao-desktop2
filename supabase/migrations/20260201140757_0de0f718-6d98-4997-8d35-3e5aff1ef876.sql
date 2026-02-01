-- Add cover_image_url to projects table for dashboard thumbnails
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS cover_image_url text;