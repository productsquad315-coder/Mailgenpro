-- NUCLEAR OPTION: Completely bypass the trigger
-- This will let users sign up while we debug

BEGIN;

-- 1. DISABLE the trigger temporarily
ALTER TABLE auth.users DISABLE TRIGGER on_auth_user_created;

-- 2. Verify trigger is disabled
SELECT 
    tgname,
    tgenabled,
    CASE tgenabled 
        WHEN 'O' THEN 'ENABLED'
        WHEN 'D' THEN 'DISABLED'
        ELSE 'OTHER'
    END as status
FROM pg_trigger 
WHERE tgrelid = 'auth.users'::regclass;

COMMIT;

-- NOW TRY SIGNUP - it should work (user will be created in auth.users)
-- After signup works, we can manually create the profile records
-- Then re-enable the trigger for future users
