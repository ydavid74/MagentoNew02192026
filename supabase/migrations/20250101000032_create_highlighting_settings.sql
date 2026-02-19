-- Create highlighting_settings table to store user preferences
CREATE TABLE IF NOT EXISTS highlighting_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  settings JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create unique index to ensure one settings record per user
CREATE UNIQUE INDEX IF NOT EXISTS highlighting_settings_user_id_idx 
ON highlighting_settings(user_id);

-- Enable RLS
ALTER TABLE highlighting_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own highlighting settings" ON highlighting_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own highlighting settings" ON highlighting_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own highlighting settings" ON highlighting_settings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own highlighting settings" ON highlighting_settings
  FOR DELETE USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_highlighting_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_highlighting_settings_updated_at
  BEFORE UPDATE ON highlighting_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_highlighting_settings_updated_at();
