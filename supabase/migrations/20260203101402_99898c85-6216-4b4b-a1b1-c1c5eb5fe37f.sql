-- Drop existing constraint that limits stage to 1-3
ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS projects_current_stage_check;

-- Add new constraint that allows stages 1-4
ALTER TABLE public.projects ADD CONSTRAINT projects_current_stage_check 
  CHECK (current_stage >= 1 AND current_stage <= 4);