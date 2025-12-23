-- IMMEDIATE FIX: Disable the broken trigger
-- This allows users to sign up RIGHT NOW
-- We'll handle profile creation differently

BEGIN;

-- Drop the broken trigger completely
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_email_credits ON auth.users;

-- Drop the function too
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

COMMIT;

-- USERS CAN NOW SIGN UP!
-- The user will be created in auth.users
-- We'll create profiles via the frontend or a different mechanism
