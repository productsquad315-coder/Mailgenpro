-- DEBUGGING LOGS
-- Create a table to track credit deduction attempts

CREATE TABLE IF NOT EXISTS public.debug_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    log_text text,
    created_at timestamp DEFAULT now()
);

-- Update deduct function to log
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
    -- Ignore logging errors
    NULL;
  END;

  SELECT generations_limit, topup_credits, generations_used
  INTO v_limit, v_topup, v_used
  FROM public.user_usage
  WHERE user_id = p_user_id;
  
  -- Handle missing record without logging to keep it safe
  IF NOT FOUND THEN
     INSERT INTO public.user_usage (user_id, plan, generations_limit, generations_used, topup_credits)
     VALUES (p_user_id, 'trial', 20, 1, 0);
     RETURN true;
  END IF;

  v_limit := COALESCE(v_limit, 20);
  v_topup := COALESCE(v_topup, 0);
  v_used := COALESCE(v_used, 0);

  BEGIN
    INSERT INTO public.debug_logs (log_text) VALUES ('State: ' || v_limit::text || '/' || v_topup::text || '/' || v_used::text);
  EXCEPTION WHEN OTHERS THEN NULL; END;

  IF (v_limit + v_topup) > v_used THEN
    UPDATE public.user_usage
    SET generations_used = generations_used + 1,
        updated_at = now()
    WHERE user_id = p_user_id;
    
    INSERT INTO public.debug_logs (log_text) VALUES ('Deduction SUCCESS. New Used=' || (v_used + 1));
    RETURN true;
  ELSE
    INSERT INTO public.debug_logs (log_text) VALUES ('Deduction FAILED. Insufficient credits.');
    RETURN false;
  END IF;
END;
$$;

-- Grant access to log table
GRANT ALL ON public.debug_logs TO postgres, service_role, authenticated, anon;
