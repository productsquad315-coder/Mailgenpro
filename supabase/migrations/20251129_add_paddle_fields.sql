-- Add Paddle customer and subscription fields to user_usage table
-- This migration adds Paddle-specific fields while keeping Lemon Squeezy fields for backward compatibility

-- Add Paddle customer ID field
ALTER TABLE user_usage ADD COLUMN IF NOT EXISTS paddle_customer_id TEXT;

-- Add Paddle subscription ID field
ALTER TABLE user_usage ADD COLUMN IF NOT EXISTS paddle_subscription_id TEXT;

-- Add indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_usage_paddle_customer ON user_usage(paddle_customer_id);
CREATE INDEX IF NOT EXISTS idx_user_usage_paddle_subscription ON user_usage(paddle_subscription_id);

-- Add comments for documentation
COMMENT ON COLUMN user_usage.paddle_customer_id IS 'Paddle customer ID for payment processing';
COMMENT ON COLUMN user_usage.paddle_subscription_id IS 'Paddle subscription ID for recurring payments';
