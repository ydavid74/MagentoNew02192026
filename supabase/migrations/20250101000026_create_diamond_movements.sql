-- Create diamond_movements table for tracking inventory movements
CREATE TABLE IF NOT EXISTS public.diamond_movements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    parcel_id VARCHAR(255) NOT NULL,
    movement_type VARCHAR(50) NOT NULL CHECK (movement_type IN ('deduction', 'restoration', 'addition', 'adjustment')),
    ct_weight DECIMAL(10,3) NOT NULL,
    stones INTEGER NOT NULL,
    order_id UUID,
    deduction_type VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_diamond_movements_parcel_id ON public.diamond_movements(parcel_id);
CREATE INDEX IF NOT EXISTS idx_diamond_movements_order_id ON public.diamond_movements(order_id);
CREATE INDEX IF NOT EXISTS idx_diamond_movements_created_at ON public.diamond_movements(created_at);
CREATE INDEX IF NOT EXISTS idx_diamond_movements_movement_type ON public.diamond_movements(movement_type);

-- Enable Row Level Security
ALTER TABLE public.diamond_movements ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view diamond movements" ON public.diamond_movements
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert diamond movements" ON public.diamond_movements
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update diamond movements" ON public.diamond_movements
    FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete diamond movements" ON public.diamond_movements
    FOR DELETE USING (auth.uid() IS NOT NULL);
