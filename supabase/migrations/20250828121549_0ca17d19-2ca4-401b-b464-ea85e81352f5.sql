-- Create profiles table
CREATE TABLE public.profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('admin', 'employee')) DEFAULT 'employee',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create customers table
CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  email TEXT UNIQUE,
  phone TEXT,
  billing_addr JSONB,
  shipping_addr JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create orders table
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id),
  purchase_from TEXT,
  order_date DATE,
  total_amount NUMERIC DEFAULT 0,
  current_status TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create order_items table
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  sku TEXT,
  size TEXT,
  metal_type TEXT,
  details TEXT,
  price NUMERIC DEFAULT 0,
  qty INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create order_status_history table
CREATE TABLE public.order_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  status TEXT,
  comment TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create order_costs table
CREATE TABLE public.order_costs (
  order_id UUID PRIMARY KEY REFERENCES orders(id) ON DELETE CASCADE,
  casting NUMERIC DEFAULT 0,
  diamond NUMERIC DEFAULT 0,
  labor NUMERIC DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create order_comments table
CREATE TABLE public.order_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  content TEXT,
  is_important BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create documents table
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  type TEXT CHECK (type IN ('invoice', 'appraisal', 'label', '3d', 'other')),
  file_url TEXT,
  filename TEXT,
  size INTEGER,
  content_type TEXT,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create employee_notes table
CREATE TABLE public.employee_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  content TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create diamond_parcels table
CREATE TABLE public.diamond_parcels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parcel_code TEXT UNIQUE,
  name TEXT,
  shape TEXT,
  color TEXT,
  clarity TEXT,
  carat_total NUMERIC DEFAULT 0,
  min_level NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create diamond_subparcels table
CREATE TABLE public.diamond_subparcels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parcel_id UUID REFERENCES diamond_parcels(id) ON DELETE CASCADE,
  sub_code TEXT,
  carat NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create diamond_movements table
CREATE TABLE public.diamond_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parcel_id UUID REFERENCES diamond_parcels(id) ON DELETE CASCADE,
  subparcel_id UUID REFERENCES diamond_subparcels(id),
  direction TEXT CHECK (direction IN ('add', 'reduce')),
  amount NUMERIC,
  reason TEXT,
  related_order UUID REFERENCES orders(id),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create shipping_entries table
CREATE TABLE public.shipping_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  item_id UUID REFERENCES order_items(id),
  type TEXT CHECK (type IN ('invoice', 'appraisal', 'label')),
  file_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create audit_log table
CREATE TABLE public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  entity TEXT,
  entity_id UUID,
  action TEXT,
  before JSONB,
  after JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_customers_email ON public.customers(email);
CREATE INDEX idx_orders_customer_id ON public.orders(customer_id);
CREATE INDEX idx_orders_created_at ON public.orders(created_at);
CREATE INDEX idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX idx_order_status_history_order_id ON public.order_status_history(order_id);
CREATE INDEX idx_order_comments_order_id ON public.order_comments(order_id);
CREATE INDEX idx_documents_order_id ON public.documents(order_id);
CREATE INDEX idx_employee_notes_order_id ON public.employee_notes(order_id);
CREATE INDEX idx_diamond_movements_parcel_id ON public.diamond_movements(parcel_id);
CREATE INDEX idx_diamond_movements_created_at ON public.diamond_movements(created_at);
CREATE INDEX idx_shipping_entries_order_id ON public.shipping_entries(order_id);
CREATE INDEX idx_audit_log_entity ON public.audit_log(entity, entity_id);
CREATE INDEX idx_audit_log_created_at ON public.audit_log(created_at);
CREATE INDEX idx_diamond_parcels_code ON public.diamond_parcels(parcel_code);

-- Create storage bucket for documents
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diamond_parcels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diamond_subparcels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diamond_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipping_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user role
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE user_id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins can update any profile" ON public.profiles FOR UPDATE TO authenticated USING (public.get_current_user_role() = 'admin');
CREATE POLICY "Anyone can insert profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- RLS Policies for customers
CREATE POLICY "Authenticated users can view customers" ON public.customers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can create customers" ON public.customers FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update customers" ON public.customers FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Only admins can delete customers" ON public.customers FOR DELETE TO authenticated USING (public.get_current_user_role() = 'admin');

-- RLS Policies for orders
CREATE POLICY "Authenticated users can view orders" ON public.orders FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can create orders" ON public.orders FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update orders" ON public.orders FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Only admins can delete orders" ON public.orders FOR DELETE TO authenticated USING (public.get_current_user_role() = 'admin');

-- RLS Policies for order_items
CREATE POLICY "Authenticated users can view order items" ON public.order_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can create order items" ON public.order_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update order items" ON public.order_items FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Only admins can delete order items" ON public.order_items FOR DELETE TO authenticated USING (public.get_current_user_role() = 'admin');

-- RLS Policies for order_status_history
CREATE POLICY "Authenticated users can view status history" ON public.order_status_history FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can create status history" ON public.order_status_history FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());
CREATE POLICY "Only admins can delete status history" ON public.order_status_history FOR DELETE TO authenticated USING (public.get_current_user_role() = 'admin');

-- RLS Policies for order_costs
CREATE POLICY "Authenticated users can view order costs" ON public.order_costs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage order costs" ON public.order_costs FOR ALL TO authenticated USING (true);

-- RLS Policies for order_comments
CREATE POLICY "Authenticated users can view comments" ON public.order_comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can create comments" ON public.order_comments FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());
CREATE POLICY "Users can update their own comments" ON public.order_comments FOR UPDATE TO authenticated USING (created_by = auth.uid());
CREATE POLICY "Only admins can delete comments" ON public.order_comments FOR DELETE TO authenticated USING (public.get_current_user_role() = 'admin');

-- RLS Policies for documents
CREATE POLICY "Authenticated users can view documents" ON public.documents FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can create documents" ON public.documents FOR INSERT TO authenticated WITH CHECK (uploaded_by = auth.uid());
CREATE POLICY "Users can update their own documents" ON public.documents FOR UPDATE TO authenticated USING (uploaded_by = auth.uid());
CREATE POLICY "Only admins can delete documents" ON public.documents FOR DELETE TO authenticated USING (public.get_current_user_role() = 'admin');

-- RLS Policies for employee_notes
CREATE POLICY "Authenticated users can view employee notes" ON public.employee_notes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can create employee notes" ON public.employee_notes FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());
CREATE POLICY "Users can update their own notes" ON public.employee_notes FOR UPDATE TO authenticated USING (created_by = auth.uid());
CREATE POLICY "Only admins can delete employee notes" ON public.employee_notes FOR DELETE TO authenticated USING (public.get_current_user_role() = 'admin');

-- RLS Policies for diamond_parcels
CREATE POLICY "Authenticated users can view diamond parcels" ON public.diamond_parcels FOR SELECT TO authenticated USING (true);
CREATE POLICY "Only admins can manage diamond parcels" ON public.diamond_parcels FOR ALL TO authenticated USING (public.get_current_user_role() = 'admin');

-- RLS Policies for diamond_subparcels
CREATE POLICY "Authenticated users can view diamond subparcels" ON public.diamond_subparcels FOR SELECT TO authenticated USING (true);
CREATE POLICY "Only admins can manage diamond subparcels" ON public.diamond_subparcels FOR ALL TO authenticated USING (public.get_current_user_role() = 'admin');

-- RLS Policies for diamond_movements
CREATE POLICY "Authenticated users can view diamond movements" ON public.diamond_movements FOR SELECT TO authenticated USING (true);
CREATE POLICY "Only admins can create diamond movements" ON public.diamond_movements FOR INSERT TO authenticated WITH CHECK (public.get_current_user_role() = 'admin' AND created_by = auth.uid());
CREATE POLICY "Only admins can manage diamond movements" ON public.diamond_movements FOR ALL TO authenticated USING (public.get_current_user_role() = 'admin');

-- RLS Policies for shipping_entries
CREATE POLICY "Authenticated users can view shipping entries" ON public.shipping_entries FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can create shipping entries" ON public.shipping_entries FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update shipping entries" ON public.shipping_entries FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Only admins can delete shipping entries" ON public.shipping_entries FOR DELETE TO authenticated USING (public.get_current_user_role() = 'admin');

-- RLS Policies for audit_log
CREATE POLICY "Only admins can view audit log" ON public.audit_log FOR SELECT TO authenticated USING (public.get_current_user_role() = 'admin');
CREATE POLICY "System can create audit entries" ON public.audit_log FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- Storage policies for documents bucket
CREATE POLICY "Authenticated users can view documents" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'documents');
CREATE POLICY "Authenticated users can upload documents" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can update their own documents" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Only admins can delete documents" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'documents' AND public.get_current_user_role() = 'admin');

