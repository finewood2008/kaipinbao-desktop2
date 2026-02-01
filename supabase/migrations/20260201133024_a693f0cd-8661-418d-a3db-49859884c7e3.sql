-- Add new columns to generated_images table for phase support
ALTER TABLE public.generated_images 
ADD COLUMN IF NOT EXISTS image_type text NOT NULL DEFAULT 'product',
ADD COLUMN IF NOT EXISTS phase integer NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS parent_image_id uuid REFERENCES public.generated_images(id);

-- Add constraint to ensure valid image types
ALTER TABLE public.generated_images 
ADD CONSTRAINT valid_image_type CHECK (image_type IN ('product', 'scene', 'structure', 'exploded', 'usage', 'lifestyle', 'detail', 'comparison', 'custom'));

-- Add constraint to ensure valid phase
ALTER TABLE public.generated_images 
ADD CONSTRAINT valid_phase CHECK (phase IN (1, 2));

-- Create index for faster queries by phase and type
CREATE INDEX IF NOT EXISTS idx_generated_images_phase ON public.generated_images(phase);
CREATE INDEX IF NOT EXISTS idx_generated_images_type ON public.generated_images(image_type);
CREATE INDEX IF NOT EXISTS idx_generated_images_parent ON public.generated_images(parent_image_id);

-- Create generated_videos table for video generation
CREATE TABLE public.generated_videos (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  video_url text,
  prompt text NOT NULL,
  scene_description text,
  duration_seconds integer NOT NULL DEFAULT 6,
  status text NOT NULL DEFAULT 'pending',
  parent_image_id uuid REFERENCES public.generated_images(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'processing', 'completed', 'failed'))
);

-- Enable RLS on generated_videos
ALTER TABLE public.generated_videos ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for generated_videos
CREATE POLICY "Users can view videos of their projects" 
ON public.generated_videos 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM projects 
  WHERE projects.id = generated_videos.project_id 
  AND projects.user_id = auth.uid()
));

CREATE POLICY "Users can insert videos to their projects" 
ON public.generated_videos 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM projects 
  WHERE projects.id = generated_videos.project_id 
  AND projects.user_id = auth.uid()
));

CREATE POLICY "Users can update videos of their projects" 
ON public.generated_videos 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM projects 
  WHERE projects.id = generated_videos.project_id 
  AND projects.user_id = auth.uid()
));

CREATE POLICY "Users can delete videos of their projects" 
ON public.generated_videos 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM projects 
  WHERE projects.id = generated_videos.project_id 
  AND projects.user_id = auth.uid()
));

-- Add trigger for automatic timestamp updates on generated_videos
CREATE TRIGGER update_generated_videos_updated_at
BEFORE UPDATE ON public.generated_videos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster queries
CREATE INDEX idx_generated_videos_project ON public.generated_videos(project_id);
CREATE INDEX idx_generated_videos_status ON public.generated_videos(status);