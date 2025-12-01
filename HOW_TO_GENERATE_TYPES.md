# How to Generate TypeScript Types in Supabase

## Step-by-Step Visual Guide

### Step 1: Go to Your Supabase Dashboard

Navigate to: https://supabase.com/dashboard

Log in if needed, then select your **Mailit** project.

---

### Step 2: Open Project Settings

Look at the **left sidebar** and click the **gear icon (⚙️)** at the bottom.

This is labeled "Project Settings"

---

### Step 3: Navigate to API Section

In the Project Settings menu, click on **"API"** in the left sidebar.

You'll see several sections on this page.

---

### Step 4: Scroll to "Project API keys"

Scroll down the API page until you see a section called **"Project API keys"**

---

### Step 5: Find "Generate Types" Button

Just below the API keys section, you'll see a code block with TypeScript types.

Look for a button that says **"Generate Types"** or **"Copy"**

---

### Step 6: Copy the Types

1. Click the **"Generate Types"** button (or the copy icon)
2. This will copy the TypeScript code to your clipboard

---

### Step 7: Update Your Types File

1. Open your project in VS Code
2. Navigate to: `src/integrations/supabase/types.ts`
3. **Select ALL content** (Ctrl+A)
4. **Paste** the new types (Ctrl+V)
5. **Save** the file (Ctrl+S)

---

## Alternative: Use Supabase CLI

If you can't find the button, you can also generate types via command line:

```bash
npx supabase gen types typescript --project-id qijgrzfedoknlgljsyka > src/integrations/supabase/types.ts
```

This will automatically update the file with the latest types.

---

## What This Does

The types file tells TypeScript about your database structure:
- Tables (campaigns, contacts, email_sends, etc.)
- Columns and their types
- Relationships between tables

Without updated types, TypeScript doesn't know about the new tables we created (contact_lists, contacts, etc.), which causes the errors you're seeing.

---

## After Updating

1. Save the file
2. Restart VS Code (or reload window: Ctrl+Shift+P → "Reload Window")
3. TypeScript errors should disappear
4. You can now use the new tables in your code

---

**Still can't find it?** Let me know and I can help you use the CLI command instead!
