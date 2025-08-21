/*
  # Fix Trigger Recreation - Proper Sequencing

  1. Problem
    - Cannot drop trigger_referral_rewards() function because referral_completion_trigger depends on it
    - Need to drop trigger first, then function, then recreate both

  2. Solution
    - Drop the trigger first to remove dependency
    - Drop and recreate functions with SECURITY DEFINER
    - Recreate the trigger with proper function reference

  3. Security
    - SECURITY DEFINER allows functions to bypass RLS when updating referrer wallets
    - Maintains security by validating referral relationships first
    - Preserves audit trail through transaction records
*/

-- Step 1: Drop the trigger first to remove dependency
DROP TRIGGER IF EXISTS referral_completion_trigger ON referrals;

-- Step 2: Drop the dependent functions
DROP FUNCTION IF EXISTS trigger_referral_rewards();
DROP FUNCTION IF EXISTS process_referral_rewards_v2(uuid);
DROP FUNCTION IF EXISTS test_referral_reward_fix(text);

-- Step 3: Recreate process_referral_rewards_v2 with SECURITY DEFINER
CREATE OR REPLACE FUNCTION process_referral_rewards_v2(referred_user_id uuid)
RETURNS jsonb 
LANGUAGE plpgsql 
SECURITY DEFINER  -- Critical: Allows bypassing RLS to update referrer wallets
AS $$
DECLARE
  current_referral record;
  current_level integer := 1;
  reward_amount integer;
  rewards_created integer := 0;
  total_tokens_awarded integer := 0;
  result jsonb;
  error_messages text[] := '{}';
BEGIN
  RAISE NOTICE 'Starting referral reward processing for user: %', referred_user_id;
  
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
    RAISE NOTICE 'No completed referral found for user: %', referred_user_id;
    result := jsonb_set(result, '{errors}', jsonb_build_array('No completed referral found'));
    RETURN result;
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
        BEGIN
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
          
          RAISE NOTICE 'Reward record created, updating wallet for user: %', current_referral.referrer_id;
          
          -- Update referrer's wallet balance (SECURITY DEFINER allows this)
          UPDATE user_wallets
          SET balance = balance + reward_amount,
              updated_at = now()
          WHERE user_id = current_referral.referrer_id;
          
          RAISE NOTICE 'Wallet updated, creating transaction record';
          
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
          
          RAISE NOTICE 'Transaction record created successfully';
          
          rewards_created := rewards_created + 1;
          total_tokens_awarded := total_tokens_awarded + reward_amount;
          
        EXCEPTION WHEN OTHERS THEN
          RAISE WARNING 'Error processing reward at level %: %', current_level, SQLERRM;
          error_messages := error_messages || ('Error at level ' || current_level || ': ' || SQLERRM);
        END;
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
  
  RAISE NOTICE 'Referral processing completed. Rewards created: %, Total tokens: %', rewards_created, total_tokens_awarded;
  
  -- Update result
  result := jsonb_build_object(
    'success', rewards_created > 0,
    'rewards_created', rewards_created,
    'total_tokens', total_tokens_awarded,
    'levels_processed', current_level - 1,
    'errors', array_to_json(error_messages)::jsonb
  );
  
  RETURN result;
END;
$$;

-- Step 4: Recreate trigger_referral_rewards with SECURITY DEFINER
CREATE OR REPLACE FUNCTION trigger_referral_rewards()
RETURNS trigger 
LANGUAGE plpgsql 
SECURITY DEFINER  -- Critical: Allows bypassing RLS for reward processing
AS $$
BEGIN
  -- Only process if the referral status changed to 'completed'
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    RAISE NOTICE 'Referral completed, triggering reward processing for user: %', NEW.referred_id;
    
    -- Add delay to ensure user profile is fully committed
    PERFORM pg_sleep(2);
    
    -- Process rewards
    PERFORM process_referral_rewards_v2(NEW.referred_id);
    
    RAISE NOTICE 'Reward processing triggered for user: %', NEW.referred_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Step 5: Recreate the trigger
