-- Add Shopify order number field to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS shopify_order_number TEXT;

-- Add comment
COMMENT ON COLUMN public.orders.shopify_order_number IS 'Shopify order number (e.g., #1001, #1002)';

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_orders_shopify_order_number ON public.orders(shopify_order_number);
