-- Fix get_my_credits to handle both authenticated calls and direct testing
DROP FUNCTION IF EXISTS get_my_credits();

CREATE OR REPLACE FUNCTION get_my_credits()
RETURNS TABLE (
  credits_total int,
  plan text,
  credits_free int,
  credits_paid int
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_user_id uuid;
  v_usage record;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
     RETURN; 
  END IF;

  -- Get the user's current usage
  SELECT * INTO v_usage FROM public.user_usage WHERE user_id = v_user_id;

  -- If no record exists, create one (self-healing)
  IF v_usage IS NULL THEN
     INSERT INTO public.user_usage (user_id, plan, generations_limit, generations_used, topup_credits)
     VALUES (v_user_id, 'trial', 20, 0, 0)
     ON CONFLICT (user_id) DO NOTHING
     RETURNING * INTO v_usage;
     
     -- If still null due to race condition, try selecting again
     IF v_usage IS NULL THEN
        SELECT * INTO v_usage FROM public.user_usage WHERE user_id = v_user_id;
     END IF;
  END IF;

  -- Return calculated credits
  RETURN QUERY SELECT 
    (COALESCE(v_usage.generations_limit, 20) + COALESCE(v_usage.topup_credits, 0) - COALESCE(v_usage.generations_used, 0))::int as credits_total,
    COALESCE(v_usage.plan, 'trial') as plan,
    (COALESCE(v_usage.generations_limit, 20) - COALESCE(v_usage.generations_used, 0))::int as credits_free,
    (COALESCE(v_usage.topup_credits, 0))::int as credits_paid;
END;
$$;

GRANT EXECUTE ON FUNCTION get_my_credits() TO authenticated, service_role;

-- For testing purposes, create a version that accepts user_id
CREATE OR REPLACE FUNCTION get_credits_for_user(p_user_id uuid)
RETURNS TABLE (
  credits_total int,
  plan text,
  credits_free int,
  credits_paid int
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_usage record;
BEGIN
  SELECT * INTO v_usage FROM public.user_usage WHERE user_id = p_user_id;

  IF v_usage IS NULL THEN
     RETURN QUERY SELECT 0::int, 'trial'::text, 0::int, 0::int;
     RETURN;
  END IF;

  RETURN QUERY SELECT 
    (COALESCE(v_usage.generations_limit, 20) + COALESCE(v_usage.topup_credits, 0) - COALESCE(v_usage.generations_used, 0))::int as credits_total,
    COALESCE(v_usage.plan, 'trial') as plan,
    (COALESCE(v_usage.generations_limit, 20) - COALESCE(v_usage.generations_used, 0))::int as credits_free,
    (COALESCE(v_usage.topup_credits, 0))::int as credits_paid;
END;
$$;

GRANT EXECUTE ON FUNCTION get_credits_for_user(uuid) TO authenticated, service_role;
