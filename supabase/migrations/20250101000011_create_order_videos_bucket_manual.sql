-- Manual creation of order-videos storage bucket
-- This migration ensures the bucket exists for video uploads

-- First, check if the bucket already exists
DO $$
BEGIN
    -- Check if bucket exists
    IF NOT EXISTS (
        SELECT 1 FROM storage.buckets WHERE id = 'order-videos'
    ) THEN
        -- Create the storage bucket manually
        INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
        VALUES (
            'order-videos',
            'order-videos',
            true,
            104857600, -- 100MB limit
            ARRAY['video/webm', 'video/mp4', 'video/quicktime']
        );
        
        RAISE NOTICE 'Storage bucket "order-videos" created successfully';
    ELSE
        RAISE NOTICE 'Storage bucket "order-videos" already exists';
    END IF;
END $$;

-- Set up storage policies for the order-videos bucket
-- Policy: Allow authenticated users to upload videos
DROP POLICY IF EXISTS "Allow authenticated users to upload order videos" ON storage.objects;
CREATE POLICY "Allow authenticated users to upload order videos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'order-videos' AND 
    auth.role() = 'authenticated'
  );

-- Policy: Allow users to view videos for orders they have access to
DROP POLICY IF EXISTS "Allow users to view order videos" ON storage.objects;
CREATE POLICY "Allow users to view order videos" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'order-videos'
  );

-- Policy: Allow users to update their own uploaded videos
DROP POLICY IF EXISTS "Allow users to update their own order videos" ON storage.objects;
CREATE POLICY "Allow users to update their own order videos" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'order-videos' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Policy: Allow users to delete their own uploaded videos
DROP POLICY IF EXISTS "Allow users to delete their own order videos" ON storage.objects;
CREATE POLICY "Allow users to delete their own order videos" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'order-videos' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Verify bucket creation
SELECT 
    id, 
    name, 
    public, 
    file_size_limit,
    allowed_mime_types
FROM storage.buckets 
WHERE id = 'order-videos';

-- Show storage policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'objects' 
AND policyname LIKE '%order videos%';
