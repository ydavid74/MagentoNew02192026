-- Create email_logs table for audit trail
CREATE TABLE public.email_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    status_rule_id UUID,
    email_type TEXT NOT NULL CHECK (email_type IN ('customer', 'private', 'additional')),
    recipient_email TEXT NOT NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT NOT NULL CHECK (status IN ('sent', 'failed', 'pending')),
    error_message TEXT,
    shopify_email_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add comments
COMMENT ON TABLE public.email_logs IS 'Audit log of all automated emails sent for order status updates';
COMMENT ON COLUMN public.email_logs.order_id IS 'Reference to the order this email was sent for';
COMMENT ON COLUMN public.email_logs.status_rule_id IS 'Reference to the status rule that triggered this email';
COMMENT ON COLUMN public.email_logs.email_type IS 'Type of email: customer, private, or additional';
COMMENT ON COLUMN public.email_logs.recipient_email IS 'Email address that received the message';
COMMENT ON COLUMN public.email_logs.subject IS 'Subject line of the email';
COMMENT ON COLUMN public.email_logs.message IS 'Body content of the email';
COMMENT ON COLUMN public.email_logs.sent_at IS 'When the email was actually sent';
COMMENT ON COLUMN public.email_logs.status IS 'Current status of the email send attempt';
COMMENT ON COLUMN public.email_logs.error_message IS 'Error details if sending failed';
COMMENT ON COLUMN public.email_logs.shopify_email_id IS 'Shopify API email ID for tracking';

-- Create indexes
CREATE INDEX idx_email_logs_order_id ON public.email_logs(order_id);
CREATE INDEX idx_email_logs_status_rule_id ON public.email_logs(status_rule_id);
CREATE INDEX idx_email_logs_sent_at ON public.email_logs(sent_at);
CREATE INDEX idx_email_logs_status ON public.email_logs(status);
CREATE INDEX idx_email_logs_email_type ON public.email_logs(email_type);

-- Enable RLS
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Enable read access for all users" ON public.email_logs FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON public.email_logs FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users" ON public.email_logs FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users" ON public.email_logs FOR DELETE USING (auth.role() = 'authenticated');
