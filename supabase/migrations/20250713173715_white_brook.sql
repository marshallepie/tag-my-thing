/*
  # Admin Token Adjustment Functions

  1. New Functions
    - adjust_user_tokens: Safely adjust user token balances with transaction logging
    - get_user_analytics: Get comprehensive user analytics for dashboard
    - get_signup_analytics: Get signup trends and metrics

  2. Security
    - Functions check for admin_influencer role before execution
    - All token adjustments are logged with proper transaction records
    - Comprehensive error handling and validation
*/

-- Function to adjust user token balances (admin only)
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
  -- Get the current user and verify admin_influencer role
  admin_user_id := auth.uid();
  
  SELECT role INTO admin_role
  FROM user_profiles
  WHERE id = admin_user_id;
  
  IF admin_role != 'admin_influencer' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Unauthorized: Only admin influencers can adjust token balances'
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
    'Admin adjustment: ' || adjustment_reason || ' (by admin: ' || admin_user_id::text || ')'
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

-- Function to get user analytics for dashboard
CREATE OR REPLACE FUNCTION get_user_analytics()
RETURNS jsonb AS $$
DECLARE
  admin_user_id uuid;
  admin_role text;
  total_users integer;
  new_users_today integer;
  new_users_week integer;
  new_users_month integer;
  total_tokens_distributed integer;
  total_assets integer;
  total_transactions integer;
  result jsonb;
BEGIN
  -- Verify admin_influencer role
  admin_user_id := auth.uid();
  
  SELECT role INTO admin_role
  FROM user_profiles
  WHERE id = admin_user_id;
  
  IF admin_role != 'admin_influencer' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Unauthorized: Only admin influencers can access analytics'
    );
  END IF;
  
  -- Get user statistics
  SELECT COUNT(*) INTO total_users FROM user_profiles;
  
  SELECT COUNT(*) INTO new_users_today
  FROM user_profiles
  WHERE created_at >= CURRENT_DATE;
  
  SELECT COUNT(*) INTO new_users_week
  FROM user_profiles
  WHERE created_at >= CURRENT_DATE - INTERVAL '7 days';
  
  SELECT COUNT(*) INTO new_users_month
  FROM user_profiles
  WHERE created_at >= CURRENT_DATE - INTERVAL '30 days';
  
  -- Get token statistics
  SELECT COALESCE(SUM(balance), 0) INTO total_tokens_distributed
  FROM user_wallets;
  
  -- Get asset statistics
  SELECT COUNT(*) INTO total_assets FROM assets;
  
  -- Get transaction statistics
  SELECT COUNT(*) INTO total_transactions FROM token_transactions;
  
  -- Build result
  result := jsonb_build_object(
    'success', true,
    'user_stats', jsonb_build_object(
      'total_users', total_users,
      'new_users_today', new_users_today,
      'new_users_week', new_users_week,
      'new_users_month', new_users_month
    ),
    'token_stats', jsonb_build_object(
      'total_tokens_distributed', total_tokens_distributed,
      'total_transactions', total_transactions
    ),
    'asset_stats', jsonb_build_object(
      'total_assets', total_assets
    ),
    'generated_at', now()
  );
  
  RETURN result;
  
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', 'Database error: ' || SQLERRM
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get signup analytics with daily breakdown
CREATE OR REPLACE FUNCTION get_signup_analytics(days_back integer DEFAULT 30)
RETURNS jsonb AS $$
DECLARE
  admin_user_id uuid;
  admin_role text;
  signup_data jsonb;
  result jsonb;
BEGIN
  -- Verify admin_influencer role
  admin_user_id := auth.uid();
  
  SELECT role INTO admin_role
  FROM user_profiles
  WHERE id = admin_user_id;
  
  IF admin_role != 'admin_influencer' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Unauthorized: Only admin influencers can access analytics'
    );
  END IF;
  
  -- Get daily signup data
  SELECT jsonb_agg(
    jsonb_build_object(
      'date', signup_date,
      'signups', signup_count,
      'role_breakdown', role_breakdown
    ) ORDER BY signup_date
  ) INTO signup_data
  FROM (
    SELECT 
      DATE(created_at) as signup_date,
      COUNT(*) as signup_count,
      jsonb_object_agg(role, role_count) as role_breakdown
    FROM (
      SELECT 
        created_at,
        role,
        COUNT(*) as role_count
      FROM user_profiles
      WHERE created_at >= CURRENT_DATE - INTERVAL '1 day' * days_back
      GROUP BY DATE(created_at), role
    ) role_counts
    GROUP BY DATE(created_at)
  ) daily_signups;
  
  result := jsonb_build_object(
    'success', true,
    'days_back', days_back,
    'signup_data', COALESCE(signup_data, '[]'::jsonb),
    'generated_at', now()
  );
  
  RETURN result;
  
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', 'Database error: ' || SQLERRM
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to authenticated users (RLS will handle authorization)
GRANT EXECUTE ON FUNCTION adjust_user_tokens(uuid, integer, text) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_analytics() TO authenticated;
GRANT EXECUTE ON FUNCTION get_signup_analytics(integer) TO authenticated;