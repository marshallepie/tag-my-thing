-- Fix bug_reports RLS policies to use correct role names
-- The system uses 'admin' and 'moderator' roles, not 'admin_influencer'

-- Drop old policies with incorrect role check
DROP POLICY IF EXISTS "Admin influencers can read all bug reports" ON bug_reports;
DROP POLICY IF EXISTS "Admin influencers can update bug reports" ON bug_reports;
DROP POLICY IF EXISTS "Admin influencers can delete bug reports" ON bug_reports;

-- Create new policies with correct role checks
-- Admins can view all bug reports
CREATE POLICY "Admins can read all bug reports"
  ON bug_reports FOR SELECT
  TO authenticated
  USING (
    (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin'
  );

-- Admins can update bug reports (status, priority, admin_notes)
CREATE POLICY "Admins can update bug reports"
  ON bug_reports FOR UPDATE
  TO authenticated
  USING (
    (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin'
  );

-- Admins can delete bug reports
CREATE POLICY "Admins can delete bug reports"
  ON bug_reports FOR DELETE
  TO authenticated
  USING (
    (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin'
  );

-- Add comments
COMMENT ON POLICY "Admins can read all bug reports" ON bug_reports IS
  'Allows users with admin role to view all bug reports';
COMMENT ON POLICY "Admins can update bug reports" ON bug_reports IS
  'Allows users with admin role to update bug report status, priority, and notes';
COMMENT ON POLICY "Admins can delete bug reports" ON bug_reports IS
  'Allows users with admin role to delete bug reports';
