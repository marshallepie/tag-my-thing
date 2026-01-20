-- Check RLS policies on user_profiles table
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'user_profiles'
ORDER BY policyname;

-- Check if RLS is enabled
SELECT
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = 'user_profiles';

-- Count total users in user_profiles (bypassing RLS as service_role)
SELECT COUNT(*) as total_users_in_table
FROM public.user_profiles;
