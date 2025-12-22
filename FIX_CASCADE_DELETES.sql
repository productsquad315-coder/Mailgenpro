-- Fix missing ON DELETE CASCADE for campaign-related tables
-- This ensures that when a campaign is deleted, all its associated data (queue, sends, unsubscribes) is also removed automatically.

-- 1. Fix email_send_queue
ALTER TABLE public.email_send_queue
DROP CONSTRAINT IF EXISTS email_send_queue_campaign_id_fkey,
ADD CONSTRAINT email_send_queue_campaign_id_fkey
FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE;

-- 2. Fix unsubscribes
ALTER TABLE public.unsubscribes
DROP CONSTRAINT IF EXISTS unsubscribes_campaign_id_fkey,
ADD CONSTRAINT unsubscribes_campaign_id_fkey
FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE;

-- 3. Fix email_sends (it already has cascade for campaign_id, but check email_sequence_id)
-- We should also cascade when an email sequence item is deleted
ALTER TABLE public.email_sends
DROP CONSTRAINT IF EXISTS email_sends_email_sequence_id_fkey,
ADD CONSTRAINT email_sends_email_sequence_id_fkey
FOREIGN KEY (email_sequence_id) REFERENCES email_sequences(id) ON DELETE CASCADE;

-- Also verify campaigns table has cascade for user_id (it should, but just in case)
-- ALTER TABLE public.campaigns
-- DROP CONSTRAINT IF EXISTS campaigns_user_id_fkey,
-- ADD CONSTRAINT campaigns_user_id_fkey
-- FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
