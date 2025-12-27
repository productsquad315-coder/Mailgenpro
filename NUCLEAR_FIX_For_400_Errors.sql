-- NUCLEAR FIX FOR "400 BAD REQUEST" RPC ERRORS
-- Run this ENTIRE SCRIPT in the Supabase Dashboard -> SQL Editor

-- 1. DROP ALL conflicting functions to clean the slate
DROP FUNCTION IF EXISTS public.get_my_credits();
DROP FUNCTION IF EXISTS public.initialize_free_trial();

-- 2. Re-create initialize_free_trial (The Healer)
CREATE OR REPLACE FUNCTION public.initialize_free_trial()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    -- Ensure user_usage exists and has at least 20 limit
    INSERT INTO user_usage (user_id, plan, generations_limit, generations_used, subscription_status, topup_credits)
    VALUES (auth.uid(), 'trial', 20, 0, 'active', 0)
    ON CONFLICT (user_id) DO UPDATE
    SET generations_limit = 20
    WHERE user_usage.generations_limit < 20;

    -- Ensure email_credits exists
    INSERT INTO email_credits (user_id, credits_free, credits_paid, credits_total)
    SELECT auth.uid(), 20, 0, 20
    WHERE NOT EXISTS (SELECT 1 FROM email_credits WHERE user_id = auth.uid());
END;
$$;

-- 3. Re-create get_my_credits (The Fetcher)
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
    -- Call the Healer first
    PERFORM public.initialize_free_trial();

    -- Sync and Fetch
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
