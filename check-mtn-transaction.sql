-- Check the most recent MTN MOMO transaction
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/uylayywjytfztihrvogb/editor

SELECT
  reference_id,
  phone_number,
  amount,
  currency,
  tmt_tokens_amount,
  status,
  created_at,
  updated_at,
  completed_at,
  error_message
FROM mtn_momo_transactions
ORDER BY created_at DESC
LIMIT 5;

-- This will show you:
-- - If the transaction was created (should see it with status='pending')
-- - The reference ID (UUID)
-- - When it was created
