-- Performance Optimization: Add Missing Indexes
-- Run this in Supabase SQL Editor for better performance

-- Index on campaigns.user_id for faster user campaign lookups
CREATE INDEX IF NOT EXISTS idx_campaigns_user_id ON campaigns(user_id);

-- Index on email_sequences.campaign_id for faster email fetching
CREATE INDEX IF NOT EXISTS idx_email_sequences_campaign_id ON email_sequences(campaign_id);

-- Index on user_usage.user_id for faster credit lookups
CREATE INDEX IF NOT EXISTS idx_user_usage_user_id ON user_usage(user_id);

-- Index on profiles.email for faster email lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- Index on campaigns.status for filtering
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);

-- Composite index for campaign queries with user and status
CREATE INDEX IF NOT EXISTS idx_campaigns_user_status ON campaigns(user_id, status);

-- Index on email_sequences for ordering
CREATE INDEX IF NOT EXISTS idx_email_sequences_campaign_seq ON email_sequences(campaign_id, sequence_number);

-- Verify indexes were created
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN ('campaigns', 'email_sequences', 'user_usage', 'profiles')
ORDER BY tablename, indexname;
