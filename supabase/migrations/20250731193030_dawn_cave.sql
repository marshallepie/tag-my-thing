/*
  # Fix Ambiguous Column Reference Error

  1. Problem
    - The get_nok_assignment_stats() function has a variable named 'user_id' 
    - This conflicts with the 'user_id' column in joined tables
    - PostgreSQL throws "column reference 'user_id' is ambiguous" error

  2. Solution
    - Recreate the function with renamed variable 'v_user_id'
    - This eliminates the naming conflict
    - Maintains all existing functionality

  3. Security
    - Function remains SECURITY DEFINER
    - All permissions and access controls preserved
*/

-- Drop and recreate the get_nok_assignment_stats function with fixed variable naming
DROP FUNCTION IF EXISTS get_nok_assignment_stats() CASCADE;

CREATE OR REPLACE FUNCTION get_nok_assignment_stats()
RETURNS jsonb AS $$
DECLARE
  v_user_id uuid := (select auth.uid()); -- Renamed from user_id to avoid ambiguity
  user_email text;
  incoming_count integer;
  outgoing_count integer;
  triggered_incoming integer;
  pending_outgoing integer;
  upcoming_dms_count integer;
BEGIN
  -- Get user email for NOK lookups
  SELECT email INTO user_email FROM user_profiles WHERE id = v_user_id;
  
  -- Count incoming assignments (where user is designated as NOK)
  SELECT COUNT(*) INTO incoming_count
  FROM asset_nok_assignments ana
  WHERE ana.nok_id IN (SELECT id FROM next_of_kin WHERE email = user_email);
  
  -- Count outgoing assignments (where user assigned others as NOK)
  SELECT COUNT(*) INTO outgoing_count
  FROM asset_nok_assignments ana
  JOIN assets a ON ana.asset_id = a.id
  WHERE a.user_id = v_user_id; -- Use the renamed variable
  
  -- Count triggered incoming assignments
  SELECT COUNT(*) INTO triggered_incoming
  FROM asset_nok_assignments ana
  WHERE ana.nok_id IN (SELECT id FROM next_of_kin WHERE email = user_email)
  AND ana.status = 'triggered';
  
  -- Count pending outgoing assignments
  SELECT COUNT(*) INTO pending_outgoing
  FROM asset_nok_assignments ana
  JOIN assets a ON ana.asset_id = a.id
  WHERE a.user_id = v_user_id -- Use the renamed variable
  AND ana.status IN ('pending', 'active');
  
  -- Count upcoming DMS (within 30 days)
  SELECT COUNT(*) INTO upcoming_dms_count
  FROM asset_nok_assignments ana
  JOIN assets a ON ana.asset_id = a.id
  WHERE a.user_id = v_user_id -- Use the renamed variable
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

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_nok_assignment_stats() TO authenticated;

-- Add comment to document the fix
COMMENT ON FUNCTION get_nok_assignment_stats() IS 'Returns statistics about incoming and outgoing NOK assignments for dashboard display. Fixed ambiguous user_id variable naming.';