CREATE TRIGGER referral_completion_trigger
  AFTER INSERT OR UPDATE ON referrals
  FOR EACH ROW
  EXECUTE FUNCTION trigger_referral_rewards();

-- Step 6: Recreate test function with SECURITY DEFINER
CREATE OR REPLACE FUNCTION test_referral_reward_fix(referred_email text)
RETURNS jsonb 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
DECLARE
  user_id uuid;
  result jsonb;
  wallet_before integer;
  wallet_after integer;
  referrer_id uuid;
BEGIN
  -- Find the referred user
  SELECT id INTO user_id FROM user_profiles WHERE email = referred_email;
  
  IF user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'User not found: ' || referred_email);
  END IF;
  
  -- Find the referrer and get their wallet balance before
  SELECT r.referrer_id, w.balance INTO referrer_id, wallet_before
  FROM referrals r
  JOIN user_wallets w ON w.user_id = r.referrer_id
  WHERE r.referred_id = user_id AND r.status = 'completed';
  
  IF referrer_id IS NULL THEN
    RETURN jsonb_build_object('error', 'No referrer found for user: ' || referred_email);
  END IF;
  
  -- Process rewards
  SELECT process_referral_rewards_v2(user_id) INTO result;
  
  -- Get wallet balance after
  SELECT balance INTO wallet_after FROM user_wallets WHERE user_id = referrer_id;
  
  -- Add wallet comparison to result
  result := result || jsonb_build_object(
    'wallet_before', wallet_before,
    'wallet_after', wallet_after,
    'wallet_increased', wallet_after > wallet_before,
    'referrer_id', referrer_id
  );
  
  RETURN result;
END;
$$;

-- Step 7: Grant execute permissions
GRANT EXECUTE ON FUNCTION process_referral_rewards_v2(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION test_referral_reward_fix(text) TO authenticated;

-- Step 8: Add comments to document the fix
COMMENT ON FUNCTION process_referral_rewards_v2(uuid) IS 'Processes referral rewards with SECURITY DEFINER to bypass RLS when updating referrer wallets - Fixed trigger recreation issue';
COMMENT ON FUNCTION trigger_referral_rewards() IS 'Trigger function to automatically process referral rewards when referrals are completed - Fixed with proper SECURITY DEFINER';
COMMENT ON FUNCTION test_referral_reward_fix(text) IS 'Test function to verify referral reward processing works correctly after SECURITY DEFINER fix';

-- Step 9: Verification
DO $$
BEGIN
  -- Verify trigger exists
  IF EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_name = 'referral_completion_trigger'
    AND event_object_table = 'referrals'
  ) THEN
    RAISE NOTICE '✅ SUCCESS: referral_completion_trigger recreated successfully';
  ELSE
    RAISE EXCEPTION '❌ FAILED: referral_completion_trigger was not recreated';
  END IF;
  
  -- Verify functions exist
  IF EXISTS (
    SELECT 1 FROM information_schema.routines 
    WHERE routine_name = 'process_referral_rewards_v2'
    AND routine_schema = 'public'
  ) THEN
    RAISE NOTICE '✅ SUCCESS: process_referral_rewards_v2 function recreated';
  ELSE
    RAISE EXCEPTION '❌ FAILED: process_referral_rewards_v2 function missing';
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM information_schema.routines 
    WHERE routine_name = 'trigger_referral_rewards'
    AND routine_schema = 'public'
  ) THEN
    RAISE NOTICE '✅ SUCCESS: trigger_referral_rewards function recreated';
  ELSE
    RAISE EXCEPTION '❌ FAILED: trigger_referral_rewards function missing';
  END IF;
  
  RAISE NOTICE '🚀 Migration completed successfully - Referral rewards should now work properly';
END $$;