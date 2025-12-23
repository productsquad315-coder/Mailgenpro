-- DEFINITIVE ROOT CAUSE FIX
-- This script diagnoses AND fixes the real issue causing 500 errors
-- Run this ENTIRE script in Supabase SQL Editor

-- ============================================
-- PART 1: DIAGNOSTIC - Find the Real Problem
-- ============================================

-- Check if trigger exists and is enabled
SELECT 
    tgname as trigger_name,
    tgenabled as enabled,
    pg_get_triggerdef(oid) as definition
FROM pg_trigger 
WHERE tgrelid = 'auth.users'::regclass;

-- Check if function exists
SELECT 
    proname as function_name,
    prosecdef as is_security_definer
FROM pg_proc 
WHERE proname = 'handle_new_user';

-- Check if tables exist
SELECT 
    table_name,
    table_schema
FROM information_schema.tables 
WHERE table_name IN ('profiles', 'user_usage', 'user_roles', 'email_credits')
    AND table_schema = 'public';

-- Check if app_role type exists
SELECT 
    typname,
    typnamespace::regnamespace as schema
FROM pg_type 
WHERE typname = 'app_role';

-- ============================================
-- PART 2: THE REAL FIX
-- ============================================

BEGIN;

-- 1. Create app_role type if missing (in public schema explicitly)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type 
        WHERE typname = 'app_role' 
        AND typnamespace = 'public'::regnamespace
    ) THEN
        CREATE TYPE public.app_role AS ENUM ('admin', 'user');
    END IF;
END $$;

-- 2. Ensure all tables exist with correct structure
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email text NOT NULL,
    full_name text,
    avatar_url text,
    user_platform text,
    brand_guidelines jsonb,
    ui_theme text DEFAULT 'system',
    onboarding_completed boolean DEFAULT false,
    app_role text DEFAULT 'user',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role public.app_role NOT NULL,
    created_at timestamptz DEFAULT now(),
    UNIQUE(user_id, role)
);

CREATE TABLE IF NOT EXISTS public.user_usage (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    plan text DEFAULT 'free',
    generations_used int DEFAULT 0,
    generations_limit int DEFAULT 5,
    topup_credits int DEFAULT 0,
    subscription_id text,
    subscription_status text,
    current_period_end timestamptz,
    lemonsqueezy_customer_id text,
    paddle_customer_id text,
    paddle_subscription_id text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.email_credits (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    credits_free int DEFAULT 0,
    credits_paid int DEFAULT 0,
    credits_used_this_month int DEFAULT 0,
    last_reset_at timestamptz DEFAULT now(),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 3. CRITICAL: Disable RLS temporarily for trigger operations
-- The trigger needs to bypass RLS to insert records
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_credits ENABLE ROW LEVEL SECURITY;

-- 4. Grant explicit permissions
-- No direct INSERT for authenticated role on user_usage
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.user_roles TO authenticated;
GRANT SELECT ON public.user_usage TO authenticated;
GRANT SELECT ON public.email_credits TO authenticated;

-- Grant ALL to service_role (used by triggers and edge functions)
GRANT ALL ON public.profiles TO service_role;
GRANT ALL ON public.user_roles TO service_role;
GRANT ALL ON public.user_usage TO service_role;
GRANT ALL ON public.email_credits TO service_role;

-- 5. Drop ALL existing triggers to avoid conflicts
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_email_credits ON auth.users;
DROP TRIGGER IF EXISTS create_profile_on_signup ON auth.users;
DROP TRIGGER IF EXISTS handle_new_user_trigger ON auth.users;

-- 6. Create the SIMPLEST possible trigger function
-- No fancy error handling - let it fail loudly so we can see the real error
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    -- Insert profile
    INSERT INTO public.profiles (id, email, full_name, app_role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        'user'
    );
    
    -- Insert user role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user'::public.app_role);
    
    -- Insert usage
    INSERT INTO public.user_usage (user_id, plan, generations_limit)
    VALUES (NEW.id, 'trial', 20);
    
    -- Insert email credits
    INSERT INTO public.email_credits (user_id, credits_free)
    VALUES (NEW.id, 50);
    
    RETURN NEW;
END;
$$;

-- 7. Create the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- 8. Set admin privileges
UPDATE public.profiles 
SET app_role = 'admin' 
WHERE email = 'b.vijay0452@gmail.com';

UPDATE public.user_usage 
SET generations_limit = 100000 
WHERE user_id IN (
    SELECT id FROM auth.users WHERE email = 'b.vijay0452@gmail.com'
);

COMMIT;

-- ============================================
-- PART 3: VERIFICATION
-- ============================================

-- Verify trigger is active
SELECT 
    tgname,
    tgenabled,
    CASE tgenabled 
        WHEN 'O' THEN 'ENABLED'
        WHEN 'D' THEN 'DISABLED'
        ELSE 'UNKNOWN'
    END as status
FROM pg_trigger 
WHERE tgrelid = 'auth.users'::regclass
    AND tgname = 'on_auth_user_created';
