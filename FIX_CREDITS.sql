-- FIX CREDITS DISPLAY (RLS FOR USER_USAGE)
-- Run this in Supabase SQL Editor

-- Enable RLS on user_usage
ALTER TABLE user_usage ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own usage" ON user_usage;
DROP POLICY IF EXISTS "Users can update own usage" ON user_usage; -- Usually only service role updates this, but good to have read access

-- Create Policy: Users can view their own usage data
CREATE POLICY "Users can view own usage"
ON user_usage FOR SELECT
USING (auth.uid() = user_id);

-- Create Policy: Users can update their own usage (if needed, though usually backend handles this)
-- We'll keep it read-only for users for now to prevent tampering, 
-- but ensure the SELECT policy is in place so the dashboard can read it.

-- ALSO: Ensure the user has a usage row
-- This block will insert a row for the current user if it doesn't exist
DO $$
DECLARE
  curr_user_id uuid;
  curr_user_email text;
BEGIN
  -- Try to get the user ID for b.vijay0452@gmail.com
  SELECT id, email INTO curr_user_id, curr_user_email FROM auth.users WHERE email = 'b.vijay0452@gmail.com';
  
  IF curr_user_id IS NOT NULL THEN
    INSERT INTO public.user_usage (user_id, generations_limit, generations_used)
    VALUES (curr_user_id, 100, 0)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
END $$;
