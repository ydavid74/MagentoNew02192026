-- Add status column to order_customer_notes table
ALTER TABLE public.order_customer_notes 
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'pending';

-- Create index on status for better query performance
CREATE INDEX IF NOT EXISTS idx_order_customer_notes_status ON public.order_customer_notes(status);

-- Add comment to explain the status column
COMMENT ON COLUMN public.order_customer_notes.status IS 'Status of the customer note (pending, processing, shipped, delivered, cancelled, returned)';

-- Update existing records to have a default status
UPDATE public.order_customer_notes 
SET status = 'pending' 
WHERE status IS NULL;
