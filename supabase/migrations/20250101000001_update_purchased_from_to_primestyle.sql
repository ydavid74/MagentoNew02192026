-- Update all existing orders to set purchased_from to 'primestyle'
-- This migration sets the purchase_from field for all orders to 'primestyle'

-- Update all existing orders
UPDATE orders 
SET purchase_from = 'primestyle'
WHERE purchase_from IS NULL OR purchase_from != 'primestyle';

-- Verify the update
-- You can run this query to check the results:
-- SELECT id, purchase_from FROM orders LIMIT 10;

-- Optional: Add a comment to track this change
COMMENT ON COLUMN orders.purchase_from IS 'Updated all values to primestyle on 2025-01-01';
