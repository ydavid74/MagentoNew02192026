-- Create order_3d_related table
CREATE TABLE IF NOT EXISTS public.order_3d_related (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  date_added TIMESTAMP WITH TIME ZONE DEFAULT now(),
  added_by UUID REFERENCES auth.users(id),
  image_url TEXT NOT NULL,
  image_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_order_3d_related_order_id ON public.order_3d_related(order_id);
CREATE INDEX IF NOT EXISTS idx_order_3d_related_added_by ON public.order_3d_related(added_by);
CREATE INDEX IF NOT EXISTS idx_order_3d_related_date_added ON public.order_3d_related(date_added);

-- Add comments to explain the table purpose
COMMENT ON TABLE public.order_3d_related IS '3D related files and images for orders';
COMMENT ON COLUMN public.order_3d_related.order_id IS 'Reference to the order this 3D item belongs to';
COMMENT ON COLUMN public.order_3d_related.date_added IS 'When the 3D item was added';
COMMENT ON COLUMN public.order_3d_related.added_by IS 'User who added the 3D item';
COMMENT ON COLUMN public.order_3d_related.image_url IS 'URL to the uploaded 3D file or image';
COMMENT ON COLUMN public.order_3d_related.image_name IS 'Original filename of the uploaded file';

-- Enable Row Level Security (RLS)
ALTER TABLE public.order_3d_related ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Note: These are simplified policies that allow all authenticated users to access 3D items
-- You can customize these policies based on your specific access control requirements
-- For example, you could restrict access based on order ownership, user roles, etc.

-- Policy for selecting 3D items (users can view items for orders they have access to)
CREATE POLICY "Users can view 3D items for accessible orders" ON public.order_3d_related
  FOR SELECT USING (
    -- For now, allow all authenticated users to view 3D items
    -- You can adjust this policy based on your specific access control requirements
    auth.uid() IS NOT NULL
  );

-- Policy for inserting 3D items (users can add items to any order)
CREATE POLICY "Users can add 3D items to orders" ON public.order_3d_related
  FOR INSERT WITH CHECK (
    -- Users must be authenticated
    auth.uid() IS NOT NULL
    -- Users can only add items as themselves
    AND added_by = auth.uid()
  );

-- Policy for updating 3D items (users can update items they added)
CREATE POLICY "Users can update their own 3D items" ON public.order_3d_related
  FOR UPDATE USING (added_by = auth.uid())
  WITH CHECK (added_by = auth.uid());

-- Policy for deleting 3D items (users can delete items they added)
CREATE POLICY "Users can delete their own 3D items" ON public.order_3d_related
  FOR DELETE USING (added_by = auth.uid());

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at column
CREATE TRIGGER update_order_3d_related_updated_at
  BEFORE UPDATE ON public.order_3d_related
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
