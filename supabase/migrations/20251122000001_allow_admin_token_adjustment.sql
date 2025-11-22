-- Migration: Allow admin and moderator roles to adjust token balances
-- Created: 2025-11-22
-- Description: Updates adjust_user_tokens function to allow admin, moderator, and admin_influencer roles

-- Update the adjust_user_tokens function to allow admin, moderator, and admin_influencer
CREATE OR REPLACE FUNCTION adjust_user_tokens(
  target_user_id uuid,
  adjustment_amount integer,
  adjustment_reason text DEFAULT 'Admin adjustment'
)
RETURNS jsonb AS $$
DECLARE
  admin_user_id uuid;
  admin_role text;
  current_balance integer;
  new_balance integer;
  transaction_type text;
  result jsonb;
BEGIN
  -- Get the current user and verify role
  admin_user_id := auth.uid();
  
  SELECT role INTO admin_role
  FROM user_profiles
  WHERE id = admin_user_id;
  
  -- Allow admin, moderator, and admin_influencer roles
  IF admin_role NOT IN ('admin', 'moderator', 'admin_influencer') THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Unauthorized: Only admins and moderators can adjust token balances'
    );
  END IF;
  
  -- Validate target user exists
  IF NOT EXISTS (SELECT 1 FROM user_profiles WHERE id = target_user_id) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Target user not found'
    );
  END IF;
  
  -- Get current balance
  SELECT balance INTO current_balance
  FROM user_wallets
  WHERE user_id = target_user_id;
  
  IF current_balance IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'User wallet not found'
    );
  END IF;
  
  -- Calculate new balance and validate
  new_balance := current_balance + adjustment_amount;
  
  IF new_balance < 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Insufficient balance for this adjustment'
    );
  END IF;
  
  -- Determine transaction type
  transaction_type := CASE 
    WHEN adjustment_amount > 0 THEN 'earned'
    ELSE 'spent'
  END;
  
  -- Update wallet balance
  UPDATE user_wallets
  SET balance = new_balance,
      updated_at = now()
  WHERE user_id = target_user_id;
  
  -- Create transaction record
  INSERT INTO token_transactions (
    user_id,
    amount,
    type,
    source,
    description
  ) VALUES (
    target_user_id,
    abs(adjustment_amount),
    transaction_type,
    'admin_reward',
    'Admin adjustment: ' || adjustment_reason || ' (by ' || admin_role || ': ' || admin_user_id::text || ')'
  );
  
  -- Return success result
  RETURN jsonb_build_object(
    'success', true,
    'previous_balance', current_balance,
    'adjustment_amount', adjustment_amount,
    'new_balance', new_balance,
    'transaction_type', transaction_type
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', 'Database error: ' || SQLERRM
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION adjust_user_tokens IS 'Allows admin, moderator, and admin_influencer roles to adjust user token balances';
