# Database Migration Steps: Rename 'level' to 'referral_level'

## ⚠️ CRITICAL: Database Schema Update Required

The `level` column in your referral tables conflicts with internal PostgreSQL/Supabase naming conventions. You need to rename it to `referral_level` in your database.

## Step 1: Access Supabase SQL Editor

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your TagMyThing project
3. Click on "SQL Editor" in the left sidebar
4. Click "New Query"

## Step 2: Execute the Migration SQL

Copy and paste the following SQL commands into the SQL editor and run them:

```sql
-- Rename 'level' column to 'referral_level' in referrals table
ALTER TABLE referrals RENAME COLUMN level TO referral_level;

-- Rename 'level' column to 'referral_level' in referral_rewards table
ALTER TABLE referral_rewards RENAME COLUMN level TO referral_level;

-- Rename 'level' column to 'referral_level' in referral_settings table
ALTER TABLE referral_settings RENAME COLUMN level TO referral_level;

-- Update the unique constraint on referral_settings
ALTER TABLE referral_settings DROP CONSTRAINT IF EXISTS referral_settings_level_key;
ALTER TABLE referral_settings ADD CONSTRAINT referral_settings_referral_level_key UNIQUE (referral_level);

-- Update indexes
DROP INDEX IF EXISTS idx_referrals_level;
CREATE INDEX IF NOT EXISTS idx_referrals_referral_level ON referrals(referral_level);

DROP INDEX IF EXISTS idx_referral_rewards_level;
CREATE INDEX IF NOT EXISTS idx_referral_rewards_referral_level ON referral_rewards(referral_level);

-- Update the process_referral_rewards function to use the new column name
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

-- Update the debug_referral_chain function
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
  reward_status text; -- Declare reward_status variable
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
    SELECT status INTO reward_status
    FROM referral_rewards
    WHERE referrer_id = current_referral.referrer_id
      AND referred_id = start_user_id
      AND referral_rewards.referral_level = current_level;
    
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

-- Update existing data to use referral_level = 1 for any existing referrals
UPDATE referrals SET referral_level = 1 WHERE referral_level IS NULL;
UPDATE referral_rewards SET referral_level = 1 WHERE referral_level IS NULL;

-- Verify the changes
SELECT 'referrals' as table_name, count(*) as row_count FROM referrals
UNION ALL
SELECT 'referral_rewards' as table_name, count(*) as row_count FROM referral_rewards
UNION ALL
SELECT 'referral_settings' as table_name, count(*) as row_count FROM referral_settings;
```

## Step 3: Verify the Migration

After running the SQL, verify that:

1. All three tables (`referrals`, `referral_rewards`, `referral_settings`) now have `referral_level` instead of `level`
2. The functions have been updated successfully
3. Existing data has been preserved

## Step 4: Test the Application

1. Try signing up with a referral code
2. Check that the influencer referrals page loads correctly
3. Verify that referral rewards are processed properly

## Why This Change Was Necessary

The `level` column name conflicts with PostgreSQL's internal system columns and reserved keywords. This can cause:

- Ambiguous column references in queries
- Unexpected behavior in database operations
- Conflicts with PostgreSQL's internal `level` field used in hierarchical queries

By renaming to `referral_level`, we:
- Eliminate naming conflicts
- Make the column purpose more explicit
- Ensure compatibility with PostgreSQL best practices

## Rollback (If Needed)

If you need to rollback this change:

```sql
ALTER TABLE referrals RENAME COLUMN referral_level TO level;
ALTER TABLE referral_rewards RENAME COLUMN referral_level TO level;
ALTER TABLE referral_settings RENAME COLUMN referral_level TO level;
```

However, you would then need to revert the frontend code changes as well.