-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  role TEXT CHECK (role IN ('admin', 'employee')) DEFAULT 'employee',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create customers table
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  email TEXT UNIQUE,
  phone TEXT,
  billing_addr JSONB,
  shipping_addr JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create orders table
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES public.customers(id),
  purchase_from TEXT,
  order_date DATE,
  total_amount NUMERIC DEFAULT 0,
  current_status TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create order_items table
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  sku TEXT,
  size TEXT,
  metal_type TEXT,
  details TEXT,
  price NUMERIC DEFAULT 0,
  qty INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create order_status_history table
CREATE TABLE IF NOT EXISTS public.order_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  status TEXT,
  comment TEXT,
  created_by UUID REFERENCES auth.users,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create order_costs table
CREATE TABLE IF NOT EXISTS public.order_costs (
  order_id UUID PRIMARY KEY REFERENCES public.orders(id) ON DELETE CASCADE,
  casting NUMERIC DEFAULT 0,
  diamond NUMERIC DEFAULT 0,
  labor NUMERIC DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create order_comments table
CREATE TABLE IF NOT EXISTS public.order_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  content TEXT,
  is_important BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create documents table
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  type TEXT CHECK (type IN ('invoice', 'appraisal', 'label', '3d', 'other')),
  file_url TEXT,
  filename TEXT,
  size INTEGER,
  content_type TEXT,
  uploaded_by UUID REFERENCES auth.users,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create employee_notes table
CREATE TABLE IF NOT EXISTS public.employee_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  content TEXT,
  created_by UUID REFERENCES auth.users,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create diamond_parcels table
CREATE TABLE IF NOT EXISTS public.diamond_parcels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parcel_code TEXT UNIQUE,
  name TEXT,
  shape TEXT,
  color TEXT,
  clarity TEXT,
  carat_total NUMERIC DEFAULT 0,
  min_level NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create diamond_subparcels table
CREATE TABLE IF NOT EXISTS public.diamond_subparcels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parcel_id UUID REFERENCES public.diamond_parcels(id) ON DELETE CASCADE,
  sub_code TEXT,
  carat NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create diamond_movements table
CREATE TABLE IF NOT EXISTS public.diamond_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parcel_id UUID REFERENCES public.diamond_parcels(id) ON DELETE CASCADE,
  subparcel_id UUID REFERENCES public.diamond_subparcels(id),
  direction TEXT CHECK (direction IN ('add', 'reduce')),
  amount NUMERIC,
  reason TEXT,
  related_order UUID REFERENCES public.orders(id),
  created_by UUID REFERENCES auth.users,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create shipping_entries table
CREATE TABLE IF NOT EXISTS public.shipping_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  item_id UUID REFERENCES public.order_items(id),
  type TEXT CHECK (type IN ('invoice', 'appraisal', 'label')),
  file_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create audit_log table
CREATE TABLE IF NOT EXISTS public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users,
  entity TEXT,
  entity_id UUID,
  action TEXT,
  before JSONB,
  after JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_status_history_order_id ON public.order_status_history(order_id);
CREATE INDEX IF NOT EXISTS idx_order_status_history_created_at ON public.order_status_history(created_at);
CREATE INDEX IF NOT EXISTS idx_order_comments_order_id ON public.order_comments(order_id);
CREATE INDEX IF NOT EXISTS idx_documents_order_id ON public.documents(order_id);
CREATE INDEX IF NOT EXISTS idx_employee_notes_order_id ON public.employee_notes(order_id);
CREATE INDEX IF NOT EXISTS idx_diamond_parcels_parcel_code ON public.diamond_parcels(parcel_code);
CREATE INDEX IF NOT EXISTS idx_diamond_subparcels_parcel_id ON public.diamond_subparcels(parcel_id);
CREATE INDEX IF NOT EXISTS idx_diamond_movements_parcel_id ON public.diamond_movements(parcel_id);
CREATE INDEX IF NOT EXISTS idx_diamond_movements_created_at ON public.diamond_movements(created_at);
CREATE INDEX IF NOT EXISTS idx_shipping_entries_order_id ON public.shipping_entries(order_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity_id ON public.audit_log(entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON public.audit_log(created_at);

-- Create storage bucket for documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- Create function to get current user role (for RLS policies)
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE user_id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for order_costs updated_at
DROP TRIGGER IF EXISTS update_order_costs_updated_at ON public.order_costs;
CREATE TRIGGER update_order_costs_updated_at
  BEFORE UPDATE ON public.order_costs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

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

-- RLS Policies for profiles
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
CREATE POLICY "Users can view all profiles" ON public.profiles
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
CREATE POLICY "Admins can update any profile" ON public.profiles
  FOR UPDATE USING (get_current_user_role() = 'admin');

-- RLS Policies for customers
DROP POLICY IF EXISTS "Authenticated users can view customers" ON public.customers;
CREATE POLICY "Authenticated users can view customers" ON public.customers
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can create customers" ON public.customers;
CREATE POLICY "Authenticated users can create customers" ON public.customers
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update customers" ON public.customers;
CREATE POLICY "Authenticated users can update customers" ON public.customers
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Only admins can delete customers" ON public.customers;
CREATE POLICY "Only admins can delete customers" ON public.customers
  FOR DELETE USING (get_current_user_role() = 'admin');

-- RLS Policies for orders
DROP POLICY IF EXISTS "Authenticated users can view orders" ON public.orders;
CREATE POLICY "Authenticated users can view orders" ON public.orders
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can create orders" ON public.orders;
CREATE POLICY "Authenticated users can create orders" ON public.orders
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update orders" ON public.orders;
CREATE POLICY "Authenticated users can update orders" ON public.orders
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Only admins can delete orders" ON public.orders;
CREATE POLICY "Only admins can delete orders" ON public.orders
  FOR DELETE USING (get_current_user_role() = 'admin');

-- RLS Policies for order_items
DROP POLICY IF EXISTS "Authenticated users can view order items" ON public.order_items;
CREATE POLICY "Authenticated users can view order items" ON public.order_items
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can create order items" ON public.order_items;
CREATE POLICY "Authenticated users can create order items" ON public.order_items
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update order items" ON public.order_items;
CREATE POLICY "Authenticated users can update order items" ON public.order_items
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Only admins can delete order items" ON public.order_items;
CREATE POLICY "Only admins can delete order items" ON public.order_items
  FOR DELETE USING (get_current_user_role() = 'admin');

-- RLS Policies for order_status_history
DROP POLICY IF EXISTS "Authenticated users can view status history" ON public.order_status_history;
CREATE POLICY "Authenticated users can view status history" ON public.order_status_history
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can create status history" ON public.order_status_history;
CREATE POLICY "Authenticated users can create status history" ON public.order_status_history
  FOR INSERT WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "Only admins can delete status history" ON public.order_status_history;
CREATE POLICY "Only admins can delete status history" ON public.order_status_history
  FOR DELETE USING (get_current_user_role() = 'admin');

-- RLS Policies for order_costs
DROP POLICY IF EXISTS "Authenticated users can view order costs" ON public.order_costs;
CREATE POLICY "Authenticated users can view order costs" ON public.order_costs
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can manage order costs" ON public.order_costs;
CREATE POLICY "Authenticated users can manage order costs" ON public.order_costs
  FOR ALL USING (true);

-- RLS Policies for order_comments
DROP POLICY IF EXISTS "Authenticated users can view comments" ON public.order_comments;
CREATE POLICY "Authenticated users can view comments" ON public.order_comments
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can create comments" ON public.order_comments;
CREATE POLICY "Authenticated users can create comments" ON public.order_comments
  FOR INSERT WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "Users can update their own comments" ON public.order_comments;
CREATE POLICY "Users can update their own comments" ON public.order_comments
  FOR UPDATE USING (created_by = auth.uid());

DROP POLICY IF EXISTS "Only admins can delete comments" ON public.order_comments;
CREATE POLICY "Only admins can delete comments" ON public.order_comments
  FOR DELETE USING (get_current_user_role() = 'admin');

-- RLS Policies for documents
DROP POLICY IF EXISTS "Authenticated users can view documents" ON public.documents;
CREATE POLICY "Authenticated users can view documents" ON public.documents
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can create documents" ON public.documents;
CREATE POLICY "Authenticated users can create documents" ON public.documents
  FOR INSERT WITH CHECK (uploaded_by = auth.uid());

DROP POLICY IF EXISTS "Users can update their own documents" ON public.documents;
CREATE POLICY "Users can update their own documents" ON public.documents
  FOR UPDATE USING (uploaded_by = auth.uid());

DROP POLICY IF EXISTS "Only admins can delete documents" ON public.documents;
CREATE POLICY "Only admins can delete documents" ON public.documents
  FOR DELETE USING (get_current_user_role() = 'admin');

-- RLS Policies for employee_notes
DROP POLICY IF EXISTS "Authenticated users can view employee notes" ON public.employee_notes;
CREATE POLICY "Authenticated users can view employee notes" ON public.employee_notes
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can create employee notes" ON public.employee_notes;
CREATE POLICY "Authenticated users can create employee notes" ON public.employee_notes
  FOR INSERT WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "Users can update their own notes" ON public.employee_notes;
CREATE POLICY "Users can update their own notes" ON public.employee_notes
  FOR UPDATE USING (created_by = auth.uid());

DROP POLICY IF EXISTS "Only admins can delete employee notes" ON public.employee_notes;
CREATE POLICY "Only admins can delete employee notes" ON public.employee_notes
  FOR DELETE USING (get_current_user_role() = 'admin');

-- RLS Policies for diamond_parcels
DROP POLICY IF EXISTS "Authenticated users can view diamond parcels" ON public.diamond_parcels;
CREATE POLICY "Authenticated users can view diamond parcels" ON public.diamond_parcels
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Only admins can manage diamond parcels" ON public.diamond_parcels;
CREATE POLICY "Only admins can manage diamond parcels" ON public.diamond_parcels
  FOR ALL USING (get_current_user_role() = 'admin');

-- RLS Policies for diamond_subparcels
DROP POLICY IF EXISTS "Authenticated users can view diamond subparcels" ON public.diamond_subparcels;
CREATE POLICY "Authenticated users can view diamond subparcels" ON public.diamond_subparcels
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Only admins can manage diamond subparcels" ON public.diamond_subparcels;
CREATE POLICY "Only admins can manage diamond subparcels" ON public.diamond_subparcels
  FOR ALL USING (get_current_user_role() = 'admin');

-- RLS Policies for diamond_movements
DROP POLICY IF EXISTS "Authenticated users can view diamond movements" ON public.diamond_movements;
CREATE POLICY "Authenticated users can view diamond movements" ON public.diamond_movements
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Only admins can create diamond movements" ON public.diamond_movements;
CREATE POLICY "Only admins can create diamond movements" ON public.diamond_movements
  FOR INSERT WITH CHECK (get_current_user_role() = 'admin' AND created_by = auth.uid());

DROP POLICY IF EXISTS "Only admins can manage diamond movements" ON public.diamond_movements;
CREATE POLICY "Only admins can manage diamond movements" ON public.diamond_movements
  FOR ALL USING (get_current_user_role() = 'admin');

-- RLS Policies for shipping_entries
DROP POLICY IF EXISTS "Authenticated users can view shipping entries" ON public.shipping_entries;
CREATE POLICY "Authenticated users can view shipping entries" ON public.shipping_entries
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can create shipping entries" ON public.shipping_entries;
CREATE POLICY "Authenticated users can create shipping entries" ON public.shipping_entries
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update shipping entries" ON public.shipping_entries;
CREATE POLICY "Authenticated users can update shipping entries" ON public.shipping_entries
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Only admins can delete shipping entries" ON public.shipping_entries;
CREATE POLICY "Only admins can delete shipping entries" ON public.shipping_entries
  FOR DELETE USING (get_current_user_role() = 'admin');

-- RLS Policies for audit_log
DROP POLICY IF EXISTS "Only admins can view audit log" ON public.audit_log;
CREATE POLICY "Only admins can view audit log" ON public.audit_log
  FOR SELECT USING (get_current_user_role() = 'admin');

DROP POLICY IF EXISTS "System can create audit entries" ON public.audit_log;
CREATE POLICY "System can create audit entries" ON public.audit_log
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Storage policies for documents bucket
DROP POLICY IF EXISTS "Users can view their own documents" ON storage.objects;
CREATE POLICY "Users can view their own documents" ON storage.objects
  FOR SELECT USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can upload their own documents" ON storage.objects;
CREATE POLICY "Users can upload their own documents" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can update their own documents" ON storage.objects;
CREATE POLICY "Users can update their own documents" ON storage.objects
  FOR UPDATE USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Admins can delete any document" ON storage.objects;
CREATE POLICY "Admins can delete any document" ON storage.objects
  FOR DELETE USING (bucket_id = 'documents' AND get_current_user_role() = 'admin');

-- Create auto-profile trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, role)
  VALUES (NEW.id, 'employee');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Seed data
-- Insert sample customers
INSERT INTO public.customers (id, name, email, phone, billing_addr, shipping_addr) VALUES
  ('f47ac10b-58cc-4372-a567-0e02b2c3d479', 'John Smith', 'john.smith@email.com', '+1-555-0101', 
   '{"street": "123 Main St", "city": "New York", "state": "NY", "zip": "10001"}',
   '{"street": "123 Main St", "city": "New York", "state": "NY", "zip": "10001"}'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d480', 'Sarah Johnson', 'sarah.johnson@email.com', '+1-555-0102',
   '{"street": "456 Oak Ave", "city": "Los Angeles", "state": "CA", "zip": "90210"}',
   '{"street": "456 Oak Ave", "city": "Los Angeles", "state": "CA", "zip": "90210"}'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d481', 'Michael Brown', 'michael.brown@email.com', '+1-555-0103',
   '{"street": "789 Pine St", "city": "Chicago", "state": "IL", "zip": "60601"}',
   '{"street": "789 Pine St", "city": "Chicago", "state": "IL", "zip": "60601"}'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d482', 'Emily Davis', 'emily.davis@email.com', '+1-555-0104',
   '{"street": "321 Elm Dr", "city": "Miami", "state": "FL", "zip": "33101"}',
   '{"street": "321 Elm Dr", "city": "Miami", "state": "FL", "zip": "33101"}'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d483', 'David Wilson', 'david.wilson@email.com', '+1-555-0105',
   '{"street": "654 Maple Ln", "city": "Seattle", "state": "WA", "zip": "98101"}',
   '{"street": "654 Maple Ln", "city": "Seattle", "state": "WA", "zip": "98101"}'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d484', 'Lisa Anderson', 'lisa.anderson@email.com', '+1-555-0106',
   '{"street": "987 Cedar St", "city": "Denver", "state": "CO", "zip": "80201"}',
   '{"street": "987 Cedar St", "city": "Denver", "state": "CO", "zip": "80201"}'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d485', 'Robert Taylor', 'robert.taylor@email.com', '+1-555-0107',
   '{"street": "147 Birch Ave", "city": "Boston", "state": "MA", "zip": "02101"}',
   '{"street": "147 Birch Ave", "city": "Boston", "state": "MA", "zip": "02101"}'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d486', 'Jennifer Martinez', 'jennifer.martinez@email.com', '+1-555-0108',
   '{"street": "258 Spruce Rd", "city": "Phoenix", "state": "AZ", "zip": "85001"}',
   '{"street": "258 Spruce Rd", "city": "Phoenix", "state": "AZ", "zip": "85001"}'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d487', 'Christopher Lee', 'christopher.lee@email.com', '+1-555-0109',
   '{"street": "369 Willow St", "city": "Atlanta", "state": "GA", "zip": "30301"}',
   '{"street": "369 Willow St", "city": "Atlanta", "state": "GA", "zip": "30301"}'),
  ('f47ac10b-58cc-4372-a567-0e02b2c3d488', 'Amanda White', 'amanda.white@email.com', '+1-555-0110',
   '{"street": "741 Poplar Dr", "city": "Dallas", "state": "TX", "zip": "75201"}',
   '{"street": "741 Poplar Dr", "city": "Dallas", "state": "TX", "zip": "75201"}')
ON CONFLICT (id) DO NOTHING;

-- Insert sample orders
INSERT INTO public.orders (id, customer_id, purchase_from, order_date, total_amount, current_status) VALUES
  ('a47ac10b-58cc-4372-a567-0e02b2c3d479', 'f47ac10b-58cc-4372-a567-0e02b2c3d479', 'Online Store', '2024-01-15', 2850.00, 'completed'),
  ('a47ac10b-58cc-4372-a567-0e02b2c3d480', 'f47ac10b-58cc-4372-a567-0e02b2c3d480', 'Showroom', '2024-01-20', 4200.00, 'in_production'),
  ('a47ac10b-58cc-4372-a567-0e02b2c3d481', 'f47ac10b-58cc-4372-a567-0e02b2c3d481', 'Phone Order', '2024-01-25', 1650.00, 'pending'),
  ('a47ac10b-58cc-4372-a567-0e02b2c3d482', 'f47ac10b-58cc-4372-a567-0e02b2c3d482', 'Online Store', '2024-02-01', 3200.00, 'shipped'),
  ('a47ac10b-58cc-4372-a567-0e02b2c3d483', 'f47ac10b-58cc-4372-a567-0e02b2c3d483', 'Showroom', '2024-02-05', 5800.00, 'completed'),
  ('a47ac10b-58cc-4372-a567-0e02b2c3d484', 'f47ac10b-58cc-4372-a567-0e02b2c3d484', 'Online Store', '2024-02-10', 2100.00, 'in_production'),
  ('a47ac10b-58cc-4372-a567-0e02b2c3d485', 'f47ac10b-58cc-4372-a567-0e02b2c3d485', 'Phone Order', '2024-02-15', 3750.00, 'pending'),
  ('a47ac10b-58cc-4372-a567-0e02b2c3d486', 'f47ac10b-58cc-4372-a567-0e02b2c3d486', 'Showroom', '2024-02-20', 4900.00, 'shipped'),
  ('a47ac10b-58cc-4372-a567-0e02b2c3d487', 'f47ac10b-58cc-4372-a567-0e02b2c3d487', 'Online Store', '2024-02-25', 2650.00, 'completed'),
  ('a47ac10b-58cc-4372-a567-0e02b2c3d488', 'f47ac10b-58cc-4372-a567-0e02b2c3d488', 'Phone Order', '2024-03-01', 3300.00, 'in_production')
ON CONFLICT (id) DO NOTHING;

-- Insert sample order items
INSERT INTO public.order_items (order_id, sku, size, metal_type, details, price, qty) VALUES
  ('a47ac10b-58cc-4372-a567-0e02b2c3d479', 'RNG-001', '7', '14K Gold', 'Solitaire engagement ring with 1ct diamond', 2500.00, 1),
  ('a47ac10b-58cc-4372-a567-0e02b2c3d479', 'BND-001', '7', '14K Gold', 'Matching wedding band', 350.00, 1),
  ('a47ac10b-58cc-4372-a567-0e02b2c3d480', 'NCK-001', 'One Size', '18K Gold', 'Diamond tennis necklace', 4200.00, 1),
  ('a47ac10b-58cc-4372-a567-0e02b2c3d481', 'EAR-001', 'One Size', '14K Gold', 'Diamond stud earrings', 1650.00, 1),
  ('a47ac10b-58cc-4372-a567-0e02b2c3d482', 'BRC-001', 'Medium', '18K Gold', 'Diamond bracelet', 3200.00, 1),
  ('a47ac10b-58cc-4372-a567-0e02b2c3d483', 'RNG-002', '6', 'Platinum', 'Three-stone engagement ring', 5800.00, 1),
  ('a47ac10b-58cc-4372-a567-0e02b2c3d484', 'PND-001', 'One Size', '14K Gold', 'Diamond pendant necklace', 2100.00, 1),
  ('a47ac10b-58cc-4372-a567-0e02b2c3d485', 'RNG-003', '8', '18K Gold', 'Vintage style engagement ring', 3750.00, 1),
  ('a47ac10b-58cc-4372-a567-0e02b2c3d486', 'SET-001', '7', '14K Gold', 'Complete bridal set', 4900.00, 1),
  ('a47ac10b-58cc-4372-a567-0e02b2c3d487', 'EAR-002', 'One Size', '18K Gold', 'Diamond hoop earrings', 2650.00, 1),
  ('a47ac10b-58cc-4372-a567-0e02b2c3d488', 'BND-002', '9', 'Platinum', 'Eternity wedding band', 3300.00, 1)
ON CONFLICT DO NOTHING;

-- Insert sample order costs
INSERT INTO public.order_costs (order_id, casting, diamond, labor) VALUES
  ('a47ac10b-58cc-4372-a567-0e02b2c3d479', 150.00, 1200.00, 300.00),
  ('a47ac10b-58cc-4372-a567-0e02b2c3d480', 200.00, 2800.00, 450.00),
  ('a47ac10b-58cc-4372-a567-0e02b2c3d481', 120.00, 800.00, 250.00),
  ('a47ac10b-58cc-4372-a567-0e02b2c3d482', 180.00, 1800.00, 380.00),
  ('a47ac10b-58cc-4372-a567-0e02b2c3d483', 250.00, 3200.00, 550.00),
  ('a47ac10b-58cc-4372-a567-0e02b2c3d484', 140.00, 1100.00, 280.00),
  ('a47ac10b-58cc-4372-a567-0e02b2c3d485', 220.00, 2100.00, 420.00),
  ('a47ac10b-58cc-4372-a567-0e02b2c3d486', 300.00, 2800.00, 650.00),
  ('a47ac10b-58cc-4372-a567-0e02b2c3d487', 160.00, 1500.00, 320.00),
  ('a47ac10b-58cc-4372-a567-0e02b2c3d488', 190.00, 1900.00, 390.00)
ON CONFLICT (order_id) DO NOTHING;

-- Insert sample diamond parcels
INSERT INTO public.diamond_parcels (id, parcel_code, name, shape, color, clarity, carat_total, min_level) VALUES
  ('d47ac10b-58cc-4372-a567-0e02b2c3d479', 'DIA-RD-001', 'Round Brilliant Parcel A', 'Round', 'G-H', 'VS1-VS2', 50.00, 0.25),
  ('d47ac10b-58cc-4372-a567-0e02b2c3d480', 'DIA-PR-001', 'Princess Cut Parcel B', 'Princess', 'F-G', 'VVS2-VS1', 25.00, 0.50),
  ('d47ac10b-58cc-4372-a567-0e02b2c3d481', 'DIA-EM-001', 'Emerald Cut Parcel C', 'Emerald', 'E-F', 'VVS1-VVS2', 15.00, 1.00),
  ('d47ac10b-58cc-4372-a567-0e02b2c3d482', 'DIA-OV-001', 'Oval Parcel D', 'Oval', 'G-H', 'VS1-VS2', 30.00, 0.75),
  ('d47ac10b-58cc-4372-a567-0e02b2c3d483', 'DIA-CU-001', 'Cushion Cut Parcel E', 'Cushion', 'H-I', 'SI1-SI2', 40.00, 0.30)
ON CONFLICT (id) DO NOTHING;

-- Insert sample diamond movements
INSERT INTO public.diamond_movements (parcel_id, direction, amount, reason) VALUES
  ('d47ac10b-58cc-4372-a567-0e02b2c3d479', 'add', 50.00, 'Initial inventory'),
  ('d47ac10b-58cc-4372-a567-0e02b2c3d479', 'reduce', 5.50, 'Used for order production'),
  ('d47ac10b-58cc-4372-a567-0e02b2c3d480', 'add', 25.00, 'Initial inventory'),
  ('d47ac10b-58cc-4372-a567-0e02b2c3d480', 'reduce', 3.25, 'Used for custom order'),
  ('d47ac10b-58cc-4372-a567-0e02b2c3d481', 'add', 15.00, 'Initial inventory'),
  ('d47ac10b-58cc-4372-a567-0e02b2c3d481', 'reduce', 2.00, 'Used for special commission'),
  ('d47ac10b-58cc-4372-a567-0e02b2c3d482', 'add', 30.00, 'Initial inventory'),
  ('d47ac10b-58cc-4372-a567-0e02b2c3d482', 'reduce', 4.75, 'Used for engagement ring'),
  ('d47ac10b-58cc-4372-a567-0e02b2c3d483', 'add', 40.00, 'Initial inventory'),
  ('d47ac10b-58cc-4372-a567-0e02b2c3d483', 'reduce', 6.20, 'Used for tennis bracelet')
ON CONFLICT DO NOTHING;