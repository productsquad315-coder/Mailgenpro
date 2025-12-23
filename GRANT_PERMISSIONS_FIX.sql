-- FINAL FIX: Grant permissions and fix search_path
-- The table EXISTS but the trigger can't access it!

BEGIN;

-- 1. Grant appropriate permissions
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.user_usage TO authenticated;
GRANT SELECT ON public.user_roles TO authenticated;
GRANT SELECT ON public.email_credits TO authenticated;

-- Service role needs full access for triggers/admin
GRANT ALL ON public.profiles TO postgres, service_role;
GRANT ALL ON public.user_usage TO postgres, service_role;
GRANT ALL ON public.user_roles TO postgres, service_role;
GRANT ALL ON public.email_credits TO postgres, service_role;

-- 2. Grant USAGE on sequences (for auto-increment IDs)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- 3. Drop and recreate the trigger function with correct search_path
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
SECURITY DEFINER
-- CRITICAL: Set search_path to include both public and auth schemas
SET search_path = public, auth
LANGUAGE plpgsql
AS $$
BEGIN
    -- Insert into profiles
    INSERT INTO public.profiles (id, email, full_name, app_role, onboarding_completed)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        'user',
        false
    )
    ON CONFLICT (id) DO NOTHING;
    
    -- Insert into user_roles
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user'::public.app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
    
    -- Insert into user_usage (THE TABLE THAT EXISTS BUT TRIGGER CAN'T SEE)
    INSERT INTO public.user_usage (
        user_id, 
        plan, 
        generations_limit, 
        generations_used, 
        subscription_status,
        topup_credits
    )
    VALUES (NEW.id, 'trial', 20, 0, 'trial', 0)
    ON CONFLICT (user_id) DO NOTHING;
    
    -- Insert into email_credits
    INSERT INTO public.email_credits (user_id, credits_free)
    VALUES (NEW.id, 50)
    ON CONFLICT (user_id) DO NOTHING;
    
    RETURN NEW;
END;
$$;

-- 4. Recreate the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- 5. Verify the trigger exists and is enabled
SELECT 
    tgname as trigger_name,
    tgenabled as enabled,
    CASE tgenabled 
        WHEN 'O' THEN 'ENABLED'
        ELSE 'DISABLED'
    END as status
FROM pg_trigger 
WHERE tgrelid = 'auth.users'::regclass
    AND tgname = 'on_auth_user_created';

COMMIT;
