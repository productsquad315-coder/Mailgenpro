-- FINAL DB SYNC SCRIPT
-- Run this in Supabase Dashboard -> SQL Editor
-- This resolves the "400 Bad Request" by removing all confusing function variations

-- 1. Cleanup ALL potential variations of these functions
DROP FUNCTION IF EXISTS public.get_my_credits();
DROP FUNCTION IF EXISTS public.get_my_credits(uuid); -- Drop overload if exists

DROP FUNCTION IF EXISTS public.initialize_free_trial();
DROP FUNCTION IF EXISTS public.initialize_free_trial(uuid); -- Drop overload if exists

DROP FUNCTION IF EXISTS public.sync_user_credits(uuid);
DROP FUNCTION IF EXISTS public.reset_all_expired_credits();

-- 2. Create the "Self-Healing" Initialize Function
CREATE OR REPLACE FUNCTION public.initialize_free_trial()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    -- Ensure 20 credits limit for trial users
    INSERT INTO user_usage (user_id, plan, generations_limit, generations_used, subscription_status, topup_credits)
    VALUES (auth.uid(), 'trial', 20, 0, 'active', 0)
    ON CONFLICT (user_id) DO UPDATE
    SET generations_limit = 20
    WHERE user_usage.generations_limit < 20;

    -- Ensure email_credits table exists
    INSERT INTO email_credits (user_id, credits_free, credits_paid, credits_total)
    SELECT auth.uid(), 20, 0, 20
    WHERE NOT EXISTS (SELECT 1 FROM email_credits WHERE user_id = auth.uid());
END;
$$;

-- 3. Create the Unified Credit Fetcher
CREATE OR REPLACE FUNCTION public.get_my_credits()
RETURNS TABLE (
    credits_total INT,
    credits_free INT,
    credits_paid INT,
    credits_used_this_month INT,
    plan TEXT,
    subscription_status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    -- Self-Heal first (Fixes usage + credits if missing)
    PERFORM public.initialize_free_trial();

    -- Sync email_credits with user_usage (The Master Update)
    INSERT INTO email_credits (
        user_id, 
        credits_free, 
        credits_paid, 
        credits_total, 
        credits_used_this_month,
        updated_at
    )
    SELECT 
        user_id, 
        GREATEST(0, generations_limit - generations_used),
        COALESCE(topup_credits, 0),
        GREATEST(0, generations_limit - generations_used) + COALESCE(topup_credits, 0),
        generations_used,
        NOW()
    FROM user_usage
    WHERE user_id = auth.uid()
    ON CONFLICT (user_id) DO UPDATE SET
        credits_free = EXCLUDED.credits_free,
        credits_paid = EXCLUDED.credits_paid,
        credits_total = EXCLUDED.credits_total,
        credits_used_this_month = EXCLUDED.credits_used_this_month,
        updated_at = NOW();

    -- Return the Fresh Data
    RETURN QUERY
    SELECT 
        COALESCE(ec.credits_total, 20)::INT,
        COALESCE(ec.credits_free, 20)::INT,
        COALESCE(ec.credits_paid, 0)::INT,
        COALESCE(ec.credits_used_this_month, 0)::INT,
        COALESCE(uu.plan, 'trial'),
        COALESCE(uu.subscription_status, 'active')
    FROM user_usage uu
    LEFT JOIN email_credits ec ON uu.user_id = ec.user_id
    WHERE uu.user_id = auth.uid();
END;
$$;

-- 4. Create Master Sync User Credits (For Webhooks)
CREATE OR REPLACE FUNCTION public.sync_user_credits(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_usage public.user_usage%ROWTYPE;
    v_result JSONB;
BEGIN
    SELECT * INTO v_usage FROM public.user_usage WHERE user_id = p_user_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('error', 'User usage record not found');
    END IF;

    INSERT INTO public.email_credits (
        user_id, 
        credits_free, 
        credits_paid, 
        credits_total,
        credits_used_this_month,
        updated_at
    )
    VALUES (
        p_user_id,
        GREATEST(0, v_usage.generations_limit - v_usage.generations_used),
        COALESCE(v_usage.topup_credits, 0),
        GREATEST(0, v_usage.generations_limit - v_usage.generations_used) + COALESCE(v_usage.topup_credits, 0),
        v_usage.generations_used,
        NOW()
    )
    ON CONFLICT (user_id) DO UPDATE SET
        credits_free = EXCLUDED.credits_free,
        credits_paid = EXCLUDED.credits_paid,
        credits_total = EXCLUDED.credits_total,
        credits_used_this_month = EXCLUDED.credits_used_this_month,
        updated_at = NOW();

    SELECT row_to_json(t)::jsonb INTO v_result
    FROM public.email_credits t WHERE user_id = p_user_id;
    
    RETURN v_result;
END;
$$;
