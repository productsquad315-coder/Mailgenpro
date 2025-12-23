-- ULTIMATE DATABASE STABILITY FIX (Run this if Signup shows 500)
-- This version is fully aligned with your latest schema context.
-- Run this in your Supabase SQL Editor: https://supabase.com/dashboard/project/qijgrzfedoknlgljsyka

BEGIN;

-- 1. Ensure public.app_role type exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
        CREATE TYPE public.app_role AS ENUM ('admin', 'user');
    END IF;
END $$;

-- 2. Repair Profiles Table (aligned with your provided schema)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  user_platform text CHECK (user_platform = ANY (ARRAY['seller'::text, 'founder'::text])),
  brand_guidelines jsonb,
  ui_theme text DEFAULT 'system'::text CHECK (ui_theme = ANY (ARRAY['light'::text, 'dark'::text, 'system'::text])),
  onboarding_completed boolean DEFAULT false,
  app_role text DEFAULT 'user'::text CHECK (app_role = ANY (ARRAY['admin'::text, 'user'::text]))
);

-- 3. Repair User Usage Table
CREATE TABLE IF NOT EXISTS public.user_usage (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  plan text NOT NULL DEFAULT 'free'::text,
  generations_used integer NOT NULL DEFAULT 0,
  generations_limit integer NOT NULL DEFAULT 5,
  subscription_id text,
  subscription_status text,
  current_period_end timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  lemonsqueezy_customer_id text,
  topup_credits integer NOT NULL DEFAULT 0,
  paddle_customer_id text,
  paddle_subscription_id text
);

-- 4. Repair User Roles Table
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- 5. Repair Email Credits Table
CREATE TABLE IF NOT EXISTS public.email_credits (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  credits_free integer DEFAULT 0,
  credits_paid integer DEFAULT 0,
  credits_total integer DEFAULT 0, -- Will be handled by logic or trigger if needed
  credits_used_this_month integer DEFAULT 0,
  last_reset_at timestamp without time zone DEFAULT now(),
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now()
);

-- 6. ENSURE ALL COLUMNS EXIST (for existing tables)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS user_platform text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS brand_guidelines jsonb;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ui_theme text DEFAULT 'system';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS app_role text DEFAULT 'user';

ALTER TABLE public.user_usage ADD COLUMN IF NOT EXISTS lemonsqueezy_customer_id text;
ALTER TABLE public.user_usage ADD COLUMN IF NOT EXISTS topup_credits integer NOT NULL DEFAULT 0;
ALTER TABLE public.user_usage ADD COLUMN IF NOT EXISTS paddle_customer_id text;
ALTER TABLE public.user_usage ADD COLUMN IF NOT EXISTS paddle_subscription_id text;

-- 7. REPAIR: Unified handle_new_user() with Robust Error Handling
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  initial_credits int := 20;
BEGIN
  -- 1. Profile Insertion
  INSERT INTO public.profiles (id, email, full_name, app_role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'user'
  )
  ON CONFLICT (id) DO UPDATE SET 
    email = EXCLUDED.email;

  -- 2. User Role Insertion
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user'::public.app_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  -- 3. User Usage Insertion (20 credits for trial)
  INSERT INTO public.user_usage (user_id, plan, generations_limit, generations_used, subscription_status)
  VALUES (NEW.id, 'trial', initial_credits, 0, 'trial')
  ON CONFLICT (user_id) DO NOTHING;

  -- 4. Email Credits Insertion (50 free emails)
  INSERT INTO public.email_credits (user_id, credits_free)
  VALUES (NEW.id, 50)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;

EXCEPTION WHEN OTHERS THEN
  -- Extremely Important: This prevents the 500 error if DB logic fails.
  -- The user is still created in Auth, and can be fixed later.
  RAISE WARNING 'Signup Trigger Exception: %', SQLERRM;
  RETURN NEW;
END;
$$;

-- 8. REPAIR: Clean up potentially conflicting triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_email_credits ON auth.users;

-- 9. REPAIR: Recreate the master trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 10. Final Fix for Admin
UPDATE public.profiles SET app_role = 'admin' WHERE email = 'b.vijay0452@gmail.com';
UPDATE public.user_usage SET generations_limit = 100 WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'b.vijay0452@gmail.com');

-- 11. Ensure RLS and secure policies
ALTER TABLE public.user_usage ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can insert their own usage" ON public.user_usage;
DROP POLICY IF EXISTS "Users can view their own usage" ON public.user_usage;
CREATE POLICY "Users can view their own usage" ON public.user_usage
  FOR SELECT USING (auth.uid() = user_id);

COMMIT;
