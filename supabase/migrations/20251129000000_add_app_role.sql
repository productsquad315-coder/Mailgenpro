-- Add app_role column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS app_role TEXT DEFAULT 'user' CHECK (app_role IN ('admin', 'user'));

-- Create index for faster admin lookups
CREATE INDEX IF NOT EXISTS idx_profiles_app_role ON profiles(app_role);

-- Set your user as admin (replace with your actual email)
-- UPDATE profiles SET app_role = 'admin' WHERE email = 'your-email@example.com';
