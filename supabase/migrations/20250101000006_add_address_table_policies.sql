-- Add RLS policies for address tables
-- Migration: 20250101000006_add_address_table_policies.sql

-- Enable RLS on address tables
ALTER TABLE public.order_billing_address ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_shipping_address ENABLE ROW LEVEL SECURITY;

-- Policy for order_billing_address: Users can only access billing addresses for orders they have access to
CREATE POLICY "Users can view billing addresses for accessible orders" ON public.order_billing_address
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.orders o
            JOIN public.profiles p ON p.user_id = auth.uid()
            WHERE o.id = order_billing_address.order_id
            AND (p.role = 'admin' OR o.customer_id IN (
                SELECT customer_id FROM public.orders 
                WHERE customer_id IN (
                    SELECT customer_id FROM public.orders 
                    WHERE id IN (
                        SELECT order_id FROM public.order_billing_address 
                        WHERE created_by = auth.uid()
                    )
                )
            ))
        )
    );

CREATE POLICY "Users can insert billing addresses for accessible orders" ON public.order_billing_address
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.orders o
            JOIN public.profiles p ON p.user_id = auth.uid()
            WHERE o.id = order_billing_address.order_id
            AND (p.role = 'admin' OR o.customer_id IN (
                SELECT customer_id FROM public.orders 
                WHERE customer_id IN (
                    SELECT customer_id FROM public.orders 
                    WHERE id IN (
                        SELECT order_id FROM public.order_billing_address 
                        WHERE created_by = auth.uid()
                    )
                )
            ))
        )
    );

CREATE POLICY "Users can update billing addresses for accessible orders" ON public.order_billing_address
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.orders o
            JOIN public.profiles p ON p.user_id = auth.uid()
            WHERE o.id = order_billing_address.order_id
            AND (p.role = 'admin' OR o.customer_id IN (
                SELECT customer_id FROM public.orders 
                WHERE id IN (
                    SELECT order_id FROM public.order_billing_address 
                    WHERE created_by = auth.uid()
                )
            ))
        )
    );

CREATE POLICY "Users can delete billing addresses for accessible orders" ON public.order_billing_address
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.orders o
            JOIN public.profiles p ON p.user_id = auth.uid()
            WHERE o.id = order_billing_address.order_id
            AND (p.role = 'admin' OR o.customer_id IN (
                SELECT customer_id FROM public.orders 
                WHERE id IN (
                    SELECT order_id FROM public.order_billing_address 
                    WHERE created_by = auth.uid()
                )
            ))
        )
    );

-- Policy for order_shipping_address: Users can only access shipping addresses for orders they have access to
CREATE POLICY "Users can view shipping addresses for accessible orders" ON public.order_shipping_address
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.orders o
            JOIN public.profiles p ON p.user_id = auth.uid()
            WHERE o.id = order_shipping_address.order_id
            AND (p.role = 'admin' OR o.customer_id IN (
                SELECT customer_id FROM public.orders 
                WHERE customer_id IN (
                    SELECT customer_id FROM public.orders 
                    WHERE id IN (
                        SELECT order_id FROM public.order_shipping_address 
                        WHERE created_by = auth.uid()
                    )
                )
            ))
        )
    );

CREATE POLICY "Users can insert shipping addresses for accessible orders" ON public.order_shipping_address
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.orders o
            JOIN public.profiles p ON p.user_id = auth.uid()
            WHERE o.id = order_shipping_address.order_id
            AND (p.role = 'admin' OR o.customer_id IN (
                SELECT customer_id FROM public.orders 
                WHERE id IN (
                    SELECT order_id FROM public.order_shipping_address 
                    WHERE created_by = auth.uid()
                    AND created_by = auth.uid()
                )
            ))
        )
    );

CREATE POLICY "Users can update shipping addresses for accessible orders" ON public.order_shipping_address
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.orders o
            JOIN public.profiles p ON p.user_id = auth.uid()
            WHERE o.id = order_shipping_address.order_id
            AND (p.role = 'admin' OR o.customer_id IN (
                SELECT customer_id FROM public.orders 
                WHERE id IN (
                    SELECT order_id FROM public.order_shipping_address 
                    WHERE created_by = auth.uid()
                )
            ))
        )
    );

CREATE POLICY "Users can delete shipping addresses for accessible orders" ON public.order_shipping_address
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.orders o
            JOIN public.profiles p ON p.user_id = auth.uid()
            WHERE o.id = order_shipping_address.order_id
            AND (p.role = 'admin' OR o.customer_id IN (
                SELECT customer_id FROM public.orders 
                WHERE id IN (
                    SELECT order_id FROM public.order_shipping_address 
                    WHERE created_by = auth.uid()
                )
            ))
        )
    );

-- Add created_by column to both tables if they don't exist
ALTER TABLE public.order_billing_address ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);
ALTER TABLE public.order_shipping_address ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- Add updated_by column to both tables if they don't exist
ALTER TABLE public.order_billing_address ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);
ALTER TABLE public.order_shipping_address ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);

-- Create triggers to automatically set created_by and updated_by
CREATE OR REPLACE FUNCTION set_created_by()
RETURNS TRIGGER AS $$
BEGIN
    NEW.created_by = auth.uid();
    NEW.updated_by = auth.uid();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION set_updated_by()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_by = auth.uid();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers to both tables
DROP TRIGGER IF EXISTS set_order_billing_address_created_by ON public.order_billing_address;
CREATE TRIGGER set_order_billing_address_created_by
    BEFORE INSERT ON public.order_billing_address
    FOR EACH ROW EXECUTE FUNCTION set_created_by();

DROP TRIGGER IF EXISTS set_order_billing_address_updated_by ON public.order_billing_address;
CREATE TRIGGER set_order_billing_address_updated_by
    BEFORE UPDATE ON public.order_billing_address
    FOR EACH ROW EXECUTE FUNCTION set_updated_by();

DROP TRIGGER IF EXISTS set_order_shipping_address_created_by ON public.order_shipping_address;
CREATE TRIGGER set_order_shipping_address_created_by
    BEFORE INSERT ON public.order_shipping_address
    FOR EACH ROW EXECUTE FUNCTION set_created_by();

DROP TRIGGER IF EXISTS set_order_shipping_address_updated_by ON public.order_shipping_address;
CREATE TRIGGER set_order_shipping_address_updated_by
    BEFORE UPDATE ON public.order_shipping_address
    FOR EACH ROW EXECUTE FUNCTION set_updated_by();
