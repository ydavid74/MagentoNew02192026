-- Create import_logs table for tracking CSV imports
CREATE TABLE IF NOT EXISTS public.import_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
  status TEXT CHECK (status IN ('running', 'completed', 'failed')) DEFAULT 'running',
  counts JSONB DEFAULT '{}',
  errors JSONB DEFAULT '[]',
  created_by UUID REFERENCES auth.users,
  import_type TEXT DEFAULT 'csv_bulk_import'
);

-- Enable RLS
ALTER TABLE public.import_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for import_logs
DROP POLICY IF EXISTS "Users can view their own import logs" ON public.import_logs;
CREATE POLICY "Users can view their own import logs" ON public.import_logs
  FOR SELECT USING (created_by = auth.uid());

DROP POLICY IF EXISTS "Users can create import logs" ON public.import_logs;
CREATE POLICY "Users can create import logs" ON public.import_logs
  FOR INSERT WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "Users can update their own import logs" ON public.import_logs;
CREATE POLICY "Users can update their own import logs" ON public.import_logs
  FOR UPDATE USING (created_by = auth.uid());

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_import_logs_created_by ON public.import_logs(created_by);
CREATE INDEX IF NOT EXISTS idx_import_logs_status ON public.import_logs(status);
CREATE INDEX IF NOT EXISTS idx_import_logs_started_at ON public.import_logs(started_at);