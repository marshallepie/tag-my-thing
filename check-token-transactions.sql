-- Check recent token transactions
SELECT
  id,
  user_id,
  transaction_type,
  amount,
  description,
  created_at,
  metadata
FROM token_transactions
ORDER BY created_at DESC
LIMIT 10;