-- Trigger function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to order_costs
CREATE TRIGGER update_order_costs_updated_at
  BEFORE UPDATE ON public.order_costs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Seed data: Create sample users in profiles (assuming auth.users exist)
-- Note: You'll need to create actual users through Supabase Auth first
INSERT INTO public.profiles (user_id, role) VALUES 
  ('00000000-0000-0000-0000-000000000001'::uuid, 'admin'),
  ('00000000-0000-0000-0000-000000000002'::uuid, 'employee')
ON CONFLICT (user_id) DO NOTHING;

-- Seed customers
INSERT INTO public.customers (name, email, phone, billing_addr, shipping_addr) VALUES
  ('John Smith', 'john@example.com', '+1-555-0101', '{"street":"123 Main St","city":"New York","state":"NY","zip":"10001"}', '{"street":"123 Main St","city":"New York","state":"NY","zip":"10001"}'),
  ('Jane Doe', 'jane@example.com', '+1-555-0102', '{"street":"456 Oak Ave","city":"Los Angeles","state":"CA","zip":"90210"}', '{"street":"456 Oak Ave","city":"Los Angeles","state":"CA","zip":"90210"}'),
  ('Bob Johnson', 'bob@example.com', '+1-555-0103', '{"street":"789 Pine Rd","city":"Chicago","state":"IL","zip":"60601"}', '{"street":"789 Pine Rd","city":"Chicago","state":"IL","zip":"60601"}'),
  ('Alice Brown', 'alice@example.com', '+1-555-0104', '{"street":"321 Elm St","city":"Houston","state":"TX","zip":"77001"}', '{"street":"321 Elm St","city":"Houston","state":"TX","zip":"77001"}'),
  ('Charlie Wilson', 'charlie@example.com', '+1-555-0105', '{"street":"654 Maple Dr","city":"Phoenix","state":"AZ","zip":"85001"}', '{"street":"654 Maple Dr","city":"Phoenix","state":"AZ","zip":"85001"}'),
  ('Diana Davis', 'diana@example.com', '+1-555-0106', '{"street":"987 Cedar Ln","city":"Philadelphia","state":"PA","zip":"19101"}', '{"street":"987 Cedar Ln","city":"Philadelphia","state":"PA","zip":"19101"}'),
  ('Edward Miller', 'edward@example.com', '+1-555-0107', '{"street":"147 Birch Ct","city":"San Antonio","state":"TX","zip":"78201"}', '{"street":"147 Birch Ct","city":"San Antonio","state":"TX","zip":"78201"}'),
  ('Fiona Garcia', 'fiona@example.com', '+1-555-0108', '{"street":"258 Spruce Ave","city":"San Diego","state":"CA","zip":"92101"}', '{"street":"258 Spruce Ave","city":"San Diego","state":"CA","zip":"92101"}'),
  ('George Rodriguez', 'george@example.com', '+1-555-0109', '{"street":"369 Willow St","city":"Dallas","state":"TX","zip":"75201"}', '{"street":"369 Willow St","city":"Dallas","state":"TX","zip":"75201"}'),
  ('Helen Martinez', 'helen@example.com', '+1-555-0110', '{"street":"741 Ash Blvd","city":"San Jose","state":"CA","zip":"95101"}', '{"street":"741 Ash Blvd","city":"San Jose","state":"CA","zip":"95101"}');

