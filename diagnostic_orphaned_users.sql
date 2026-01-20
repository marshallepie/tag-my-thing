-- ============================================
-- Diagnostic Script: Orphaned Users Check
-- ============================================
-- This script identifies users in auth.users who don't have
-- corresponding entries in user_profiles table.

-- Step 1: Check for orphaned users (users without profiles)
SELECT
  'ORPHANED USERS (auth.users without user_profiles)' as check_type,
  COUNT(*) as total_orphaned,
  COUNT(*) FILTER (WHERE au.email_confirmed_at IS NOT NULL) as confirmed_orphaned,
  COUNT(*) FILTER (WHERE au.email_confirmed_at IS NULL) as unconfirmed_orphaned
FROM auth.users au
LEFT JOIN public.user_profiles up ON au.id = up.id
WHERE up.id IS NULL;

-- Step 2: List the orphaned users with details
SELECT
  au.id,
  au.email,
  au.created_at as signup_date,
  au.email_confirmed_at,
  CASE
    WHEN au.email_confirmed_at IS NULL THEN 'UNCONFIRMED'
    ELSE 'CONFIRMED'
  END as email_status,
  au.raw_user_meta_data->>'full_name' as name_from_metadata,
  'MISSING PROFILE' as status
FROM auth.users au
LEFT JOIN public.user_profiles up ON au.id = up.id
WHERE up.id IS NULL
ORDER BY au.created_at DESC;

-- Step 3: Verify trigger exists
SELECT
  trigger_name,
  event_manipulation,
  action_statement,
  action_timing
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created'
  AND event_object_schema = 'auth'
  AND event_object_table = 'users';

-- Step 4: Check recent user_profiles entries
SELECT
  'RECENT USER PROFILES' as info,
  id,
  email,
  full_name,
  created_at
FROM public.user_profiles
ORDER BY created_at DESC
LIMIT 10;

-- Step 5: Check recent auth.users entries
SELECT
  'RECENT AUTH USERS' as info,
  id,
  email,
  created_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 10;

-- Step 6: Check for users with NULL emails (these cannot be fixed)
SELECT
  'USERS WITH NULL EMAILS (CANNOT BE FIXED)' as warning,
  COUNT(*) as count
FROM auth.users au
LEFT JOIN public.user_profiles up ON au.id = up.id
WHERE up.id IS NULL AND au.email IS NULL;

-- Step 7: List users with NULL emails (if any)
SELECT
  'NULL EMAIL USERS DETAILS' as warning,
  au.id,
  au.created_at,
  au.email_confirmed_at,
  au.raw_user_meta_data->>'full_name' as name_from_metadata
FROM auth.users au
LEFT JOIN public.user_profiles up ON au.id = up.id
WHERE up.id IS NULL AND au.email IS NULL
ORDER BY au.created_at DESC
LIMIT 10;
