-- CONSOLIDATE CREDIT SYSTEM
-- Merging email_credits into user_usage and refactoring deduction logic

-- 1. Migration: Move data from email_credits to user_usage for existing users
-- Note: generations_used in user_usage is total used this month
UPDATE public.user_usage uu
SET 
  generations_limit = GREATEST(uu.generations_limit, ec.credits_free + ec.credits_used_this_month),
  generations_used = ec.credits_used_this_month,
  topup_credits = ec.credits_paid,
  updated_at = now()
FROM public.email_credits ec
WHERE uu.user_id = ec.user_id;

-- 2. Refactor: deduct_email_credit function
-- This function will now work on user_usage table
CREATE OR REPLACE FUNCTION deduct_email_credit(p_user_id uuid)
RETURNS boolean AS $$
DECLARE
  v_limit int;
  v_used int;
  v_topup int;
BEGIN
  -- Get current usage data
  SELECT generations_limit, generations_used, topup_credits 
  INTO v_limit, v_used, v_topup
  FROM user_usage
  WHERE user_id = p_user_id;
  
  -- Check if user has any credits remaining
  -- (Free/Subscription credits remaining = limit - used)
  IF (v_limit - v_used + v_topup) <= 0 THEN
    RETURN false;
  END IF;
  
  -- Deduct: Use subscription credits first, then topup
  IF (v_limit - v_used) > 0 THEN
    UPDATE user_usage
    SET 
      generations_used = generations_used + 1,
      updated_at = now()
    WHERE user_id = p_user_id;
  ELSE
    UPDATE user_usage
    SET 
      topup_credits = topup_credits - 1,
      updated_at = now()
    WHERE user_id = p_user_id;
  END IF;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Update initialization trigger to use user_usage
CREATE OR REPLACE FUNCTION initialize_user_usage()
RETURNS trigger AS $$
BEGIN
  INSERT INTO user_usage (user_id, generations_limit, generations_used, plan)
  VALUES (NEW.id, 50, 0, 'free')
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Ensure user_usage is created on signup
DROP TRIGGER IF EXISTS on_auth_user_created_user_usage ON auth.users;
CREATE TRIGGER on_auth_user_created_user_usage
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION initialize_user_usage();

-- 4. Clean up redundant trigger/function from old system
DROP TRIGGER IF EXISTS on_auth_user_created_email_credits ON auth.users;
-- We leave the email_credits table for now but it's no longer used by the app.
