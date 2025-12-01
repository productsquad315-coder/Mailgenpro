-- Clean up stuck queues and emails
-- This will remove any emails that are stuck in 'queued' or 'pending' state

-- 1. Delete stuck email sends
DELETE FROM email_sends 
WHERE status = 'queued' 
  OR status = 'pending';

-- 2. Delete stuck queues
DELETE FROM email_send_queue 
WHERE status = 'pending' 
  OR status = 'processing';
