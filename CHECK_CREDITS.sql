-- Check your current actual credit balance
SELECT 
    user_id,
    plan,
    generations_limit as limit,
    generations_used as used,
    topup_credits as topup,
    (generations_limit + topup_credits - generations_used) as available_credits,
    created_at,
    updated_at
FROM user_usage 
WHERE user_id = '59a4c609-4b84-4ec0-83bd-72342d9d17f8';

-- Also check what get_my_credits returns
SELECT * FROM get_my_credits();
