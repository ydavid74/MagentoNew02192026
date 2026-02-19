-- Create separate address tables for better data structure
-- Drop existing JSONB columns and create proper tables

-- Create order_billing_address table
CREATE TABLE IF NOT EXISTS public.order_billing_address (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    company TEXT,
    street1 TEXT NOT NULL,
    street2 TEXT,
    city TEXT NOT NULL,
    region TEXT NOT NULL,
    postcode TEXT NOT NULL,
    country TEXT NOT NULL DEFAULT 'USA',
    phone TEXT,
    email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create order_shipping_address table
CREATE TABLE IF NOT EXISTS public.order_shipping_address (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    company TEXT,
    street1 TEXT NOT NULL,
    street2 TEXT,
    city TEXT NOT NULL,
    region TEXT NOT NULL,
    postcode TEXT NOT NULL,
    country TEXT NOT NULL DEFAULT 'USA',
    phone TEXT,
    email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_order_billing_address_order_id ON public.order_billing_address(order_id);
CREATE INDEX IF NOT EXISTS idx_order_shipping_address_order_id ON public.order_shipping_address(order_id);

-- Add comments for documentation
COMMENT ON TABLE public.order_billing_address IS 'Billing address information for orders';
COMMENT ON TABLE public.order_shipping_address IS 'Shipping address information for orders';

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_order_billing_address_updated_at 
    BEFORE UPDATE ON public.order_billing_address 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_order_shipping_address_updated_at 
    BEFORE UPDATE ON public.order_shipping_address 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
