-- Migration: Create apply_referral_on_signup Function
-- Created: 2025-11-22
-- Description: Creates the missing RPC function that processes referrals during signup
-- Issue: New users with referral codes aren't getting referral relationships created

-- Drop the function if it exists with any signature
DROP FUNCTION IF EXISTS apply_referral_on_signup(uuid, text, text);
DROP FUNCTION IF EXISTS apply_referral_on_signup(uuid, text);
DROP FUNCTION IF EXISTS apply_referral_on_signup(uuid);

-- Create the apply_referral_on_signup RPC function
CREATE OR REPLACE FUNCTION apply_referral_on_signup(
  p_new_user_id uuid,
  p_referral_code text,
  p_source text DEFAULT 'signup'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_referrer_id uuid;
  v_referral_id uuid;
  v_default_referrer_email text := 'epie@marshallepie.com';
  v_result jsonb;
BEGIN
  RAISE NOTICE 'apply_referral_on_signup: Starting for user % with code: %', p_new_user_id, p_referral_code;

  -- Check if user already has a referral (prevent duplicates)
  IF EXISTS (SELECT 1 FROM referrals WHERE referred_id = p_new_user_id) THEN
    RAISE NOTICE 'apply_referral_on_signup: User % already has a referral', p_new_user_id;
    RETURN jsonb_build_object(
      'success', false,
      'message', 'User already has a referral relationship',
      'already_referred', true
    );
  END IF;

  -- Try to find referrer by code (if provided and not empty)
  IF p_referral_code IS NOT NULL AND p_referral_code != '' THEN
    SELECT id INTO v_referrer_id
    FROM user_profiles
    WHERE referral_code = p_referral_code
    AND id != p_new_user_id  -- Can't refer yourself
    LIMIT 1;

    RAISE NOTICE 'apply_referral_on_signup: Lookup by code "%" returned referrer: %', p_referral_code, v_referrer_id;
  END IF;

  -- If no referrer found by code, use default referrer (epie@marshallepie.com)
  IF v_referrer_id IS NULL THEN
    RAISE NOTICE 'apply_referral_on_signup: No referrer found, using default: %', v_default_referrer_email;
    
    SELECT id INTO v_referrer_id
    FROM user_profiles
    WHERE email = v_default_referrer_email
    LIMIT 1;

    IF v_referrer_id IS NULL THEN
      RAISE WARNING 'apply_referral_on_signup: Default referrer % not found!', v_default_referrer_email;
      RETURN jsonb_build_object(
        'success', false,
        'message', 'No referrer found and default referrer does not exist',
        'default_referrer_missing', true
      );
    END IF;
  END IF;

  RAISE NOTICE 'apply_referral_on_signup: Creating referral record with referrer: %', v_referrer_id;

  -- Create the referral relationship with 'completed' status to trigger rewards
  INSERT INTO referrals (
    referrer_id,
    referred_id,
    referral_code,
    status,
    completed_at,
    created_at,
    updated_at
  ) VALUES (
    v_referrer_id,
    p_new_user_id,
    COALESCE(p_referral_code, 'default'),
    'completed',  -- Mark as completed immediately to trigger rewards
    NOW(),
    NOW(),
    NOW()
  )
  RETURNING id INTO v_referral_id;

  RAISE NOTICE 'apply_referral_on_signup: Referral created with ID: %', v_referral_id;

  -- The trigger 'referral_completion_trigger' will automatically call process_referral_rewards_v2
  -- which will award tokens to the referrer and their chain

  -- Build success response
  v_result := jsonb_build_object(
    'success', true,
    'referral_id', v_referral_id,
    'referrer_id', v_referrer_id,
    'referred_id', p_new_user_id,
    'default_referrer_used', (p_referral_code IS NULL OR p_referral_code = '')
  );

  RAISE NOTICE 'apply_referral_on_signup: Complete. Result: %', v_result;

  RETURN v_result;

EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'apply_referral_on_signup: Error occurred: %', SQLERRM;
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'message', 'Failed to create referral relationship'
    );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION apply_referral_on_signup(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION apply_referral_on_signup(uuid, text, text) TO anon;  -- Allow during signup before authentication

-- Add helpful comment
COMMENT ON FUNCTION apply_referral_on_signup(uuid, text, text) IS 
'Creates a referral relationship for a new user. If no referral code provided, assigns to default referrer (epie@marshallepie.com). Automatically triggers reward processing.';
