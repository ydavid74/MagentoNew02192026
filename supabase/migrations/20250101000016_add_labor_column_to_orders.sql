-- Add labor column to orders table
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS labor DECIMAL(10,2) DEFAULT 0.00;

-- Create index on labor for better query performance
CREATE INDEX IF NOT EXISTS idx_orders_labor ON public.orders(labor);

-- Add comment to explain the labor column
COMMENT ON COLUMN public.orders.labor IS 'Labor cost for the order in USD';

-- Update existing orders with default labor value if needed
UPDATE public.orders
SET labor = 0.00
WHERE labor IS NULL;
