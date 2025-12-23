-- FINAL FIX: Create ALL Missing Tables
-- Root Cause: Tables don't exist in your database!
-- Error: "relation user_usage does not exist"
-- Run this ENTIRE script in Supabase SQL Editor

BEGIN;

-- 1. Create app_role enum type
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
        CREATE TYPE public.app_role AS ENUM ('admin', 'user');
    END IF;
END $$;

-- 2. Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email text NOT NULL,
    full_name text,
    avatar_url text,
    user_platform text CHECK (user_platform = ANY (ARRAY['seller'::text, 'founder'::text])),
    brand_guidelines jsonb,
    ui_theme text DEFAULT 'system'::text CHECK (ui_theme = ANY (ARRAY['light'::text, 'dark'::text, 'system'::text])),
    onboarding_completed boolean DEFAULT false,
    app_role text DEFAULT 'user'::text CHECK (app_role = ANY (ARRAY['admin'::text, 'user'::text])),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Create user_roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role public.app_role NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE(user_id, role)
);

-- 4. Create user_usage table (THE MISSING TABLE!)
CREATE TABLE IF NOT EXISTS public.user_usage (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    plan text NOT NULL DEFAULT 'free'::text,
    generations_used integer NOT NULL DEFAULT 0,
    generations_limit integer NOT NULL DEFAULT 5,
    subscription_id text,
    subscription_status text,
    current_period_end timestamptz,
    lemonsqueezy_customer_id text,
    topup_credits integer NOT NULL DEFAULT 0,
    paddle_customer_id text,
    paddle_subscription_id text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- 5. Create email_credits table
CREATE TABLE IF NOT EXISTS public.email_credits (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    credits_free integer DEFAULT 0,
    credits_paid integer DEFAULT 0,
    credits_used_this_month integer DEFAULT 0,
    last_reset_at timestamptz DEFAULT now(),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 6. Create campaigns table (needed for foreign keys)
CREATE TABLE IF NOT EXISTS public.campaigns (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    name text NOT NULL,
    url text NOT NULL,
    status text NOT NULL DEFAULT 'pending'::text,
    analyzed_data jsonb,
    sequence_type text,
    drip_duration text,
    words_per_email integer DEFAULT 250 CHECK (words_per_email >= 50 AND words_per_email <= 500),
    include_cta boolean DEFAULT true,
    cta_link text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- 7. Create email_sequences table
CREATE TABLE IF NOT EXISTS public.email_sequences (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id uuid NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
    sequence_number integer NOT NULL,
    subject text NOT NULL,
    content text NOT NULL,
    html_content text NOT NULL,
    email_type text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- 8. Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_sequences ENABLE ROW LEVEL SECURITY;

-- 9. Create RLS policies for profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can view their own usage" ON public.user_usage;
CREATE POLICY "Users can view their own usage" ON public.user_usage
    FOR SELECT USING (auth.uid() = user_id);

-- 11. Create RLS policies for campaigns
DROP POLICY IF EXISTS "Users can view their own campaigns" ON public.campaigns;
CREATE POLICY "Users can view their own campaigns" ON public.campaigns
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own campaigns" ON public.campaigns;
CREATE POLICY "Users can create their own campaigns" ON public.campaigns
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own campaigns" ON public.campaigns;
CREATE POLICY "Users can update their own campaigns" ON public.campaigns
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own campaigns" ON public.campaigns;
CREATE POLICY "Users can delete their own campaigns" ON public.campaigns
    FOR DELETE USING (auth.uid() = user_id);

-- 12. Drop all existing triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_email_credits ON auth.users;

-- 13. Create the trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, app_role, onboarding_completed)
    VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), 'user', false);
    
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user'::public.app_role);
    
    INSERT INTO public.user_usage (user_id, plan, generations_limit, generations_used, subscription_status)
    VALUES (NEW.id, 'trial', 20, 0, 'trial');
    
    INSERT INTO public.email_credits (user_id, credits_free)
    VALUES (NEW.id, 50);
    
    RETURN NEW;
END;
$$;

-- 14. Create the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- 15. Set admin user
UPDATE public.profiles SET app_role = 'admin' WHERE email = 'b.vijay0452@gmail.com';
UPDATE public.user_usage SET generations_limit = 100000, plan = 'agency' 
WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'b.vijay0452@gmail.com');

COMMIT;

-- Verify tables exist
SELECT 
    table_name,
    table_schema
FROM information_schema.tables 
WHERE table_schema = 'public'
    AND table_name IN ('profiles', 'user_usage', 'user_roles', 'email_credits', 'campaigns', 'email_sequences')
ORDER BY table_name;
