-- DIAGNOSTIC: Check what tables actually exist in your database
-- Run this first to see what's there

-- 1. List all tables in public schema
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- 2. Check if user_usage exists specifically
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'user_usage'
) as user_usage_exists;

-- 3. Check all triggers on auth.users
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'users'
    AND event_object_schema = 'auth';

-- 4. If the script above shows user_usage does NOT exist, run this:
-- (Copy from here down and run as a separate query)

CREATE TABLE public.user_usage (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    plan text NOT NULL DEFAULT 'free',
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

-- Enable RLS
ALTER TABLE public.user_usage ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY "Users can view their own usage" ON public.user_usage
    FOR SELECT USING (auth.uid() = user_id);

-- Verify it was created
SELECT tablename FROM pg_tables WHERE tablename = 'user_usage' AND schemaname = 'public';
