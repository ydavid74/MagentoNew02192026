-- Add comments column to order_3d_related table
ALTER TABLE public.order_3d_related 
ADD COLUMN IF NOT EXISTS comments TEXT;

-- Add comment to explain the new column
COMMENT ON COLUMN public.order_3d_related.comments IS 'Optional comments or notes for the 3D item';
