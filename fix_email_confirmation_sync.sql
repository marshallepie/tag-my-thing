-- ============================================
-- Fix Script: Sync Email Confirmation Status
-- ============================================
-- Manually sync email_confirmed_at from auth.users to user_profiles
-- for all users where there's a mismatch

DO $$
DECLARE
  updated_count integer := 0;
  user_record record;
BEGIN
  RAISE NOTICE 'Starting email confirmation sync...';
  RAISE NOTICE '';

  -- Update all users where auth.users has confirmation but user_profiles doesn't
  FOR user_record IN
    SELECT
      au.id,
      au.email,
      au.email_confirmed_at,
      up.email_confirmed_at as current_profile_confirmed_at
    FROM auth.users au
    INNER JOIN public.user_profiles up ON au.id = up.id
    WHERE au.email_confirmed_at IS NOT NULL
      AND (up.email_confirmed_at IS NULL OR up.email_confirmed_at != au.email_confirmed_at)
  LOOP
    -- Update the user_profile with the confirmation timestamp
    UPDATE public.user_profiles
    SET email_confirmed_at = user_record.email_confirmed_at
    WHERE id = user_record.id;

    updated_count := updated_count + 1;

    IF updated_count <= 10 THEN
      RAISE NOTICE 'Synced user %: % (confirmed at: %)',
        updated_count, user_record.email, user_record.email_confirmed_at;
    END IF;
  END LOOP;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'COMPLETED: Synced % user email confirmations', updated_count;
  RAISE NOTICE '========================================';

END $$;

-- Verify the fix
SELECT
  'VERIFICATION AFTER SYNC' as status,
  COUNT(*) as total_users,
  COUNT(*) FILTER (WHERE email_confirmed_at IS NOT NULL) as confirmed_users,
  COUNT(*) FILTER (WHERE email_confirmed_at IS NULL) as unconfirmed_users
FROM public.user_profiles;

-- Show sample of recently synced users
SELECT
  'SAMPLE OF CONFIRMED USERS' as info,
  email,
  email_confirmed_at,
  created_at
FROM public.user_profiles
WHERE email_confirmed_at IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;
