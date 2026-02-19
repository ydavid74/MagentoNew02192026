-- Add include_in_item_cost column to diamond_deductions table
ALTER TABLE public.diamond_deductions 
ADD COLUMN IF NOT EXISTS include_in_item_cost BOOLEAN DEFAULT true;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_diamond_deductions_include_in_item_cost 
ON public.diamond_deductions(include_in_item_cost);

-- Update existing records to have include_in_item_cost = true (default behavior)
UPDATE public.diamond_deductions 
SET include_in_item_cost = true 
WHERE include_in_item_cost IS NULL;
