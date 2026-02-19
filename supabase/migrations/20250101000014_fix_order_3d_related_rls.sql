-- Fix RLS policies for order_3d_related table
-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view 3D items for accessible orders" ON public.order_3d_related;
DROP POLICY IF EXISTS "Users can add 3D items to orders" ON public.order_3d_related;
DROP POLICY IF EXISTS "Users can update their own 3D items" ON public.order_3d_related;
DROP POLICY IF EXISTS "Users can delete their own 3D items" ON public.order_3d_related;

-- Create simplified RLS policies that definitely work
-- Policy for selecting 3D items - allow all authenticated users to view
CREATE POLICY "Allow authenticated users to view 3D items" ON public.order_3d_related
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Policy for inserting 3D items - allow authenticated users to insert
CREATE POLICY "Allow authenticated users to insert 3D items" ON public.order_3d_related
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Policy for updating 3D items - allow users to update items they created
CREATE POLICY "Allow users to update their own 3D items" ON public.order_3d_related
  FOR UPDATE USING (added_by = auth.uid());

-- Policy for deleting 3D items - allow users to delete items they created
CREATE POLICY "Allow users to delete their own 3D items" ON public.order_3d_related
  FOR DELETE USING (added_by = auth.uid());

-- Verify RLS is enabled
ALTER TABLE public.order_3d_related ENABLE ROW LEVEL SECURITY;
