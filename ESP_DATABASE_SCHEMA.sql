-- ESP Integration - Database Schema
-- Run this in Supabase SQL Editor

-- ============================================
-- 1. CONTACT LISTS
-- ============================================
CREATE TABLE IF NOT EXISTS contact_lists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  total_contacts int DEFAULT 0,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- ============================================
-- 2. CONTACTS
-- ============================================
CREATE TABLE IF NOT EXISTS contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id uuid REFERENCES contact_lists(id) ON DELETE CASCADE NOT NULL,
  email text NOT NULL,
  first_name text,
  last_name text,
  custom_fields jsonb DEFAULT '{}',
  status text DEFAULT 'active', -- 'active', 'unsubscribed', 'bounced'
  created_at timestamp DEFAULT now(),
  UNIQUE(list_id, email)
);

-- ============================================
-- 3. EMAIL SENDS (Tracking)
-- ============================================
CREATE TABLE IF NOT EXISTS email_sends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES campaigns(id) ON DELETE CASCADE,
  contact_id uuid REFERENCES contacts(id) ON DELETE CASCADE,
  email_sequence_id uuid REFERENCES email_sequences(id),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  
  -- Email details
  recipient_email text NOT NULL,
  subject text NOT NULL,
  
  -- ESP tracking
  esp_provider text DEFAULT 'resend',
  esp_message_id text,
  
  -- Status tracking
  status text DEFAULT 'queued', -- 'queued', 'sending', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed'
  error_message text,
  
  -- Timestamps
  queued_at timestamp DEFAULT now(),
  sent_at timestamp,
  delivered_at timestamp,
  opened_at timestamp,
  clicked_at timestamp,
  bounced_at timestamp,
  
  -- Metadata
  metadata jsonb DEFAULT '{}'
);

-- ============================================
-- 4. EMAIL CREDITS
-- ============================================
CREATE TABLE IF NOT EXISTS email_credits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) UNIQUE NOT NULL,
  
  -- Free credits (reset monthly based on plan)
  credits_free int DEFAULT 0,
  
  -- Paid credits (purchased, never expire)
  credits_paid int DEFAULT 0,
  
  -- Computed total
  credits_total int GENERATED ALWAYS AS (credits_free + credits_paid) STORED,
  
  -- Tracking
  credits_used_this_month int DEFAULT 0,
  last_reset_at timestamp DEFAULT now(),
  
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- ============================================
-- 5. CREDIT PURCHASES
-- ============================================
CREATE TABLE IF NOT EXISTS credit_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  
  -- Purchase details
  credits_purchased int NOT NULL,
  amount_usd decimal(10,2) NOT NULL,
  
  -- Payment info
  payment_provider text DEFAULT 'paddle',
  payment_id text,
  payment_status text DEFAULT 'completed',
  
  created_at timestamp DEFAULT now()
);

-- ============================================
-- 6. UNSUBSCRIBES (Compliance)
-- ============================================
CREATE TABLE IF NOT EXISTS unsubscribes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  reason text,
  campaign_id uuid REFERENCES campaigns(id),
  unsubscribed_at timestamp DEFAULT now()
);

-- ============================================
-- 7. EMAIL SEND QUEUE (Batch Processing)
-- ============================================
CREATE TABLE IF NOT EXISTS email_send_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES campaigns(id) NOT NULL,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  
  -- Queue metadata
  total_emails int NOT NULL,
  emails_sent int DEFAULT 0,
  emails_failed int DEFAULT 0,
  
  status text DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  started_at timestamp,
  completed_at timestamp,
  
  created_at timestamp DEFAULT now()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_contacts_list_id ON contacts(list_id);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);
CREATE INDEX IF NOT EXISTS idx_contacts_status ON contacts(status);
CREATE INDEX IF NOT EXISTS idx_email_sends_campaign_id ON email_sends(campaign_id);
CREATE INDEX IF NOT EXISTS idx_email_sends_status ON email_sends(status);
CREATE INDEX IF NOT EXISTS idx_email_sends_user_id ON email_sends(user_id);
CREATE INDEX IF NOT EXISTS idx_email_send_queue_status ON email_send_queue(status);
CREATE INDEX IF NOT EXISTS idx_email_credits_user_id ON email_credits(user_id);

-- ============================================
-- RLS POLICIES
-- ============================================

-- Contact Lists: Users can only see their own
ALTER TABLE contact_lists ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own lists" ON contact_lists;
CREATE POLICY "Users can view own lists" ON contact_lists 
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own lists" ON contact_lists;
CREATE POLICY "Users can create own lists" ON contact_lists 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own lists" ON contact_lists;
CREATE POLICY "Users can update own lists" ON contact_lists 
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own lists" ON contact_lists;
CREATE POLICY "Users can delete own lists" ON contact_lists 
  FOR DELETE USING (auth.uid() = user_id);

