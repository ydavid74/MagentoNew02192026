-- Add first_name and last_name columns to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT;

-- Add comments to explain the new columns
COMMENT ON COLUMN public.profiles.first_name IS 'Employee first name';
COMMENT ON COLUMN public.profiles.last_name IS 'Employee last name';

-- Create index on first_name and last_name for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_first_name ON public.profiles(first_name);
CREATE INDEX IF NOT EXISTS idx_profiles_last_name ON public.profiles(last_name);

-- Update existing profiles with sample data (you can remove this if you want to keep them empty)
UPDATE public.profiles 
SET 
  first_name = 'Admin',
  last_name = 'User'
WHERE first_name IS NULL AND last_name IS NULL;
