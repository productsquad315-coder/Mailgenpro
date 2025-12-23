-- Secure user_usage table by removing client-side INSERT policies
-- This ensures that only the database trigger can create usage records

-- 1. Explicitly drop the insecure INSERT policy
DROP POLICY IF EXISTS "Users can insert their own usage" ON public.user_usage;

-- 2. Ensure Row Level Security is enabled on all critical tables
ALTER TABLE public.user_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_credits ENABLE ROW LEVEL SECURITY;

-- 3. Verify that SELECT policies remain for user convenience
-- (These should already exist from previous migrations, but we ensure they are active)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_usage' 
        AND policyname = 'Users can view their own usage'
    ) THEN
        CREATE POLICY "Users can view their own usage" ON public.user_usage
            FOR SELECT USING (auth.uid() = user_id);
    END IF;
END $$;
