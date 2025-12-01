# Admin Setup & Troubleshooting Guide

## 1. Make Yourself Admin

### Option A: Run Migration (Recommended)
```bash
cd c:\Users\vijay\Downloads\Mailit1\Mailit
npx supabase db push
```

### Option B: Manual SQL in Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Run this query (replace with YOUR email):

```sql
-- Add app_role column if it doesn't exist
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS app_role TEXT DEFAULT 'user' CHECK (app_role IN ('admin', 'user'));

-- Make yourself admin (REPLACE WITH YOUR EMAIL!)
UPDATE profiles 
SET app_role = 'admin' 
WHERE email = 'your-email@example.com';

-- Verify it worked
SELECT id, email, app_role FROM profiles WHERE app_role = 'admin';
```

## 2. Add Credits to Yourself

Once you're admin:

1. Navigate to **http://localhost:8080/admin**
2. Search for your email
3. Add credits (e.g., 100)

## 3. Troubleshooting "Only 1 Email Generated"

This is likely an **OpenAI API issue**, not a credits issue. Check:

### A. Check Edge Function Logs
```bash
npx supabase functions logs generate-campaign --follow
```

### B. Verify OpenAI API Key
Check your `.env` file has:
```
OPENAI_API_KEY=sk-...
```

### C. Check Campaign Status
The campaign might be stuck in "analyzing" status. Check the database:

```sql
SELECT id, name, status, created_at 
FROM campaigns 
ORDER BY created_at DESC 
LIMIT 5;
```

If status is stuck on "analyzing", the Edge Function might have failed.

### D. Check Email Sequences Table
```sql
SELECT campaign_id, sequence_number, email_type, subject
FROM email_sequences
WHERE campaign_id = 'YOUR-CAMPAIGN-ID'
ORDER BY sequence_number;
```

If only 1 email exists, the generation partially failed.

## 4. Common Issues

### Issue: "Only 1 email generated instead of 4"
**Cause**: OpenAI API timeout or error during generation
**Solution**: 
- Check Edge Function logs for errors
- Verify OpenAI API key is valid
- Check OpenAI API quota/billing

### Issue: "Cannot access /admin"
**Cause**: app_role not set
**Solution**: Run the SQL above to set yourself as admin

### Issue: "Out of credits"
**Cause**: No credits in user_usage table
**Solution**: Use admin panel to add credits to yourself

## 5. Quick Test

After setting up admin access:

1. Go to `/admin`
2. Search for your email
3. You should see your credit balance
4. Add 100 credits
5. Try creating a new campaign
6. Check if all 4 emails generate

## Need More Help?

Check the Edge Function logs while creating a campaign to see the exact error.
