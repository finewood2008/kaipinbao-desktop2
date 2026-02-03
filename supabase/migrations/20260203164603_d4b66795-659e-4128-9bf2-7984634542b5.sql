-- Add version management columns to landing_pages
ALTER TABLE landing_pages ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;
ALTER TABLE landing_pages ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Create unique index: only one active version per project
CREATE UNIQUE INDEX IF NOT EXISTS landing_pages_project_active_idx 
  ON landing_pages(project_id) WHERE is_active = true;

-- Update projects stage constraint to support 5 stages
ALTER TABLE projects 
  DROP CONSTRAINT IF EXISTS projects_current_stage_check;
ALTER TABLE projects
  ADD CONSTRAINT projects_current_stage_check CHECK (current_stage >= 1 AND current_stage <= 5);