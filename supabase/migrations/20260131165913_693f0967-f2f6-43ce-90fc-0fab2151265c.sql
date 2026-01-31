-- Allow users to delete their own landing pages for regeneration
CREATE POLICY "Users can delete their landing pages" 
ON public.landing_pages 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM projects
  WHERE projects.id = landing_pages.project_id 
  AND projects.user_id = auth.uid()
));