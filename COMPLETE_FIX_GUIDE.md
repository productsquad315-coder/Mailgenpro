# Complete System Fix Guide

## STEP 1: Fix Database (CRITICAL - Do This First!)

### Run this SQL in Supabase Dashboard:

1. Go to: https://supabase.com/dashboard/project/qijgrzfedoknlgljsyka
2. Click **SQL Editor** in left sidebar
3. Click **New Query**
4. Copy and paste the contents of `FIX_ADMIN_ACCESS.sql`
5. Click **Run**

**Expected Result:**
- You should see your profile with `app_role = 'admin'`
- `topup_credits = 100`
- `total_available` shows your available credits

---

## STEP 2: Deploy Edge Functions

### Option A: Using Supabase CLI (if logged in)

```bash
# Login to Supabase
npx supabase login

# Link to your project
npx supabase link --project-ref qijgrzfedoknlgljsyka

# Deploy all functions
npx supabase functions deploy generate-campaign
npx supabase functions deploy improve-email
npx supabase functions deploy translate-campaign  
npx supabase functions deploy paddle-webhook
npx supabase functions deploy reset-monthly-credits
```

### Option B: Manual Deployment via Dashboard

1. Go to: https://supabase.com/dashboard/project/qijgrzfedoknlgljsyka/functions
2. Click **Deploy new function**
3. Upload each function folder from `supabase/functions/`

---

## STEP 3: Set Environment Secrets

### Required Secrets:

```bash
# Set OpenAI API Key (CRITICAL for campaign generation)
npx supabase secrets set OPENAI_API_KEY=sk-your-key-here

# Set Paddle Webhook Secret
npx supabase secrets set PADDLE_WEBHOOK_SECRET=your-webhook-secret

# Verify secrets are set
npx supabase secrets list
```

**OR** set them in Supabase Dashboard:
1. Go to Project Settings → Edge Functions
2. Add secrets there

---

## STEP 4: Verify Everything Works

### Test 1: Admin Access
1. Go to: http://localhost:8080/admin
2. Search for: b.vijay0452@gmail.com
3. You should see your profile with credits

### Test 2: Campaign Generation
1. Go to: http://localhost:8080/create-campaign
2. Create a 4-email campaign
3. All 4 emails should generate (not just 1)

### Test 3: Export
1. Open a completed campaign
2. Click "Export HTML"
3. Verify ZIP contains all emails with CTAs

---

## Troubleshooting

### Issue: Admin panel shows "Access Denied"
**Solution**: Run the SQL in STEP 1 again

### Issue: Only 1 email generates
**Cause**: Edge Function error or OpenAI API issue
**Solution**: 
1. Check Edge Function logs:
   ```bash
   npx supabase functions logs generate-campaign --follow
   ```
2. Verify OPENAI_API_KEY is set
3. Check OpenAI account has credits

### Issue: "Campaign not found" error
**Cause**: Edge Functions not deployed
**Solution**: Deploy functions (STEP 2)

### Issue: Cannot deploy functions
**Cause**: Not logged in to Supabase CLI
**Solution**: Run `npx supabase login` first

---

## Quick Verification Commands

```bash
# Check if logged in to Supabase
npx supabase status

# List deployed functions
npx supabase functions list

# Check function logs
npx supabase functions logs generate-campaign --tail 50

# List secrets
npx supabase secrets list
```

---

## What Each Fix Does:

1. **FIX_ADMIN_ACCESS.sql**: 
   - Adds `app_role` column
   - Makes you admin
   - Gives you 100 credits

2. **Edge Functions Deployment**:
   - Deploys campaign generation logic
   - Enables email improvement
   - Sets up payment webhooks

3. **Environment Secrets**:
   - Connects to OpenAI for email generation
   - Secures Paddle webhook endpoint

---

## Expected Timeline:

- **STEP 1**: 2 minutes (run SQL)
- **STEP 2**: 5-10 minutes (deploy functions)
- **STEP 3**: 2 minutes (set secrets)
- **STEP 4**: 5 minutes (testing)

**Total**: ~15-20 minutes

---

## After Fixes, You Should Have:

✅ Admin access at /admin
✅ 100 credits in your account
✅ All 4 emails generate in campaigns
✅ HTML export works with CTAs
✅ Payment flow functional (if Paddle configured)
