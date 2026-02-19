-- Make order_id nullable in diamond_deductions table for manual deductions
-- First, drop the foreign key constraint
ALTER TABLE public.diamond_deductions DROP CONSTRAINT IF EXISTS diamond_deductions_order_id_fkey;

-- Make order_id nullable
ALTER TABLE public.diamond_deductions ALTER COLUMN order_id DROP NOT NULL;

-- Re-add the foreign key constraint but allow NULL values
ALTER TABLE public.diamond_deductions 
ADD CONSTRAINT diamond_deductions_order_id_fkey 
FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;

-- Update the index to handle NULL values
DROP INDEX IF EXISTS idx_diamond_deductions_order_id;
CREATE INDEX IF NOT EXISTS idx_diamond_deductions_order_id ON public.diamond_deductions(order_id) WHERE order_id IS NOT NULL;
