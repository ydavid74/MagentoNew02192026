-- Create order_verification table
CREATE TABLE public.order_verification (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  date_added TIMESTAMP WITH TIME ZONE DEFAULT now(),
  added_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_order_verification_order_id ON public.order_verification(order_id);
CREATE INDEX IF NOT EXISTS idx_order_verification_date_added ON public.order_verification(date_added);
CREATE INDEX IF NOT EXISTS idx_order_verification_added_by ON public.order_verification(added_by);

-- Add comments to explain the table and columns
COMMENT ON TABLE public.order_verification IS 'Verification comments and records for orders';
COMMENT ON COLUMN public.order_verification.order_id IS 'Reference to the order being verified';
COMMENT ON COLUMN public.order_verification.date_added IS 'When the verification was added';
COMMENT ON COLUMN public.order_verification.added_by IS 'User who added the verification';
COMMENT ON COLUMN public.order_verification.comment IS 'Verification comment or note';

-- Enable Row Level Security (RLS)
ALTER TABLE public.order_verification ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can view verification records for orders (all authenticated users can view)
CREATE POLICY "Users can view order verification records" ON public.order_verification
  FOR SELECT USING (
    auth.uid() IS NOT NULL
  );

-- Users can insert verification records for any order
CREATE POLICY "Users can insert order verification records" ON public.order_verification
  FOR INSERT WITH CHECK (
    added_by = auth.uid() AND auth.uid() IS NOT NULL
  );

-- Users can update verification records they created
CREATE POLICY "Users can update their own verification records" ON public.order_verification
  FOR UPDATE USING (
    added_by = auth.uid()
  );

-- Users can delete verification records they created
CREATE POLICY "Users can delete their own verification records" ON public.order_verification
  FOR DELETE USING (
    added_by = auth.uid()
  );

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_order_verification_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at column
CREATE TRIGGER update_order_verification_updated_at
  BEFORE UPDATE ON public.order_verification
  FOR EACH ROW
  EXECUTE FUNCTION update_order_verification_updated_at_column();
