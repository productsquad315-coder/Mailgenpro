-- AI Scheduler Integration Setup
-- Run this in Supabase SQL Editor

-- 1. Add scheduled_at to email_send_queue
ALTER TABLE email_send_queue 
ADD COLUMN IF NOT EXISTS scheduled_at timestamp DEFAULT now();

-- 2. Add scheduled_at to email_sends
ALTER TABLE email_sends 
ADD COLUMN IF NOT EXISTS scheduled_at timestamp DEFAULT now();

-- 3. Create indexes for performance (worker queries)
CREATE INDEX IF NOT EXISTS idx_email_send_queue_scheduled_at ON email_send_queue(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_email_sends_scheduled_at ON email_sends(scheduled_at);

-- 4. Update send-worker logic (conceptual - this is done in Edge Function code)
-- The worker will now query: WHERE status = 'queued' AND scheduled_at <= now()
