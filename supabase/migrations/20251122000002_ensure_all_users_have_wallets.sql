-- Migration: Ensure all users have wallet records
-- Created: 2025-11-22
-- Description: Creates missing wallet records for users and adds a trigger to auto-create wallets

-- First, create wallets for any users that don't have one
DO $$
DECLARE
  new_wallet_count INTEGER;
BEGIN
  -- Insert wallets for users without them
  WITH inserted_wallets AS (
    INSERT INTO user_wallets (user_id, balance, created_at, updated_at)
    SELECT 
      up.id,
      50, -- Default starting balance
      NOW(),
      NOW()
    FROM user_profiles up
    LEFT JOIN user_wallets uw ON up.id = uw.user_id
    WHERE uw.id IS NULL
    ON CONFLICT (user_id) DO NOTHING
    RETURNING user_id
  )
  SELECT COUNT(*) INTO new_wallet_count FROM inserted_wallets;
  
  -- Create transaction records for the new wallets
  INSERT INTO token_transactions (user_id, amount, type, source, description)
  SELECT 
    user_id,
    50,
    'earned',
    'signup',
    'Welcome bonus - wallet created retroactively'
  FROM user_wallets
  WHERE user_id IN (
    SELECT up.id
    FROM user_profiles up
    LEFT JOIN token_transactions tt ON up.id = tt.user_id AND tt.description LIKE '%Welcome bonus%'
    WHERE tt.id IS NULL
  )
  AND balance = 50  -- Only add transaction for new wallets with default balance
  ON CONFLICT DO NOTHING;
  
  RAISE NOTICE 'Created % new wallet(s)', new_wallet_count;
END $$;

-- Ensure unique constraint exists on user_wallets
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'user_wallets_user_id_key'
  ) THEN
    ALTER TABLE user_wallets ADD CONSTRAINT user_wallets_user_id_key UNIQUE (user_id);
    RAISE NOTICE 'Added unique constraint on user_wallets.user_id';
  END IF;
END $$;

-- Create a function to automatically create wallet for new users
CREATE OR REPLACE FUNCTION create_wallet_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create wallet with default 50 TMT balance
  INSERT INTO user_wallets (user_id, balance, created_at, updated_at)
  VALUES (NEW.id, 50, NOW(), NOW());
  
  -- Create initial transaction record
  INSERT INTO token_transactions (user_id, amount, type, source, description)
  VALUES (NEW.id, 50, 'earned', 'signup', 'Welcome bonus for new user');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS auto_create_wallet_on_user_creation ON user_profiles;

-- Create trigger to automatically create wallet when user profile is created
CREATE TRIGGER auto_create_wallet_on_user_creation
  AFTER INSERT ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_wallet_for_new_user();

COMMENT ON FUNCTION create_wallet_for_new_user IS 'Automatically creates a wallet with 50 TMT for new users';
