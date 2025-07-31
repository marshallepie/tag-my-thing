/*
  # Dead Man's Switch & Enhanced Next-of-Kin System

  1. New Columns
    - `last_activity_at` in user_profiles for DMS tracking
    - `dms_date` in asset_nok_assignments for Dead Man's Switch activation
    - `status` in asset_nok_assignments for assignment lifecycle
    - `access_granted_at` for tracking when DMS was triggered
    - `reassigned_by_user_id` for tracking reassignments
    - `reassigned_to_nok_id` for tracking reassignment targets
    - `original_assigner_user_id` for tracking original asset owner

  2. Enhanced RLS Policies
    - NOKs can read their designated assignments
    - Conditional access based on DMS status
    - Support for reassignment functionality

  3. Core Functions
    - update_user_activity() - Track user engagement
    - assign_nok_to_asset_with_dms() - Assign NOK with DMS date
    - mass_assign_assets_to_nok() - Bulk assignment functionality
    - reassign_incoming_nok_assignment() - Allow NOK reassignment
    - get_user_incoming_nok_assignments() - Retrieve incoming assignments
    - get_user_outgoing_nok_assignments() - Retrieve outgoing assignments
    - check_and_trigger_dms() - Core DMS trigger logic

  4. Security
    - All functions use SECURITY DEFINER for safe execution
    - RLS policies ensure proper access control
    - DMS activation is conditional on user activity
*/

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
UPDATE asset_nok_assignments ana
SET original_assigner_user_id = a.user_id
FROM assets a
WHERE ana.asset_id = a.id
AND ana.original_assigner_user_id IS NULL;

-- Update RLS policies for asset_nok_assignments

-- Policy for users to read their own assignments (outgoing)
DROP POLICY IF EXISTS "Users can read own asset NOK assignments" ON asset_nok_assignments;
CREATE POLICY "Users can read own asset NOK assignments"
  ON asset_nok_assignments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM assets
      WHERE assets.id = asset_nok_assignments.asset_id AND assets.user_id = (select auth.uid())
    )
  );

-- Policy for NOKs to read assignments where they are designated (incoming)
CREATE POLICY "NOKs can read their designated assignments"
  ON asset_nok_assignments FOR SELECT
  TO authenticated
  USING (
    nok_id IN (
      SELECT id FROM next_of_kin 
      WHERE email = (
        SELECT email FROM user_profiles WHERE id = (select auth.uid())
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
      WHERE assets.id = asset_nok_assignments.asset_id AND assets.user_id = (select auth.uid())
    )
    AND original_assigner_user_id = (select auth.uid())
  );

-- Policy for users to update their own assignments
DROP POLICY IF EXISTS "Users can update own asset NOK assignments" ON asset_nok_assignments;
CREATE POLICY "Users can update own asset NOK assignments"
  ON asset_nok_assignments FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM assets
      WHERE assets.id = asset_nok_assignments.asset_id AND assets.user_id = (select auth.uid())
    )
    OR nok_id IN (
      SELECT id FROM next_of_kin 
      WHERE email = (
        SELECT email FROM user_profiles WHERE id = (select auth.uid())
      )
    )
  );

-- Policy for users to delete their own assignments
DROP POLICY IF EXISTS "Users can delete own asset NOK assignments" ON asset_nok_assignments;
CREATE POLICY "Users can delete own asset NOK assignments"
  ON asset_nok_assignments FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM assets
      WHERE assets.id = asset_nok_assignments.asset_id AND assets.user_id = (select auth.uid())
    )
  );

-- Admin influencers can manage all asset NOK assignments
CREATE POLICY "Admin influencers can read all asset NOK assignments"
  ON asset_nok_assignments FOR SELECT
  TO authenticated
  USING (is_user_role('admin_influencer'));

