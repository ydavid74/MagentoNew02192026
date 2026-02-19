-- Comprehensive fix for diamond_history RLS policies
-- This ensures that authenticated users can create, read, update, and delete diamond history entries

-- Drop all existing policies for diamond_history
DROP POLICY IF EXISTS "Users can view diamond history" ON public.diamond_history;
DROP POLICY IF EXISTS "Admins can insert diamond history" ON public.diamond_history;
DROP POLICY IF EXISTS "Admins can update diamond history" ON public.diamond_history;
DROP POLICY IF EXISTS "Admins can delete diamond history" ON public.diamond_history;
DROP POLICY IF EXISTS "Authenticated users can insert diamond history" ON public.diamond_history;
DROP POLICY IF EXISTS "Authenticated users can update diamond history" ON public.diamond_history;
DROP POLICY IF EXISTS "Authenticated users can delete diamond history" ON public.diamond_history;

-- Create comprehensive policies for diamond_history
-- Allow authenticated users to view all diamond history entries
CREATE POLICY "Authenticated users can view diamond history" ON public.diamond_history
    FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

-- Allow authenticated users to insert diamond history entries
CREATE POLICY "Authenticated users can insert diamond history" ON public.diamond_history
    FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

-- Allow authenticated users to update diamond history entries
CREATE POLICY "Authenticated users can update diamond history" ON public.diamond_history
    FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL);

-- Allow authenticated users to delete diamond history entries
CREATE POLICY "Authenticated users can delete diamond history" ON public.diamond_history
    FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- Ensure RLS is enabled
ALTER TABLE public.diamond_history ENABLE ROW LEVEL SECURITY;
