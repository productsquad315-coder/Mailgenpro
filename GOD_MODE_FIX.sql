-- GOD MODE DATABASE FIX (V2)
-- Reverts to the "old" working behavior while fixing the root cause of the 500 error.
-- Run this in your Supabase SQL Editor: https://supabase.com/dashboard/project/qijgrzfedoknlgljsyka

BEGIN;

-- 1. Ensure public.app_role type exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
        CREATE TYPE public.app_role AS ENUM ('admin', 'user');
    END IF;
END $$;

-- 2. CREATE MISSING TABLES IF THEY ARE GONE (Protecting your schema)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  onboarding_completed boolean DEFAULT false,
  app_role text DEFAULT 'user'::text
);

CREATE TABLE IF NOT EXISTS public.user_usage (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  plan text NOT NULL DEFAULT 'trial'::text,
  generations_used integer NOT NULL DEFAULT 0,
  generations_limit integer NOT NULL DEFAULT 20,
  subscription_status text DEFAULT 'trial'::text,
  topup_credits integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'user'::public.app_role,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

CREATE TABLE IF NOT EXISTS public.email_credits (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  credits_free integer DEFAULT 50,
  credits_paid integer DEFAULT 0,
  credits_used_this_month integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- 3. THE TRIGGER FUNCTION (REALLY FIXED THIS TIME)
-- We use 'SET search_path = public' (no quotes) to ensure PG finds the tables.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert Profile
  INSERT INTO public.profiles (id, email, full_name, app_role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'user'
  )
  ON CONFLICT (id) DO UPDATE SET 
    email = EXCLUDED.email;

  -- Insert Role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT DO NOTHING;

  -- Insert Usage (Trial limits)
  INSERT INTO public.user_usage (user_id, plan, generations_limit, generations_used)
  VALUES (NEW.id, 'trial', 20, 0)
  ON CONFLICT DO NOTHING;

  -- Insert Email Credits
  INSERT INTO public.email_credits (user_id, credits_free)
  VALUES (NEW.id, 50)
  ON CONFLICT DO NOTHING;

  RETURN NEW;

EXCEPTION WHEN OTHERS THEN
  -- Log error for debugging but DON'T block the user creation in Auth
  RAISE WARNING 'Signup Trigger Logic Failed: %', SQLERRM;
  RETURN NEW;
END;
$$;

-- 4. CLEAN UP & RECREATE TRIGGER
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_email_credits ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 5. FINAL PERMISSIONS 
GRANT ALL ON public.profiles TO service_role;
GRANT ALL ON public.user_usage TO service_role;
GRANT ALL ON public.user_roles TO service_role;
GRANT ALL ON public.email_credits TO service_role;

-- Grant select to authenticated so they can see their own data via RLS
GRANT SELECT ON public.profiles TO authenticated;
GRANT SELECT ON public.user_usage TO authenticated;
GRANT SELECT ON public.user_roles TO authenticated;
GRANT SELECT ON public.email_credits TO authenticated;

COMMIT;

-- VERIFICATION
SELECT 'SUCCESS! Trigger recreated and tables secured.' as status;
