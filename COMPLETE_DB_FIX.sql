-- COMPLETE DB FIX
-- Run this entire script in Supabase SQL Editor to fix credit display issues.

-- 1. Ensure user_usage table exists and has all columns
CREATE TABLE IF NOT EXISTS user_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL UNIQUE,
  plan text DEFAULT 'trial',
  generations_limit int DEFAULT 20,
  generations_used int DEFAULT 0,
  topup_credits int DEFAULT 0,
  subscription_status text DEFAULT 'active',
  lemonsqueezy_customer_id text,
  subscription_id text,
  current_period_end timestamp,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Safely add columns if missing
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_usage' AND column_name = 'topup_credits') THEN
    ALTER TABLE user_usage ADD COLUMN topup_credits int DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_usage' AND column_name = 'lemonsqueezy_customer_id') THEN
    ALTER TABLE user_usage ADD COLUMN lemonsqueezy_customer_id text;
  END IF;
END $$;

-- 2. Enable RLS
ALTER TABLE user_usage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own usage" ON user_usage;
CREATE POLICY "Users can view own usage" ON user_usage FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Webhook can update usage" ON user_usage;
-- (Webhook uses service_role, so it bypasses RLS, but we add this just in case of other setups)
-- No generic update policy for users, valid.

-- 3. Fix the RPC function 'get_my_credits'
DROP FUNCTION IF EXISTS get_my_credits();

CREATE OR REPLACE FUNCTION get_my_credits()
RETURNS TABLE (
  credits_total int,
  plan text,
  credits_free int,
  credits_paid int
) AS $$
DECLARE
  v_user_id uuid;
  v_usage record;
BEGIN
  v_user_id := auth.uid();
  
  -- If no user logged in, return empty
  IF v_user_id IS NULL THEN
    RETURN;
  END IF;

  -- Get usage record
  SELECT * INTO v_usage FROM user_usage WHERE user_id = v_user_id;

  -- Self-healing: Create record if it doesn't exist (Legacy users)
  IF v_usage IS NULL THEN
     INSERT INTO user_usage (user_id, plan, generations_limit, generations_used, topup_credits) 
     VALUES (v_user_id, 'trial', 20, 0, 0)
     ON CONFLICT (user_id) DO NOTHING
     RETURNING * INTO v_usage;
     
     -- If insert failed due to race condition, select again
     IF v_usage IS NULL THEN
        SELECT * INTO v_usage FROM user_usage WHERE user_id = v_user_id;
     END IF;
  END IF;

  RETURN QUERY SELECT 
    (COALESCE(v_usage.generations_limit, 0) - COALESCE(v_usage.generations_used, 0) + COALESCE(v_usage.topup_credits, 0))::int as credits_total,
    COALESCE(v_usage.plan, 'trial') as plan,
    (COALESCE(v_usage.generations_limit, 0) - COALESCE(v_usage.generations_used, 0))::int as credits_free,
    COALESCE(v_usage.topup_credits, 0)::int as credits_paid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Grant Permissions (Crucial!)
GRANT EXECUTE ON FUNCTION get_my_credits() TO authenticated;
GRANT EXECUTE ON FUNCTION get_my_credits() TO service_role;
GRANT SELECT ON user_usage TO authenticated;

-- 5. Trigger for new users
CREATE OR REPLACE FUNCTION handle_new_user_usage()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_usage (user_id, plan, generations_limit, generations_used, topup_credits)
  VALUES (NEW.id, 'trial', 20, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created_usage ON auth.users;
CREATE TRIGGER on_auth_user_created_usage
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user_usage();

-- 6. Unified Deduction Logic
-- This ensures that when the backend attempts to deduct a credit, it uses the 'user_usage' table.
CREATE OR REPLACE FUNCTION deduct_email_credit(p_user_id uuid)
RETURNS boolean AS $$
DECLARE
  v_limit int;
  v_used int;
  v_topup int;
BEGIN
  -- Get current usage
  SELECT generations_limit, generations_used, topup_credits 
  INTO v_limit, v_used, v_topup
  FROM user_usage 
  WHERE user_id = p_user_id;

  -- Default to 0 if null
  v_limit := COALESCE(v_limit, 0);
  v_used := COALESCE(v_used, 0);
  v_topup := COALESCE(v_topup, 0);

  -- Check if user has enough credits
  IF (v_limit + v_topup) > v_used THEN
    -- Increment used count
    UPDATE user_usage 
    SET generations_used = generations_used + 1,
        updated_at = now()
    WHERE user_id = p_user_id;
    RETURN true;
  ELSE
    RETURN false;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
