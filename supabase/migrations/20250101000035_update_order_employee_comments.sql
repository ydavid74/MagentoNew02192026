-- Update order_employee_comments table to support file attachments and important flag
-- Migration: 20250101000035_update_order_employee_comments.sql

-- Add new columns to order_employee_comments table
ALTER TABLE public.order_employee_comments 
ADD COLUMN IF NOT EXISTS is_important BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS file_url TEXT,
ADD COLUMN IF NOT EXISTS filename TEXT,
ADD COLUMN IF NOT EXISTS file_size INTEGER,
ADD COLUMN IF NOT EXISTS content_type TEXT;

-- Add comments for new columns
COMMENT ON COLUMN public.order_employee_comments.is_important IS 'Flag for important comments that should be highlighted';
COMMENT ON COLUMN public.order_employee_comments.file_url IS 'URL to the attached file stored in Supabase Storage';
COMMENT ON COLUMN public.order_employee_comments.filename IS 'Original filename of the attached file';
COMMENT ON COLUMN public.order_employee_comments.file_size IS 'Size of the attached file in bytes';
COMMENT ON COLUMN public.order_employee_comments.content_type IS 'MIME type of the attached file';

-- Create index for important comments for better performance
CREATE INDEX IF NOT EXISTS idx_order_employee_comments_is_important ON public.order_employee_comments(is_important);
