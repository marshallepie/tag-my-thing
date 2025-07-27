/*
  # Deactivate Redundant Subscription Plans

  1. Problem
    - Multiple subscription plans with similar purposes are active
    - Legacy plans (pro-monthly, pro-yearly, enterprise-monthly, enterprise-yearly) 
      are redundant with new simplified plans (professional, enterprise)
    - This creates confusion and maintenance overhead

  2. Solution
    - Deactivate legacy subscription plans
    - Keep only the intended plans: freemium, professional, enterprise
    - Migrate any users on legacy plans to equivalent new plans

  3. Security
    - Preserve existing user subscriptions by migrating to equivalent plans
    - Maintain data integrity during the cleanup process
*/

-- First, migrate users from legacy plans to new equivalent plans
UPDATE user_profiles 
SET subscription_plan = CASE 
  WHEN subscription_plan IN ('pro-monthly', 'pro-yearly') THEN 'professional'
  WHEN subscription_plan IN ('enterprise-monthly', 'enterprise-yearly') THEN 'enterprise'
  ELSE subscription_plan
END,
updated_at = now()
WHERE subscription_plan IN ('pro-monthly', 'pro-yearly', 'enterprise-monthly', 'enterprise-yearly');

-- Deactivate redundant subscription plans
UPDATE subscription_plans 
SET active = false,
    updated_at = now()
WHERE name IN ('pro-monthly', 'pro-yearly', 'enterprise-monthly', 'enterprise-yearly');

-- Ensure only the intended plans remain active
UPDATE subscription_plans 
SET active = true,
    updated_at = now()
WHERE name IN ('freemium', 'professional', 'enterprise');

-- Verify we have the correct active plans with proper configuration
-- Update freemium plan to ensure it's properly configured
UPDATE subscription_plans 
SET 
  token_limit = 50,
  price_gbp = 0,
  price_xaf = 0,
  billing_interval = 'monthly',
  features = ARRAY[
    '50 TMT tokens per month',
    'Basic asset tagging',
    'Limited product verification (5 products)',
    'Basic QR code generation',
    'Email support'
  ],
  active = true,
  updated_at = now()
WHERE name = 'freemium';

-- Update professional plan to ensure it's properly configured
UPDATE subscription_plans 
SET 
  token_limit = 1000,
  price_gbp = 8.99,
  price_xaf = 6742,  -- 8.99 * 750 XAF/GBP
  billing_interval = 'monthly',
  features = ARRAY[
    '1000 TMT tokens per month',
    'Unlimited asset tagging',
    'Product verification system',
    'QR code generation',
    'Scan history tracking',
    'Business dashboard access',
    'Priority email support'
  ],
  active = true,
  updated_at = now()
WHERE name = 'professional';

-- Update enterprise plan to ensure it's properly configured
UPDATE subscription_plans 
SET 
  token_limit = 10000,
  price_gbp = 49.99,
  price_xaf = 37492,  -- 49.99 * 750 XAF/GBP
  billing_interval = 'monthly',
  features = ARRAY[
    '10000 TMT tokens per month',
    'Unlimited asset tagging',
    'Advanced product verification',
    'Bulk QR code generation',
    'Advanced analytics dashboard',
    'API access for integrations',
    'Custom branding options',
    'Dedicated account manager',
    'Priority phone support',
    'SLA guarantees'
  ],
  active = true,
  updated_at = now()
WHERE name = 'enterprise';

-- Create a function to get active subscription plans for frontend use
CREATE OR REPLACE FUNCTION get_active_subscription_plans()
RETURNS TABLE(
  id uuid,
  name text,
  token_limit integer,
  price_gbp decimal(10,2),
  price_xaf decimal(10,2),
  billing_interval text,
  features text[],
  is_recommended boolean
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sp.id,
    sp.name,
    sp.token_limit,
    sp.price_gbp,
    sp.price_xaf,
    sp.billing_interval,
    sp.features,
    CASE 
      WHEN sp.name = 'professional' THEN true
      ELSE false
    END as is_recommended
  FROM subscription_plans sp
  WHERE sp.active = true
  ORDER BY 
    CASE sp.name
      WHEN 'freemium' THEN 1
      WHEN 'professional' THEN 2
      WHEN 'enterprise' THEN 3
      ELSE 4
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_active_subscription_plans() TO authenticated;

-- Add RLS policy for subscription plans to allow reading active plans
DROP POLICY IF EXISTS "Anyone can read active subscription plans" ON subscription_plans;
CREATE POLICY "Anyone can read active subscription plans"
  ON subscription_plans FOR SELECT
  TO authenticated
  USING (active = true);

-- Create a view for easy access to active plans
CREATE OR REPLACE VIEW active_business_plans AS
SELECT 
  id,
  name,
  token_limit,
  price_gbp,
  price_xaf,
  billing_interval,
  features,
  CASE 
    WHEN name = 'professional' THEN true
    ELSE false
  END as is_recommended,
  CASE name
    WHEN 'freemium' THEN 1
    WHEN 'professional' THEN 2
    WHEN 'enterprise' THEN 3
    ELSE 4
  END as sort_order
FROM subscription_plans
WHERE active = true
ORDER BY sort_order;

-- Add comment to document the cleanup
COMMENT ON TABLE subscription_plans IS 'Subscription plans - cleaned up redundant plans on 2025-01-25, only freemium/professional/enterprise remain active';

-- Log the cleanup action
DO $$
DECLARE
  deactivated_count integer;
  migrated_users integer;
BEGIN
  -- Count deactivated plans
  SELECT COUNT(*) INTO deactivated_count
  FROM subscription_plans
  WHERE name IN ('pro-monthly', 'pro-yearly', 'enterprise-monthly', 'enterprise-yearly')
  AND active = false;
  
  -- Count migrated users (this is approximate since we already updated them)
  SELECT COUNT(*) INTO migrated_users
  FROM user_profiles
  WHERE subscription_plan IN ('professional', 'enterprise');
  
  RAISE NOTICE 'Subscription plan cleanup completed:';
  RAISE NOTICE '- Deactivated % redundant plans', deactivated_count;
  RAISE NOTICE '- Active plans: freemium, professional, enterprise';
  RAISE NOTICE '- Users on business plans: %', migrated_users;
END $$;