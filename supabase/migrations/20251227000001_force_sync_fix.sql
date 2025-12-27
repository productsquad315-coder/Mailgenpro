-- Force update credit RPCs to fix 400 Bad Request signature mismatches
-- and ensure aggressive self-healing logic for user credits.

-- 1. FIX: initialize_free_trial
-- Explicitly drop to clear any bad signatures
DROP FUNCTION IF EXISTS public.initialize_free_trial();

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
    WHERE user_usage.plan = 'trial' AND user_usage.generations_limit < 20;

    -- Ensure email_credits table exists for user
    INSERT INTO email_credits (user_id, credits_free, credits_paid, credits_total)
    SELECT auth.uid(), 20, 0, 20
    WHERE NOT EXISTS (SELECT 1 FROM email_credits WHERE user_id = auth.uid());
END;
$$;

-- 2. FIX: get_my_credits
-- Explicitly drop to clear any bad signatures
DROP FUNCTION IF EXISTS public.get_my_credits();

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
    -- Self-Healing: Call initialize logic if missing
    PERFORM public.initialize_free_trial();

    -- Synchronize email_credits from user_usage (Source of Truth)
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

    -- Return Data
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
