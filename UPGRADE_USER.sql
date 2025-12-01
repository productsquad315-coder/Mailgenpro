-- UPGRADE USER TO PRO & ADD CREDITS
-- Run this in Supabase SQL Editor

-- 1. Update Profile to 'admin' (or 'pro' if you have that role defined)
UPDATE profiles
SET app_role = 'admin'
WHERE id IN (SELECT id FROM auth.users WHERE email = 'b.vijay0452@gmail.com');

-- 2. Grant 1000 Credits & Set Plan to 'pro'
-- We use ON CONFLICT to insert if missing, or update if exists
DO $$
DECLARE
  target_user_id uuid;
BEGIN
  SELECT id INTO target_user_id FROM auth.users WHERE email = 'b.vijay0452@gmail.com';

  IF target_user_id IS NOT NULL THEN
    INSERT INTO public.user_usage (user_id, generations_limit, generations_used, plan)
    VALUES (target_user_id, 1000, 0, 'pro')
    ON CONFLICT (user_id) 
    DO UPDATE SET 
      generations_limit = 1000,
      plan = 'pro';
  END IF;
END $$;
