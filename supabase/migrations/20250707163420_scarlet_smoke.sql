-- Fix automatic referral reward processing
-- This migration ensures rewards are processed correctly on signup

-- Create a more robust reward processing function
CREATE OR REPLACE FUNCTION process_referral_rewards_v2(referred_user_id uuid)
RETURNS jsonb AS $$
DECLARE
  current_referral record;
  current_level integer := 1;
  reward_amount integer;
  rewards_created integer := 0;
  total_tokens_awarded integer := 0;
  result jsonb;
BEGIN
  -- Initialize result
  result := jsonb_build_object(
    'success', false,
    'rewards_created', 0,
    'total_tokens', 0,
    'levels_processed', 0,
    'errors', '[]'::jsonb
  );
  
  -- Start with the direct referral
  SELECT * INTO current_referral
  FROM referrals
  WHERE referred_id = referred_user_id AND status = 'completed';
  
  IF current_referral.id IS NULL THEN
    result := jsonb_set(result, '{errors}', result->'errors' || jsonb_build_array('No completed referral found'));
    RETURN result;
  END IF;
  
  -- Process up to 5 levels of referrals
  WHILE current_referral.id IS NOT NULL AND current_level <= 5 LOOP
    -- Get reward amount for this level
    SELECT token_reward INTO reward_amount
    FROM referral_settings
    WHERE referral_settings.referral_level = current_level AND active = true;
    
    -- Process reward if amount is valid
    IF reward_amount IS NOT NULL AND reward_amount > 0 THEN
      -- Check if reward already exists to avoid duplicates
      IF NOT EXISTS (
        SELECT 1 FROM referral_rewards
        WHERE referrer_id = current_referral.referrer_id
          AND referred_id = referred_user_id
          AND referral_level = current_level
      ) THEN
        BEGIN
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
          
          rewards_created := rewards_created + 1;
          total_tokens_awarded := total_tokens_awarded + reward_amount;
          
        EXCEPTION WHEN OTHERS THEN
          result := jsonb_set(result, '{errors}', result->'errors' || jsonb_build_array('Error at level ' || current_level || ': ' || SQLERRM));
        END;
      END IF;
    END IF;
    
    -- Move to next level - find who referred the current referrer
    SELECT * INTO current_referral
    FROM referrals
    WHERE referred_id = current_referral.referrer_id AND status = 'completed';
    
    current_level := current_level + 1;
  END LOOP;
  
  -- Update result
  result := jsonb_build_object(
    'success', rewards_created > 0,
    'rewards_created', rewards_created,
    'total_tokens', total_tokens_awarded,
    'levels_processed', current_level - 1,
    'errors', result->'errors'
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger function that automatically processes rewards when a referral is completed
CREATE OR REPLACE FUNCTION trigger_referral_rewards()
RETURNS trigger AS $$
BEGIN
  -- Only process if the referral status changed to 'completed'
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    -- Process rewards asynchronously (in a separate transaction)
    PERFORM process_referral_rewards_v2(NEW.referred_id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS referral_completion_trigger ON referrals;
CREATE TRIGGER referral_completion_trigger
  AFTER INSERT OR UPDATE ON referrals
  FOR EACH ROW
  EXECUTE FUNCTION trigger_referral_rewards();

-- Create a function to manually process rewards for testing
CREATE OR REPLACE FUNCTION manual_process_rewards(user_email text)
RETURNS jsonb AS $$
DECLARE
  user_id uuid;
  result jsonb;
BEGIN
  -- Find user by email
  SELECT id INTO user_id FROM user_profiles WHERE email = user_email;
  
  IF user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'User not found: ' || user_email);
  END IF;
  
  -- Process rewards
  SELECT process_referral_rewards_v2(user_id) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Create a comprehensive test function
CREATE OR REPLACE FUNCTION test_referral_flow(referrer_code text, referred_email text)
RETURNS jsonb AS $$
DECLARE
  referrer_id uuid;
  referred_id uuid;
  referral_id uuid;
  result jsonb;
BEGIN
  -- Find referrer
  SELECT id INTO referrer_id FROM user_profiles WHERE referral_code = referrer_code;
  IF referrer_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Referrer not found with code: ' || referrer_code);
  END IF;
  
  -- Find referred user
  SELECT id INTO referred_id FROM user_profiles WHERE email = referred_email;
  IF referred_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Referred user not found: ' || referred_email);
  END IF;
  
  -- Create or update referral record
  INSERT INTO referrals (
    referrer_id,
    referred_id,
    referral_code,
    referral_level,
    status,
    completed_at
  ) VALUES (
    referrer_id,
    referred_id,
    referrer_code,
    1,
    'completed',
    now()
  )
  ON CONFLICT (referred_id) DO UPDATE SET
    status = 'completed',
    completed_at = now()
  RETURNING id INTO referral_id;
  
  -- Process rewards
  SELECT process_referral_rewards_v2(referred_id) INTO result;
  
  -- Add referral info to result
  result := result || jsonb_build_object(
    'referral_id', referral_id,
    'referrer_id', referrer_id,
    'referred_id', referred_id
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Update existing referral_settings to ensure they're correct
UPDATE referral_settings SET 
  token_reward = CASE referral_level
    WHEN 1 THEN 50
    WHEN 2 THEN 30
    WHEN 3 THEN 20
    WHEN 4 THEN 10
    WHEN 5 THEN 5
  END,
  active = true
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