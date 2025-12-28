-- Fix RPC functions for Credit System

-- 1. sync_user_credits: Used by the webhook to sync usage data
DROP FUNCTION IF EXISTS sync_user_credits(uuid);

CREATE OR REPLACE FUNCTION sync_user_credits(p_user_id uuid)
RETURNS void AS $$
DECLARE
  v_usage record;
  v_total int;
BEGIN
  -- Get current usage
  SELECT * INTO v_usage FROM user_usage WHERE user_id = p_user_id;
  
  -- Calculate total
  v_total := (COALESCE(v_usage.generations_limit, 0) - COALESCE(v_usage.generations_used, 0) + COALESCE(v_usage.topup_credits, 0));

  -- If you are using a separate email_credits table for the frontend, update it here.
  -- Otherwise, this function just ensures the user_usage record exists.
  IF v_usage IS NULL THEN
      INSERT INTO user_usage (user_id) VALUES (p_user_id);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. get_my_credits: The main function called by the frontend
-- We drop it first to ensure we can change the return type if needed
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

  -- Get usage record
  SELECT * INTO v_usage FROM user_usage WHERE user_id = v_user_id;

  -- Create if doesn't exist
  IF v_usage IS NULL THEN
     INSERT INTO user_usage (user_id) VALUES (v_user_id) RETURNING * INTO v_usage;
  END IF;

  RETURN QUERY SELECT 
    GREATEST(0, (COALESCE(v_usage.generations_limit, 0) - COALESCE(v_usage.generations_used, 0) + COALESCE(v_usage.topup_credits, 0)))::int as credits_total,
    COALESCE(v_usage.plan, 'trial') as plan,
    GREATEST(0, (COALESCE(v_usage.generations_limit, 0) - COALESCE(v_usage.generations_used, 0)))::int as credits_free,
    COALESCE(v_usage.topup_credits, 0)::int as credits_paid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
