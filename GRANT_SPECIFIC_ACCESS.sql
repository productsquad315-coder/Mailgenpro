-- 1. REVERT: Set everyone back to 'free' plan
UPDATE public.user_usage
SET plan = 'free';

-- 2. REVERT: Reset everyone's credits to 0 (or default)
UPDATE public.email_credits
SET credits_free = 0, credits_paid = 0;

-- 3. GRANT: Find user by email and upgrade to Pro
UPDATE public.user_usage
SET plan = 'pro'
WHERE user_id IN (
    SELECT id FROM auth.users WHERE email = 'b.vijay0452@gmail.com'
);

-- 4. GRANT: Give 5,000 credits to specific user
INSERT INTO public.email_credits (user_id, credits_free, credits_paid)
SELECT id, 5000, 0 
FROM auth.users 
WHERE email = 'b.vijay0452@gmail.com'
ON CONFLICT (user_id) 
DO UPDATE SET 
    credits_free = 5000,
    updated_at = now();
