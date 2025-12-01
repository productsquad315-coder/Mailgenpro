-- =====================================================
-- CRITICAL FIX: Add app_role column and set admin
-- Run this in Supabase SQL Editor
-- =====================================================

-- Step 1: Add app_role column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS app_role TEXT DEFAULT 'user' 
CHECK (app_role IN ('admin', 'user'));

-- Step 2: Create index for performance
CREATE INDEX IF NOT EXISTS idx_profiles_app_role ON profiles(app_role);

-- Step 3: Make b.vijay0452@gmail.com an admin
UPDATE profiles 
SET app_role = 'admin' 
WHERE email = 'b.vijay0452@gmail.com';

-- Step 4: Give yourself 100 initial credits
UPDATE user_usage 
SET topup_credits = COALESCE(topup_credits, 0) + 100 
WHERE user_id = (
    SELECT id FROM profiles WHERE email = 'b.vijay0452@gmail.com'
);

-- Step 5: Verify the changes
SELECT 
    p.id,
    p.email,
    p.app_role,
    u.generations_used,
    u.generations_limit,
    u.topup_credits,
    (u.generations_limit + COALESCE(u.topup_credits, 0) - u.generations_used) as total_available
FROM profiles p
LEFT JOIN user_usage u ON p.id = u.user_id
WHERE p.email = 'b.vijay0452@gmail.com';

-- Expected result:
-- You should see:
-- - app_role = 'admin'
-- - topup_credits = 100 (or more if you already had some)
-- - total_available = your available credits
