-- Add user management fields to profiles table

-- Add last_login_at field to track when user last logged in
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE;

-- Add comments to explain the new columns
COMMENT ON COLUMN public.profiles.last_login_at IS 'Timestamp of when the user last logged in';

-- Create index on last_login_at for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_last_login_at ON public.profiles(last_login_at);

-- Create function to update last login time
CREATE OR REPLACE FUNCTION public.update_last_login()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the last_login_at timestamp when user logs in
  UPDATE public.profiles 
  SET last_login_at = now() 
  WHERE user_id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically update last login time
-- This will be triggered by Supabase auth events
DROP TRIGGER IF EXISTS update_last_login_trigger ON auth.users;
CREATE TRIGGER update_last_login_trigger
  AFTER UPDATE OF last_sign_in_at ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_last_login();
