-- supabase/migrations/20250731140000_dms_nok_enhancements.sql

-- Add last_activity_at to user_profiles for DMS tracking
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS last_activity_at timestamptz DEFAULT now();

-- Add DMS and reassignment fields to asset_nok_assignments
ALTER TABLE asset_nok_assignments
ADD COLUMN IF NOT EXISTS dms_date timestamptz NOT NULL DEFAULT (now() + interval '1 year'),
ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'triggered', 'cancelled')),
ADD COLUMN IF NOT EXISTS access_granted_at timestamptz,
ADD COLUMN IF NOT EXISTS reassigned_by_user_id uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS reassigned_to_nok_id uuid REFERENCES next_of_kin(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS original_assigner_user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE;

-- Populate original_assigner_user_id for existing records
-- This assumes the user_id from the associated asset is the original assigner
UPDATE asset_nok_assignments ana
SET original_assigner_user_id = a.user_id
FROM assets a
WHERE ana.asset_id = a.id
AND ana.original_assigner_user_id IS NULL;

-- Update RLS policies for asset_nok_assignments to incorporate new fields and DMS logic

-- Policy for users to read their own assignments (outgoing)
DROP POLICY IF EXISTS "Users can read own asset NOK assignments" ON asset_nok_assignments;
CREATE POLICY "Users can read own asset NOK assignments"
  ON asset_nok_assignments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM assets
      WHERE assets.id = asset_nok_assignments.asset_id AND assets.user_id = auth.uid()
    )
  );

-- Policy for NOKs to read assignments where they are designated (incoming)
-- Access to asset details is conditional on DMS status
CREATE POLICY "NOKs can read their designated assignments"
  ON asset_nok_assignments FOR SELECT
  TO authenticated
  USING (
    nok_id IN (SELECT id FROM next_of_kin WHERE email = auth.email())
    AND (
      status = 'triggered' -- Full access if DMS triggered
      OR (
        -- Limited access if not triggered (only assignment details, not asset details)
        status IN ('pending', 'active', 'cancelled')
        AND (auth.uid() IS NOT NULL) -- Ensure authenticated
      )
    )
  );

-- Policy for users to insert their own assignments
DROP POLICY IF EXISTS "Users can insert own asset NOK assignments" ON asset_nok_assignments;
CREATE POLICY "Users can insert own asset NOK assignments"
  ON asset_nok_assignments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM assets
      WHERE assets.id = asset_nok_assignments.asset_id AND assets.user_id = auth.uid()
    )
    AND original_assigner_user_id = auth.uid() -- Ensure original assigner is current user
  );

-- Policy for users to update their own assignments (e.g., dms_date)
DROP POLICY IF EXISTS "Users can update own asset NOK assignments" ON asset_nok_assignments;
CREATE POLICY "Users can update own asset NOK assignments"
  ON asset_nok_assignments FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM assets
      WHERE assets.id = asset_nok_assignments.asset_id AND assets.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM assets
      WHERE assets.id = asset_nok_assignments.asset_id AND assets.user_id = auth.uid()
    )
    AND original_assigner_user_id = auth.uid() -- Only original assigner can update
  );

-- Policy for users to delete their own assignments
DROP POLICY IF EXISTS "Users can delete own asset NOK assignments" ON asset_nok_assignments;
CREATE POLICY "Users can delete own asset NOK assignments"
  ON asset_nok_assignments FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM assets
      WHERE assets.id = asset_nok_assignments.asset_id AND assets.user_id = auth.uid()
    )
  );

-- Admin influencers can read all asset NOK assignments
CREATE POLICY "Admin influencers can read all asset NOK assignments"
  ON asset_nok_assignments FOR SELECT
  TO authenticated
  USING (is_user_role('admin_influencer'));

-- Admin influencers can update asset NOK assignments (e.g., status for DMS)
CREATE POLICY "Admin influencers can update asset NOK assignments"
  ON asset_nok_assignments FOR UPDATE
  TO authenticated
  USING (is_user_role('admin_influencer'));

-- Add comment to document the changes
COMMENT ON COLUMN user_profiles.last_activity_at IS 'Timestamp of the user''s last significant activity or login, used for Dead Man''s Switch.';
COMMENT ON COLUMN asset_nok_assignments.dms_date IS 'The date by which the assigner must log in or update to prevent DMS activation.';
COMMENT ON COLUMN asset_nok_assignments.status IS 'Current status of the NOK assignment: pending, active, triggered, cancelled.';
COMMENT ON COLUMN asset_nok_assignments.access_granted_at IS 'Timestamp when the Dead Man''s Switch was triggered and access was granted.';
COMMENT ON COLUMN asset_nok_assignments.reassigned_by_user_id IS 'The user who reassigned this incoming NOK assignment.';
COMMENT ON COLUMN asset_nok_assignments.reassigned_to_nok_id IS 'The next_of_kin who received this reassigned assignment.';
COMMENT ON COLUMN asset_nok_assignments.original_assigner_user_id IS 'The original user who created this asset_nok_assignment.';

-- Create a trigger to update last_activity_at on user_profiles when a user logs in
-- This requires a function to be created first
CREATE OR REPLACE FUNCTION update_last_activity_at()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE user_profiles
  SET last_activity_at = now()
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- This trigger needs to be set on auth.users table, which is not directly accessible via migrations.
-- You would typically set this up via a database hook or a separate migration if you have direct access to auth schema.
-- For now, we will rely on manual updates or updates from the application layer.
-- Example of how it would be set (DO NOT RUN THIS HERE):
-- CREATE TRIGGER on_auth_user_created_update_profile
--   AFTER INSERT ON auth.users
--   FOR EACH ROW EXECUTE FUNCTION public.update_last_activity_at();
-- CREATE TRIGGER on_auth_user_updated_update_profile
--   AFTER UPDATE ON auth.users
--   FOR EACH ROW EXECUTE FUNCTION public.update_last_activity_at();
