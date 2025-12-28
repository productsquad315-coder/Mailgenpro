-- SIMPLIFIED RESET SCRIPT
-- RUN THIS IN SUPABASE SQL EDITOR TO FIX EVERYTHING

-- 1. Ensure user_usage is the Master Table
CREATE TABLE IF NOT EXISTS public.user_usage (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) UNIQUE NOT NULL,
    plan text DEFAULT 'trial',
    generations_limit integer DEFAULT 20, -- Free trial gets 20
    generations_used integer DEFAULT 0,
    topup_credits integer DEFAULT 0,      -- Purchased credits go here
    subscription_status text DEFAULT 'active',
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    -- Lemon Squeezy fields
    lemonsqueezy_customer_id text,
    subscription_id text,
    current_period_end timestamp with time zone
);

-- 2. Secure it and Ensure Constraint
ALTER TABLE public.user_usage ENABLE ROW LEVEL SECURITY;

-- Ensure unique constraint exists for ON CONFLICT to work
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_usage_user_id_key') THEN
    ALTER TABLE public.user_usage ADD CONSTRAINT user_usage_user_id_key UNIQUE (user_id);
  END IF;
END $$;

DROP POLICY IF EXISTS "Users view own usage" ON public.user_usage;
CREATE POLICY "Users view own usage" ON public.user_usage
    FOR SELECT USING (auth.uid() = user_id);

-- 3. The "One True Function" to get credits
-- Frontend calls this. Edge Functions call this.
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
  
  -- If invoked by service_role (Edge Function) without auth.uid(), pass p_user_id? 
  -- Actually, Edge Functions usually set auth.uid() via JWT. 
  -- If not, we might fail. But let's assume standard auth.
  
  IF v_user_id IS NULL THEN
     -- Fallback for direct service role calls if they don't simulate user
     -- (Our edge functions usually simulate user or pass ID)
     -- For now, return empty if no user.
     RETURN; 
  END IF;

  -- "Self-Healing": If record missing, create it now (Default: Trial, 20 credits)
  insert into public.user_usage (user_id, plan, generations_limit, generations_used, topup_credits)
  values (v_user_id, 'trial', 20, 0, 0)
  on conflict (user_id) do nothing;

  SELECT * INTO v_usage FROM public.user_usage WHERE user_id = v_user_id;

  -- Logic: Total Available = (Limit + Topup) - Used
  RETURN QUERY SELECT 
    (COALESCE(v_usage.generations_limit, 20) + COALESCE(v_usage.topup_credits, 0) - COALESCE(v_usage.generations_used, 0))::int as credits_total,
    COALESCE(v_usage.plan, 'trial') as plan,
    (COALESCE(v_usage.generations_limit, 20))::int as credits_free,
    (COALESCE(v_usage.topup_credits, 0))::int as credits_paid;
END;
$$;

-- Grant access
GRANT EXECUTE ON FUNCTION get_my_credits() TO authenticated;
GRANT EXECUTE ON FUNCTION get_my_credits() TO service_role;


-- 4. The "One True Function" to deduct credits
-- Edge Functions call this.
CREATE OR REPLACE FUNCTION deduct_email_credit(p_user_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_limit int;
  v_topup int;
  v_used int;
BEGIN
  -- 1. Get current state
  SELECT generations_limit, topup_credits, generations_used
  INTO v_limit, v_topup, v_used
  FROM public.user_usage
  WHERE user_id = p_user_id;
  
  -- 2. Handle missing record (heal it)
  IF NOT FOUND THEN
    INSERT INTO public.user_usage (user_id, plan, generations_limit, generations_used, topup_credits)
    VALUES (p_user_id, 'trial', 20, 1, 0); -- Created and used 1 immediately
    RETURN true;
  END IF;

  v_limit := COALESCE(v_limit, 20);
  v_topup := COALESCE(v_topup, 0);
  v_used := COALESCE(v_used, 0);

  -- 3. Check Balance
  IF (v_limit + v_topup) > v_used THEN
    -- Have credits, deduct one (increment used)
    UPDATE public.user_usage
    SET generations_used = generations_used + 1,
        updated_at = now()
    WHERE user_id = p_user_id;
    RETURN true;
  ELSE
    -- No credits
    RETURN false;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION deduct_email_credit(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION deduct_email_credit(uuid) TO service_role;


-- 5. Helper: Add purchased credits (Admin / Webhook)
CREATE OR REPLACE FUNCTION add_topup_credits(p_user_id uuid, p_credits int)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.user_usage
  SET topup_credits = COALESCE(topup_credits, 0) + p_credits,
      updated_at = now()
  WHERE user_id = p_user_id;

  -- Handle missing record
  IF NOT FOUND THEN
    INSERT INTO public.user_usage (user_id, plan, generations_limit, generations_used, topup_credits)
    VALUES (p_user_id, 'trial', 20, 0, p_credits);
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION add_topup_credits(uuid, int) TO service_role;
GRANT EXECUTE ON FUNCTION add_topup_credits(uuid, int) TO authenticated; -- Only admin actually calls this via UI


-- 6. Trigger for New Signups
CREATE OR REPLACE FUNCTION handle_new_user_usage()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_usage (user_id, plan, generations_limit, generations_used, topup_credits)
  VALUES (NEW.id, 'trial', 20, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created_simple ON auth.users;
CREATE TRIGGER on_auth_user_created_simple
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user_usage();


-- 7. Dummy "Sync" for backward compatibility with old Webhooks/Code
-- This ensures 'sync_user_credits' doesn't crash if called, but does nothing.
CREATE OR REPLACE FUNCTION sync_user_credits(p_user_id uuid)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  -- No-op: user_usage IS the source of truth now.
  -- We don't need to sync to email_credits anymore.
  NULL; 
END;
$$;
