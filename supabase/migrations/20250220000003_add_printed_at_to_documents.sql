-- Add printed_at column to track when a document was opened/printed
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS printed_at TIMESTAMP WITH TIME ZONE;
