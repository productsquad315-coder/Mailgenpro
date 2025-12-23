-- ABSOLUTE ROOT CAUSE DIAGNOSTIC
-- Run this to see EXACTLY what's wrong

-- 1. Check if trigger exists and what function it's calling
SELECT 
    t.tgname as trigger_name,
    t.tgenabled as enabled,
    p.proname as function_name,
    pg_get_functiondef(p.oid) as function_definition
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE t.tgrelid = 'auth.users'::regclass
    AND t.tgname = 'on_auth_user_created';

-- 2. Check EXACTLY what search_path the function is using
SELECT 
    proname,
    proconfig
FROM pg_proc 
WHERE proname = 'handle_new_user';

-- 3. Test if the function can actually see user_usage
-- This simulates what happens during signup
DO $$
DECLARE
    test_id uuid := gen_random_uuid();
BEGIN
    -- Try to insert like the trigger does
    SET search_path = public, pg_temp;
    
    INSERT INTO user_usage (user_id, plan, generations_limit)
    VALUES (test_id, 'test', 1);
    
    -- Clean up
    DELETE FROM user_usage WHERE user_id = test_id;
    
    RAISE NOTICE 'SUCCESS: Function CAN see user_usage table';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'FAILED: %', SQLERRM;
END $$;
