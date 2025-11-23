-- Migration: Improve user creation trigger logging
-- Created: 2025-11-22
-- Description: Add better error logging to identify why profile/wallet creation fails
-- Issue: Silent failures in create_user_profile_and_wallet function

CREATE OR REPLACE FUNCTION create_user_profile_and_wallet()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  signup_bonus integer := 50;
  user_role text := 'user';
  is_business boolean := false;
  profile_created boolean := false;
  wallet_created boolean := false;
  transaction_created boolean := false;
BEGIN
  RAISE NOTICE 'Creating profile for user: % (%)', NEW.id, NEW.email;
  
  -- Check if user metadata indicates influencer or business user
  IF NEW.raw_user_meta_data ? 'role' THEN
    user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'user');
    IF user_role = 'influencer' THEN
      signup_bonus := 100;
    END IF;
  END IF;

  IF NEW.raw_user_meta_data ? 'is_business_user' THEN
    is_business := COALESCE((NEW.raw_user_meta_data->>'is_business_user')::boolean, false);
  END IF;

  -- Create user profile
  BEGIN
    INSERT INTO public.user_profiles (
      id,
      email,
      full_name,
      role,
      subscription_plan,
      is_business_user,
      last_activity_at
    ) VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
      user_role,
      'freemium',
      is_business,
      now()
    );
    profile_created := true;
    RAISE NOTICE 'Profile created for user: %', NEW.id;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE WARNING 'Failed to create user profile for %: % (SQLSTATE: %)', NEW.email, SQLERRM, SQLSTATE;
  END;

  -- Create user wallet with signup bonus
  BEGIN
    INSERT INTO public.user_wallets (
      user_id,
      balance
    ) VALUES (
      NEW.id,
      signup_bonus
    );
    wallet_created := true;
    RAISE NOTICE 'Wallet created for user: % with balance: %', NEW.id, signup_bonus;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE WARNING 'Failed to create user wallet for %: % (SQLSTATE: %)', NEW.email, SQLERRM, SQLSTATE;
  END;

  -- Create initial transaction record
  BEGIN
    INSERT INTO public.token_transactions (
      user_id,
      amount,
      type,
      source,
      description
    ) VALUES (
      NEW.id,
      signup_bonus,
      'earned',
      'signup',
      CASE 
        WHEN user_role = 'influencer' THEN 'Welcome bonus (Influencer)'
        WHEN is_business THEN 'Welcome bonus (Business)'
        ELSE 'Welcome bonus'
      END
    );
    transaction_created := true;
    RAISE NOTICE 'Transaction created for user: %', NEW.id;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE WARNING 'Failed to create transaction for %: % (SQLSTATE: %)', NEW.email, SQLERRM, SQLSTATE;
  END;

  RAISE NOTICE 'User setup complete - Profile: %, Wallet: %, Transaction: %', 
    profile_created, wallet_created, transaction_created;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION create_user_profile_and_wallet() IS 
'Trigger function that creates user profile, wallet, and initial transaction when a new user signs up. Now with enhanced logging.';
