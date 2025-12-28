-- FIX ZERO CREDITS (ONE-TIME REPAIR)
-- This script forces a reset of credits for users who are showing 0 due to previous migration errors.
-- It ensures every "trial" user starts with 20 credits available.

-- 1. Reset 'trial' users to have 20 limit and 0 used (Fresh Start)
UPDATE public.user_usage
SET 
  generations_limit = 20,
  generations_used = 0,
  plan = 'trial'
WHERE 
  -- Target users who seem broken (e.g. 0 limit, or used >= limit on trial)
  (generations_limit IS NULL OR generations_limit = 0)
  OR
  (plan = 'trial' AND (generations_limit - generations_used) <= 0);

-- 2. Ensure everyone has at least the default rows initialized correctly
-- (In case the ON CONFLICT clause skipped them but they had bad data)
UPDATE public.user_usage
SET topup_credits = 0
WHERE topup_credits IS NULL;

-- 3. Verify the fix (Optional: You can run this SELECT to see results)
-- SELECT user_id, plan, generations_limit, generations_used, topup_credits, 
--        (generations_limit + topup_credits - generations_used) as available
-- FROM public.user_usage;
