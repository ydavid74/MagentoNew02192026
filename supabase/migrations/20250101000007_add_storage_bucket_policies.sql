-- Add storage bucket policies for documents bucket
-- Migration: 20250101000007_add_storage_bucket_policies.sql

-- Create the documents bucket if it doesn't exist
-- Note: This should be done through the Supabase dashboard if the INSERT fails
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO NOTHING;

-- IMPORTANT: The following policies should be created through the Supabase Dashboard
-- Go to Storage > Policies > storage.objects and create these policies manually
-- 
-- Policy 1: "Allow authenticated uploads"
-- Type: INSERT
-- Target roles: authenticated
-- Using expression: bucket_id = 'documents'
--
-- Policy 2: "Allow public viewing"
-- Type: SELECT  
-- Target roles: anon, authenticated
-- Using expression: bucket_id = 'documents'
--
-- Policy 3: "Allow authenticated updates"
-- Type: UPDATE
-- Target roles: authenticated
-- Using expression: bucket_id = 'documents'
--
-- Policy 4: "Allow authenticated deletes"
-- Type: DELETE
-- Target roles: authenticated
-- Using expression: bucket_id = 'documents'

-- Alternative: If you have admin access, you can try this approach:
-- Note: This may still fail due to ownership restrictions

-- Try to create policies (may fail due to ownership)
DO $$
BEGIN
    -- Policy for uploading files to the documents bucket
    BEGIN
        CREATE POLICY "Allow authenticated uploads" ON storage.objects
            FOR INSERT WITH CHECK (
                bucket_id = 'documents' 
                AND auth.role() = 'authenticated'
            );
        RAISE NOTICE 'Upload policy created successfully';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Upload policy creation failed: %', SQLERRM;
    END;

    -- Policy for viewing files in the documents bucket
    BEGIN
        CREATE POLICY "Allow public viewing" ON storage.objects
            FOR SELECT USING (
                bucket_id = 'documents'
            );
        RAISE NOTICE 'View policy created successfully';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'View policy creation failed: %', SQLERRM;
    END;

    -- Policy for updating files in the documents bucket
    BEGIN
        CREATE POLICY "Allow authenticated updates" ON storage.objects
            FOR UPDATE USING (
                bucket_id = 'documents' 
                AND auth.role() = 'authenticated'
            );
        RAISE NOTICE 'Update policy created successfully';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Update policy creation failed: %', SQLERRM;
    END;

    -- Policy for deleting files in the documents bucket
    BEGIN
        CREATE POLICY "Allow authenticated deletes" ON storage.objects
            FOR DELETE USING (
                bucket_id = 'documents' 
                AND auth.role() = 'authenticated'
            );
        RAISE NOTICE 'Delete policy created successfully';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Delete policy creation failed: %', SQLERRM;
    END;

END $$;

-- Note: If all policies fail, you must create them manually through the Supabase Dashboard
-- The error "must be owner of table objects" indicates this is a system table
-- that cannot be modified through SQL migrations
