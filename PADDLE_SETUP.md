# Paddle Setup Guide for Seamlessemails

This guide will walk you through setting up Paddle for payment processing in Seamlessemails.

## Prerequisites

- Paddle account (you mentioned you already have one created)
- Access to Paddle Vendor Dashboard
- Supabase project access

---

## Step 1: Configure Products in Paddle Dashboard

### A. Create Subscription Products

1. Go to **Paddle Dashboard** → **Catalog** → **Products**
2. Click **"Create Product"**

#### Product 1: Starter Plan
- **Name**: Seamlessemails Starter
- **Description**: 150 email generation credits per month
- **Type**: Subscription
- **Prices**:
  - **Monthly**: $11.00 USD (recurring monthly)
  - **Lifetime**: $59.00 USD (one-time payment, recurring credits)

#### Product 2: Pro Plan
- **Name**: Seamlessemails Pro
- **Description**: 500 email generation credits per month with advanced features
- **Type**: Subscription
- **Price**: $29.00 USD (recurring monthly)

### B. Create One-Time Credit Pack Products

#### Product 3: Starter Pack
- **Name**: Starter Credit Pack
- **Description**: 40 one-time email generation credits
- **Type**: Standard (one-time)
- **Price**: $5.00 USD

#### Product 4: Growth Pack
- **Name**: Growth Credit Pack
- **Description**: 120 one-time email generation credits
- **Type**: Standard (one-time)
- **Price**: $12.00 USD

#### Product 5: Pro Pack
- **Name**: Pro Credit Pack
- **Description**: 300 one-time email generation credits
- **Type**: Standard (one-time)
- **Price**: $25.00 USD

#### Product 6: Agency Pack
- **Name**: Agency Credit Pack
- **Description**: 800 one-time email generation credits
- **Type**: Standard (one-time)
- **Price**: $60.00 USD

---

## Step 2: Get Your Paddle Credentials

### A. Get Vendor ID (Client-side Token)

1. Go to **Paddle Dashboard** → **Developer Tools** → **Authentication**
2. Find your **"Client-side token"** (starts with `live_` or `test_`)
3. Copy this value

### B. Get Webhook Secret

1. Go to **Paddle Dashboard** → **Developer Tools** → **Notifications**
2. Click **"Create notification destination"** or edit existing
3. Set **Destination URL** to: `https://qijgrzfedoknlgljsyka.supabase.co/functions/v1/paddle-webhook`
4. Enable all event types (or at minimum):
   - `transaction.completed`
   - `subscription.created`
   - `subscription.updated`
   - `subscription.canceled`
   - `subscription.paused`
   - `subscription.resumed`
5. Copy the **Webhook Secret Key** (starts with `pdl_ntfset_`)

---

## Step 3: Update Environment Variables

### A. Update `.env` file

```bash
# Replace with your actual Paddle vendor ID
VITE_PADDLE_VENDOR_ID="test_xxxxxxxxxxxxx"  # or live_xxxxxxxxxxxxx for production

# Start with sandbox for testing
VITE_PADDLE_ENVIRONMENT="sandbox"  # Change to "production" when ready
```

### B. Get Price IDs and Update Configuration

1. For each product you created, click on it in Paddle Dashboard
2. Go to the **"Prices"** tab
3. Copy each **Price ID** (format: `pri_xxxxxxxxxxxxx`)
4. Add these to your `.env` file:

```bash
# Subscription Plans
VITE_PADDLE_PRICE_STARTER_MONTHLY=pri_xxxxxxxxxxxxx
VITE_PADDLE_PRICE_STARTER_LIFETIME=pri_xxxxxxxxxxxxx
VITE_PADDLE_PRICE_PRO_MONTHLY=pri_xxxxxxxxxxxxx

# Credit Packs
VITE_PADDLE_PRICE_PACK_STARTER=pri_xxxxxxxxxxxxx
VITE_PADDLE_PRICE_PACK_GROWTH=pri_xxxxxxxxxxxxx
VITE_PADDLE_PRICE_PACK_PRO=pri_xxxxxxxxxxxxx
VITE_PADDLE_PRICE_PACK_AGENCY=pri_xxxxxxxxxxxxx
```

---

## Step 4: Configure Supabase Secrets

Set the Paddle webhook secret in Supabase:

```bash
# Set webhook secret
supabase secrets set PADDLE_WEBHOOK_SECRET=pdl_ntfset_xxxxxxxxxxxxx
```

---

## Step 5: Deploy Database Migration and Webhook

```bash
# Apply database migration
supabase db push

# Deploy Paddle webhook function
supabase functions deploy paddle-webhook
```

---

## Step 6: Enable Custom Data Passthrough

In Paddle Dashboard:

1. Go to **Settings** → **Checkout settings**
2. Enable **"Custom data"** option
3. This allows passing `user_id` to identify customers

---

## Step 7: Test in Sandbox Mode

### A. Use Paddle's Test Cards

Paddle provides test card numbers for sandbox:
- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`

### B. Test Checkout Flow

1. Start your dev server: `npm run dev`
2. Navigate to pricing page
3. Click on a plan
4. Complete checkout with test card
5. Verify webhook receives event in Supabase logs:
   ```bash
   supabase functions logs paddle-webhook
   ```

### C. Verify Database Updates

Check that user credits were updated:
```sql
SELECT user_id, plan, generations_limit, paddle_customer_id, paddle_subscription_id
FROM user_usage
WHERE user_id = 'your-test-user-id';
```

---

## Step 8: Go Live (When Ready)

### A. Switch to Production Mode

1. In Paddle Dashboard, switch from Sandbox to Live mode
2. Recreate products in Live mode (or use existing)
3. Get new Live price IDs
4. Update `.env`:
   ```bash
   VITE_PADDLE_VENDOR_ID="live_xxxxxxxxxxxxx"
   VITE_PADDLE_ENVIRONMENT="production"
   ```

### B. Update Webhook URL

Update notification destination to production URL:
```
https://qijgrzfedoknlgljsyka.supabase.co/functions/v1/paddle-webhook
```

### C. Deploy Changes

```bash
npm run build
# Deploy to your hosting platform
```

---

## Troubleshooting

### Webhook Not Receiving Events

1. Check Supabase function logs:
   ```bash
   supabase functions logs paddle-webhook --tail
   ```

2. Verify webhook URL is correct in Paddle Dashboard

3. Check that `PADDLE_WEBHOOK_SECRET` is set in Supabase secrets

### Checkout Not Opening

1. Verify Paddle.js script is loaded (check browser console)
2. Check that `VITE_PADDLE_VENDOR_ID` is set correctly
3. Ensure you're using the correct environment (sandbox vs production)

### Credits Not Being Added

1. Check webhook logs for errors
2. Verify product names match expected patterns in webhook handler
3. Check database for `paddle_customer_id` and `paddle_subscription_id`

---

## Support

- **Paddle Documentation**: https://developer.paddle.com/
- **Paddle Support**: https://paddle.com/support
- **Supabase Edge Functions**: https://supabase.com/docs/guides/functions

---

## Next Steps

After completing this setup:

1. ✅ Test thoroughly in sandbox mode
2. ✅ Update frontend components to use Paddle (next task)
3. ✅ Remove old Lemon Squeezy integration
4. ✅ Deploy to production
5. ✅ Monitor first real transactions
