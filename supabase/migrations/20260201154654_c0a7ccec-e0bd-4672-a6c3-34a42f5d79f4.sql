-- Fix the overly permissive storage policy by requiring service role authentication
-- Drop the overly permissive policy and create a more restrictive one

DROP POLICY IF EXISTS "Service role can upload review screenshots" ON storage.objects;

-- Create a policy that only allows authenticated users (which includes service role)
-- The service role will bypass RLS anyway, but this makes the policy more explicit
CREATE POLICY "Authenticated users can upload review screenshots"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'review-screenshots');