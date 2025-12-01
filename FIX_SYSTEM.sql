-- MASTER FIX SCRIPT FOR MAILIT
-- Run this ONE script to fix Admin Access, Database Performance, and RLS Policies.

-- ==========================================
-- 1. FIX ADMIN ACCESS & CREDITS
-- ==========================================

-- Add app_role column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'app_role') THEN
        ALTER TABLE profiles ADD COLUMN app_role text DEFAULT 'user' CHECK (app_role IN ('admin', 'user'));
    END IF;
END $$;

-- Set Admin User (b.vijay0452@gmail.com)
UPDATE profiles
SET app_role = 'admin'
WHERE id IN (SELECT id FROM auth.users WHERE email = 'b.vijay0452@gmail.com');

-- Grant 100 Credits to Admin
UPDATE user_usage
SET generations_limit = 100
WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'b.vijay0452@gmail.com');

-- ==========================================
-- 2. OPTIMIZE DATABASE PERFORMANCE (INDEXES)
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_campaigns_user_id ON campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_email_sequences_campaign_id ON email_sequences(campaign_id);
CREATE INDEX IF NOT EXISTS idx_user_usage_user_id ON user_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_user_status ON campaigns(user_id, status);
CREATE INDEX IF NOT EXISTS idx_email_sequences_campaign_seq ON email_sequences(campaign_id, sequence_number);

-- ==========================================
-- 3. FIX DISPLAY ISSUES (RLS POLICIES)
-- ==========================================

-- Enable RLS
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_sequences ENABLE ROW LEVEL SECURITY;

-- Drop old policies to ensure clean slate
DROP POLICY IF EXISTS "Users can view own campaigns" ON campaigns;
DROP POLICY IF EXISTS "Users can insert own campaigns" ON campaigns;
DROP POLICY IF EXISTS "Users can update own campaigns" ON campaigns;
DROP POLICY IF EXISTS "Users can delete own campaigns" ON campaigns;
DROP POLICY IF EXISTS "Users can view own email sequences" ON email_sequences;
DROP POLICY IF EXISTS "Users can insert own email sequences" ON email_sequences;
DROP POLICY IF EXISTS "Users can update own email sequences" ON email_sequences;
DROP POLICY IF EXISTS "Users can delete own email sequences" ON email_sequences;

-- Create Correct Policies
CREATE POLICY "Users can view own campaigns" ON campaigns FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own campaigns" ON campaigns FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own campaigns" ON campaigns FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own campaigns" ON campaigns FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own email sequences" ON email_sequences FOR SELECT USING (
  EXISTS (SELECT 1 FROM campaigns WHERE campaigns.id = email_sequences.campaign_id AND campaigns.user_id = auth.uid())
);
CREATE POLICY "Users can insert own email sequences" ON email_sequences FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM campaigns WHERE campaigns.id = email_sequences.campaign_id AND campaigns.user_id = auth.uid())
);
CREATE POLICY "Users can update own email sequences" ON email_sequences FOR UPDATE USING (
  EXISTS (SELECT 1 FROM campaigns WHERE campaigns.id = email_sequences.campaign_id AND campaigns.user_id = auth.uid())
);
CREATE POLICY "Users can delete own email sequences" ON email_sequences FOR DELETE USING (
  EXISTS (SELECT 1 FROM campaigns WHERE campaigns.id = email_sequences.campaign_id AND campaigns.user_id = auth.uid())
);

-- ==========================================
-- 4. FIX REALTIME SUBSCRIPTIONS
-- ==========================================
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime FOR TABLE campaigns, user_usage;
COMMIT;