-- Seed orders
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
LIMIT 10;

-- Seed order items (2-3 items per order)
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
  'Custom engagement ring with diamond setting',
  (RANDOM() * 2000 + 100)::numeric(10,2),
  1
FROM public.orders o,
     generate_series(1, 2 + (RANDOM() * 2)::int) as s;

-- Seed order costs
INSERT INTO public.order_costs (order_id, casting, diamond, labor)
SELECT 
  id,
  (RANDOM() * 200 + 50)::numeric(10,2),
  (RANDOM() * 1000 + 100)::numeric(10,2),
  (RANDOM() * 300 + 100)::numeric(10,2)
FROM public.orders;

-- Seed order status history
INSERT INTO public.order_status_history (order_id, status, comment, created_by)
SELECT 
  o.id,
  o.current_status,
  'Status updated to ' || o.current_status,
  '00000000-0000-0000-0000-000000000001'::uuid
FROM public.orders o;

-- Seed order comments
INSERT INTO public.order_comments (order_id, content, is_important, created_by)
SELECT 
  o.id,
  CASE (RANDOM() * 3)::int
    WHEN 0 THEN 'Customer requested rush delivery'
    WHEN 1 THEN 'Special packaging requirements'
    ELSE 'Follow up needed on diamond selection'
  END,
  RANDOM() > 0.8,
  '00000000-0000-0000-0000-000000000002'::uuid
