/*
  # Delete specific user by UID

  1. Changes
    - Delete user with UID: a89638fe-88b4-4ed2-ad3d-24ce6306c3ce
    - All related data will be cascade deleted due to foreign key constraints

  2. Tables affected (cascade deletion)
    - auth.users (Supabase authentication table)
    - user_profiles (main record)
    - user_wallets 
    - assets
    - next_of_kin
    - asset_nok_assignments
    - token_transactions
    - referrals
    - referral_rewards
    - products
    - scan_events
    - bug_reports (if user_id references user_profiles)
    - Any other tables with foreign key references

  3. Security
    - This is a one-time deletion migration
    - Cannot be undone without backup restoration
*/

-- First delete from user_profiles table (if it still exists)
-- This will cascade delete all related records due to foreign key constraints
DELETE FROM user_profiles 
WHERE id = 'a89638fe-88b4-4ed2-ad3d-24ce6306c3ce';

-- Then delete from auth.users table
-- This is the main Supabase auth table
DELETE FROM auth.users 
WHERE id = 'a89638fe-88b4-4ed2-ad3d-24ce6306c3ce';

-- Verify complete deletion
DO $$
DECLARE
  profile_count INTEGER;
  auth_count INTEGER;
BEGIN
  -- Check user_profiles table
  SELECT COUNT(*) INTO profile_count 
  FROM user_profiles 
  WHERE id = 'a89638fe-88b4-4ed2-ad3d-24ce6306c3ce';
  
  -- Check auth.users table
  SELECT COUNT(*) INTO auth_count 
  FROM auth.users 
  WHERE id = 'a89638fe-88b4-4ed2-ad3d-24ce6306c3ce';
  
  IF profile_count = 0 AND auth_count = 0 THEN
    RAISE NOTICE 'User a89638fe-88b4-4ed2-ad3d-24ce6306c3ce successfully deleted from both user_profiles and auth.users';
  ELSE
    RAISE EXCEPTION 'Failed to completely delete user. Profile count: %, Auth count: %', profile_count, auth_count;
  END IF;
END $$;