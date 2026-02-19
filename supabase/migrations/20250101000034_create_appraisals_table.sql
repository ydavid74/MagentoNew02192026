-- Create appraisals table
CREATE TABLE IF NOT EXISTS public.appraisals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  stock_number TEXT NOT NULL,
  type TEXT,
  shape TEXT,
  measurement TEXT,
  color TEXT,
  clarity TEXT,
  polish_symmetry TEXT,
  precious_metal TEXT,
  description TEXT,
  image_url TEXT,
  diamond_weight TEXT,
  replacement_value TEXT,
  pdf_url TEXT,
  pdf_generated_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index on stock_number for faster searches
CREATE INDEX IF NOT EXISTS idx_appraisals_stock_number ON public.appraisals(stock_number);

-- Create index on order_id for faster queries
CREATE INDEX IF NOT EXISTS idx_appraisals_order_id ON public.appraisals(order_id);

-- Create index on created_by for user-specific queries
CREATE INDEX IF NOT EXISTS idx_appraisals_created_by ON public.appraisals(created_by);

-- Add RLS policies
ALTER TABLE public.appraisals ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to read all appraisals
CREATE POLICY "Authenticated users can read appraisals" ON public.appraisals
  FOR SELECT USING (auth.role() = 'authenticated');

-- Policy for authenticated users to insert appraisals
CREATE POLICY "Authenticated users can insert appraisals" ON public.appraisals
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Policy for users to update their own appraisals
CREATE POLICY "Users can update their own appraisals" ON public.appraisals
  FOR UPDATE USING (auth.uid() = created_by);

-- Policy for users to delete their own appraisals
CREATE POLICY "Users can delete their own appraisals" ON public.appraisals
  FOR DELETE USING (auth.uid() = created_by);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_appraisals_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at column
CREATE TRIGGER update_appraisals_updated_at
  BEFORE UPDATE ON public.appraisals
  FOR EACH ROW
  EXECUTE FUNCTION update_appraisals_updated_at_column();
