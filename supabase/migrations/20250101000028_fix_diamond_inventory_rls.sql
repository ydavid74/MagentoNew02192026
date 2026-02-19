-- Fix RLS policies for diamond_inventory table to allow authenticated users to update records
-- This is needed for the inventory deduction and restoration functionality

-- Drop the existing restrictive policies
DROP POLICY IF EXISTS "Admins can update diamond inventory" ON public.diamond_inventory;
DROP POLICY IF EXISTS "Admins can insert diamond inventory" ON public.diamond_inventory;
DROP POLICY IF EXISTS "Admins can delete diamond inventory" ON public.diamond_inventory;

-- Create new policies that allow authenticated users to manage inventory
CREATE POLICY "Authenticated users can update diamond inventory" ON public.diamond_inventory
    FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert diamond inventory" ON public.diamond_inventory
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete diamond inventory" ON public.diamond_inventory
    FOR DELETE USING (auth.uid() IS NOT NULL);
