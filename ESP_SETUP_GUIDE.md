# ESP Integration Setup Guide

## Step 1: Run Database Schema

1. Open Supabase Dashboard → SQL Editor
2. Copy the contents of `ESP_DATABASE_SCHEMA.sql`
3. Paste and click "Run"
4. Verify all tables were created successfully

## Step 2: Set up Resend

1. **Sign up for Resend**:
   - Go to https://resend.com
   - Create a free account (no credit card required)
   - You get 100 emails/day free forever

2. **Get API Key**:
   - In Resend Dashboard → API Keys
   - Click "Create API Key"
   - Copy the key (starts with `re_`)

3. **Add to Supabase**:
   - Supabase Dashboard → Project Settings → Edge Functions
   - Scroll to "Secrets"
   - Add new secret:
     - Name: `RESEND_API_KEY`
     - Value: Your Resend API key
   - Click "Save"

## Step 3: Deploy Edge Functions

Run these commands in your terminal:

```bash
# Navigate to project directory
cd c:\Users\vijay\Downloads\Mailit1\Mailit

# Deploy send-campaign function
npx supabase functions deploy send-campaign

# Deploy send-worker function
npx supabase functions deploy send-worker
```

## Step 4: Update TypeScript Types

1. In Supabase Dashboard → Project Settings → API
2. Scroll to "TypeScript Types"
3. Click "Generate Types"
4. Copy the generated types
5. Replace contents of `src/integrations/supabase/types.ts`

## Step 5: Test the Feature

1. Start your dev server: `npm run dev`
2. Navigate to `/contacts`
3. Import a CSV with test contacts (or create a list manually)
4. Go to a campaign
5. Click "Send Campaign" (button will be added in Week 3)

## Troubleshooting

### TypeScript Errors
- Make sure you've updated the Supabase types (Step 4)
- Restart your dev server

### "Resend API Key not found"
- Check that you added `RESEND_API_KEY` to Supabase secrets
- Redeploy the Edge Functions

### Emails not sending
- Check Supabase Edge Function logs
- Verify Resend API key is valid
- Check email_sends table for error messages

## Next Steps

Once this is working, we'll build:
- Week 3: Send Campaign UI
- Week 4: Email analytics & billing
