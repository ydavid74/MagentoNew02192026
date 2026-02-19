-- Create storage bucket for appraisal files
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', TRUE)
ON CONFLICT (id) DO NOTHING;

-- Policy for public read access to documents
CREATE POLICY "Allow public read access to documents"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'documents');

-- Policy for authenticated users to upload documents
CREATE POLICY "Allow authenticated uploads to documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'documents');

-- Policy for authenticated users to update documents
CREATE POLICY "Allow authenticated updates to documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'documents');

-- Policy for authenticated users to delete documents
CREATE POLICY "Allow authenticated deletes to documents"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'documents');

-- Note: The actual appraisal files (CSS, images, etc.) need to be uploaded manually
-- to the 'documents/appraisal_files/' path in Supabase Storage
-- Files to upload:
-- - appraisal.css
-- - bottom_left.jpg
-- - bottom_right.jpg
-- - diamond_img1.jpg
-- - diamond_img2.jpg
-- - IMAGE_APP.gif
-- - Jewelry Report.png
-- - logo-2.png
-- - prime_style_logo.jpg
-- - top_diamond.jpg
-- - top_left.jpg
-- - top_right.jpg
