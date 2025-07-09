/*
  # Fix referral system and add test data

  1. Updates
    - Add better indexing for referral code lookups
    - Create test influencer with referral code
    - Fix any RLS issues with referral lookups

  2. Test Data
    - Create a test influencer user with referral code 'marshallepie'
    - Ensure proper permissions for referral lookups
*/

-- Add index for faster referral code lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_referral_code_not_null 
ON user_profiles(referral_code) WHERE referral_code IS NOT NULL;

-- Create a test influencer user if it doesn't exist
DO $$
BEGIN
  -- Check if marshallepie user exists
  IF NOT EXISTS (
    SELECT 1 FROM user_profiles WHERE referral_code = 'marshallepie'
  ) THEN
    -- Insert test influencer user
    INSERT INTO user_profiles (
      id,
      email,
      full_name,
      role,
      referral_code,
      subscription_plan
    ) VALUES (
      '8056c771-42be-40e2-942a-28950b3b1ae6',
      'marshall@marshallepie.com',
      'Marshall Epie',
      'influencer',
      'marshallepie',
      'freemium'
    );
    
    -- Create wallet for the test user
    INSERT INTO user_wallets (
      user_id,
      balance
    ) 
    SELECT id, 100 FROM user_profiles WHERE referral_code = 'marshallepie';
  END IF;
END $$;

-- Update RLS policies to allow referral code lookups during signup
-- This is needed for the referral system to work properly
DROP POLICY IF EXISTS "Allow referral code lookup" ON user_profiles;
CREATE POLICY "Allow referral code lookup"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (referral_code IS NOT NULL);

-- Also allow anonymous users to look up referral codes for signup
DROP POLICY IF EXISTS "Allow anonymous referral lookup" ON user_profiles;
CREATE POLICY "Allow anonymous referral lookup"
  ON user_profiles FOR SELECT
  TO anon
  USING (referral_code IS NOT NULL);

-- Ensure the generate_referral_code function works properly
CREATE OR REPLACE FUNCTION generate_referral_code(user_id uuid, username text)
RETURNS text AS $$
DECLARE
  base_code text;
  final_code text;
  counter integer := 0;
BEGIN
  -- Create base code from username or user_id
  IF username IS NOT NULL AND length(username) > 0 THEN
    base_code := lower(regexp_replace(username, '[^a-zA-Z0-9]', '', 'g'));
  ELSE
    base_code := 'user' || substring(user_id::text, 1, 8);
  END IF;
  
  -- Ensure minimum length
  IF length(base_code) < 3 THEN
    base_code := base_code || substring(user_id::text, 1, 8);
  END IF;
  
  -- Limit to reasonable length
  IF length(base_code) > 12 THEN
    base_code := substring(base_code, 1, 12);
  END IF;
  
  final_code := base_code;
  
  -- Check for uniqueness and add counter if needed
  WHILE EXISTS (SELECT 1 FROM user_profiles WHERE referral_code = final_code) LOOP
    counter := counter + 1;
    final_code := base_code || counter::text;
    
    -- Prevent infinite loop
    IF counter > 999 THEN
      final_code := base_code || substring(gen_random_uuid()::text, 1, 4);
      EXIT;
    END IF;
  END LOOP;
  
  RETURN final_code;
END;
$$ LANGUAGE plpgsql;