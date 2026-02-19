-- Create order_casting table
CREATE TABLE IF NOT EXISTS public.order_casting (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  supplier TEXT NOT NULL,
  date_added TIMESTAMP WITH TIME ZONE DEFAULT now(),
  metal_type TEXT NOT NULL,
  quantity TEXT NOT NULL,
  weight DECIMAL(10,2) NOT NULL,
  weight_unit TEXT NOT NULL DEFAULT 'g',
  price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_order_casting_order_id ON public.order_casting(order_id);
CREATE INDEX IF NOT EXISTS idx_order_casting_supplier ON public.order_casting(supplier);
CREATE INDEX IF NOT EXISTS idx_order_casting_metal_type ON public.order_casting(metal_type);
CREATE INDEX IF NOT EXISTS idx_order_casting_date_added ON public.order_casting(date_added);

-- Add comments to explain the table purpose
COMMENT ON TABLE public.order_casting IS 'Casting materials and inventory for orders';
COMMENT ON COLUMN public.order_casting.order_id IS 'Reference to the order this casting item belongs to';
COMMENT ON COLUMN public.order_casting.supplier IS 'Supplier or vendor name';
COMMENT ON COLUMN public.order_casting.date_added IS 'When the casting item was added';
COMMENT ON COLUMN public.order_casting.metal_type IS 'Type of metal (e.g., 14K Gold, Platinum)';
COMMENT ON COLUMN public.order_casting.quantity IS 'Quantity description (e.g., 1 piece, 2 units)';
COMMENT ON COLUMN public.order_casting.weight IS 'Weight of the casting material';
COMMENT ON COLUMN public.order_casting.weight_unit IS 'Unit of weight (g, dwt, oz)';
COMMENT ON COLUMN public.order_casting.price IS 'Price of the casting material';

-- Enable Row Level Security (RLS)
ALTER TABLE public.order_casting ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Note: These are simplified policies that allow all authenticated users to access casting items
-- You can customize these policies based on your specific access control requirements

-- Policy for selecting casting items - allow all authenticated users to view
CREATE POLICY "Allow authenticated users to view casting items" ON public.order_casting
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Policy for inserting casting items - allow authenticated users to insert
CREATE POLICY "Allow authenticated users to insert casting items" ON public.order_casting
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Policy for updating casting items - allow all authenticated users to update
CREATE POLICY "Allow authenticated users to update casting items" ON public.order_casting
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Policy for deleting casting items - allow all authenticated users to delete
CREATE POLICY "Allow authenticated users to delete casting items" ON public.order_casting
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at column
CREATE TRIGGER update_order_casting_updated_at
  BEFORE UPDATE ON public.order_casting
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
