-- Create diamond_deductions table manually
CREATE TABLE IF NOT EXISTS public.diamond_deductions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    date_added TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    type VARCHAR(50) NOT NULL, -- 'center', 'side', 'manual'
    product_sku VARCHAR(100),
    parcel_id VARCHAR(100),
    ct_weight DECIMAL(10,3),
    stones VARCHAR(100),
    price_per_ct DECIMAL(10,2),
    total_price DECIMAL(10,2),
    mm VARCHAR(100),
    comments TEXT,
    deduction_type VARCHAR(20) NOT NULL DEFAULT 'center',
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_diamond_deductions_order_id ON public.diamond_deductions(order_id);
CREATE INDEX IF NOT EXISTS idx_diamond_deductions_parcel_id ON public.diamond_deductions(parcel_id);
CREATE INDEX IF NOT EXISTS idx_diamond_deductions_type ON public.diamond_deductions(type);
CREATE INDEX IF NOT EXISTS idx_diamond_deductions_created_at ON public.diamond_deductions(created_at);

-- Enable Row Level Security
ALTER TABLE public.diamond_deductions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (simplified for now)
CREATE POLICY "Users can view diamond deductions" ON public.diamond_deductions
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert diamond deductions" ON public.diamond_deductions
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update diamond deductions" ON public.diamond_deductions
    FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete diamond deductions" ON public.diamond_deductions
    FOR DELETE USING (auth.uid() IS NOT NULL);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_diamond_deductions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER trigger_update_diamond_deductions_updated_at
    BEFORE UPDATE ON public.diamond_deductions
    FOR EACH ROW
    EXECUTE FUNCTION update_diamond_deductions_updated_at();
