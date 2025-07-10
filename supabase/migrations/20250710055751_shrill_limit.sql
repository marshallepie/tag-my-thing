/*
  # Simplify Subscription System

  1. Changes Made
    - Set all paid subscription plans to inactive except 'freemium'
    - Update all existing users to 'freemium' plan
    - Remove subscription upgrade/downgrade logic
    - Keep only token-based economy

  2. Security
    - Maintain existing RLS policies
    - Ensure data integrity during transition

  3. Notes
    - This migration simplifies the system to only use the freemium plan
    - All users will be on the freemium plan with token-based access
    - Paid subscriptions are disabled but data is preserved for historical purposes
*/

-- Step 1: Set all paid subscription plans to inactive
UPDATE subscription_plans
SET active = false, updated_at = now()
WHERE name != 'freemium';

-- Step 2: Ensure freemium plan exists and is active
INSERT INTO subscription_plans (name, token_limit, price_gbp, price_xaf, billing_interval, features, active)
VALUES ('freemium', 50, 0, 0, 'monthly', ARRAY['50 TMT tokens per month', 'Basic asset tagging', 'Unlimited assets', 'Next-of-kin assignments'], true)
ON CONFLICT (name) DO UPDATE SET
  active = true,
  features = ARRAY['50 TMT tokens per month', 'Basic asset tagging', 'Unlimited assets', 'Next-of-kin assignments'],
  updated_at = now();

-- Step 3: Set all existing user profiles to the 'freemium' plan
UPDATE user_profiles
SET subscription_plan = 'freemium', updated_at = now()
WHERE subscription_plan != 'freemium';

-- Step 4: Update user_profiles constraint to only allow freemium
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_subscription_plan_check;
ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_subscription_plan_check 
  CHECK (subscription_plan = 'freemium');

-- Step 5: Add a comment to document the change
COMMENT ON TABLE subscription_plans IS 'Subscription plans table - simplified to only support freemium plan as of 2025-01-10';

-- Step 6: Create a view for active plans (should only show freemium)
CREATE OR REPLACE VIEW active_subscription_plans AS
SELECT * FROM subscription_plans WHERE active = true;

-- Verification queries (these will be logged but not affect the migration)
-- SELECT name, active FROM subscription_plans ORDER BY name;
-- SELECT DISTINCT subscription_plan FROM user_profiles;