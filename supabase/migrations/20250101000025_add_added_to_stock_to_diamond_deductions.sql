-- Add added_to_stock column to diamond_deductions table
ALTER TABLE public.diamond_deductions 
ADD COLUMN IF NOT EXISTS added_to_stock BOOLEAN DEFAULT false;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_diamond_deductions_added_to_stock 
ON public.diamond_deductions(added_to_stock);

-- Update existing records to have added_to_stock = false (default behavior)
UPDATE public.diamond_deductions 
SET added_to_stock = false 
WHERE added_to_stock IS NULL;
