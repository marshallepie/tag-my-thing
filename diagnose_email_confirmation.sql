-- ============================================
-- Diagnostic: Email Confirmation Status
-- ============================================
-- Check the sync between auth.users and user_profiles

-- Step 1: Count users in auth.users by confirmation status
SELECT
  'AUTH.USERS CONFIRMATION STATUS' as table_name,
  COUNT(*) as total_users,
  COUNT(*) FILTER (WHERE email_confirmed_at IS NOT NULL) as confirmed_users,
  COUNT(*) FILTER (WHERE email_confirmed_at IS NULL) as unconfirmed_users
FROM auth.users;

-- Step 2: Count users in user_profiles by confirmation status
SELECT
  'USER_PROFILES CONFIRMATION STATUS' as table_name,
  COUNT(*) as total_users,
  COUNT(*) FILTER (WHERE email_confirmed_at IS NOT NULL) as confirmed_users,
  COUNT(*) FILTER (WHERE email_confirmed_at IS NULL) as unconfirmed_users
FROM public.user_profiles;

-- Step 3: Find users who are confirmed in auth.users but NULL in user_profiles
SELECT
  'CONFIRMED IN AUTH.USERS BUT NULL IN USER_PROFILES' as issue,
  COUNT(*) as count
FROM auth.users au
INNER JOIN public.user_profiles up ON au.id = up.id
WHERE au.email_confirmed_at IS NOT NULL
  AND up.email_confirmed_at IS NULL;

-- Step 4: List specific users with the mismatch (first 20)
SELECT
  au.email,
  au.email_confirmed_at as auth_confirmed_at,
  up.email_confirmed_at as profile_confirmed_at,
  up.created_at as profile_created_at,
  'NEEDS SYNC' as status
FROM auth.users au
INNER JOIN public.user_profiles up ON au.id = up.id
WHERE au.email_confirmed_at IS NOT NULL
  AND up.email_confirmed_at IS NULL
ORDER BY up.created_at DESC
LIMIT 20;

-- Step 5: Check if email_confirmed_at column exists
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'user_profiles'
  AND column_name = 'email_confirmed_at';
