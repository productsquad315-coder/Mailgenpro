-- migration/20251227000000_sync_credits.sql
-- Unified Credit Synchronization for Mailgenpro

-- 1. Redefine deduct_email_credit as the primary deduction RPC
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
    -- 1. Sync check: Check and reset monthly credits if needed (matches user_usage logic)
    -- This ensures email_credits is reset alongside user_usage
    UPDATE user_usage
    SET 
        generations_used = 0,
        current_period_end = NOW() + INTERVAL '1 month',
        updated_at = NOW()
    WHERE user_id = p_user_id
      AND current_period_end < NOW()
      AND subscription_status IN ('active', 'trial')
      AND plan != 'free';

    -- 2. Deduct from email_credits
    -- Get current values
    SELECT credits_free, credits_paid INTO v_credits_free, v_credits_paid
    FROM email_credits
    WHERE user_id = p_user_id;

    IF NOT FOUND THEN
        -- If missing, try to initialize from user_usage
        INSERT INTO email_credits (user_id, credits_free, credits_paid, credits_total)
        SELECT user_id, generations_limit - generations_used, topup_credits, (generations_limit - generations_used) + topup_credits
        FROM user_usage
        WHERE user_id = p_user_id
        ON CONFLICT (user_id) DO NOTHING;
        
        SELECT credits_free, credits_paid INTO v_credits_free, v_credits_paid
        FROM email_credits
        WHERE user_id = p_user_id;
    END IF;

    -- Deduction logic: topup (paid) first, then subscription (free)
    -- This matches the priority in increment_user_generations
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

-- 2. Redefine add_topup_credits to sync with email_credits
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

-- 3. Redefine increment_user_generations to use the unified deduction
CREATE OR REPLACE FUNCTION public.increment_user_generations(user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Simply call the unified deduction function
  IF NOT public.deduct_email_credit(user_id) THEN
    RAISE EXCEPTION 'Insufficient credits. Please purchase more credits to continue.';
  END IF;
END;
$$;

-- 4. Unify handle_new_user to use consistent initial credits (50)
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
  
  -- Unify to 20 trial credits
  INSERT INTO public.user_usage (user_id, plan, generations_limit, generations_used, subscription_status, topup_credits)
  VALUES (NEW.id, 'trial', 20, 0, 'trial', 0)
  ON CONFLICT (user_id) DO NOTHING;
  
  INSERT INTO public.email_credits (user_id, credits_free, credits_paid, credits_total)
  VALUES (NEW.id, 20, 0, 20)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;
