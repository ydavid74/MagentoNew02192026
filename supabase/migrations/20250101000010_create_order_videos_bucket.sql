-- Create storage bucket for order videos
-- This bucket will store video recordings from employee comments

-- Create the storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'order-videos',
  'order-videos',
  true,
  104857600, -- 100MB limit
  ARRAY['video/webm', 'video/mp4', 'video/quicktime']
) ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for the order-videos bucket

-- Policy: Allow authenticated users to upload videos
CREATE POLICY "Allow authenticated users to upload order videos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'order-videos' AND 
    auth.role() = 'authenticated'
  );

-- Policy: Allow users to view videos for orders they have access to
CREATE POLICY "Allow users to view order videos" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'order-videos'
  );

-- Policy: Allow users to update their own uploaded videos
CREATE POLICY "Allow users to update their own order videos" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'order-videos' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Policy: Allow users to delete their own uploaded videos
CREATE POLICY "Allow users to delete their own order videos" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'order-videos' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Add comment for documentation
COMMENT ON TABLE storage.objects IS 'Storage objects including order video recordings';
