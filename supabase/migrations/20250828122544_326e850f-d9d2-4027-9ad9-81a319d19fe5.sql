-- Fix function security warnings
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT 
SECURITY DEFINER
SET search_path = public
LANGUAGE SQL 
STABLE AS $$
  SELECT role FROM public.profiles WHERE user_id = auth.uid();
$$;

-- Fix update trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Add more seed data (customers already exist, add more)
INSERT INTO public.customers (name, email, phone, billing_addr, shipping_addr) VALUES
  ('Diana Davis', 'diana@example.com', '+1-555-0106', '{"street":"987 Cedar Ln","city":"Philadelphia","state":"PA","zip":"19101"}', '{"street":"987 Cedar Ln","city":"Philadelphia","state":"PA","zip":"19101"}'),
  ('Edward Miller', 'edward@example.com', '+1-555-0107', '{"street":"147 Birch Ct","city":"San Antonio","state":"TX","zip":"78201"}', '{"street":"147 Birch Ct","city":"San Antonio","state":"TX","zip":"78201"}'),
  ('Fiona Garcia', 'fiona@example.com', '+1-555-0108', '{"street":"258 Spruce Ave","city":"San Diego","state":"CA","zip":"92101"}', '{"street":"258 Spruce Ave","city":"San Diego","state":"CA","zip":"92101"}'),
  ('George Rodriguez', 'george@example.com', '+1-555-0109', '{"street":"369 Willow St","city":"Dallas","state":"TX","zip":"75201"}', '{"street":"369 Willow St","city":"Dallas","state":"TX","zip":"75201"}'),
  ('Helen Martinez', 'helen@example.com', '+1-555-0110', '{"street":"741 Ash Blvd","city":"San Jose","state":"CA","zip":"95101"}', '{"street":"741 Ash Blvd","city":"San Jose","state":"CA","zip":"95101"}')
ON CONFLICT (email) DO NOTHING;

-- Force seed orders (fixed the issue)
INSERT INTO public.orders (customer_id, purchase_from, order_date, total_amount, current_status) 
SELECT 
  c.id,
  CASE (RANDOM() * 3)::int 
    WHEN 0 THEN 'Website'
    WHEN 1 THEN 'Phone'
    ELSE 'In-Store'
  END,
  CURRENT_DATE - (RANDOM() * 30)::int,
  (RANDOM() * 5000 + 500)::numeric(10,2),
  CASE (RANDOM() * 5)::int
    WHEN 0 THEN 'pending'
    WHEN 1 THEN 'processing'
    WHEN 2 THEN 'ready'
    WHEN 3 THEN 'shipped'
    ELSE 'completed'
  END
FROM public.customers c
LIMIT 10
ON CONFLICT DO NOTHING;

-- Seed order items (25 items across orders)
INSERT INTO public.order_items (order_id, sku, size, metal_type, details, price, qty)
SELECT 
  o.id,
  'SKU-' || LPAD((RANDOM() * 9999)::int::text, 4, '0'),
  CASE (RANDOM() * 4)::int
    WHEN 0 THEN '6'
    WHEN 1 THEN '7'
    WHEN 2 THEN '8'
    ELSE '9'
  END,
  CASE (RANDOM() * 3)::int
    WHEN 0 THEN '14K Gold'
    WHEN 1 THEN '18K Gold'
    ELSE 'Platinum'
  END,
  'Custom jewelry piece with detailed craftsmanship',
  (RANDOM() * 2000 + 100)::numeric(10,2),
  (RANDOM() * 3 + 1)::int
FROM public.orders o,
     generate_series(1, 3) as s
ON CONFLICT DO NOTHING;

-- Seed order costs
INSERT INTO public.order_costs (order_id, casting, diamond, labor)
SELECT 
  id,
  (RANDOM() * 200 + 50)::numeric(10,2),
  (RANDOM() * 1000 + 100)::numeric(10,2),
  (RANDOM() * 300 + 100)::numeric(10,2)
FROM public.orders
ON CONFLICT DO NOTHING;

-- Seed more diamond subparcels
INSERT INTO public.diamond_subparcels (parcel_id, sub_code, carat)
SELECT 
  dp.id,
  dp.parcel_code || '-' || LPAD(s::text, 2, '0'),
  (RANDOM() * 2 + 0.3)::numeric(4,2)
FROM public.diamond_parcels dp,
     generate_series(1, 4) as s
ON CONFLICT DO NOTHING;