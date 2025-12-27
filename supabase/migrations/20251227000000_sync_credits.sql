-- migration/20251227000000_sync_credits.sql
-- Ultra Fix: Unified Credit Synchronization for Mailgenpro

-- 0. Cleanup existing functions to prevent signature mismatch errors
-- These drops ensure that CREATE OR REPLACE won't fail due to parameter/return changes
DROP FUNCTION IF EXISTS public.get_my_credits();
DROP FUNCTION IF EXISTS public.deduct_email_credit(UUID);
DROP FUNCTION IF EXISTS public.add_topup_credits(UUID, INT);
DROP FUNCTION IF EXISTS public.increment_user_generations(UUID);
DROP FUNCTION IF EXISTS public.initialize_free_trial();
DROP FUNCTION IF EXISTS public.recover_my_credits();
DROP FUNCTION IF EXISTS public.refresh_monthly_email_credits();

-- 1. Ensure Table Schema and Constraints
-- Make sure email_credits exists and has all necessary columns
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'email_credits') THEN
        CREATE TABLE public.email_credits (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            credits_free INT DEFAULT 0,
            credits_paid INT DEFAULT 0,
            credits_total INT DEFAULT 0,
            credits_used_this_month INT DEFAULT 0,
            last_reset_at TIMESTAMPTZ DEFAULT NOW(),
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW(),
            UNIQUE(user_id)
        );
    END IF;

    -- Add columns if they missed previous partial migrations
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'email_credits' AND column_name = 'credits_used_this_month') THEN
        ALTER TABLE public.email_credits ADD COLUMN credits_used_this_month INT DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'email_credits' AND column_name = 'last_reset_at') THEN
        ALTER TABLE public.email_credits ADD COLUMN last_reset_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_email_credits_user_id ON public.email_credits(user_id);

