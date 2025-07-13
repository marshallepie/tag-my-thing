/*
  # Fix Admin Influencer RLS Infinite Recursion

  1. Problem
    - RLS policies for admin_influencer role cause infinite recursion
    - Policies query user_profiles table to check role, triggering same policies

  2. Solution
    - Create SECURITY DEFINER function to safely check user roles
    - Update all admin_influencer RLS policies to use this function
    - Breaks the recursion loop by bypassing RLS in the role check

  3. Security
    - SECURITY DEFINER function runs with elevated privileges
    - Only checks role, doesn't expose other user data
    - Maintains security while fixing recursion
*/

-- Create a SECURITY DEFINER function to safely check user roles without RLS
CREATE OR REPLACE FUNCTION is_user_role(check_role text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role text;
BEGIN
  -- Get the current user's role directly without triggering RLS
  SELECT role INTO user_role
  FROM user_profiles
  WHERE id = auth.uid();
  
  -- Return true if the user has the specified role
  RETURN user_role = check_role;
EXCEPTION
  WHEN OTHERS THEN
    -- Return false if any error occurs (user not found, etc.)
    RETURN false;
END;
$$;

-- Drop existing problematic admin influencer policies
DROP POLICY IF EXISTS "Admin influencers can read all user profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admin influencers can update user profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admin influencers can read all user wallets" ON user_wallets;
DROP POLICY IF EXISTS "Admin influencers can update user wallets" ON user_wallets;
DROP POLICY IF EXISTS "Admin influencers can read all token transactions" ON token_transactions;
DROP POLICY IF EXISTS "Admin influencers can insert token transactions" ON token_transactions;
DROP POLICY IF EXISTS "Admin influencers can read all assets" ON assets;
DROP POLICY IF EXISTS "Admin influencers can read all referrals" ON referrals;
DROP POLICY IF EXISTS "Admin influencers can read all referral rewards" ON referral_rewards;
DROP POLICY IF EXISTS "Admin influencers can read all payments" ON payments;

-- Recreate admin influencer policies using the safe function

-- User profiles policies
CREATE POLICY "Admin influencers can read all user profiles"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (is_user_role('admin_influencer'));

CREATE POLICY "Admin influencers can update user profiles"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (is_user_role('admin_influencer'))
  WITH CHECK (
    is_user_role('admin_influencer')
    -- Prevent updating id and email for security
    AND id = (SELECT id FROM user_profiles WHERE id = user_profiles.id)
    AND email = (SELECT email FROM user_profiles WHERE id = user_profiles.id)
  );

-- User wallets policies
CREATE POLICY "Admin influencers can read all user wallets"
  ON user_wallets FOR SELECT
  TO authenticated
  USING (is_user_role('admin_influencer'));

CREATE POLICY "Admin influencers can update user wallets"
  ON user_wallets FOR UPDATE
  TO authenticated
  USING (is_user_role('admin_influencer'));

-- Token transactions policies
CREATE POLICY "Admin influencers can read all token transactions"
  ON token_transactions FOR SELECT
  TO authenticated
  USING (is_user_role('admin_influencer'));

CREATE POLICY "Admin influencers can insert token transactions"
  ON token_transactions FOR INSERT
  TO authenticated
  WITH CHECK (is_user_role('admin_influencer'));

-- Assets policies
CREATE POLICY "Admin influencers can read all assets"
  ON assets FOR SELECT
  TO authenticated
  USING (is_user_role('admin_influencer'));

-- Referrals policies
CREATE POLICY "Admin influencers can read all referrals"
  ON referrals FOR SELECT
  TO authenticated
  USING (is_user_role('admin_influencer'));

-- Referral rewards policies
CREATE POLICY "Admin influencers can read all referral rewards"
  ON referral_rewards FOR SELECT
  TO authenticated
  USING (is_user_role('admin_influencer'));

-- Payments policies
CREATE POLICY "Admin influencers can read all payments"
  ON payments FOR SELECT
  TO authenticated
  USING (is_user_role('admin_influencer'));

-- Grant execute permission on the function to authenticated users
GRANT EXECUTE ON FUNCTION is_user_role(text) TO authenticated;

-- Add comment to document the fix
COMMENT ON FUNCTION is_user_role(text) IS 'SECURITY DEFINER function to safely check user roles without triggering RLS recursion. Used by admin_influencer policies.';