-- Diagnostic Query: Check for users without wallets
-- Run this in Supabase SQL Editor to see which users are missing wallets

SELECT 
  up.id,
  up.email,
  up.full_name,
  up.created_at as user_created,
  uw.id as wallet_id,
  uw.balance,
  uw.created_at as wallet_created
FROM user_profiles up
LEFT JOIN user_wallets uw ON up.id = uw.user_id
WHERE uw.id IS NULL
ORDER BY up.created_at DESC;

-- Count of users without wallets
SELECT COUNT(*) as users_without_wallets
FROM user_profiles up
LEFT JOIN user_wallets uw ON up.id = uw.user_id
WHERE uw.id IS NULL;

-- Count of users with wallets
SELECT COUNT(*) as users_with_wallets
FROM user_profiles up
INNER JOIN user_wallets uw ON up.id = uw.user_id;

-- All users and their wallet status
SELECT 
  COUNT(*) as total_users,
  COUNT(uw.id) as users_with_wallets,
  COUNT(*) - COUNT(uw.id) as users_without_wallets
FROM user_profiles up
LEFT JOIN user_wallets uw ON up.id = uw.user_id;
