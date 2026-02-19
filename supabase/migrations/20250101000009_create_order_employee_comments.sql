-- Create order_employee_comments table
-- This table stores employee comments with video recordings for orders

CREATE TABLE IF NOT EXISTS public.order_employee_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  video_url TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_order_employee_comments_order_id ON public.order_employee_comments(order_id);
CREATE INDEX IF NOT EXISTS idx_order_employee_comments_created_by ON public.order_employee_comments(created_by);
CREATE INDEX IF NOT EXISTS idx_order_employee_comments_created_at ON public.order_employee_comments(created_at);

-- Add RLS policies
ALTER TABLE public.order_employee_comments ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view comments for orders they have access to
CREATE POLICY "Users can view order employee comments" ON public.order_employee_comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_employee_comments.order_id
    )
  );

-- Policy: Authenticated users can insert comments
CREATE POLICY "Authenticated users can insert order employee comments" ON public.order_employee_comments
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Policy: Users can update their own comments
CREATE POLICY "Users can update their own comments" ON public.order_employee_comments
  FOR UPDATE USING (auth.uid() = created_by);

-- Policy: Users can delete their own comments
CREATE POLICY "Users can delete their own comments" ON public.order_employee_comments
  FOR DELETE USING (auth.uid() = created_by);

-- Add comments for documentation
COMMENT ON TABLE public.order_employee_comments IS 'Stores employee comments with optional video recordings for orders';
COMMENT ON COLUMN public.order_employee_comments.order_id IS 'Reference to the order this comment belongs to';
COMMENT ON COLUMN public.order_employee_comments.content IS 'Text content of the employee comment';
COMMENT ON COLUMN public.order_employee_comments.video_url IS 'URL to the video recording stored in Supabase Storage';
COMMENT ON COLUMN public.order_employee_comments.created_by IS 'User who created this comment';
COMMENT ON COLUMN public.order_employee_comments.created_at IS 'Timestamp when this comment was created';
