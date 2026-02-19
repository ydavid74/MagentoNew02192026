-- Add CAD and General cost fields to orders table
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS cad_cost DECIMAL(10,2) DEFAULT 15.00,
ADD COLUMN IF NOT EXISTS general_cost DECIMAL(10,2) DEFAULT 20.00;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_orders_cad_cost ON public.orders(cad_cost);
CREATE INDEX IF NOT EXISTS idx_orders_general_cost ON public.orders(general_cost);

-- Add comments to explain the new columns
COMMENT ON COLUMN public.orders.cad_cost IS 'CAD design cost for the order in USD (default: $15)';
COMMENT ON COLUMN public.orders.general_cost IS 'General labor cost for the order in USD (default: $20)';

-- Update existing orders with default values if needed
UPDATE public.orders
SET cad_cost = 15.00,
    general_cost = 20.00
WHERE cad_cost IS NULL OR general_cost IS NULL;
