-- Check user wallet balance
SELECT
  user_id,
  balance,
  updated_at
FROM user_wallets
ORDER BY updated_at DESC
LIMIT 5;

-- Check recent token transactions
SELECT
  id,
  user_id,
  transaction_type,
  amount,
  description,
  created_at
FROM token_transactions
ORDER BY created_at DESC
LIMIT 10;

-- Check MTN MOMO transactions
SELECT
  reference_id,
  phone_number,
  amount,
  tmt_tokens_amount,
  status,
  completed_at,
  error_message
FROM mtn_momo_transactions
ORDER BY created_at DESC
LIMIT 5;
