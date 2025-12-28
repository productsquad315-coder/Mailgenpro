-- Test what get_my_credits actually returns
SELECT * FROM get_my_credits();

-- Compare with raw data
SELECT 
    user_id,
    generations_limit,
    generations_used,
    topup_credits,
    (generations_limit + topup_credits - generations_used) as calculated_total
FROM user_usage 
WHERE user_id = '59a4c609-4b84-4ec0-83bd-72342d9d17f8';
