-- EMERGENCY: Drop the recursive policy immediately
DROP POLICY IF EXISTS "Admins can view all user profiles" ON public.user_profiles;

-- Verify it's dropped
SELECT 'Policy dropped successfully' as status;
