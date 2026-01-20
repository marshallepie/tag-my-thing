-- ============================================
-- Fix Script: Create Missing User Profiles
-- ============================================
-- This script creates user_profiles entries for users who exist
-- in auth.users but don't have profiles.
-- It also creates wallets and initial token transactions.

-- NOTE: This uses the same logic as the create_user_profile_and_wallet() trigger function

DO $$
DECLARE
  auth_user record;
  signup_bonus integer := 50;
  profile_count integer := 0;
  confirmed_count integer := 0;
  unconfirmed_count integer := 0;
  null_email_count integer := 0;
BEGIN
  -- First, check for users with NULL emails (we'll skip these)
  SELECT COUNT(*) INTO null_email_count
  FROM auth.users au
  LEFT JOIN public.user_profiles up ON au.id = up.id
  WHERE up.id IS NULL AND au.email IS NULL;

  IF null_email_count > 0 THEN
    RAISE WARNING '⚠️  Found % users with NULL emails - these will be SKIPPED', null_email_count;
    RAISE WARNING '    NULL email users are typically incomplete signups or test data';
  END IF;

  RAISE NOTICE 'Starting orphaned user profile creation...';
  RAISE NOTICE 'NOTE: This will create profiles for ALL orphaned users (confirmed and unconfirmed)';
  RAISE NOTICE '';

  -- Loop through auth.users who don't have profiles
  -- This includes BOTH confirmed and unconfirmed users
  -- To only fix confirmed users, add: AND au.email_confirmed_at IS NOT NULL
  FOR auth_user IN
    SELECT au.id, au.email, au.raw_user_meta_data, au.created_at, au.email_confirmed_at
    FROM auth.users au
    LEFT JOIN public.user_profiles up ON au.id = up.id
    WHERE up.id IS NULL
      AND au.email IS NOT NULL  -- Skip users with NULL emails
    ORDER BY au.created_at DESC
  LOOP
    RAISE NOTICE 'Creating profile for user: % (email: %)', auth_user.id, auth_user.email;

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
        'Welcome bonus (retroactive - admin fix)'
      );

      RAISE NOTICE 'Created wallet and bonus tokens for user: %', auth_user.email;
    END IF;

    profile_count := profile_count + 1;

    -- Track confirmed vs unconfirmed
    IF auth_user.email_confirmed_at IS NOT NULL THEN
      confirmed_count := confirmed_count + 1;
    ELSE
      unconfirmed_count := unconfirmed_count + 1;
    END IF;
  END LOOP;

  RAISE NOTICE 'Completed! Created % missing profiles', profile_count;
  RAISE NOTICE '  - Confirmed users: %', confirmed_count;
  RAISE NOTICE '  - Unconfirmed users: %', unconfirmed_count;

  -- Return summary
  IF profile_count > 0 THEN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'SUCCESS: Fixed % orphaned user profiles', profile_count;
    RAISE NOTICE '========================================';
  ELSE
    RAISE NOTICE '========================================';
    RAISE NOTICE 'No orphaned users found. All users have profiles!';
    RAISE NOTICE '========================================';
  END IF;

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error creating profiles: %', SQLERRM;
END $$;

-- Verify the fix: Count remaining orphaned users (should be 0)
SELECT
  'VERIFICATION: Remaining orphaned users' as status,
  COUNT(*) as count
FROM auth.users au
LEFT JOIN public.user_profiles up ON au.id = up.id
WHERE up.id IS NULL;

-- Show recently created profiles
SELECT
  'RECENTLY CREATED PROFILES' as info,
  email,
  full_name,
  created_at,
  'Fixed by admin script' as source
FROM public.user_profiles
ORDER BY created_at DESC
LIMIT 10;

-- Show users with NULL emails (if any) for investigation
SELECT
  'USERS WITH NULL EMAILS (SKIPPED)' as warning,
  au.id,
  au.created_at,
  au.raw_user_meta_data->>'full_name' as name_from_metadata,
  au.email_confirmed_at,
  'These users cannot be fixed automatically' as note
FROM auth.users au
LEFT JOIN public.user_profiles up ON au.id = up.id
WHERE up.id IS NULL AND au.email IS NULL
ORDER BY au.created_at DESC;
