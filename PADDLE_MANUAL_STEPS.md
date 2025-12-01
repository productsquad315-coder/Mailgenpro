# Manual Paddle Deployment Steps

Since the Supabase CLI authentication is not set up, please complete these steps manually in the Supabase dashboard:

## ✅ Completed
- Database migration pushed successfully (paddle_customer_id and paddle_subscription_id fields added)

## 🔧 Manual Steps Required

### Step 1: Set Webhook Secret

1. Go to **Supabase Dashboard**: https://supabase.com/dashboard/project/qijgrzfedoknlgljsyka
2. Navigate to **Settings** → **Edge Functions** → **Secrets**
3. Click **"Add new secret"**
4. Set:
   - **Name**: `PADDLE_WEBHOOK_SECRET`
   - **Value**: `ntfset_01kb7tv5k4mz414yt96qv635et`
5. Click **Save**

### Step 2: Deploy Paddle Webhook Function

**Option A: Via Supabase Dashboard**
1. Go to **Edge Functions** in your Supabase dashboard
2. Click **"Deploy new function"**
3. Upload the file: `supabase/functions/paddle-webhook/index.ts`
4. Function name: `paddle-webhook`

**Option B: Via CLI (if you can authenticate)**
```bash
# Login to Supabase
supabase login

# Link project
supabase link --project-ref qijgrzfedoknlgljsyka

# Deploy function
supabase functions deploy paddle-webhook
```

### Step 3: Configure Paddle Webhook URL

1. Go to **Paddle Dashboard**: https://vendors.paddle.com/
2. Navigate to **Developer Tools** → **Notifications**
3. Click **"Create notification destination"** or edit existing
4. Set **Destination URL** to:
   ```
   https://qijgrzfedoknlgljsyka.supabase.co/functions/v1/paddle-webhook
   ```
5. Enable these event types:
   - ✅ `transaction.completed`
   - ✅ `subscription.created`
   - ✅ `subscription.updated`
   - ✅ `subscription.canceled`
   - ✅ `subscription.paused`
   - ✅ `subscription.resumed`
6. Save the notification destination

### Step 4: Get Paddle Price IDs

1. In Paddle Dashboard, go to **Catalog** → **Products**
2. For each product you create, copy the **Price ID** (format: `pri_xxxxx`)
3. Add these to your `.env` file:

```env
# Subscription Plans
VITE_PADDLE_PRICE_STARTER_MONTHLY=pri_xxxxx
VITE_PADDLE_PRICE_STARTER_LIFETIME=pri_xxxxx
VITE_PADDLE_PRICE_PRO_MONTHLY=pri_xxxxx

# Credit Packs
VITE_PADDLE_PRICE_PACK_STARTER=pri_xxxxx
VITE_PADDLE_PRICE_PACK_GROWTH=pri_xxxxx
VITE_PADDLE_PRICE_PACK_PRO=pri_xxxxx
VITE_PADDLE_PRICE_PACK_AGENCY=pri_xxxxx
```

## Next Steps

Once you've completed the above steps:
1. Let me know, and I'll update all frontend components to use Paddle
2. We'll test the checkout flow
3. Deploy the updated frontend

## Quick Test

After deploying the webhook, you can test it by:
1. Making a test purchase in Paddle sandbox
2. Checking Supabase Edge Function logs:
   - Go to **Edge Functions** → **paddle-webhook** → **Logs**
   - You should see webhook events being received
