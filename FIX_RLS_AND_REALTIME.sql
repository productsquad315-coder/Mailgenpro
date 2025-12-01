-- Fix RLS Policies for Campaigns and Email Sequences
-- Run this in Supabase SQL Editor

-- Enable RLS on tables
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_sequences ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own campaigns" ON campaigns;
DROP POLICY IF EXISTS "Users can insert own campaigns" ON campaigns;
DROP POLICY IF EXISTS "Users can update own campaigns" ON campaigns;
DROP POLICY IF EXISTS "Users can delete own campaigns" ON campaigns;

DROP POLICY IF EXISTS "Users can view own email sequences" ON email_sequences;
DROP POLICY IF EXISTS "Users can insert own email sequences" ON email_sequences;
DROP POLICY IF EXISTS "Users can update own email sequences" ON email_sequences;
DROP POLICY IF EXISTS "Users can delete own email sequences" ON email_sequences;

-- Campaigns Policies
CREATE POLICY "Users can view own campaigns"
ON campaigns FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own campaigns"
ON campaigns FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own campaigns"
ON campaigns FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own campaigns"
ON campaigns FOR DELETE
USING (auth.uid() = user_id);

-- Email Sequences Policies
-- We check against the campaign's user_id
CREATE POLICY "Users can view own email sequences"
ON email_sequences FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM campaigns
    WHERE campaigns.id = email_sequences.campaign_id
    AND campaigns.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert own email sequences"
ON email_sequences FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM campaigns
    WHERE campaigns.id = email_sequences.campaign_id
    AND campaigns.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update own email sequences"
ON email_sequences FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM campaigns
    WHERE campaigns.id = email_sequences.campaign_id
    AND campaigns.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete own email sequences"
ON email_sequences FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM campaigns
    WHERE campaigns.id = email_sequences.campaign_id
    AND campaigns.user_id = auth.uid()
  )
);

-- Service Role Policies (for Edge Functions)
-- Supabase service role bypasses RLS by default, but explicit policies can be safer if needed.
-- Generally not required if using service_role key, but good to ensure no blocks.
