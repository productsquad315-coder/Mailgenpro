# Quick Setup Commands

## Your Resend API Key
```
re_ahkXDkZh_CCKC2CkNhNniP4vE8FfYndbF
```

## Step-by-Step Setup

### 1. Add Resend API Key to Supabase

**Option A: Via Supabase Dashboard (Recommended)**
1. Go to your Supabase project dashboard
2. Click "Project Settings" (gear icon in sidebar)
3. Click "Edge Functions" in the left menu
4. Scroll down to "Secrets" section
5. Click "Add new secret"
6. Enter:
   - **Name:** `RESEND_API_KEY`
   - **Value:** `re_ahkXDkZh_CCKC2CkNhNniP4vE8FfYndbF`
7. Click "Save"

**Option B: Via Supabase CLI**
```bash
npx supabase secrets set RESEND_API_KEY=re_ahkXDkZh_CCKC2CkNhNniP4vE8FfYndbF
```

---

### 2. Deploy Edge Functions

Open your terminal and run:

```bash
# Navigate to project directory
cd c:\Users\vijay\Downloads\Mailit1\Mailit

# Login to Supabase (if not already logged in)
npx supabase login

# Link to your project (if not already linked)
npx supabase link --project-ref YOUR_PROJECT_REF

# Deploy send-campaign function
npx supabase functions deploy send-campaign

# Deploy send-worker function
npx supabase functions deploy send-worker
```

---

### 3. Run Database Schema

1. Open Supabase Dashboard → SQL Editor
2. Create a new query
3. Copy ALL contents from `ESP_DATABASE_SCHEMA.sql`
4. Paste into SQL Editor
5. Click "Run" (or press Ctrl+Enter)
6. Verify success (should see "Success. No rows returned")

---

### 4. Update TypeScript Types

1. In Supabase Dashboard → Project Settings → API
2. Scroll to "Project API keys" section
3. Click "Generate Types" button
4. Copy the generated TypeScript code
5. Open `src/integrations/supabase/types.ts`
6. Replace ALL contents with the copied types
7. Save the file

---

### 5. Test the Setup

```bash
# Start your dev server
npm run dev

# Navigate to http://localhost:5173/contacts
# Try importing a CSV with test contacts
```

---

## Verification Checklist

- [ ] Resend API key added to Supabase secrets
- [ ] Edge Functions deployed successfully
- [ ] Database schema executed (7 tables created)
- [ ] TypeScript types updated
- [ ] Dev server running without errors
- [ ] Can access /contacts page

---

## Troubleshooting

### "Project ref not found"
Run: `npx supabase projects list` to see your project ref, then use it in the link command.

### "Function deployment failed"
Make sure you're logged in: `npx supabase login`

### TypeScript errors persist
1. Make sure you updated the types file
2. Restart your dev server (Ctrl+C, then `npm run dev`)
3. Restart VS Code if needed

---

## Next Steps

Once everything is set up and working:
1. Test contact import
2. I'll build the "Send Campaign" UI (Week 3)
3. You'll be able to send emails directly from Mailit!

---

**Need help?** Let me know which step you're on and any errors you encounter.
