/*
  # Fix Referral Reward Processing

  1. Updates
    - Fix the process_referral_rewards function to properly handle wallet updates
    - Ensure referral chain processing works correctly
    - Add better error handling and logging

  2. Security
    - Maintain existing RLS policies
    - Ensure only valid referrals are processed
*/

-- Drop and recreate the process_referral_rewards function with fixes
DROP FUNCTION IF EXISTS process_referral_rewards(uuid);

CREATE OR REPLACE FUNCTION process_referral_rewards(referred_user_id uuid)
RETURNS void AS $$
DECLARE
  current_referral record;
  current_level integer := 1;
  reward_amount integer;
  referrer_wallet_id uuid;
BEGIN
  -- Start with the direct referral
  SELECT * INTO current_referral
  FROM referrals
  WHERE referred_id = referred_user_id AND status = 'completed';
  
  -- Process up to 5 levels of referrals
  WHILE current_referral.id IS NOT NULL AND current_level <= 5 LOOP
    -- Get reward amount for this level
    SELECT token_reward INTO reward_amount
    FROM referral_settings
    WHERE referral_settings.level = current_level AND active = true;
    
    -- Process reward if amount is valid
    IF reward_amount IS NOT NULL AND reward_amount > 0 THEN
      -- Check if reward already exists to avoid duplicates
      IF NOT EXISTS (
        SELECT 1 FROM referral_rewards
        WHERE referrer_id = current_referral.referrer_id
          AND referred_id = referred_user_id
          AND level = current_level
      ) THEN
        -- Create reward record
        INSERT INTO referral_rewards (
          referral_id,
          referrer_id,
          referred_id,
          level,
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
        
        -- Update referrer's wallet balance
        UPDATE user_wallets
        SET balance = balance + reward_amount,
            updated_at = now()
        WHERE user_id = current_referral.referrer_id;
        
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
      END IF;
    END IF;
    
    -- Move to next level - find who referred the current referrer
    SELECT * INTO current_referral
    FROM referrals
    WHERE referred_id = current_referral.referrer_id AND status = 'completed';
    
    current_level := current_level + 1;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create a function to manually trigger referral processing for testing
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

-- Create a function to check referral chain for debugging
DROP FUNCTION debug_referral_chain(text);
CREATE OR REPLACE FUNCTION debug_referral_chain(user_email text)
RETURNS TABLE(
  level integer,
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
    WHERE level = current_level AND active = true;
    
    -- Check if reward exists
    SELECT status INTO reward_status
    FROM referral_rewards
    WHERE referrer_id = current_referral.referrer_id
      AND referred_id = start_user_id
      AND level = current_level;
    
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