-- Create order_invoice table to store invoice HTML and metadata
CREATE TABLE IF NOT EXISTS public.order_invoice (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL,
  html_content TEXT NOT NULL,
  total_amount DECIMAL(10,2),
  status TEXT DEFAULT 'generated',
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  generated_by UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add comments
COMMENT ON TABLE public.order_invoice IS 'Stores generated invoice HTML and metadata for orders';
COMMENT ON COLUMN public.order_invoice.invoice_number IS 'Invoice number (e.g., #1001, #1002)';
COMMENT ON COLUMN public.order_invoice.html_content IS 'Complete HTML content of the invoice';
COMMENT ON COLUMN public.order_invoice.total_amount IS 'Total amount at time of invoice generation';
COMMENT ON COLUMN public.order_invoice.status IS 'Invoice status (generated, sent, paid, etc.)';
COMMENT ON COLUMN public.order_invoice.generated_at IS 'When the invoice was generated';
COMMENT ON COLUMN public.order_invoice.generated_by IS 'User who generated the invoice';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_order_invoice_order_id ON public.order_invoice(order_id);
CREATE INDEX IF NOT EXISTS idx_order_invoice_invoice_number ON public.order_invoice(invoice_number);
CREATE INDEX IF NOT EXISTS idx_order_invoice_generated_at ON public.order_invoice(generated_at);
CREATE INDEX IF NOT EXISTS idx_order_invoice_status ON public.order_invoice(status);

-- Enable RLS
ALTER TABLE public.order_invoice ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view order invoices" ON public.order_invoice
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert order invoices" ON public.order_invoice
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update order invoices" ON public.order_invoice
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete order invoices" ON public.order_invoice
  FOR DELETE USING (auth.uid() IS NOT NULL);