-- Contacts: Users can only see contacts in their lists
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own contacts" ON contacts;
CREATE POLICY "Users can view own contacts" ON contacts 
  FOR SELECT USING (
    list_id IN (SELECT id FROM contact_lists WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can create contacts" ON contacts;
CREATE POLICY "Users can create contacts" ON contacts 
  FOR INSERT WITH CHECK (
    list_id IN (SELECT id FROM contact_lists WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can update contacts" ON contacts;
CREATE POLICY "Users can update contacts" ON contacts 
  FOR UPDATE USING (
    list_id IN (SELECT id FROM contact_lists WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can delete contacts" ON contacts;
CREATE POLICY "Users can delete contacts" ON contacts 
  FOR DELETE USING (
    list_id IN (SELECT id FROM contact_lists WHERE user_id = auth.uid())
  );

-- Email Sends: Users can only see their own sends
ALTER TABLE email_sends ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own sends" ON email_sends;
CREATE POLICY "Users can view own sends" ON email_sends 
  FOR SELECT USING (auth.uid() = user_id);

-- Email Credits: Users can only see their own credits
ALTER TABLE email_credits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own credits" ON email_credits;
CREATE POLICY "Users can view own credits" ON email_credits 
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own credits" ON email_credits;
CREATE POLICY "Users can update own credits" ON email_credits 
  FOR UPDATE USING (auth.uid() = user_id);

-- Credit Purchases: Users can only see their own purchases
ALTER TABLE credit_purchases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own purchases" ON credit_purchases;
CREATE POLICY "Users can view own purchases" ON credit_purchases 
  FOR SELECT USING (auth.uid() = user_id);

-- Email Send Queue: Users can only see their own queues
ALTER TABLE email_send_queue ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own queue" ON email_send_queue;
CREATE POLICY "Users can view own queue" ON email_send_queue 
  FOR SELECT USING (auth.uid() = user_id);

-- ============================================
-- DATABASE FUNCTIONS
-- ============================================

-- Function: Deduct email credit (use free first, then paid)
CREATE OR REPLACE FUNCTION deduct_email_credit(p_user_id uuid)
RETURNS boolean AS $$
DECLARE
  v_credits_free int;
  v_credits_paid int;
BEGIN
  -- Get current credits
  SELECT credits_free, credits_paid INTO v_credits_free, v_credits_paid
  FROM email_credits
  WHERE user_id = p_user_id;
  
  -- Check if user has any credits
  IF (v_credits_free + v_credits_paid) <= 0 THEN
    RETURN false;
  END IF;
  
  -- Deduct from free first, then paid
  UPDATE email_credits
  SET 
    credits_free = CASE 
      WHEN credits_free > 0 THEN credits_free - 1
      ELSE 0
    END,
    credits_paid = CASE
      WHEN credits_free <= 0 AND credits_paid > 0 THEN credits_paid - 1
      ELSE credits_paid
    END,
    credits_used_this_month = credits_used_this_month + 1,
    updated_at = now()
  WHERE user_id = p_user_id;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Initialize email credits for new users
CREATE OR REPLACE FUNCTION initialize_email_credits()
RETURNS trigger AS $$
BEGIN
  INSERT INTO email_credits (user_id, credits_free)
  VALUES (NEW.id, 50) -- Free tier gets 50 emails
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Auto-create email credits on user signup
DROP TRIGGER IF EXISTS on_auth_user_created_email_credits ON auth.users;
CREATE TRIGGER on_auth_user_created_email_credits
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION initialize_email_credits();

-- Function: Monthly credit refresh (to be called by cron)
CREATE OR REPLACE FUNCTION refresh_monthly_email_credits()
RETURNS void AS $$
BEGIN
  UPDATE email_credits ec
  SET 
    credits_free = CASE 
      WHEN uu.plan = 'free' OR uu.plan = 'trial' THEN 50
      WHEN uu.plan = 'pro' THEN 1000
      WHEN uu.plan = 'agency' THEN 10000
      ELSE 50
    END,
    credits_used_this_month = 0,
    last_reset_at = now(),
    updated_at = now()
  FROM user_usage uu
  WHERE ec.user_id = uu.user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Update contact list count
CREATE OR REPLACE FUNCTION update_contact_list_count()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE contact_lists
    SET total_contacts = total_contacts + 1, updated_at = now()
    WHERE id = NEW.list_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE contact_lists
    SET total_contacts = GREATEST(0, total_contacts - 1), updated_at = now()
    WHERE id = OLD.list_id;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Auto-update contact list count
DROP TRIGGER IF EXISTS on_contact_change ON contacts;
CREATE TRIGGER on_contact_change
  AFTER INSERT OR DELETE ON contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_contact_list_count();