-- 2. Define deduct_email_credit as the primary deduction RPC
CREATE OR REPLACE FUNCTION public.deduct_email_credit(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_credits_free INT;
    v_credits_paid INT;
BEGIN
    -- 1. Sync check: Check and reset monthly credits if needed
    -- This ensures email_credits aligns with billing period resets
    UPDATE user_usage
    SET 
        generations_used = 0,
        current_period_end = NOW() + INTERVAL '1 month',
        updated_at = NOW()
    WHERE user_id = p_user_id
      AND current_period_end < NOW()
      AND subscription_status IN ('active', 'trial')
      AND plan != 'free';

    -- 2. Get current values from email_credits
    SELECT credits_free, credits_paid INTO v_credits_free, v_credits_paid
    FROM email_credits
    WHERE user_id = p_user_id;

    IF NOT FOUND THEN
        -- If missing, try to initialize from user_usage
        INSERT INTO email_credits (user_id, credits_free, credits_paid, credits_total)
        SELECT user_id, GREATEST(0, generations_limit - generations_used), topup_credits, GREATEST(0, generations_limit - generations_used) + topup_credits
        FROM user_usage
        WHERE user_id = p_user_id
        ON CONFLICT (user_id) DO NOTHING;
        
        SELECT credits_free, credits_paid INTO v_credits_free, v_credits_paid
        FROM email_credits
        WHERE user_id = p_user_id;
    END IF;

    -- Deduction logic: topup (paid) first, then subscription (free)
    IF v_credits_paid > 0 THEN
        UPDATE email_credits
        SET credits_paid = credits_paid - 1,
            credits_total = credits_total - 1,
            updated_at = NOW()
        WHERE user_id = p_user_id;
        
        -- SYNC user_usage topup
        UPDATE user_usage
        SET topup_credits = topup_credits - 1,
            updated_at = NOW()
        WHERE user_id = p_user_id;
        
    ELSIF v_credits_free > 0 THEN
        UPDATE email_credits
        SET credits_free = credits_free - 1,
            credits_total = credits_total - 1,
            credits_used_this_month = COALESCE(credits_used_this_month, 0) + 1,
            updated_at = NOW()
        WHERE user_id = p_user_id;
        
        -- SYNC user_usage generations_used
        UPDATE user_usage
        SET generations_used = generations_used + 1,
            updated_at = NOW()
        WHERE user_id = p_user_id;
    ELSE
        RETURN FALSE; -- Out of credits
    END IF;

    RETURN TRUE;
END;
$$;

-- 3. Redefine add_topup_credits
CREATE OR REPLACE FUNCTION public.add_topup_credits(p_user_id UUID, p_credits INT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    -- Update user_usage
    UPDATE user_usage
    SET topup_credits = COALESCE(topup_credits, 0) + p_credits,
        updated_at = NOW()
    WHERE user_id = p_user_id;

    -- Update email_credits
    UPDATE email_credits
    SET credits_paid = COALESCE(credits_paid, 0) + p_credits,
        credits_total = COALESCE(credits_total, 0) + p_credits,
        updated_at = NOW()
    WHERE user_id = p_user_id;
    
    -- Ensure row exists
    IF NOT FOUND THEN
        INSERT INTO email_credits (user_id, credits_free, credits_paid, credits_total)
        VALUES (p_user_id, 0, p_credits, p_credits);
    END IF;
END;
$$;

-- 4. Redefine increment_user_generations (backward compatibility)
CREATE OR REPLACE FUNCTION public.increment_user_generations(user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NOT public.deduct_email_credit(user_id) THEN
    RAISE EXCEPTION 'Insufficient credits. Please purchase more credits to continue.';
  END IF;
END;
$$;

-- 5. Unified Credit Fetch RPC for Frontend
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
    -- Ensure user has a row in email_credits if they have one in user_usage
    -- Matches Dashboard logic for lazy initialization
    INSERT INTO email_credits (user_id, credits_free, credits_paid, credits_total)
    SELECT user_id, 20, 0, 20
    FROM user_usage
    WHERE user_id = auth.uid()
    ON CONFLICT (user_id) DO NOTHING;

    RETURN QUERY
    SELECT 
        ec.credits_total::INT,
        ec.credits_free::INT,
        ec.credits_paid::INT,
        ec.credits_used_this_month::INT,
        uu.plan,
        uu.subscription_status
    FROM email_credits ec
    JOIN user_usage uu ON ec.user_id = uu.user_id
    WHERE ec.user_id = auth.uid();
END;
$$;

-- 6. Initialize Safe Free Trial (Ensures 20 credits)
CREATE OR REPLACE FUNCTION public.initialize_free_trial()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    INSERT INTO user_usage (user_id, plan, generations_limit, generations_used, subscription_status, topup_credits)
    VALUES (auth.uid(), 'trial', 20, 0, 'active', 0)
    ON CONFLICT (user_id) DO NOTHING;

    INSERT INTO email_credits (user_id, credits_free, credits_paid, credits_total)
    VALUES (auth.uid(), 20, 0, 20)
    ON CONFLICT (user_id) DO NOTHING;
END;
$$;

-- 7. Credit Recovery/Fix Script RPC
CREATE OR REPLACE FUNCTION public.recover_my_credits()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_result JSON;
BEGIN
    INSERT INTO email_credits (user_id, credits_free, credits_paid, credits_total)
    SELECT user_id, GREATEST(0, generations_limit - generations_used), topup_credits, GREATEST(0, generations_limit - generations_used) + topup_credits
    FROM user_usage
    WHERE user_id = auth.uid()
    ON CONFLICT (user_id) DO UPDATE SET
        credits_free = EXCLUDED.credits_free,
        credits_paid = EXCLUDED.credits_paid,
        credits_total = EXCLUDED.credits_total,
        updated_at = NOW();

    SELECT row_to_json(t) INTO v_result
    FROM (SELECT * FROM email_credits WHERE user_id = auth.uid()) t;
    
    RETURN v_result;
END;
$$;

-- 8. Final Onboarding Trigger Update (20 credits)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, app_role, onboarding_completed)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'user',
    false
  )
  ON CONFLICT (id) DO NOTHING;
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user'::public.app_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  -- Initial 20 trial credits
  INSERT INTO public.user_usage (user_id, plan, generations_limit, generations_used, subscription_status, topup_credits)
  VALUES (NEW.id, 'trial', 20, 0, 'active', 0)
  ON CONFLICT (user_id) DO NOTHING;
  
  INSERT INTO public.email_credits (user_id, credits_free, credits_paid, credits_total)
  VALUES (NEW.id, 20, 0, 20)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- 9. Master Sync RPC: Synchronizes email_credits with user_usage
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
    -- 1. Get source data from user_usage
    SELECT * INTO v_usage FROM public.user_usage WHERE user_id = p_user_id;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('error', 'User usage record not found');
    END IF;

    -- 2. Upsert into email_credits
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

-- 10. Global Reset RPC: Reset all users whose billing period has ended
CREATE OR REPLACE FUNCTION public.reset_all_expired_credits()
RETURNS TABLE (reset_count INT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_count INT := 0;
BEGIN
    -- 1. Identify users to reset in user_usage
    WITH to_reset AS (
        UPDATE public.user_usage
        SET 
            generations_used = 0,
            current_period_end = current_period_end + INTERVAL '1 month',
            updated_at = NOW()
        WHERE current_period_end < NOW()
          AND subscription_status IN ('active', 'trial')
          AND plan != 'free'
        RETURNING user_id
    )
    -- 2. Sync email_credits for those users
    INSERT INTO public.email_credits (user_id, credits_free, credits_paid, credits_total, credits_used_this_month, last_reset_at, updated_at)
    SELECT 
        uu.user_id,
        uu.generations_limit,
        COALESCE(uu.topup_credits, 0),
        uu.generations_limit + COALESCE(uu.topup_credits, 0),
        0,
        NOW(),
        NOW()
    FROM public.user_usage uu
    JOIN to_reset tr ON uu.user_id = tr.user_id
    ON CONFLICT (user_id) DO UPDATE SET
        credits_free = EXCLUDED.credits_free,
        credits_paid = EXCLUDED.credits_paid,
        credits_total = EXCLUDED.credits_total,
        credits_used_this_month = 0,
        last_reset_at = NOW(),
        updated_at = NOW();

    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN QUERY SELECT v_count;
END;
$$;
