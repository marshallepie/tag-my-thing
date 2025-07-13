/*
  # Add Admin Influencer Role

  1. Updates
    - Add 'admin_influencer' to the role constraint in user_profiles table
    - This allows users to have the admin_influencer role for dashboard access

  2. Security
    - Maintains existing RLS policies
    - New role will be used for enhanced permissions in subsequent migrations
*/

-- Update role constraint to include admin_influencer
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_role_check;
ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_role_check 
  CHECK (role = ANY (ARRAY['user'::text, 'nok'::text, 'moderator'::text, 'admin'::text, 'influencer'::text, 'admin_influencer'::text]));

-- Add comment to document the new role
COMMENT ON COLUMN user_profiles.role IS 'User role: user, nok, moderator, admin, influencer, admin_influencer. admin_influencer has enhanced dashboard access.';