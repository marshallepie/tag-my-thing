-- Migration: Allow admin and moderator roles to read all user wallets
-- Created: 2025-11-22
-- Description: Updates RLS policies to allow admin, moderator, and admin_influencer to view all wallets

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Admin influencers can read all user wallets" ON user_wallets;
DROP POLICY IF EXISTS "Admin influencers can update user wallets" ON user_wallets;

-- Create new policies that include admin and moderator roles
CREATE POLICY "Admins can read all user wallets"
  ON user_wallets FOR SELECT
  TO authenticated
  USING (
    is_user_role('admin') OR 
    is_user_role('moderator') OR 
    is_user_role('admin_influencer')
  );

CREATE POLICY "Admins can update user wallets"
  ON user_wallets FOR UPDATE
  TO authenticated
  USING (
    is_user_role('admin') OR 
    is_user_role('moderator') OR 
    is_user_role('admin_influencer')
  );

COMMENT ON POLICY "Admins can read all user wallets" ON user_wallets IS 
  'Allows admin, moderator, and admin_influencer roles to view all user wallet balances';

COMMENT ON POLICY "Admins can update user wallets" ON user_wallets IS 
  'Allows admin, moderator, and admin_influencer roles to update wallet balances';
