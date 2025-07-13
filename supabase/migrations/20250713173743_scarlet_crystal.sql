/*
  # Create Test Admin Influencer User

  1. Test Data
    - Create a test admin influencer user for development and testing
    - This user will have access to the admin influencer dashboard

  2. Security
    - Creates user with admin_influencer role
    - Sets up wallet and initial token balance
*/

-- Create test admin influencer user if it doesn't exist
DO $$
BEGIN
  -- Check if admin influencer test user exists
  IF NOT EXISTS (
    SELECT 1 FROM user_profiles WHERE email = 'admin@tagmything.com'
  ) THEN
    -- Insert test admin influencer user
    INSERT INTO user_profiles (
      id,
      email,
      full_name,
      role,
      referral_code,
      subscription_plan
    ) VALUES (
      '11111111-1111-1111-1111-111111111111',
      'admin@tagmything.com',
      'Admin Influencer',
      'admin_influencer',
      'admininfluencer',
      'freemium'
    );
    
    -- Create wallet for the test admin user
    INSERT INTO user_wallets (
      user_id,
      balance
    ) 
    SELECT id, 1000 FROM user_profiles WHERE email = 'admin@tagmything.com';
    
    -- Create initial transaction record
    INSERT INTO token_transactions (
      user_id,
      amount,
      type,
      source,
      description
    )
    SELECT 
      id,
      1000,
      'earned',
      'admin_reward',
      'Initial admin influencer setup'
    FROM user_profiles WHERE email = 'admin@tagmything.com';
  END IF;
END $$;

-- Add comment to document the test user
COMMENT ON TABLE user_profiles IS 'User profiles table - includes test admin influencer user (admin@tagmything.com) for development';