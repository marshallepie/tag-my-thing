/*
  # Add Email Confirmation Status to User Profiles

  1. Problem
    - Admin dashboard can't access auth.users.email_confirmed_at directly from client
    - This causes all users to show as "unconfirmed" in the UI

  2. Solution
    - Add email_confirmed_at column to user_profiles table
    - Update trigger to sync this field when profiles are created
    - Backfill existing users with their confirmation status

  3. Security
    - Maintains existing RLS policies
    - Only syncs data from auth.users during profile creation/update
*/

-- Step 1: Add email_confirmed_at column to user_profiles
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS email_confirmed_at timestamptz;

-- Step 2: Update the create_user_profile_and_wallet trigger to include email_confirmed_at
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
    last_activity_at,
    email_confirmed_at  -- NEW: Include confirmation status
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    user_role,
    'freemium',
    is_business,
    now(),
    NEW.email_confirmed_at  -- NEW: Sync from auth.users
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

-- Step 3: Update the profile sync trigger to sync email_confirmed_at
CREATE OR REPLACE FUNCTION sync_profile_to_auth()
RETURNS TRIGGER AS $$
DECLARE
  current_metadata jsonb;
BEGIN
  -- Get current user metadata
  SELECT raw_user_meta_data INTO current_metadata
  FROM auth.users
  WHERE id = NEW.id;

  -- Initialize metadata if null
  IF current_metadata IS NULL THEN
    current_metadata := '{}'::jsonb;
  END IF;

  -- Update auth.users with new profile information
  UPDATE auth.users
  SET
    phone = COALESCE(NEW.phone_number, phone),
    email = CASE
      WHEN NEW.email IS NOT NULL AND NEW.email != '' AND NEW.email != email
      THEN NEW.email
      ELSE email
    END,
    raw_user_meta_data = current_metadata || jsonb_build_object(
      'full_name', COALESCE(NEW.full_name, ''),
      'account_type', COALESCE(NEW.account_type, 'user'),
      'phone_number', COALESCE(NEW.phone_number, ''),
      'updated_via', 'profile_sync'
    ),
    updated_at = now()
  WHERE id = NEW.id;

  -- Log the sync for debugging
  RAISE NOTICE 'Synced profile data for user %: name=%, email=%, phone=%',
    NEW.id, NEW.full_name, NEW.email, NEW.phone_number;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Create trigger to sync email_confirmed_at FROM auth.users TO user_profiles
-- This runs when a user confirms their email
CREATE OR REPLACE FUNCTION sync_email_confirmation_to_profile()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update if email_confirmed_at changed from NULL to a timestamp
  IF OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL THEN
    UPDATE public.user_profiles
    SET email_confirmed_at = NEW.email_confirmed_at
    WHERE id = NEW.id;

    RAISE NOTICE 'Synced email confirmation for user %', NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users for email confirmation sync
DROP TRIGGER IF EXISTS on_email_confirmed ON auth.users;
CREATE TRIGGER on_email_confirmed
  AFTER UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW
  WHEN (OLD.email_confirmed_at IS DISTINCT FROM NEW.email_confirmed_at)
  EXECUTE FUNCTION sync_email_confirmation_to_profile();

-- Step 5: Backfill existing users with their email confirmation status
DO $$
DECLARE
  user_record record;
  updated_count integer := 0;
BEGIN
  RAISE NOTICE 'Backfilling email_confirmed_at for existing users...';

  FOR user_record IN
    SELECT
      au.id,
      au.email_confirmed_at,
      up.email
    FROM auth.users au
    INNER JOIN public.user_profiles up ON au.id = up.id
    WHERE up.email_confirmed_at IS NULL
      AND au.email_confirmed_at IS NOT NULL
  LOOP
    UPDATE public.user_profiles
    SET email_confirmed_at = user_record.email_confirmed_at
    WHERE id = user_record.id;

    updated_count := updated_count + 1;
  END LOOP;

  RAISE NOTICE 'Backfilled % users with email confirmation status', updated_count;
END $$;

-- Add comment to document the changes
COMMENT ON COLUMN public.user_profiles.email_confirmed_at IS 'Timestamp when user confirmed their email address. Synced from auth.users.email_confirmed_at';
COMMENT ON FUNCTION sync_email_confirmation_to_profile() IS 'Automatically syncs email confirmation status from auth.users to user_profiles when user confirms their email';
