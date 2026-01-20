/*
  # Fix Admin RLS Policy Without Recursion

  1. Problem
    - Previous policy caused infinite recursion by querying user_profiles within the policy
    - This crashes the entire application

  2. Solution
    - Create a SECURITY DEFINER function that bypasses RLS to check admin status
    - Use that function in the RLS policy to avoid recursion

  3. Security
    - Function is SECURITY DEFINER so it bypasses RLS (safe for this specific check)
    - Only checks the requesting user's own role, not modifying data
*/

-- Drop the problematic policy if it still exists
DROP POLICY IF EXISTS "Admins can view all user profiles" ON public.user_profiles;

-- Create a helper function to check if current user is admin (bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_admin_or_moderator()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.user_profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'admin_influencer', 'moderator')
  );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.is_admin_or_moderator() TO authenticated;

-- Create policy using the helper function (no recursion!)
CREATE POLICY "Admins can view all user profiles"
ON public.user_profiles
FOR SELECT
TO authenticated
USING (
  -- Allow if user is admin (uses helper function, no recursion)
  public.is_admin_or_moderator()
  -- OR allow users to see their own profile
  OR id = auth.uid()
);

-- Verify the policy was created
DO $$
DECLARE
  policy_count integer;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE tablename = 'user_profiles'
    AND policyname = 'Admins can view all user profiles';

  IF policy_count > 0 THEN
    RAISE NOTICE '✅ Admin policy created successfully (no recursion)';
  ELSE
    RAISE WARNING '⚠️  Admin policy was not created';
  END IF;
END $$;

COMMENT ON FUNCTION public.is_admin_or_moderator() IS
'Helper function to check if current user has admin/moderator role. Uses SECURITY DEFINER to bypass RLS and avoid recursion.';

COMMENT ON POLICY "Admins can view all user profiles" ON public.user_profiles IS
'Allows admin, admin_influencer, and moderator roles to view all user profiles for user management. Uses helper function to avoid infinite recursion.';
