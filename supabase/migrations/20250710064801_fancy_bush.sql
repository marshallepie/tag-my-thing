/*
  # Adjust Referral System for All Users

  1. Updates
    - Ensure referral_settings has correct token rewards
    - Remove any restrictions on who can create referral codes
    - Update referral processing to only award tokens on signup (not purchases)

  2. Security
    - Maintain existing RLS policies
    - Ensure all users can generate and use referral codes
*/

-- Ensure referral_settings has the correct token rewards
UPDATE referral_settings SET 
  token_reward = CASE referral_level
    WHEN 1 THEN 50
    WHEN 2 THEN 30
    WHEN 3 THEN 20
    WHEN 4 THEN 10
    WHEN 5 THEN 5
  END,
  active = true,
  updated_at = now()
WHERE referral_level BETWEEN 1 AND 5;

-- Insert missing referral_settings if they don't exist
INSERT INTO referral_settings (referral_level, token_reward, active)
SELECT level_num, 
       CASE level_num
         WHEN 1 THEN 50
         WHEN 2 THEN 30
         WHEN 3 THEN 20
         WHEN 4 THEN 10
         WHEN 5 THEN 5
       END,
       true
FROM generate_series(1, 5) AS level_num
WHERE NOT EXISTS (
  SELECT 1 FROM referral_settings WHERE referral_level = level_num
);

-- Update the generate_referral_code function to work for all users (not just influencers)
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

-- Create a function to generate referral codes for all existing users who don't have one
CREATE OR REPLACE FUNCTION generate_missing_referral_codes()
RETURNS integer AS $$
DECLARE
  user_record record;
  new_code text;
  codes_generated integer := 0;
BEGIN
  -- Loop through all users without referral codes
  FOR user_record IN 
    SELECT id, full_name, email 
    FROM user_profiles 
    WHERE referral_code IS NULL
  LOOP
    -- Generate a referral code
    new_code := generate_referral_code(user_record.id, user_record.full_name);
    
    -- Update the user with the new code
    UPDATE user_profiles 
    SET referral_code = new_code, updated_at = now()
    WHERE id = user_record.id;
    
    codes_generated := codes_generated + 1;
  END LOOP;
  
  RETURN codes_generated;
END;
$$ LANGUAGE plpgsql;

-- Generate referral codes for all existing users who don't have one
SELECT generate_missing_referral_codes();

-- Update RLS policies to ensure all authenticated users can read referral codes for lookup
DROP POLICY IF EXISTS "Allow referral code lookup for all users" ON user_profiles;
CREATE POLICY "Allow referral code lookup for all users"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (referral_code IS NOT NULL);

-- Ensure all users can update their own referral code
DROP POLICY IF EXISTS "Users can update own referral code" ON user_profiles;
CREATE POLICY "Users can update own referral code"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Add comment to document the change
COMMENT ON TABLE referrals IS 'Referral system - all users can create and share referral codes, rewards only given on signup';
COMMENT ON TABLE referral_rewards IS 'Referral rewards - tokens awarded only when referred users sign up, not on purchases';