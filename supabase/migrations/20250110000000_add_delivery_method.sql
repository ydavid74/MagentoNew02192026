-- Add delivery_method column to orders table
-- This column will store the shipping method from Shopify orders

-- Add delivery_method column to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS delivery_method TEXT;

-- Set default value for existing orders
UPDATE orders 
SET delivery_method = 'Standard Shipping'
WHERE delivery_method IS NULL;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_orders_delivery_method ON orders(delivery_method);

-- Update RLS policies to include the new column
DROP POLICY IF EXISTS "Users can view orders" ON orders;
CREATE POLICY "Users can view orders" ON orders
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert orders" ON orders;
CREATE POLICY "Users can insert orders" ON orders
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update orders" ON orders;
CREATE POLICY "Users can update orders" ON orders
  FOR UPDATE USING (true);
