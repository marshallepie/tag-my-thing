-- Show all current RLS policies on user_profiles in a readable format
SELECT
  policyname as "Policy Name",
  cmd as "Command",
  CASE
    WHEN roles = '{public}' THEN 'public'
    WHEN roles = '{authenticated}' THEN 'authenticated'
    ELSE roles::text
  END as "Roles",
  qual as "USING Clause (who can access)",
  with_check as "WITH CHECK Clause (what can be inserted/updated)"
FROM pg_policies
WHERE tablename = 'user_profiles'
ORDER BY policyname;
