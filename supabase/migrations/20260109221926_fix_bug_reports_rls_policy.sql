-- Fix bug_reports RLS policy for Edge Function inserts
-- The Edge Function authenticates users via JWT and sets the correct user_id,
-- so we can simplify the INSERT policy to allow any authenticated user.

-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Authenticated users can insert bug reports" ON bug_reports;

-- Create a new, simpler policy that allows authenticated users to insert
-- The Edge Function handles authentication and sets the correct user_id
CREATE POLICY "Authenticated users can insert bug reports via Edge Function"
  ON bug_reports FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Add a comment explaining the policy
COMMENT ON POLICY "Authenticated users can insert bug reports via Edge Function" ON bug_reports IS
  'Allows authenticated users to insert bug reports. The submit-bug-report Edge Function validates the JWT and ensures the correct user_id is set.';
