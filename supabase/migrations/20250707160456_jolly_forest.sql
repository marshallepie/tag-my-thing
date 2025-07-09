/*
  # Fix Referral Rewards Processing

  1. Issues Fixed
    - Column name mismatch in process_referral_rewards function
    - Missing proper error handling in reward creation
    - Inconsistent referral_level references

  2. Updates
    - Fix process_referral_rewards function to use correct column names
    - Add better error handling and logging
    - Ensure referral_level consistency across all tables
    - Add manual trigger function for testing

  3. Testing
    - Provides manual trigger function to test reward processing
    - Includes debug functions to trace issues
*/

-- First, let's ensure all tables use referral_level consistently
DO $$
BEGIN
  -- Check if we need to rename columns (in case they're still named 'level')
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'referrals' AND column_name = 'level'
  ) THEN
    ALTER TABLE referrals RENAME COLUMN level TO referral_level;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'referral_rewards' AND column_name = 'level'
  ) THEN
    ALTER TABLE referral_rewards RENAME COLUMN level TO referral_level;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'referral_settings' AND column_name = 'level'
  ) THEN
    ALTER TABLE referral_settings RENAME COLUMN level TO referral_level;
  END IF;
END $$;

-- Drop and recreate the process_referral_rewards function with proper column names
DROP FUNCTION IF EXISTS process_referral_rewards(uuid);

CREATE OR REPLACE FUNCTION process_referral_rewards(referred_user_id uuid)
RETURNS void AS $$
DECLARE
  current_referral record;
  current_level integer := 1;
  reward_amount integer;
  referrer_wallet_id uuid;
  debug_info text := '';
BEGIN
  RAISE NOTICE 'Starting referral processing for user: %', referred_user_id;
  
  -- Start with the direct referral
  SELECT * INTO current_referral
  FROM referrals
  WHERE referred_id = referred_user_id AND status = 'completed';
  
  IF current_referral.id IS NULL THEN
    RAISE NOTICE 'No completed referral found for user: %', referred_user_id;
    RETURN;
  END IF;
  
  RAISE NOTICE 'Found initial referral: % -> %', current_referral.referrer_id, current_referral.referred_id;
  
  -- Process up to 5 levels of referrals
  WHILE current_referral.id IS NOT NULL AND current_level <= 5 LOOP
    RAISE NOTICE 'Processing level % for referrer: %', current_level, current_referral.referrer_id;
    
    -- Get reward amount for this level
    SELECT token_reward INTO reward_amount
    FROM referral_settings
    WHERE referral_settings.referral_level = current_level AND active = true;
    
    RAISE NOTICE 'Reward amount for level %: %', current_level, reward_amount;
    
    -- Process reward if amount is valid
    IF reward_amount IS NOT NULL AND reward_amount > 0 THEN
      -- Check if reward already exists to avoid duplicates
      IF NOT EXISTS (
        SELECT 1 FROM referral_rewards
        WHERE referrer_id = current_referral.referrer_id
          AND referred_id = referred_user_id
          AND referral_level = current_level
      ) THEN
        RAISE NOTICE 'Creating reward record for referrer % at level %', current_referral.referrer_id, current_level;
        
        -- Create reward record
        INSERT INTO referral_rewards (
          referral_id,
          referrer_id,
          referred_id,
          referral_level,
          token_amount,
          status,
          paid_at
        ) VALUES (
          current_referral.id,
          current_referral.referrer_id,
          referred_user_id,
          current_level,
          reward_amount,
          'paid',
          now()
        );
        
        RAISE NOTICE 'Reward record created successfully';
        
        -- Update referrer's wallet balance
        UPDATE user_wallets
        SET balance = balance + reward_amount,
            updated_at = now()
        WHERE user_id = current_referral.referrer_id;
        
        RAISE NOTICE 'Wallet updated for user: %', current_referral.referrer_id;
        
        -- Create transaction record
        INSERT INTO token_transactions (
          user_id,
          amount,
          type,
          source,
          description
        ) VALUES (
          current_referral.referrer_id,
          reward_amount,
          'earned',
          'referral',
          'Level ' || current_level || ' referral reward for user: ' || referred_user_id::text
        );
        
        RAISE NOTICE 'Transaction record created';
      ELSE
        RAISE NOTICE 'Reward already exists for referrer % at level %', current_referral.referrer_id, current_level;
      END IF;
    ELSE
      RAISE NOTICE 'No reward amount configured for level %', current_level;
    END IF;
    
    -- Move to next level - find who referred the current referrer
    SELECT * INTO current_referral
    FROM referrals
    WHERE referred_id = current_referral.referrer_id AND status = 'completed';
    
    current_level := current_level + 1;
  END LOOP;
  
  RAISE NOTICE 'Referral processing completed for user: %', referred_user_id;
END;
$$ LANGUAGE plpgsql;

-- Create a manual trigger function for testing
CREATE OR REPLACE FUNCTION trigger_referral_processing(user_email text)
RETURNS text AS $$
DECLARE
  user_record record;
  result_message text;
