-- Migration: Ensure all users have wallet records
-- Created: 2025-11-22
-- Description: Creates missing wallet records for users and adds a trigger to auto-create wallets

-- Create wallets for any users that don't have one
INSERT INTO user_wallets (user_id, balance, created_at, updated_at)
SELECT 
  up.id,
  50, -- Default starting balance
  NOW(),
  NOW()
FROM user_profiles up
LEFT JOIN user_wallets uw ON up.id = uw.user_id
WHERE uw.id IS NULL;

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
