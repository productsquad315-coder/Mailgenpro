# Vercel Deployment Guide for Mailit

This guide will walk you through deploying the Mailit frontend to Vercel and configuring your custom domain **mailgenpro.com**.

## Prerequisites

- [x] Vercel account (sign up at [vercel.com](https://vercel.com))
- [x] GitHub account (for connecting your repository)
- [x] Access to your domain registrar for DNS configuration
- [x] All environment variables from your `.env` file

## Step 1: Prepare Your Repository

1. **Push your code to GitHub** (if not already done):
   ```bash
   git init
   git add .
   git commit -m "Prepare for Vercel deployment"
   git branch -M main
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```

## Step 2: Deploy to Vercel

### Option A: Deploy via Vercel Dashboard (Recommended)

1. **Go to Vercel Dashboard**:
   - Visit [vercel.com/new](https://vercel.com/new)
   - Sign in with your GitHub account

2. **Import Your Repository**:
   - Click "Add New..." → "Project"
   - Select "Import Git Repository"
   - Choose your Mailit repository from the list
   - Click "Import"

3. **Configure Project**:
   - **Framework Preset**: Vite (should be auto-detected)
   - **Root Directory**: `./` (leave as default)
   - **Build Command**: `npm run build` (auto-detected from vercel.json)
   - **Output Directory**: `dist` (auto-detected from vercel.json)

4. **Add Environment Variables**:
   Click "Environment Variables" and add the following:

   | Name | Value |
   |------|-------|
   | `VITE_SUPABASE_PROJECT_ID` | `qijgrzfedoknlgljsyka` |
   | `VITE_SUPABASE_PUBLISHABLE_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (from your .env) |
   | `VITE_SUPABASE_URL` | `https://qijgrzfedoknlgljsyka.supabase.co` |
   | `VITE_GA4_MEASUREMENT_ID` | `G-911851HH7H` |
   | `VITE_PADDLE_VENDOR_ID` | `live_09b241297646258f2bcc6ee1e6c` |
   | `VITE_PADDLE_ENVIRONMENT` | `production` |
   | `VITE_PADDLE_PRICE_STARTER_MONTHLY` | `pri_01kb7t4xayvp10v538qc8tqh1r` |
   | `VITE_PADDLE_PRICE_STARTER_LIFETIME` | `pri_01kb7t82ed4a0yxnc1y1t0vv7a` |
   | `VITE_PADDLE_PRICE_PRO_MONTHLY` | `pro_01kb7t975f5y420krps01z95va` |
   | `VITE_PADDLE_PRICE_PACK_STARTER` | `pro_01kb7td4d4qw50vwp3d3w431zs` |
   | `VITE_PADDLE_PRICE_PACK_GROWTH` | `pro_01kb7thxsv1y4jq92g8g2xswa9` |
   | `VITE_PADDLE_PRICE_PACK_PRO` | `pro_01kb7tkmw1nwm76rk9mw19rchd` |
   | `VITE_PADDLE_PRICE_PACK_AGENCY` | `pri_01kb7tnkn72ab3ngqf97r4xt5r` |

   > [!TIP]
   > Copy these values from your `.env` file. Make sure to include all `VITE_` prefixed variables.

5. **Deploy**:
   - Click "Deploy"
   - Wait for the build to complete (usually 1-3 minutes)
   - You'll get a deployment URL like `https://your-project.vercel.app`

### Option B: Deploy via Vercel CLI

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy**:
   ```bash
   vercel
   ```
   - Follow the prompts to link your project
   - Environment variables will need to be added via the dashboard

## Step 3: Configure Custom Domain (mailgenpro.com)

### Add Domain in Vercel

1. **Go to Project Settings**:
   - Open your project in Vercel Dashboard
   - Click "Settings" → "Domains"

2. **Add Custom Domain**:
   - Enter `mailgenpro.com` in the domain field
   - Click "Add"
   - Vercel will provide DNS configuration instructions

3. **Add www Subdomain** (Optional but Recommended):
   - Also add `www.mailgenpro.com`
   - Vercel will automatically redirect www to the apex domain

### Configure DNS Records

You'll need to configure DNS records at your domain registrar (where you purchased mailgenpro.com). Vercel will show you which records to add:

#### Option 1: Using A Records (Recommended for Apex Domain)

Add these A records to your DNS provider:

| Type | Name | Value |
|------|------|-------|
| A | @ | 76.76.21.21 |
| CNAME | www | cname.vercel-dns.com |

#### Option 2: Using CNAME (If Supported by Registrar)

| Type | Name | Value |
|------|------|-------|
| CNAME | @ | cname.vercel-dns.com |
| CNAME | www | cname.vercel-dns.com |

> [!IMPORTANT]
> DNS propagation can take 24-48 hours, but usually completes within a few minutes to a few hours.

### Common Domain Registrars

<details>
<summary><strong>GoDaddy</strong></summary>

1. Log in to GoDaddy
2. Go to "My Products" → "DNS"
3. Click "Add" under DNS Records
4. Add the A and CNAME records as shown above
5. Save changes
</details>

<details>
<summary><strong>Namecheap</strong></summary>

1. Log in to Namecheap
2. Go to "Domain List" → Click "Manage" next to mailgenpro.com
3. Click "Advanced DNS"
4. Add the A and CNAME records
5. Save changes
</details>

<details>
<summary><strong>Cloudflare</strong></summary>

1. Log in to Cloudflare
2. Select your domain
3. Go to "DNS" → "Records"
4. Add the A and CNAME records
5. Set Proxy status to "DNS only" (gray cloud) initially
6. Save changes
</details>

<details>
<summary><strong>Google Domains</strong></summary>

1. Log in to Google Domains
2. Select mailgenpro.com
3. Go to "DNS"
4. Add the A and CNAME records under "Custom records"
5. Save changes
</details>

## Step 4: Verify Deployment

### Check Vercel Deployment

1. **Visit your Vercel URL**: `https://your-project.vercel.app`
2. **Verify the application loads correctly**
3. **Check browser console** for any errors

### Check Custom Domain

1. **Wait for DNS propagation** (check status at [whatsmydns.net](https://www.whatsmydns.net))
2. **Visit mailgenpro.com**
3. **Verify SSL certificate** is active (you should see the padlock icon)

### Test Application Features

- [ ] Homepage loads correctly
- [ ] User authentication works (sign up/login)
- [ ] Supabase connection is working
- [ ] Payment integration (Paddle) is functional
- [ ] Google Analytics is tracking (check GA4 dashboard)
- [ ] All routes work correctly (React Router)

## Step 5: Update Supabase Configuration

> [!WARNING]
> You need to update your Supabase project to allow requests from your new domain.

1. **Go to Supabase Dashboard**:
   - Visit [app.supabase.com](https://app.supabase.com)
   - Select your project (qijgrzfedoknlgljsyka)

2. **Update Site URL**:
   - Go to "Authentication" → "URL Configuration"
   - Set **Site URL** to: `https://mailgenpro.com`

3. **Add Redirect URLs**:
   - Add these to **Redirect URLs**:
     - `https://mailgenpro.com/**`
     - `https://www.mailgenpro.com/**`
     - `https://*.vercel.app/**` (for preview deployments)

4. **Save changes**

## Step 6: Update Paddle Configuration

> [!IMPORTANT]
> Update your Paddle webhook URL to point to your Supabase Edge Function.

1. **Go to Paddle Dashboard**:
   - Visit [vendors.paddle.com](https://vendors.paddle.com)
   - Go to "Developer Tools" → "Webhooks"

2. **Update Webhook URL**:
   - Set webhook URL to your Supabase function:
     ```
     https://qijgrzfedoknlgljsyka.supabase.co/functions/v1/paddle-webhook
     ```
   - Or if using Lemon Squeezy webhook:
     ```
     https://qijgrzfedoknlgljsyka.supabase.co/functions/v1/lemon-squeezy-webhook
     ```

3. **Update Allowed Domains**:
   - Add `mailgenpro.com` to allowed domains in Paddle settings

## Troubleshooting

### Build Fails on Vercel

**Issue**: Build fails with dependency errors

**Solution**:
- Check that all dependencies are in `package.json` (not just `devDependencies`)
- Ensure Node.js version compatibility
- Check build logs in Vercel dashboard for specific errors

### Environment Variables Not Working

**Issue**: Application can't connect to Supabase or other services

**Solution**:
- Verify all environment variables are set in Vercel dashboard
- Ensure variable names have the `VITE_` prefix
- Redeploy after adding/updating environment variables

### Custom Domain Not Working

**Issue**: Domain shows "Domain not found" or doesn't load

**Solution**:
- Check DNS propagation status at [whatsmydns.net](https://www.whatsmydns.net)
- Verify DNS records are correct in your registrar
- Wait up to 48 hours for full DNS propagation
- Check Vercel domain status in project settings

### SSL Certificate Issues

**Issue**: "Not Secure" warning or SSL errors

**Solution**:
- Vercel automatically provisions SSL certificates
- Wait a few minutes after DNS propagation
- If issue persists, remove and re-add the domain in Vercel

### Authentication Not Working

**Issue**: Users can't sign up or login

**Solution**:
- Verify Supabase Site URL and Redirect URLs are updated
- Check browser console for CORS errors
- Ensure environment variables are correct

### Payment Integration Issues

**Issue**: Paddle checkout not loading

**Solution**:
- Verify Paddle environment variables are set correctly
- Check that domain is allowed in Paddle settings
- Ensure webhook URL is updated in Paddle dashboard

## Continuous Deployment

Vercel automatically deploys your application when you push to your main branch:

1. **Make changes locally**
2. **Commit and push to GitHub**:
   ```bash
   git add .
   git commit -m "Your commit message"
   git push
   ```
3. **Vercel automatically builds and deploys**
4. **Check deployment status** in Vercel dashboard

### Preview Deployments

- Every pull request gets a unique preview URL
- Test changes before merging to main
- Preview URLs: `https://your-project-git-branch-name.vercel.app`

## Important Notes

> [!CAUTION]
> **Supabase Edge Functions**: The functions in `supabase/functions/` are NOT deployed to Vercel. These must be deployed separately to Supabase using the Supabase CLI:
> ```bash
> supabase functions deploy generate-campaign
> supabase functions deploy lemon-squeezy-webhook
> ```

> [!NOTE]
> **Environment Variables**: Never commit your `.env` file to Git. Always configure environment variables in the Vercel dashboard.

> [!TIP]
> **Performance**: Vercel's Edge Network ensures your application loads quickly worldwide. Monitor performance in the Vercel Analytics dashboard.

## Next Steps

After successful deployment:

1. ✅ Test all application features thoroughly
2. ✅ Set up monitoring and analytics
3. ✅ Configure custom error pages (optional)
4. ✅ Set up Vercel Analytics for performance insights
5. ✅ Configure preview deployments for staging
6. ✅ Set up environment-specific configurations

## Support Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)
- [Supabase Documentation](https://supabase.com/docs)
- [Paddle Documentation](https://developer.paddle.com/)

---

**Deployment Checklist**:
- [ ] Code pushed to GitHub
- [ ] Project imported to Vercel
- [ ] Environment variables configured
- [ ] Initial deployment successful
- [ ] Custom domain added in Vercel
- [ ] DNS records configured
- [ ] SSL certificate active
- [ ] Supabase URLs updated
- [ ] Paddle configuration updated
- [ ] Application tested and verified
