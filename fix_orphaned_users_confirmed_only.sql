-- ============================================
-- Fix Script: Create Missing User Profiles (CONFIRMED USERS ONLY)
-- ============================================
-- This script creates user_profiles entries ONLY for users who:
-- 1. Exist in auth.users
-- 2. Don't have profiles
-- 3. Have CONFIRMED their email (email_confirmed_at IS NOT NULL)
--
-- Unconfirmed users are left alone since they may be abandoned signups.

DO $$
DECLARE
  auth_user record;
  signup_bonus integer := 50;
  profile_count integer := 0;
  null_email_count integer := 0;
BEGIN
  -- First, check for confirmed users with NULL emails (we'll skip these)
  SELECT COUNT(*) INTO null_email_count
  FROM auth.users au
  LEFT JOIN public.user_profiles up ON au.id = up.id
  WHERE up.id IS NULL
    AND au.email IS NULL
    AND au.email_confirmed_at IS NOT NULL;

  IF null_email_count > 0 THEN
    RAISE WARNING '⚠️  Found % confirmed users with NULL emails - these will be SKIPPED', null_email_count;
  END IF;

  RAISE NOTICE 'Starting orphaned user profile creation (CONFIRMED USERS ONLY)...';
  RAISE NOTICE '';

  -- Loop through confirmed auth.users who don't have profiles
  FOR auth_user IN
    SELECT au.id, au.email, au.raw_user_meta_data, au.created_at, au.email_confirmed_at
    FROM auth.users au
    LEFT JOIN public.user_profiles up ON au.id = up.id
    WHERE up.id IS NULL
      AND au.email_confirmed_at IS NOT NULL  -- ONLY confirmed users
      AND au.email IS NOT NULL  -- Skip users with NULL emails
    ORDER BY au.created_at DESC
  LOOP
    RAISE NOTICE 'Creating profile for CONFIRMED user: % (email: %)', auth_user.id, auth_user.email;

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
        'Welcome bonus (retroactive - confirmed user fix)'
      );

      RAISE NOTICE 'Created wallet and bonus tokens for user: %', auth_user.email;
    END IF;

    profile_count := profile_count + 1;
  END LOOP;

  RAISE NOTICE 'Completed! Created % missing profiles (confirmed users only)', profile_count;

  -- Return summary
  IF profile_count > 0 THEN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'SUCCESS: Fixed % confirmed orphaned user profiles', profile_count;
    RAISE NOTICE '========================================';
  ELSE
    RAISE NOTICE '========================================';
    RAISE NOTICE 'No confirmed orphaned users found. All confirmed users have profiles!';
    RAISE NOTICE '========================================';
  END IF;

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error creating profiles: %', SQLERRM;
END $$;

-- Show remaining orphaned users (will only show unconfirmed ones if any)
SELECT
  'REMAINING ORPHANED USERS (after fix)' as status,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE au.email_confirmed_at IS NOT NULL) as confirmed,
  COUNT(*) FILTER (WHERE au.email_confirmed_at IS NULL) as unconfirmed
FROM auth.users au
LEFT JOIN public.user_profiles up ON au.id = up.id
WHERE up.id IS NULL;

-- Show recently created profiles
SELECT
  'RECENTLY CREATED PROFILES' as info,
  email,
  full_name,
  created_at,
  'Fixed by admin script (confirmed only)' as source
FROM public.user_profiles
ORDER BY created_at DESC
LIMIT 10;
