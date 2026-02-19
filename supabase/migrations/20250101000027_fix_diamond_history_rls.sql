-- Fix RLS policies for diamond_history table to allow authenticated users to insert records
-- This is needed for the inventory movement logging functionality

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Admins can insert diamond history" ON public.diamond_history;

-- Create a new policy that allows authenticated users to insert records
CREATE POLICY "Authenticated users can insert diamond history" ON public.diamond_history
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Also update the update and delete policies to be less restrictive
DROP POLICY IF EXISTS "Admins can update diamond history" ON public.diamond_history;
DROP POLICY IF EXISTS "Admins can delete diamond history" ON public.diamond_history;

CREATE POLICY "Authenticated users can update diamond history" ON public.diamond_history
    FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete diamond history" ON public.diamond_history
    FOR DELETE USING (auth.uid() IS NOT NULL);
