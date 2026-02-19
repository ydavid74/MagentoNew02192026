-- Remove current_status column from orders table
-- This column will be replaced by using the status from the latest customer note

-- Drop the current_status column
ALTER TABLE public.orders DROP COLUMN IF EXISTS current_status;

-- Add comment to document the change
COMMENT ON TABLE public.orders IS 'Orders table - status is now derived from latest customer note status';
