-- Fix broken RLS INSERT policies for address tables
-- Problem: INSERT policies had circular reference - checked for existing addresses
-- created by the user, but no addresses exist yet on first insert.
-- Fix: Allow INSERT if user is admin OR is authenticated with a profile.

-- Drop broken billing address INSERT policy
DROP POLICY IF EXISTS "Users can insert billing addresses for accessible orders" ON public.order_billing_address;

-- Create fixed billing address INSERT policy
CREATE POLICY "Users can insert billing addresses for accessible orders" ON public.order_billing_address
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.user_id = auth.uid()
        )
    );

-- Drop broken shipping address INSERT policy
DROP POLICY IF EXISTS "Users can insert shipping addresses for accessible orders" ON public.order_shipping_address;

-- Create fixed shipping address INSERT policy
CREATE POLICY "Users can insert shipping addresses for accessible orders" ON public.order_shipping_address
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.user_id = auth.uid()
        )
    );
