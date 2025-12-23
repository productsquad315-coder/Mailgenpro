-- Fix the broken search_path in handle_new_user trigger
-- The October 23rd migration broke it by using 'public' as a string instead of a schema identifier

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp  -- FIXED: No quotes, proper schema list
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
  
  INSERT INTO public.user_usage (user_id, plan, generations_limit, generations_used, subscription_status, topup_credits)
  VALUES (NEW.id, 'trial', 20, 0, 'trial', 0)
  ON CONFLICT (user_id) DO NOTHING;
  
  INSERT INTO public.email_credits (user_id, credits_free, credits_paid)
  VALUES (NEW.id, 50, 0)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
