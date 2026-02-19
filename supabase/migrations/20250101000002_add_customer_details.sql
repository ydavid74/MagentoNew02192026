-- Add customer details and address fields to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS customization_notes TEXT,
ADD COLUMN IF NOT EXISTS previous_order_id UUID REFERENCES public.orders(id),
ADD COLUMN IF NOT EXISTS how_did_you_hear TEXT;

-- Enhance customers table with additional fields
ALTER TABLE public.customers 
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT,
ADD COLUMN IF NOT EXISTS company TEXT,
ADD COLUMN IF NOT EXISTS tax_id TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Create a more structured address format
-- Update existing billing_addr and shipping_addr to use consistent structure
-- The JSONB structure will be:
-- {
--   "first_name": "John",
--   "last_name": "Doe", 
--   "company": "Company Name",
--   "street1": "123 Main St",
--   "street2": "Apt 4B",
--   "city": "New York",
--   "region": "NY",
--   "postcode": "10001",
--   "country": "USA",
--   "phone": "+1-555-123-4567",
--   "email": "john@example.com"
-- }

-- Add comments to document the expected structure
COMMENT ON COLUMN public.customers.billing_addr IS 'JSONB object with address fields: first_name, last_name, company, street1, street2, city, region, postcode, country, phone, email';
COMMENT ON COLUMN public.customers.shipping_addr IS 'JSONB object with address fields: first_name, last_name, company, street1, street2, city, region, postcode, country, phone, email';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_date ON public.orders(order_date);
CREATE INDEX IF NOT EXISTS idx_orders_current_status ON public.orders(current_status);
CREATE INDEX IF NOT EXISTS idx_customers_email ON public.customers(email);
