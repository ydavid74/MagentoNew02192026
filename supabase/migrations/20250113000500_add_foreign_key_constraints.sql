-- Add foreign key constraints after all tables are created
ALTER TABLE public.email_logs 
ADD CONSTRAINT email_logs_status_rule_id_fkey 
FOREIGN KEY (status_rule_id) REFERENCES public.statuses_model(id) ON DELETE SET NULL;
