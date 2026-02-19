-- Create statuses_model table for automation rules
CREATE TABLE public.statuses_model (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    status TEXT NOT NULL,
    new_status TEXT NOT NULL,
    wait_time_business_days INTEGER CHECK (wait_time_business_days >= 0),
    description TEXT,
    private_email TEXT,
    email_subject TEXT,
    email_custom_message TEXT,
    additional_recipients TEXT[],
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add comments
COMMENT ON TABLE public.statuses_model IS 'Automation rules for order status transitions and customer communication';
COMMENT ON COLUMN public.statuses_model.status IS 'Current status that triggers the rule';
COMMENT ON COLUMN public.statuses_model.new_status IS 'Next status to transition to';
COMMENT ON COLUMN public.statuses_model.wait_time_business_days IS 'Number of business days to wait before transition (or Instant)';
COMMENT ON COLUMN public.statuses_model.description IS 'Human-readable description of the rule';
COMMENT ON COLUMN public.statuses_model.private_email IS 'Email address to send copy of customer notification';
COMMENT ON COLUMN public.statuses_model.email_subject IS 'Subject line for customer email';
COMMENT ON COLUMN public.statuses_model.email_custom_message IS 'Email body with placeholders (e.g., {{ order_number }})';
COMMENT ON COLUMN public.statuses_model.additional_recipients IS 'Array of additional email addresses to CC';
COMMENT ON COLUMN public.statuses_model.is_active IS 'Whether this rule is currently active';

-- Create indexes
CREATE INDEX idx_statuses_model_status ON public.statuses_model(status);
CREATE INDEX idx_statuses_model_active ON public.statuses_model(is_active);
CREATE INDEX idx_statuses_model_wait_time ON public.statuses_model(wait_time_business_days);

-- Enable RLS
ALTER TABLE public.statuses_model ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Enable read access for all users" ON public.statuses_model FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON public.statuses_model FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users" ON public.statuses_model FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users" ON public.statuses_model FOR DELETE USING (auth.role() = 'authenticated');

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_statuses_model_updated_at 
    BEFORE UPDATE ON public.statuses_model 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
