-- ULTIMATE DIAGNOSTIC: Find where user_usage actually is
-- Run each section separately and report results

-- 1. Find ALL user_usage tables in ALL schemas
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE tablename = 'user_usage';

-- 2. Check what schema the trigger is using
SELECT 
    proname,
    prosrc,
    proconfig
FROM pg_proc 
WHERE proname = 'handle_new_user';

-- 3. List ALL tables in public schema
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- 4. Check if there's a schema issue with qualified names
SELECT 
    table_schema,
    table_name
FROM information_schema.tables
WHERE table_name LIKE '%usage%';
