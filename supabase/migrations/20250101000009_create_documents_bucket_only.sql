-- Create documents bucket for product images
-- Migration: 20250101000009_create_documents_bucket_only.sql

-- This migration only creates the bucket
-- Storage policies must be created manually through the Supabase Dashboard

-- Create the documents bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO NOTHING;

-- Note: After running this migration, you must manually create storage policies:
--
-- 1. Go to your Supabase Dashboard
-- 2. Navigate to Storage > Policies
-- 3. Click on the storage.objects table
-- 4. Create the following policies manually:
--
-- Policy 1: "Allow authenticated uploads"
-- - Type: INSERT
-- - Target roles: authenticated
-- - Using expression: bucket_id = 'documents'
--
-- Policy 2: "Allow public viewing"
-- - Type: SELECT
-- - Target roles: anon, authenticated
-- - Using expression: bucket_id = 'documents'
--
-- Policy 3: "Allow authenticated updates"
-- - Type: UPDATE
-- - Target roles: authenticated
-- - Using expression: bucket_id = 'documents'
--
-- Policy 4: "Allow authenticated deletes"
-- - Type: DELETE
-- - Target roles: authenticated
-- - Using expression: bucket_id = 'documents'
--
-- The reason for manual creation is that storage.objects is a system table
-- that cannot be modified through SQL migrations due to ownership restrictions.
