-- Create order-files storage bucket for file attachments
-- Migration: 20250101000036_create_order_files_storage.sql

-- Create the order-files storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'order-files',
  'order-files',
  true,
  104857600, -- 100MB limit
  ARRAY[
    'image/*',
    'video/*',
    'audio/*',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv',
    'application/zip',
    'application/x-zip-compressed',
    'application/json',
    'application/xml',
    'text/xml'
  ]
) ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for order-files bucket
CREATE POLICY "Users can view order files" ON storage.objects
  FOR SELECT USING (bucket_id = 'order-files');

CREATE POLICY "Users can upload order files" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'order-files');

CREATE POLICY "Users can update order files" ON storage.objects
  FOR UPDATE USING (bucket_id = 'order-files');

CREATE POLICY "Users can delete order files" ON storage.objects
  FOR DELETE USING (bucket_id = 'order-files');
