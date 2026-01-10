-- Make bug-screenshots bucket public so screenshots can be displayed
-- The bucket was originally created as private, but we need public URLs to display screenshots

-- Update the bucket to be public
UPDATE storage.buckets
SET public = true
WHERE id = 'bug-screenshots';

-- Drop the old restrictive storage policies since we're using service_role key in Edge Function
DROP POLICY IF EXISTS "Authenticated users can upload bug screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Admin influencers can read all bug screenshots" ON storage.objects;
DROP POLICY IF EXISTS "Users can read own bug screenshots" ON storage.objects;

-- New policy: Allow public reads (anyone can view screenshots via public URL)
CREATE POLICY "Public can read bug screenshots"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'bug-screenshots');

-- Note: Uploads are handled by the Edge Function using service_role key, which bypasses RLS
-- So we don't need INSERT policies for authenticated users

COMMENT ON POLICY "Public can read bug screenshots" ON storage.objects IS
  'Allows anyone with the URL to view bug report screenshots. Uploads are controlled by the Edge Function.';
