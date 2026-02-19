-- Update orders table structure to support the new 7-column layout
-- Add bill_to_name and ship_to_name columns

-- Add new columns to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS bill_to_name TEXT,
ADD COLUMN IF NOT EXISTS ship_to_name TEXT;

-- Update existing orders to have default values for the new columns
-- For now, we'll use the customer name as default for both bill_to_name and ship_to_name
UPDATE orders 
SET 
  bill_to_name = COALESCE(
    (SELECT name FROM customers WHERE customers.id = orders.customer_id),
    'Unknown Customer'
  ),
  ship_to_name = COALESCE(
    (SELECT name FROM customers WHERE customers.id = orders.customer_id),
    'Unknown Customer'
  )
WHERE bill_to_name IS NULL OR ship_to_name IS NULL;

-- Make the new columns NOT NULL with default values
ALTER TABLE orders 
ALTER COLUMN bill_to_name SET NOT NULL,
ALTER COLUMN bill_to_name SET DEFAULT 'Unknown Customer',
ALTER COLUMN ship_to_name SET NOT NULL,
ALTER COLUMN ship_to_name SET DEFAULT 'Unknown Customer';

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_orders_bill_to_name ON orders(bill_to_name);
CREATE INDEX IF NOT EXISTS idx_orders_ship_to_name ON orders(ship_to_name);

-- Update RLS policies to include new columns
DROP POLICY IF EXISTS "Users can view orders" ON orders;
CREATE POLICY "Users can view orders" ON orders
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert orders" ON orders;
CREATE POLICY "Users can insert orders" ON orders
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update orders" ON orders;
CREATE POLICY "Users can update orders" ON orders
  FOR UPDATE USING (true);

-- Insert some sample data for testing (if table is empty)
INSERT INTO orders (id, customer_id, purchase_from, order_date, current_status, total_amount, bill_to_name, ship_to_name)
SELECT 
  gen_random_uuid(),
  c.id,
  CASE (random() * 3)::int
    WHEN 0 THEN 'Website'
    WHEN 1 THEN 'Phone'
    WHEN 2 THEN 'In-Store'
  END,
  (CURRENT_DATE - (random() * 365)::int * INTERVAL '1 day')::date,
  CASE (random() * 4)::int
    WHEN 0 THEN 'pending'
    WHEN 1 THEN 'processing'
    WHEN 2 THEN 'shipped'
    WHEN 3 THEN 'delivered'
  END,
  (random() * 5000 + 100)::numeric(10,2),
  c.name,
  c.name
FROM customers c
WHERE NOT EXISTS (SELECT 1 FROM orders LIMIT 1)
LIMIT 10;