FROM public.orders o
WHERE RANDOM() > 0.5;

-- Seed diamond parcels
INSERT INTO public.diamond_parcels (parcel_code, name, shape, color, clarity, carat_total, min_level) VALUES
  ('DP-001', 'Round Brilliant Mix', 'Round', 'G-H', 'VS1-VS2', 10.5, 1.0),
  ('DP-002', 'Princess Cut Collection', 'Princess', 'F-G', 'SI1-SI2', 8.2, 0.5),
  ('DP-003', 'Emerald Selection', 'Emerald', 'H-I', 'VS2-SI1', 6.8, 0.3),
  ('DP-004', 'Oval Premium', 'Oval', 'E-F', 'VVS2-VS1', 12.3, 0.8),
  ('DP-005', 'Cushion Vintage', 'Cushion', 'G-H', 'SI1-SI2', 9.7, 0.4);

-- Seed diamond subparcels
INSERT INTO public.diamond_subparcels (parcel_id, sub_code, carat)
SELECT 
  dp.id,
  dp.parcel_code || '-' || LPAD(s::text, 2, '0'),
  (RANDOM() * 2 + 0.3)::numeric(4,2)
FROM public.diamond_parcels dp,
     generate_series(1, 3 + (RANDOM() * 3)::int) as s;

-- Seed diamond movements (some adds and reduces to create realistic inventory)
INSERT INTO public.diamond_movements (parcel_id, subparcel_id, direction, amount, reason, created_by)
SELECT 
  ds.parcel_id,
  ds.id,
  'add',
  ds.carat,
  'Initial inventory',
  '00000000-0000-0000-0000-000000000001'::uuid
FROM public.diamond_subparcels ds;

-- Add some reductions
INSERT INTO public.diamond_movements (parcel_id, subparcel_id, direction, amount, reason, related_order, created_by)
SELECT 
  ds.parcel_id,
  ds.id,
  'reduce',
  (ds.carat * 0.3)::numeric(4,2),
  'Used in order',
  o.id,
  '00000000-0000-0000-0000-000000000002'::uuid
FROM public.diamond_subparcels ds
CROSS JOIN (SELECT id FROM public.orders ORDER BY RANDOM() LIMIT 1) o
WHERE RANDOM() > 0.6;

-- Seed some documents
INSERT INTO public.documents (order_id, type, file_url, filename, size, content_type, uploaded_by)
SELECT 
  o.id,
  CASE (RANDOM() * 4)::int
    WHEN 0 THEN 'invoice'
    WHEN 1 THEN 'appraisal'
    WHEN 2 THEN 'label'
    ELSE '3d'
  END,
  '/documents/' || gen_random_uuid() || '.pdf',
  'document_' || LPAD((RANDOM() * 9999)::int::text, 4, '0') || '.pdf',
  (RANDOM() * 1000000 + 50000)::int,
  'application/pdf',
  '00000000-0000-0000-0000-000000000001'::uuid
FROM public.orders o
WHERE RANDOM() > 0.3;

-- Seed shipping entries
INSERT INTO public.shipping_entries (order_id, item_id, type, file_url)
SELECT 
  oi.order_id,
  oi.id,
  'label',
  '/shipping/' || gen_random_uuid() || '.pdf'
FROM public.order_items oi
WHERE RANDOM() > 0.7;