-- MANUAL TEST: Force call deduct_email_credit for your user
-- First, get your user ID:
SELECT id, email FROM auth.users LIMIT 5;

-- Then test deduction manually (replace YOUR_USER_ID with actual UUID from above):
-- SELECT deduct_email_credit('YOUR_USER_ID');

-- Check if it worked:
-- SELECT * FROM debug_logs ORDER BY created_at DESC;

-- Check current credit state:
-- SELECT user_id, generations_limit, generations_used, topup_credits 
-- FROM user_usage 
-- WHERE user_id = 'YOUR_USER_ID';
