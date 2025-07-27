/*
  # Reintroduce Paid Subscription Plans for Business Users

  1. Subscription Plans
    - Reactivate Professional and Enterprise plans
    - Update pricing and features for business users
    - Set appropriate token limits

  2. User Profiles
    - Remove freemium-only constraint
    - Allow users to be assigned to paid plans

  3. Business Features
    - Professional: 1000 TMT/month @ £8.99
    - Enterprise: 10000 TMT/month @ £49.99
    - Enhanced features for each tier
*/

-- Remove the freemium-only constraint from user_profiles
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_subscription_plan_check;

-- Add new constraint allowing all plan types
ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_subscription_plan_check 
  CHECK (subscription_plan IN ('freemium', 'professional', 'enterprise'));

-- Update subscription plans with business-focused offerings
UPDATE subscription_plans SET 
  active = true,
  updated_at = now()
WHERE name IN ('pro-monthly', 'pro-yearly', 'enterprise-monthly', 'enterprise-yearly');

-- Insert/Update Professional monthly plan
INSERT INTO subscription_plans (
  name, 
  token_limit, 
  price_gbp, 
  price_xaf, 
  billing_interval, 
  features, 
  active
) VALUES (
  'professional',
  1000,
  8.99,
  6742,  -- 8.99 * 750 XAF/GBP
  'monthly',
  ARRAY[
    '1000 TMT tokens per month',
    'Unlimited asset tagging',
    'Product verification system',
    'QR code generation',
    'Scan history tracking',
    'Business dashboard access',
    'Priority email support'
  ],
  true
) ON CONFLICT (name) DO UPDATE SET
  token_limit = EXCLUDED.token_limit,
  price_gbp = EXCLUDED.price_gbp,
  price_xaf = EXCLUDED.price_xaf,
  features = EXCLUDED.features,
  active = EXCLUDED.active,
  updated_at = now();

-- Insert/Update Enterprise monthly plan
INSERT INTO subscription_plans (
  name,
  token_limit,
  price_gbp,
  price_xaf,
  billing_interval,
  features,
  active
) VALUES (
  'enterprise',
  10000,
  49.99,
  37492,  -- 49.99 * 750 XAF/GBP
  'monthly',
  ARRAY[
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
  true
) ON CONFLICT (name) DO UPDATE SET
  token_limit = EXCLUDED.token_limit,
  price_gbp = EXCLUDED.price_gbp,
  price_xaf = EXCLUDED.price_xaf,
  features = EXCLUDED.features,
  active = EXCLUDED.active,
  updated_at = now();

-- Update freemium plan features for business users
UPDATE subscription_plans SET
  features = ARRAY[
    '50 TMT tokens per month',
    'Basic asset tagging',
    'Limited product verification (5 products)',
    'Basic QR code generation',
    'Email support'
  ],
  updated_at = now()
WHERE name = 'freemium';

-- Create function to check subscription limits for business features
CREATE OR REPLACE FUNCTION check_business_subscription_limit(
  user_id uuid,
  feature_type text,
  current_usage integer DEFAULT 0
)
RETURNS jsonb AS $$
DECLARE
  user_plan text;
  plan_limits jsonb;
  result jsonb;
BEGIN
  -- Get user's subscription plan
  SELECT subscription_plan INTO user_plan
  FROM user_profiles
  WHERE id = user_id;
  
  -- Define limits for each plan
  plan_limits := jsonb_build_object(
    'freemium', jsonb_build_object(
      'products', 5,
      'qr_codes', 5,
      'api_calls', 0
    ),
    'professional', jsonb_build_object(
      'products', 1000,
      'qr_codes', 1000,
      'api_calls', 1000
    ),
    'enterprise', jsonb_build_object(
      'products', -1,  -- unlimited
      'qr_codes', -1,  -- unlimited
      'api_calls', -1  -- unlimited
    )
  );
  
  -- Get limit for user's plan and feature
  DECLARE
    user_limit integer;
  BEGIN
    user_limit := (plan_limits->user_plan->>feature_type)::integer;
    
    -- -1 means unlimited
    IF user_limit = -1 THEN
      result := jsonb_build_object(
        'allowed', true,
        'limit', 'unlimited',
        'current_usage', current_usage,
        'plan', user_plan
      );
    ELSIF current_usage >= user_limit THEN
      result := jsonb_build_object(
        'allowed', false,
        'limit', user_limit,
        'current_usage', current_usage,
        'plan', user_plan,
        'message', 'Subscription limit reached. Please upgrade your plan.'
      );
    ELSE
      result := jsonb_build_object(
        'allowed', true,
        'limit', user_limit,
        'current_usage', current_usage,
        'plan', user_plan,
        'remaining', user_limit - current_usage
      );
    END IF;
    
    RETURN result;
  END;
  
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'allowed', false,
    'error', 'Failed to check subscription limits: ' || SQLERRM
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION check_business_subscription_limit(uuid, text, integer) TO authenticated;

-- Add comment to document the changes
COMMENT ON TABLE subscription_plans IS 'Subscription plans - reintroduced paid plans for business users as of 2025-01-25';
COMMENT ON FUNCTION check_business_subscription_limit(uuid, text, integer) IS 'Check if user can perform action based on their subscription plan limits';