-- FIX CREDIT DEDUCTION LOGIC
-- Run this in Supabase SQL Editor

-- 1. Create/Replace the increment function with correct logic
-- Logic: 
--   If used < limit: Increment used (consume plan credits)
--   Else: Decrement topup (consume extra credits)
--   Always increment used for tracking purposes? 
--   Actually, if we increment used forever, the formula Max(0, Limit - Used) + Topup works perfectly.
--   Wait, if we increment used past limit, (Limit - Used) becomes negative. Max(0, neg) is 0.
--   So Remaining = 0 + Topup.
--   If we THEN decrement Topup, Remaining decreases.
--   This is CORRECT.

CREATE OR REPLACE FUNCTION increment_user_generations(user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE user_usage
  SET 
    -- Decrement topup ONLY if we are already over the limit
    topup_credits = CASE 
      WHEN generations_used >= generations_limit THEN GREATEST(0, topup_credits - 1)
      ELSE topup_credits 
    END,
    -- Always increment usage to track total consumption
    generations_used = generations_used + 1
  WHERE user_usage.user_id = increment_user_generations.user_id;
END;
$$;
