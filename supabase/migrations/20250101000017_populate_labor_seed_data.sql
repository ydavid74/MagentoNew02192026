-- Populate labor column with realistic seed data for existing orders
-- This provides varied labor costs based on common jewelry work

-- Update orders with realistic labor costs
-- Labor costs typically range from $50 to $500 depending on complexity
UPDATE public.orders
SET labor = CASE 
  -- Simple repairs and basic work
  WHEN id % 10 = 0 THEN 75.00
  WHEN id % 10 = 1 THEN 125.00
  WHEN id % 10 = 2 THEN 95.00
  WHEN id % 10 = 3 THEN 150.00
  WHEN id % 10 = 4 THEN 85.00
  
  -- Medium complexity work
  WHEN id % 10 = 5 THEN 200.00
  WHEN id % 10 = 6 THEN 175.00
  WHEN id % 10 = 7 THEN 225.00
  
  -- Complex custom work
  WHEN id % 10 = 8 THEN 350.00
  WHEN id % 10 = 9 THEN 275.00
  
  -- Default fallback
  ELSE 150.00
END
WHERE labor = 0.00 OR labor IS NULL;

-- Verify the update
SELECT 
  COUNT(*) as total_orders,
  MIN(labor) as min_labor,
  MAX(labor) as max_labor,
  AVG(labor) as avg_labor,
  SUM(labor) as total_labor_cost
FROM public.orders;
