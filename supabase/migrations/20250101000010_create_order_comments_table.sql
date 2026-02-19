-- Create order_comments table for storing order comments
-- Migration: 20250101000010_create_order_comments_table.sql

-- Create order_comments table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.order_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_important BOOLEAN DEFAULT false,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_order_comments_order_id ON public.order_comments(order_id);
CREATE INDEX IF NOT EXISTS idx_order_comments_created_by ON public.order_comments(created_by);
CREATE INDEX IF NOT EXISTS idx_order_comments_created_at ON public.order_comments(created_at);

-- Add comments for documentation
COMMENT ON TABLE public.order_comments IS 'Comments and notes for orders';
COMMENT ON COLUMN public.order_comments.content IS 'The comment text content';
COMMENT ON COLUMN public.order_comments.is_important IS 'Flag for important comments that should be highlighted';

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at trigger
CREATE TRIGGER update_order_comments_updated_at 
    BEFORE UPDATE ON public.order_comments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS on order_comments table
ALTER TABLE public.order_comments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for order_comments
-- Users can only access comments for orders they have access to
CREATE POLICY "Users can view comments for accessible orders" ON public.order_comments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.orders o
            JOIN public.profiles p ON p.user_id = auth.uid()
            WHERE o.id = order_comments.order_id
            AND (p.role = 'admin' OR o.customer_id IN (
                SELECT customer_id FROM public.orders 
                WHERE id IN (
                    SELECT order_id FROM public.order_comments 
                    WHERE created_by = auth.uid()
                )
            ))
        )
    );

CREATE POLICY "Users can insert comments for accessible orders" ON public.order_comments
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.orders o
            JOIN public.profiles p ON p.user_id = auth.uid()
            WHERE o.id = order_comments.order_id
            AND (p.role = 'admin' OR o.customer_id IN (
                SELECT customer_id FROM public.orders 
                WHERE id IN (
                    SELECT order_id FROM public.order_comments 
                    WHERE created_by = auth.uid()
                )
            ))
        )
    );

CREATE POLICY "Users can update their own comments" ON public.order_comments
    FOR UPDATE USING (
        created_by = auth.uid()
    );

CREATE POLICY "Users can delete their own comments" ON public.order_comments
    FOR DELETE USING (
        created_by = auth.uid()
    );
