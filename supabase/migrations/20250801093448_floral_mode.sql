/*
  # Add missing get_user_asset_count function

  1. New Function
    - get_user_asset_count() - Returns count of assets for current user
    
  2. Security
    - Uses auth.uid() to ensure users only see their own asset count
    - SECURITY DEFINER for safe execution
*/

-- Create function to get user's asset count
CREATE OR REPLACE FUNCTION get_user_asset_count()
RETURNS integer AS $$
DECLARE
  asset_count integer;
  current_user_id uuid;
BEGIN
  -- Get current user ID
  current_user_id := auth.uid();
  
  -- Return 0 if no user is authenticated
  IF current_user_id IS NULL THEN
    RETURN 0;
  END IF;
  
  -- Count assets for the current user
  SELECT COUNT(*) INTO asset_count
  FROM assets
  WHERE user_id = current_user_id;
  
  RETURN COALESCE(asset_count, 0);
  
EXCEPTION WHEN OTHERS THEN
  -- Return 0 on any error to prevent breaking the dashboard
  RETURN 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_asset_count() TO authenticated;

-- Add comment to document the function
COMMENT ON FUNCTION get_user_asset_count() IS 'Returns the count of assets for the currently authenticated user';