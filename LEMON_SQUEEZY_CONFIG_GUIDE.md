# Lemon Squeezy Configuration Guide 🍋

To complete the billing integration, you'll need to gather the following details from your [Lemon Squeezy Dashboard](https://app.lemonsqueezy.com/).

## 1. Credentials & Secrets

| Item | Where to find it | Purpose |
|------|------------------|---------|
| **Store ID** | Settings > Stores | Used for creating checkout links. |
| **Webhook Secret** | Settings > Webhooks (after creating one) | Used to verify payments are genuine. |
| **API Key** | Settings > API | (Optional) For fetching subscription details later. |

## 2. Product Setup (Critical!)

The webhook logic relies on **Product Names** or **Variant Names** to assign the correct credits. Please ensure your products in Lemon Squeezy match these keywords:

### Subscription Plans
| Plan Name | Keywords to include in Name | Credits / Month |
|-----------|-----------------------------|-----------------|
| **Starter** | "Starter" | 150 |
| **Pro** | "Pro" | 500 |
| **Lifetime** | "Lifetime" | 150 |

*Example: "Mailit Pro Plan" or "Monthly Pro Subscription"*

### Credit Packs (One-time)
| Pack Name | Keywords to include in Name | Credits Added |
|-----------|-----------------------------|---------------|
| **Starter Pack** | "Starter Pack" | 40 |
| **Growth Pack** | "Growth Pack" | 120 |
| **Pro Pack** | "Pro Pack" | 300 |
| **Agency Pack** | "Agency Pack" | 800 |

*Example: "Growth Pack - 120 Credits"*

## 3. Product IDs (For Checkout Links)

You will need the **Variant ID** for each product to create "Buy Now" buttons in the app.

1. Go to **Products**.
2. Click on a product.
3. Click **Share** (top right).
4. Copy the URL. It looks like: `https://yourstore.lemonsqueezy.com/checkout/buy/VARIANT_ID`.
5. Save these **Variant IDs** for:
   - Starter Plan
   - Pro Plan
   - Lifetime Deal
   - All Credit Packs

## 4. Webhook Setup

1. Go to **Settings > Webhooks**.
2. Click **+ New Webhook**.
3. **Callback URL:** `[YOUR_SUPABASE_URL]/functions/v1/lemon-squeezy-webhook`
   *(You can find your Supabase URL in the dashboard or `.env` file)*
4. **Signing Secret:** Copy this! You'll need it for the `LEMON_SQUEEZY_WEBHOOK_SECRET`.
5. **Events:** Check these:
   - `order_created`
   - `subscription_created`
   - `subscription_updated`
   - `subscription_cancelled`
   - `subscription_expired`
   - `subscription_resumed`
6. Click **Save Webhook**.

## Next Steps

Once you have these details:
1. Run: `npx supabase secrets set LEMON_SQUEEZY_WEBHOOK_SECRET=your_signing_secret`
2. We will update the frontend `BuyCredits` component with your **Variant IDs**.
