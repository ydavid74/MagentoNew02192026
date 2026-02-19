-- Fix storage bucket policies to resolve RLS violations
-- Migration: 20250101000008_fix_storage_policies.sql

-- Drop existing policies that are too restrictive
DROP POLICY IF EXISTS "Authenticated users can upload files to documents bucket" ON storage.objects;
DROP POLICY IF EXISTS "Public can view files in documents bucket" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update files in documents bucket" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete files in documents bucket" ON storage.objects;

-- Create simpler, more permissive policies

-- Policy for uploading files: Allow any authenticated user to upload
CREATE POLICY "Allow authenticated uploads" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'documents' 
        AND auth.role() = 'authenticated'
    );

-- Policy for viewing files: Allow public access
CREATE POLICY "Allow public viewing" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'documents'
    );

-- Policy for updating files: Allow authenticated users to update any file
CREATE POLICY "Allow authenticated updates" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'documents' 
        AND auth.role() = 'authenticated'
    );

-- Policy for deleting files: Allow authenticated users to delete any file
CREATE POLICY "Allow authenticated deletes" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'documents' 
        AND auth.role() = 'authenticated'
    );

-- Alternative: If you want to be more restrictive, you can use this approach instead:
-- CREATE POLICY "Allow authenticated operations" ON storage.objects
--     FOR ALL USING (
--         bucket_id = 'documents' 
--         AND auth.role() = 'authenticated'
--     );
