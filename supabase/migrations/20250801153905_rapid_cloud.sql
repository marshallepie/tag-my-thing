/*
  # Fix Missing User Profiles

  1. Problem
    - Users exist in auth.users but have no corresponding profile in user_profiles table
    - This causes authentication to fail because useAuth expects both user and profile
    - App gets stuck in loading state

  2. Solution
    - Create profiles for existing auth users who don't have profiles
    - Create wallets and initial token transactions for these users
    - Set up database trigger to auto-create profiles for future signups

  3. Security
    - Uses SECURITY DEFINER to bypass RLS during automatic creation
    - Ensures data consistency and proper initialization
*/

-- Function to automatically create user profile and wallet on signup
CREATE OR REPLACE FUNCTION create_user_profile_and_wallet()
RETURNS trigger AS $$
DECLARE
  signup_bonus integer := 50; -- Default bonus for regular users
  user_role text := 'user';
  is_business boolean := false;
BEGIN
  -- Check if user metadata indicates influencer or business user
  IF NEW.raw_user_meta_data ? 'role' THEN
    user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'user');
    IF user_role = 'influencer' THEN
      signup_bonus := 100; -- Influencers get more tokens
    END IF;
  END IF;

  IF NEW.raw_user_meta_data ? 'is_business_user' THEN
    is_business := COALESCE((NEW.raw_user_meta_data->>'is_business_user')::boolean, false);
  END IF;

  -- Create user profile
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

  -- Create user wallet with signup bonus
  INSERT INTO public.user_wallets (
    user_id,
    balance
  ) VALUES (
    NEW.id,
    signup_bonus
  );

  -- Create initial transaction record
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

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the signup
    RAISE WARNING 'Failed to create user profile and wallet: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_user_profile_and_wallet();

-- Function to generate referral code for existing users without one
CREATE OR REPLACE FUNCTION generate_missing_referral_codes()
RETURNS integer AS $$
DECLARE
  user_record record;
  new_code text;
  codes_generated integer := 0;
BEGIN
  FOR user_record IN 
    SELECT id, full_name, email 
    FROM user_profiles 
    WHERE referral_code IS NULL
  LOOP
    -- Generate a referral code
    new_code := generate_referral_code(user_record.id, user_record.full_name);
    
    -- Update the user with the new code
    UPDATE user_profiles 
    SET referral_code = new_code, updated_at = now()
    WHERE id = user_record.id;
    
    codes_generated := codes_generated + 1;
  END LOOP;
  
  RETURN codes_generated;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create missing profiles for existing auth users who don't have profiles
DO $$
DECLARE
  auth_user record;
  signup_bonus integer := 50;
BEGIN
  -- Loop through auth.users who don't have profiles
  FOR auth_user IN 
    SELECT au.id, au.email, au.raw_user_meta_data, au.created_at
    FROM auth.users au
    LEFT JOIN public.user_profiles up ON au.id = up.id
    WHERE up.id IS NULL
  LOOP
    -- Create missing profile
    INSERT INTO public.user_profiles (
      id,
      email,
      full_name,
      role,
      subscription_plan,
      is_business_user,
      last_activity_at,
      created_at
    ) VALUES (
      auth_user.id,
      auth_user.email,
      COALESCE(auth_user.raw_user_meta_data->>'full_name', ''),
      COALESCE(auth_user.raw_user_meta_data->>'role', 'user'),
      'freemium',
      COALESCE((auth_user.raw_user_meta_data->>'is_business_user')::boolean, false),
      now(),
      auth_user.created_at
    );

    -- Create missing wallet if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM public.user_wallets WHERE user_id = auth_user.id) THEN
      INSERT INTO public.user_wallets (
        user_id,
        balance
      ) VALUES (
        auth_user.id,
        signup_bonus
      );

      -- Create initial transaction
      INSERT INTO public.token_transactions (
        user_id,
        amount,
        type,
        source,
        description
      ) VALUES (
        auth_user.id,
        signup_bonus,
        'earned',
        'signup',
        'Welcome bonus (retroactive)'
      );
    END IF;
  END LOOP;
END $$;

-- Generate referral codes for existing users
SELECT generate_missing_referral_codes();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION create_user_profile_and_wallet() TO service_role;
GRANT EXECUTE ON FUNCTION generate_missing_referral_codes() TO authenticated;

-- Add comment to document the changes
COMMENT ON FUNCTION create_user_profile_and_wallet() IS 'Automatically creates user profile, wallet, and initial tokens when a new user signs up via Supabase Auth';