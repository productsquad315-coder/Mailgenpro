-- Lemon Squeezy Integration Setup
-- Run this in Supabase SQL Editor

-- 1. Ensure user_usage table exists and has required columns
CREATE TABLE IF NOT EXISTS user_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL UNIQUE,
  plan text DEFAULT 'trial',
  generations_limit int DEFAULT 20,
  generations_used int DEFAULT 0,
  topup_credits int DEFAULT 0,
  subscription_status text DEFAULT 'active',
  lemonsqueezy_customer_id text,
  subscription_id text,
  current_period_end timestamp,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Add columns if they don't exist (safe migration)
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_usage' AND column_name = 'topup_credits') THEN
    ALTER TABLE user_usage ADD COLUMN topup_credits int DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_usage' AND column_name = 'lemonsqueezy_customer_id') THEN
    ALTER TABLE user_usage ADD COLUMN lemonsqueezy_customer_id text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_usage' AND column_name = 'subscription_id') THEN
    ALTER TABLE user_usage ADD COLUMN subscription_id text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_usage' AND column_name = 'current_period_end') THEN
    ALTER TABLE user_usage ADD COLUMN current_period_end timestamp;
  END IF;
END $$;

-- 2. Create add_topup_credits function (used by webhook)
CREATE OR REPLACE FUNCTION add_topup_credits(p_user_id uuid, p_credits int)
RETURNS void AS $$
BEGIN
  UPDATE user_usage
  SET topup_credits = COALESCE(topup_credits, 0) + p_credits,
      updated_at = now()
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create RLS policies for user_usage if they don't exist
ALTER TABLE user_usage ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_usage' AND policyname = 'Users can view own usage') THEN
    CREATE POLICY "Users can view own usage" ON user_usage FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

-- 4. Trigger to create user_usage on signup (if not exists)
CREATE OR REPLACE FUNCTION handle_new_user_usage()
RETURNS trigger AS $$
BEGIN
  INSERT INTO user_usage (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created_usage ON auth.users;
CREATE TRIGGER on_auth_user_created_usage
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user_usage();