CREATE POLICY "Admin influencers can update asset NOK assignments"
  ON asset_nok_assignments FOR UPDATE
  TO authenticated
  USING (is_user_role('admin_influencer'));

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_asset_nok_assignments_dms_date ON asset_nok_assignments(dms_date);
CREATE INDEX IF NOT EXISTS idx_asset_nok_assignments_status ON asset_nok_assignments(status);
CREATE INDEX IF NOT EXISTS idx_asset_nok_assignments_original_assigner ON asset_nok_assignments(original_assigner_user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_last_activity ON user_profiles(last_activity_at);

-- Function to update last_activity_at for the current user
CREATE OR REPLACE FUNCTION update_user_activity()
RETURNS void AS $$
BEGIN
  UPDATE user_profiles
  SET last_activity_at = now()
  WHERE id = (select auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to assign NOK to an asset with DMS date
CREATE OR REPLACE FUNCTION assign_nok_to_asset_with_dms(
  p_asset_id uuid,
  p_nok_id uuid,
  p_dms_date timestamptz DEFAULT (now() + interval '1 year')
)
RETURNS jsonb AS $$
DECLARE
  assigner_id uuid := (select auth.uid());
  asset_owner_id uuid;
  assignment_id uuid;
BEGIN
  -- Verify current user owns the asset
  SELECT user_id INTO asset_owner_id FROM assets WHERE id = p_asset_id;
  IF asset_owner_id IS NULL OR asset_owner_id != assigner_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized: You do not own this asset.');
  END IF;

  -- Insert or update the assignment
  INSERT INTO asset_nok_assignments (asset_id, nok_id, dms_date, original_assigner_user_id, status)
  VALUES (p_asset_id, p_nok_id, p_dms_date, assigner_id, 'pending')
  ON CONFLICT (asset_id, nok_id) DO UPDATE SET
    dms_date = EXCLUDED.dms_date,
    status = 'pending',
    access_granted_at = NULL,
    updated_at = now()
  RETURNING id INTO assignment_id;

  RETURN jsonb_build_object('success', true, 'assignment_id', assignment_id, 'message', 'NOK assigned successfully.');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mass assign all user's assets to a single NOK
CREATE OR REPLACE FUNCTION mass_assign_assets_to_nok(
  p_nok_id uuid,
  p_dms_date timestamptz DEFAULT (now() + interval '1 year')
)
RETURNS jsonb AS $$
DECLARE
  assigner_id uuid := (select auth.uid());
  assigned_count integer := 0;
  asset_record record;
BEGIN
  FOR asset_record IN SELECT id FROM assets WHERE user_id = assigner_id LOOP
    INSERT INTO asset_nok_assignments (asset_id, nok_id, dms_date, original_assigner_user_id, status)
    VALUES (asset_record.id, p_nok_id, p_dms_date, assigner_id, 'pending')
    ON CONFLICT (asset_id, nok_id) DO UPDATE SET
      dms_date = EXCLUDED.dms_date,
      status = 'pending',
      access_granted_at = NULL,
      updated_at = now();
    assigned_count := assigned_count + 1;
  END LOOP;

  RETURN jsonb_build_object('success', true, 'assigned_count', assigned_count, 'message', 'Assets mass assigned successfully.');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function for a designated NOK to reassign an incoming assignment
CREATE OR REPLACE FUNCTION reassign_incoming_nok_assignment(
  p_assignment_id uuid,
  p_new_nok_id uuid
)
RETURNS jsonb AS $$
DECLARE
  current_nok_id uuid;
  original_assigner uuid;
  user_email text;
BEGIN
  -- Get current user's email
  SELECT email INTO user_email FROM user_profiles WHERE id = (select auth.uid());
  
  -- Verify the current user is the designated NOK for this assignment
  SELECT nok_id, original_assigner_user_id INTO current_nok_id, original_assigner
  FROM asset_nok_assignments
  WHERE id = p_assignment_id;

  IF current_nok_id IS NULL OR current_nok_id != (SELECT id FROM next_of_kin WHERE email = user_email) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized: You are not the designated NOK for this assignment.');
  END IF;

  -- Update the existing assignment to reflect reassignment
  UPDATE asset_nok_assignments
  SET
    nok_id = p_new_nok_id,
    reassigned_by_user_id = (select auth.uid()),
    reassigned_to_nok_id = p_new_nok_id,
    status = 'pending',
    access_granted_at = NULL,
    updated_at = now()
  WHERE id = p_assignment_id;

  RETURN jsonb_build_object('success', true, 'assignment_id', p_assignment_id, 'message', 'Assignment reassigned successfully.');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get assignments where the current user is the designated NOK
CREATE OR REPLACE FUNCTION get_user_incoming_nok_assignments()
RETURNS TABLE(
  assignment_id uuid,
  asset_id uuid,
  asset_title text,
  asset_media_url text,
  asset_media_type text,
  assigner_email text,
  assigner_full_name text,
  dms_date timestamptz,
  status text,
  access_granted_at timestamptz,
  can_view_details boolean
) AS $$
DECLARE
  user_email text;
BEGIN
  -- Get current user's email
  SELECT email INTO user_email FROM user_profiles WHERE id = (select auth.uid());
  
  RETURN QUERY
  SELECT
    ana.id AS assignment_id,
    a.id AS asset_id,
    CASE 
      WHEN ana.status = 'triggered' THEN a.title
      ELSE 'Asset assigned to you'
    END AS asset_title,
    CASE 
      WHEN ana.status = 'triggered' THEN a.media_url
      ELSE NULL
    END AS asset_media_url,
    CASE 
      WHEN ana.status = 'triggered' THEN a.media_type
      ELSE 'unknown'
    END AS asset_media_type,
    up.email AS assigner_email,
    CASE 
      WHEN ana.status = 'triggered' THEN up.full_name
      ELSE 'Someone'
    END AS assigner_full_name,
    ana.dms_date,
    ana.status,
    ana.access_granted_at,
    (ana.status = 'triggered') AS can_view_details
  FROM asset_nok_assignments ana
  JOIN assets a ON ana.asset_id = a.id
  JOIN user_profiles up ON ana.original_assigner_user_id = up.id
  WHERE ana.nok_id IN (SELECT id FROM next_of_kin WHERE email = user_email);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get assignments where the current user assigned others as NOK
CREATE OR REPLACE FUNCTION get_user_outgoing_nok_assignments()
RETURNS TABLE(
  assignment_id uuid,
  asset_id uuid,
  asset_title text,
  asset_media_url text,
  asset_media_type text,
  nok_name text,
  nok_email text,
  nok_relationship text,
  dms_date timestamptz,
  status text,
  access_granted_at timestamptz,
  days_until_dms integer
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ana.id AS assignment_id,
    a.id AS asset_id,
    a.title AS asset_title,
    a.media_url AS asset_media_url,
    a.media_type AS asset_media_type,
    nok.name AS nok_name,
    nok.email AS nok_email,
    nok.relationship AS nok_relationship,
    ana.dms_date,
    ana.status,
    ana.access_granted_at,
    EXTRACT(DAY FROM (ana.dms_date - now()))::integer AS days_until_dms
  FROM asset_nok_assignments ana
  JOIN assets a ON ana.asset_id = a.id
  JOIN next_of_kin nok ON ana.nok_id = nok.id
  WHERE a.user_id = (select auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Core DMS trigger function
CREATE OR REPLACE FUNCTION check_and_trigger_dms()
RETURNS jsonb AS $$
DECLARE
  triggered_count integer := 0;
  assignment_record record;
  result jsonb;
BEGIN
  -- Loop through pending/active assignments where DMS date has passed
  FOR assignment_record IN
    SELECT
      ana.id AS assignment_id,
      ana.asset_id,
      ana.nok_id,
      ana.dms_date,
      ana.original_assigner_user_id,
      up.last_activity_at
    FROM asset_nok_assignments ana
    JOIN user_profiles up ON ana.original_assigner_user_id = up.id
    WHERE ana.status IN ('pending', 'active')
    AND ana.dms_date <= now()
  LOOP
    -- Check if the assigner's last activity is older than the DMS date
    IF assignment_record.last_activity_at IS NULL OR assignment_record.last_activity_at < assignment_record.dms_date THEN
      -- Trigger DMS: update status and access_granted_at
      UPDATE asset_nok_assignments
      SET
        status = 'triggered',
        access_granted_at = now()
      WHERE id = assignment_record.assignment_id;

      triggered_count := triggered_count + 1;
    END IF;
  END LOOP;

  result := jsonb_build_object(
    'success', true,
    'triggered_assignments_count', triggered_count,
    'message', 'DMS check completed.',
    'checked_at', now()
  );

  RETURN result;

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', 'Error in check_and_trigger_dms: ' || SQLERRM
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get NOK assignment statistics for dashboard
CREATE OR REPLACE FUNCTION get_nok_assignment_stats()
RETURNS jsonb AS $$
DECLARE
  user_id uuid := (select auth.uid());
  user_email text;
  incoming_count integer;
  outgoing_count integer;
  triggered_incoming integer;
  pending_outgoing integer;
  upcoming_dms_count integer;
BEGIN
  -- Get user email for NOK lookups
  SELECT email INTO user_email FROM user_profiles WHERE id = user_id;
  
  -- Count incoming assignments (where user is designated as NOK)
  SELECT COUNT(*) INTO incoming_count
  FROM asset_nok_assignments ana
  WHERE ana.nok_id IN (SELECT id FROM next_of_kin WHERE email = user_email);
  
  -- Count outgoing assignments (where user assigned others as NOK)
  SELECT COUNT(*) INTO outgoing_count
  FROM asset_nok_assignments ana
  JOIN assets a ON ana.asset_id = a.id
  WHERE a.user_id = user_id;
  
  -- Count triggered incoming assignments
  SELECT COUNT(*) INTO triggered_incoming
  FROM asset_nok_assignments ana
  WHERE ana.nok_id IN (SELECT id FROM next_of_kin WHERE email = user_email)
  AND ana.status = 'triggered';
  
  -- Count pending outgoing assignments
  SELECT COUNT(*) INTO pending_outgoing
  FROM asset_nok_assignments ana
  JOIN assets a ON ana.asset_id = a.id
  WHERE a.user_id = user_id
  AND ana.status IN ('pending', 'active');
  
  -- Count upcoming DMS (within 30 days)
  SELECT COUNT(*) INTO upcoming_dms_count
  FROM asset_nok_assignments ana
  JOIN assets a ON ana.asset_id = a.id
  WHERE a.user_id = user_id
  AND ana.status IN ('pending', 'active')
  AND ana.dms_date <= now() + interval '30 days';

  RETURN jsonb_build_object(
    'incoming_count', incoming_count,
    'outgoing_count', outgoing_count,
    'triggered_incoming', triggered_incoming,
    'pending_outgoing', pending_outgoing,
    'upcoming_dms_count', upcoming_dms_count
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION update_user_activity() TO authenticated;
GRANT EXECUTE ON FUNCTION assign_nok_to_asset_with_dms(uuid, uuid, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION mass_assign_assets_to_nok(uuid, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION reassign_incoming_nok_assignment(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_incoming_nok_assignments() TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_outgoing_nok_assignments() TO authenticated;
GRANT EXECUTE ON FUNCTION get_nok_assignment_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION check_and_trigger_dms() TO service_role;

-- Add comments to document the changes
COMMENT ON COLUMN user_profiles.last_activity_at IS 'Timestamp of the user''s last significant activity or login, used for Dead Man''s Switch.';
COMMENT ON COLUMN asset_nok_assignments.dms_date IS 'The date by which the assigner must log in or update to prevent DMS activation.';
COMMENT ON COLUMN asset_nok_assignments.status IS 'Current status of the NOK assignment: pending, active, triggered, cancelled.';
COMMENT ON COLUMN asset_nok_assignments.access_granted_at IS 'Timestamp when the Dead Man''s Switch was triggered and access was granted.';
COMMENT ON COLUMN asset_nok_assignments.reassigned_by_user_id IS 'The user who reassigned this incoming NOK assignment.';
COMMENT ON COLUMN asset_nok_assignments.reassigned_to_nok_id IS 'The next_of_kin who received this reassigned assignment.';
COMMENT ON COLUMN asset_nok_assignments.original_assigner_user_id IS 'The original user who created this asset_nok_assignment.';

COMMENT ON FUNCTION update_user_activity() IS 'Updates the last_activity_at timestamp for the current user.';
COMMENT ON FUNCTION assign_nok_to_asset_with_dms(uuid, uuid, timestamptz) IS 'Assigns a Next-of-Kin to an asset with a Dead Man''s Switch date.';
COMMENT ON FUNCTION mass_assign_assets_to_nok(uuid, timestamptz) IS 'Mass assigns all of the current user''s assets to a specified Next-of-Kin.';
COMMENT ON FUNCTION reassign_incoming_nok_assignment(uuid, uuid) IS 'Allows a designated Next-of-Kin to reassign an incoming asset assignment to another Next-of-Kin.';
COMMENT ON FUNCTION get_user_incoming_nok_assignments() IS 'Retrieves asset assignments where the current user is the designated Next-of-Kin.';
COMMENT ON FUNCTION get_user_outgoing_nok_assignments() IS 'Retrieves asset assignments where the current user has assigned others as Next-of-Kin.';
COMMENT ON FUNCTION get_nok_assignment_stats() IS 'Returns statistics about incoming and outgoing NOK assignments for dashboard display.';
COMMENT ON FUNCTION check_and_trigger_dms() IS 'Checks and triggers Dead Man''s Switch for asset assignments based on DMS date and user activity.';