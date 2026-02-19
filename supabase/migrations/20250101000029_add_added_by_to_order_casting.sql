-- Add added_by column to order_casting table
ALTER TABLE public.order_casting 
ADD COLUMN added_by UUID REFERENCES auth.users(id);

-- Create index for added_by column
CREATE INDEX IF NOT EXISTS idx_order_casting_added_by ON public.order_casting(added_by);

-- Add comment to explain the column
COMMENT ON COLUMN public.order_casting.added_by IS 'User who added this casting item';

-- Update existing records to set added_by to the first available user (if any)
-- This is a fallback for existing data
UPDATE public.order_casting 
SET added_by = (SELECT id FROM auth.users LIMIT 1)
WHERE added_by IS NULL;
