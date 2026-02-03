-- Create reference-images storage bucket for user uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('reference-images', 'reference-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

-- RLS policy: Users can upload reference images
CREATE POLICY "Users can upload reference images"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'reference-images' AND auth.uid() IS NOT NULL);

-- RLS policy: Reference images are publicly accessible
CREATE POLICY "Reference images are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'reference-images');

-- RLS policy: Users can delete their reference images
CREATE POLICY "Users can delete their reference images"
ON storage.objects
FOR DELETE
USING (bucket_id = 'reference-images' AND auth.uid() IS NOT NULL);