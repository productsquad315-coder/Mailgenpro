-- OPTION 1: Grant Access to ALL Users (Easiest for Dev)
-- This will make every user a Pro user and give them 5,000 credits.

-- 1. Upgrade all users to Pro plan
UPDATE public.user_usage
SET plan = 'pro';

-- 2. Give all users 5,000 free email credits
INSERT INTO public.email_credits (user_id, credits_free, credits_paid)
SELECT id, 5000, 0 FROM auth.users
ON CONFLICT (user_id) 
DO UPDATE SET 
    credits_free = 5000,
    updated_at = now();

-----------------------------------------------------------------------

-- OPTION 2: Grant Access to Specific User (If you know your User ID)
-- Replace 'YOUR_USER_ID_HERE' with your actual UUID

/*
-- 1. Upgrade specific user
UPDATE public.user_usage
SET plan = 'pro'
WHERE user_id = 'YOUR_USER_ID_HERE';

-- 2. Give specific user credits
INSERT INTO public.email_credits (user_id, credits_free, credits_paid)
VALUES ('YOUR_USER_ID_HERE', 5000, 0)
ON CONFLICT (user_id) 
DO UPDATE SET 
    credits_free = 5000,
    updated_at = now();
*/
