-- Add bill_to_name and ship_to_name columns to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS bill_to_name TEXT,
ADD COLUMN IF NOT EXISTS ship_to_name TEXT;

-- Update existing orders to have default values
UPDATE public.orders 
SET bill_to_name = COALESCE(bill_to_name, 'Customer'),
    ship_to_name = COALESCE(ship_to_name, 'Customer')
WHERE bill_to_name IS NULL OR ship_to_name IS NULL;
