-- Add customer_id field to customers table
-- This field will store a human-readable customer identifier

ALTER TABLE public.customers 
ADD COLUMN IF NOT EXISTS customer_id VARCHAR(50) UNIQUE;

-- Create an index on customer_id for better performance
CREATE INDEX IF NOT EXISTS idx_customers_customer_id ON public.customers(customer_id);

-- Add a comment to explain the field
COMMENT ON COLUMN public.customers.customer_id IS 'Human-readable customer identifier (e.g., CUST-001, CUST-002)';
