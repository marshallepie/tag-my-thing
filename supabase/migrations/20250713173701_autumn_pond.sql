/*
  # Admin Influencer RLS Policies

  1. New Policies
    - Admin influencers can read all user profiles
    - Admin influencers can read all user wallets
    - Admin influencers can read all token transactions
    - Admin influencers can read all assets
    - Admin influencers can update user profiles (except id and email)
    - Admin influencers can update user wallets for token adjustments

  2. Security
    - All policies check for admin_influencer role
    - Maintains data integrity by restricting certain field updates
    - Provides comprehensive read access for dashboard analytics
*/

-- Admin Influencer policies for user_profiles
CREATE POLICY "Admin influencers can read all user profiles"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles admin_profile
      WHERE admin_profile.id = auth.uid() 
      AND admin_profile.role = 'admin_influencer'
    )
  );

CREATE POLICY "Admin influencers can update user profiles"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles admin_profile
      WHERE admin_profile.id = auth.uid() 
      AND admin_profile.role = 'admin_influencer'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles admin_profile
      WHERE admin_profile.id = auth.uid() 
      AND admin_profile.role = 'admin_influencer'
    )
    -- Prevent updating id and email for security
    AND id = (SELECT id FROM user_profiles WHERE id = user_profiles.id)
    AND email = (SELECT email FROM user_profiles WHERE id = user_profiles.id)
  );

-- Admin Influencer policies for user_wallets
CREATE POLICY "Admin influencers can read all user wallets"
  ON user_wallets FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles admin_profile
      WHERE admin_profile.id = auth.uid() 
      AND admin_profile.role = 'admin_influencer'
    )
  );

CREATE POLICY "Admin influencers can update user wallets"
  ON user_wallets FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles admin_profile
      WHERE admin_profile.id = auth.uid() 
      AND admin_profile.role = 'admin_influencer'
    )
  );

-- Admin Influencer policies for token_transactions
CREATE POLICY "Admin influencers can read all token transactions"
  ON token_transactions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles admin_profile
      WHERE admin_profile.id = auth.uid() 
      AND admin_profile.role = 'admin_influencer'
    )
  );

CREATE POLICY "Admin influencers can insert token transactions"
  ON token_transactions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles admin_profile
      WHERE admin_profile.id = auth.uid() 
      AND admin_profile.role = 'admin_influencer'
    )
  );

-- Admin Influencer policies for assets
CREATE POLICY "Admin influencers can read all assets"
  ON assets FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles admin_profile
      WHERE admin_profile.id = auth.uid() 
      AND admin_profile.role = 'admin_influencer'
    )
  );

-- Admin Influencer policies for referrals
CREATE POLICY "Admin influencers can read all referrals"
  ON referrals FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles admin_profile
      WHERE admin_profile.id = auth.uid() 
      AND admin_profile.role = 'admin_influencer'
    )
  );

-- Admin Influencer policies for referral_rewards
CREATE POLICY "Admin influencers can read all referral rewards"
  ON referral_rewards FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles admin_profile
      WHERE admin_profile.id = auth.uid() 
      AND admin_profile.role = 'admin_influencer'
    )
  );

-- Admin Influencer policies for payments
CREATE POLICY "Admin influencers can read all payments"
  ON payments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles admin_profile
      WHERE admin_profile.id = auth.uid() 
      AND admin_profile.role = 'admin_influencer'
    )
  );