-- GK CRM: company_subscriptions కి Subscriptions API + max_users support
ALTER TABLE company_subscriptions
  ADD COLUMN IF NOT EXISTS max_users INTEGER DEFAULT 10,
  ADD COLUMN IF NOT EXISTS razorpay_plan_id TEXT,
  ADD COLUMN IF NOT EXISTS razorpay_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS billing_cycle TEXT DEFAULT 'monthly';

-- ఇప్పటికే ఉన్న active 'starter' row కి limit set చేయి
UPDATE company_subscriptions
SET max_users = 10
WHERE plan_config->>'interior-design' = 'starter';