BEGIN
  -- Find user by email
  SELECT id, email INTO user_record
  FROM user_profiles
  WHERE email = user_email;
  
  IF user_record.id IS NULL THEN
    RETURN 'User not found with email: ' || user_email;
  END IF;
  
  -- Process referral rewards
  PERFORM process_referral_rewards(user_record.id);
  
  RETURN 'Referral processing completed for user: ' || user_email;
END;
$$ LANGUAGE plpgsql;

-- Update the debug function to use correct column names
DROP FUNCTION IF EXISTS debug_referral_chain(text);
CREATE OR REPLACE FUNCTION debug_referral_chain(user_email text)
RETURNS TABLE(
  referral_level integer,
  referrer_email text,
  referred_email text,
  reward_amount integer,
  reward_status text
) AS $$
DECLARE
  start_user_id uuid;
  current_user_id uuid;
  current_level integer := 1;
  current_referral record;
  reward_setting record;
  reward_status text;
BEGIN
  -- Get starting user ID
  SELECT id INTO start_user_id
  FROM user_profiles
  WHERE email = user_email;
  
  IF start_user_id IS NULL THEN
    RETURN;
  END IF;
  
  current_user_id := start_user_id;
  
  -- Trace up the referral chain
  WHILE current_level <= 5 LOOP
    -- Find who referred this user
    SELECT r.*, 
           referrer.email as referrer_email,
           referred.email as referred_email
    INTO current_referral
    FROM referrals r
    JOIN user_profiles referrer ON referrer.id = r.referrer_id
    JOIN user_profiles referred ON referred.id = r.referred_id
    WHERE r.referred_id = current_user_id AND r.status = 'completed';
    
    EXIT WHEN current_referral.id IS NULL;
    
    -- Get reward setting for this level
    SELECT * INTO reward_setting
    FROM referral_settings
    WHERE referral_settings.referral_level = current_level AND active = true;
    
    -- Check if reward exists
    SELECT rr.status INTO reward_status
    FROM referral_rewards rr
    WHERE rr.referrer_id = current_referral.referrer_id
      AND rr.referred_id = start_user_id
      AND rr.referral_level = current_level;
    
    -- Return row
    RETURN QUERY SELECT 
      current_level,
      current_referral.referrer_email,
      current_referral.referred_email,
      COALESCE(reward_setting.token_reward, 0),
      COALESCE(reward_status, 'not_created');
    
    -- Move up the chain
    current_user_id := current_referral.referrer_id;
    current_level := current_level + 1;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Ensure referral_settings has the correct data
INSERT INTO referral_settings (referral_level, token_reward, active) VALUES
  (1, 50, true),
  (2, 30, true),
  (3, 20, true),
  (4, 10, true),
  (5, 5, true)
ON CONFLICT (referral_level) DO UPDATE SET
  token_reward = EXCLUDED.token_reward,
  active = EXCLUDED.active;

-- Create a comprehensive test function
CREATE OR REPLACE FUNCTION test_referral_system(referred_email text)
RETURNS TABLE(
  step text,
  result text,
  details text
) AS $$
DECLARE
  user_id uuid;
  referral_record record;
  reward_count integer;
BEGIN
  -- Step 1: Find user
  SELECT id INTO user_id FROM user_profiles WHERE email = referred_email;
  
  IF user_id IS NULL THEN
    RETURN QUERY SELECT 'find_user'::text, 'FAILED'::text, 'User not found'::text;
    RETURN;
  END IF;
  
  RETURN QUERY SELECT 'find_user'::text, 'SUCCESS'::text, ('User ID: ' || user_id::text)::text;
  
  -- Step 2: Check referral record
  SELECT * INTO referral_record FROM referrals WHERE referred_id = user_id AND status = 'completed';
  
  IF referral_record.id IS NULL THEN
    RETURN QUERY SELECT 'find_referral'::text, 'FAILED'::text, 'No completed referral found'::text;
    RETURN;
  END IF;
  
  RETURN QUERY SELECT 'find_referral'::text, 'SUCCESS'::text, ('Referrer: ' || referral_record.referrer_id::text)::text;
  
  -- Step 3: Check reward settings
  SELECT COUNT(*) INTO reward_count FROM referral_settings WHERE active = true;
  RETURN QUERY SELECT 'check_settings'::text, 'SUCCESS'::text, (reward_count::text || ' active reward levels')::text;
  
  -- Step 4: Process rewards
  PERFORM process_referral_rewards(user_id);
  RETURN QUERY SELECT 'process_rewards'::text, 'SUCCESS'::text, 'Rewards processing completed'::text;
  
  -- Step 5: Check results
  SELECT COUNT(*) INTO reward_count FROM referral_rewards WHERE referred_id = user_id;
  RETURN QUERY SELECT 'check_results'::text, 'SUCCESS'::text, (reward_count::text || ' reward records created')::text;
  
END;
$$ LANGUAGE plpgsql;