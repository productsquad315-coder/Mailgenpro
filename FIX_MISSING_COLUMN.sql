-- FIX: Add missing updated_at column and fix deduct function
-- This is the root cause of why credits aren't deducting

-- 1. Add the missing column
ALTER TABLE public.user_usage 
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- 2. Fix the deduct function to not require updated_at (make it optional)
CREATE OR REPLACE FUNCTION deduct_email_credit(p_user_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_limit int;
  v_topup int;
  v_used int;
BEGIN
  -- Log attempts safely
  BEGIN
    INSERT INTO public.debug_logs (log_text) VALUES ('Attempting deduction for user: ' || p_user_id::text);
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  SELECT generations_limit, topup_credits, generations_used
  INTO v_limit, v_topup, v_used
  FROM public.user_usage
  WHERE user_id = p_user_id;
  
  -- Handle missing record
  IF NOT FOUND THEN
     INSERT INTO public.user_usage (user_id, plan, generations_limit, generations_used, topup_credits)
     VALUES (p_user_id, 'trial', 20, 1, 0);
     
     BEGIN
       INSERT INTO public.debug_logs (log_text) VALUES ('Created new record with 1 credit used');
     EXCEPTION WHEN OTHERS THEN NULL; END;
     
     RETURN true;
  END IF;

  v_limit := COALESCE(v_limit, 20);
  v_topup := COALESCE(v_topup, 0);
  v_used := COALESCE(v_used, 0);

  BEGIN
    INSERT INTO public.debug_logs (log_text) VALUES ('State: ' || v_limit::text || '/' || v_topup::text || '/' || v_used::text);
  EXCEPTION WHEN OTHERS THEN NULL; END;

  IF (v_limit + v_topup) > v_used THEN
    -- Update without updated_at to avoid column errors
    UPDATE public.user_usage
    SET generations_used = generations_used + 1
    WHERE user_id = p_user_id;
    
    BEGIN
      INSERT INTO public.debug_logs (log_text) VALUES ('Deduction SUCCESS. New Used=' || (v_used + 1)::text);
    EXCEPTION WHEN OTHERS THEN NULL; END;
    
    RETURN true;
  ELSE
    BEGIN
      INSERT INTO public.debug_logs (log_text) VALUES ('Deduction FAILED. Insufficient credits.');
    EXCEPTION WHEN OTHERS THEN NULL; END;
    
    RETURN false;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION deduct_email_credit(uuid) TO authenticated, service_role;
