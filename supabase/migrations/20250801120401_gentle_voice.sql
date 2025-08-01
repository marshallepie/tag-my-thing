/*
  # Comprehensive TagMyThing Database Schema
  
  This migration creates a complete, clean database schema for TagMyThing
  that includes all current functionality with consistent naming conventions.
  
  1. Core Tables
    - user_profiles: Extended user information with business and referral support
    - user_wallets: TMT token management
    - assets: Tagged assets with media support and archiving
    - next_of_kin: Next-of-kin relationships
    - asset_nok_assignments: NOK assignments with Dead Man's Switch
    
  2. Token Economy
    - token_transactions: All token movements
    - subscription_plans: Business subscription tiers
    - token_packages: Token purchase options
    - payments: Payment processing records
    
  3. Referral System
    - referrals: Multi-level referral tracking
    - referral_rewards: Token rewards for referrals
    - referral_settings: Configurable reward amounts
    
  4. Business Features
    - products: Business product registration
    - scan_events: Product verification scans
    
  5. Support & Reporting
    - bug_reports: In-app bug reporting system
    
  6. Security
    - Comprehensive RLS policies
    - SECURITY DEFINER functions for safe operations
    - Role-based access control
*/

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create role checking function (SECURITY DEFINER to avoid RLS recursion)
CREATE OR REPLACE FUNCTION is_user_role(check_role text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role text;
BEGIN
  SELECT role INTO user_role
  FROM user_profiles
  WHERE id = auth.uid();
  
  RETURN user_role = check_role;
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$;

-- ============================================================================
-- CORE USER TABLES
-- ============================================================================

-- User profiles with comprehensive user information
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text,
  avatar_url text,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'nok', 'moderator', 'admin', 'influencer', 'admin_influencer')),
  subscription_plan text NOT NULL DEFAULT 'freemium' CHECK (subscription_plan IN ('freemium', 'professional', 'enterprise')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  location text,
  language text DEFAULT 'en',
  referral_code text UNIQUE,
  is_business_user boolean DEFAULT false,
  company_name text,
  tax_id text,
  business_document_url text,
  last_activity_at timestamptz DEFAULT now(),
  PRIMARY KEY (id)
);

-- User wallets for TMT token management
CREATE TABLE IF NOT EXISTS user_wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  balance integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- ============================================================================
-- ASSET MANAGEMENT TABLES
-- ============================================================================

-- Assets with comprehensive metadata and archiving support
CREATE TABLE IF NOT EXISTS assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  tags text[] DEFAULT '{}',
  media_url text NOT NULL,
  media_type text NOT NULL CHECK (media_type IN ('photo', 'video')),
  privacy text NOT NULL DEFAULT 'private' CHECK (privacy IN ('private', 'public')),
  estimated_value decimal(10,2),
  location text,
  blockchain_hash text,
  blockchain_network text,
  blockchain_status text CHECK (blockchain_status IN ('pending', 'published', 'failed')),
  ipfs_cid text,
  arweave_tx_id text,
  archive_status text NOT NULL DEFAULT 'pending' CHECK (archive_status IN ('pending', 'archived', 'instant_requested', 'failed')),
  archive_requested_at timestamptz,
  archive_method text,
  media_items jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================================
-- NEXT-OF-KIN SYSTEM WITH DEAD MAN'S SWITCH
-- ============================================================================

-- Next of kin relationships
CREATE TABLE IF NOT EXISTS next_of_kin (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  relationship text NOT NULL,
  photo_url text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'declined')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Asset NOK assignments with Dead Man's Switch
CREATE TABLE IF NOT EXISTS asset_nok_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid REFERENCES assets(id) ON DELETE CASCADE NOT NULL,
  nok_id uuid REFERENCES next_of_kin(id) ON DELETE CASCADE NOT NULL,
  dms_date timestamptz NOT NULL DEFAULT (now() + interval '1 year'),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'triggered', 'cancelled')),
  access_granted_at timestamptz,
  reassigned_by_user_id uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  reassigned_to_nok_id uuid REFERENCES next_of_kin(id) ON DELETE SET NULL,
  original_assigner_user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(asset_id, nok_id)
);

-- ============================================================================
-- TOKEN ECONOMY TABLES
-- ============================================================================

-- Token transactions for all token movements
CREATE TABLE IF NOT EXISTS token_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  amount integer NOT NULL,
  type text NOT NULL CHECK (type IN ('earned', 'spent')),
  source text NOT NULL CHECK (source IN ('signup', 'referral', 'daily_login', 'admin_reward', 'purchase', 'tag_asset', 'edit_asset', 'upload_media', 'assign_nok', 'blockchain_publish')),
  description text,
  created_at timestamptz DEFAULT now()
);

-- Subscription plans for business users
CREATE TABLE IF NOT EXISTS subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  token_limit integer NOT NULL,
  price_gbp decimal(10,2),
  price_xaf decimal(10,2),
  billing_interval text NOT NULL CHECK (billing_interval IN ('monthly', 'yearly')),
  features text[] DEFAULT '{}',
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Token packages for purchase
CREATE TABLE IF NOT EXISTS token_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  token_amount integer NOT NULL,
  bonus_tokens integer NOT NULL DEFAULT 0,
  price_gbp decimal(10,2) NOT NULL,
  price_xaf decimal(10,2) NOT NULL,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Payment records
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  amount decimal(10,2) NOT NULL,
  currency text NOT NULL,
  payment_method text NOT NULL CHECK (payment_method IN ('stripe', 'mtn_money', 'orange_money')),
  stripe_payment_intent_id text,
  mobile_money_reference text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  type text NOT NULL CHECK (type IN ('subscription', 'tokens')),
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================================
-- REFERRAL SYSTEM TABLES
-- ============================================================================

-- Referral tracking with multi-level support
CREATE TABLE IF NOT EXISTS referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  referred_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  referral_code text NOT NULL,
  referral_level integer NOT NULL DEFAULT 1 CHECK (referral_level >= 1 AND referral_level <= 5),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(referred_id)
);

-- Referral rewards tracking
CREATE TABLE IF NOT EXISTS referral_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_id uuid REFERENCES referrals(id) ON DELETE CASCADE NOT NULL,
  referrer_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  referred_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  referral_level integer NOT NULL CHECK (referral_level >= 1 AND referral_level <= 5),
  token_amount integer NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
  paid_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Referral settings configuration
CREATE TABLE IF NOT EXISTS referral_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_level integer NOT NULL UNIQUE CHECK (referral_level >= 1 AND referral_level <= 5),
  token_reward integer NOT NULL,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================================
-- BUSINESS FEATURES TABLES
-- ============================================================================

-- Business product registration
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_name text NOT NULL,
  serial_number text UNIQUE NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  business_user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL
);

-- Product scan events for verification
CREATE TABLE IF NOT EXISTS scan_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  serial_number text NOT NULL,
  scanned_at timestamptz DEFAULT now(),
  ip_address text,
  location text,
  device_info text,
  user_id uuid REFERENCES user_profiles(id) ON DELETE SET NULL
);

-- ============================================================================
-- SUPPORT & REPORTING TABLES
-- ============================================================================

-- Bug reports system
CREATE TABLE IF NOT EXISTS bug_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email text,
  user_name text,
  error_message text NOT NULL,
  console_logs text,
  screenshot_url text,
  page_url text,
  user_agent text,
  metadata jsonb DEFAULT '{}',
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'triaged', 'in_progress', 'resolved', 'wont_fix')),
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  admin_notes text
);

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE next_of_kin ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_nok_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE scan_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE bug_reports ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- User Profiles Policies
CREATE POLICY "Users can read own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Allow referral code lookup for all users"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (referral_code IS NOT NULL);

CREATE POLICY "Allow anonymous referral lookup"
  ON user_profiles FOR SELECT
  TO anon
  USING (referral_code IS NOT NULL);

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
    AND id = (SELECT id FROM user_profiles WHERE id = user_profiles.id)
    AND email = (SELECT email FROM user_profiles WHERE id = user_profiles.id)
  );

-- User Wallets Policies
CREATE POLICY "Users can read own wallet"
  ON user_wallets FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own wallet"
  ON user_wallets FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own wallet"
  ON user_wallets FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admin influencers can read all user wallets"
  ON user_wallets FOR SELECT
  TO authenticated
  USING (is_user_role('admin_influencer'));

CREATE POLICY "Admin influencers can update user wallets"
  ON user_wallets FOR UPDATE
  TO authenticated
  USING (is_user_role('admin_influencer'));

-- Assets Policies
CREATE POLICY "Users can read own assets"
  ON assets FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can read public assets"
  ON assets FOR SELECT
  TO authenticated
  USING (privacy = 'public');

CREATE POLICY "Anonymous can read public assets"
  ON assets FOR SELECT
  TO anon
  USING (privacy = 'public');

CREATE POLICY "Users can insert own assets"
  ON assets FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own assets"
  ON assets FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own assets"
  ON assets FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admin influencers can read all assets"
  ON assets FOR SELECT
  TO authenticated
  USING (is_user_role('admin_influencer'));

-- Next of Kin Policies
CREATE POLICY "Users can read own NOKs"
  ON next_of_kin FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own NOKs"
  ON next_of_kin FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own NOKs"
  ON next_of_kin FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own NOKs"
  ON next_of_kin FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Asset NOK Assignments Policies
CREATE POLICY "Users can read own asset NOK assignments"
  ON asset_nok_assignments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM assets
      WHERE assets.id = asset_nok_assignments.asset_id AND assets.user_id = auth.uid()
    )
  );

CREATE POLICY "NOKs can read their designated assignments"
  ON asset_nok_assignments FOR SELECT
  TO authenticated
  USING (
    nok_id IN (
      SELECT id FROM next_of_kin 
      WHERE email = (
        SELECT email FROM user_profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can insert own asset NOK assignments"
  ON asset_nok_assignments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM assets
      WHERE assets.id = asset_nok_assignments.asset_id AND assets.user_id = auth.uid()
    )
    AND original_assigner_user_id = auth.uid()
  );

CREATE POLICY "Users can update own asset NOK assignments"
  ON asset_nok_assignments FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM assets
      WHERE assets.id = asset_nok_assignments.asset_id AND assets.user_id = auth.uid()
    )
    OR nok_id IN (
      SELECT id FROM next_of_kin 
      WHERE email = (
        SELECT email FROM user_profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can delete own asset NOK assignments"
  ON asset_nok_assignments FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM assets
      WHERE assets.id = asset_nok_assignments.asset_id AND assets.user_id = auth.uid()
    )
  );

CREATE POLICY "Admin influencers can read all asset NOK assignments"
  ON asset_nok_assignments FOR SELECT
  TO authenticated
  USING (is_user_role('admin_influencer'));

CREATE POLICY "Admin influencers can update asset NOK assignments"
  ON asset_nok_assignments FOR UPDATE
  TO authenticated
  USING (is_user_role('admin_influencer'));

-- Token Transactions Policies
CREATE POLICY "Users can read own transactions"
  ON token_transactions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own transactions"
  ON token_transactions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admin influencers can read all token transactions"
  ON token_transactions FOR SELECT
  TO authenticated
  USING (is_user_role('admin_influencer'));

CREATE POLICY "Admin influencers can insert token transactions"
  ON token_transactions FOR INSERT
  TO authenticated
  WITH CHECK (is_user_role('admin_influencer'));

-- Subscription Plans Policies
CREATE POLICY "Anyone can read active subscription plans"
  ON subscription_plans FOR SELECT
  TO authenticated
  USING (active = true);

-- Token Packages Policies
CREATE POLICY "Anyone can read active token packages"
  ON token_packages FOR SELECT
  TO authenticated
  USING (active = true);

-- Payments Policies
CREATE POLICY "Users can read own payments"
  ON payments FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own payments"
  ON payments FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own payments"
  ON payments FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admin influencers can read all payments"
  ON payments FOR SELECT
  TO authenticated
  USING (is_user_role('admin_influencer'));

-- Referrals Policies
CREATE POLICY "Users can read own referrals as referrer"
  ON referrals FOR SELECT
  TO authenticated
  USING (referrer_id = auth.uid());

CREATE POLICY "Users can read own referrals as referred"
  ON referrals FOR SELECT
  TO authenticated
  USING (referred_id = auth.uid());

CREATE POLICY "Users can insert referrals"
  ON referrals FOR INSERT
  TO authenticated
  WITH CHECK (referred_id = auth.uid());

CREATE POLICY "System can update referrals"
  ON referrals FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Admin influencers can read all referrals"
  ON referrals FOR SELECT
  TO authenticated
  USING (is_user_role('admin_influencer'));

-- Referral Rewards Policies
CREATE POLICY "Users can read own referral rewards"
  ON referral_rewards FOR SELECT
  TO authenticated
  USING (referrer_id = auth.uid() OR referred_id = auth.uid());

CREATE POLICY "System can insert referral rewards"
  ON referral_rewards FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "System can update referral rewards"
  ON referral_rewards FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Admin influencers can read all referral rewards"
  ON referral_rewards FOR SELECT
  TO authenticated
  USING (is_user_role('admin_influencer'));

-- Referral Settings Policies
CREATE POLICY "Anyone can read referral settings"
  ON referral_settings FOR SELECT
  TO authenticated
  USING (active = true);

CREATE POLICY "Admins can manage referral settings"
  ON referral_settings FOR ALL
  TO authenticated
  USING (is_user_role('admin_influencer'));

-- Products Policies
CREATE POLICY "Business users can read own products"
  ON products FOR SELECT
  TO authenticated
  USING (
    business_user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND is_business_user = true
    )
  );

CREATE POLICY "Business users can insert own products"
  ON products FOR INSERT
  TO authenticated
  WITH CHECK (
    business_user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND is_business_user = true
    )
  );

CREATE POLICY "Business users can update own products"
  ON products FOR UPDATE
  TO authenticated
  USING (
    business_user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND is_business_user = true
    )
  );

CREATE POLICY "Business users can delete own products"
  ON products FOR DELETE
  TO authenticated
  USING (
    business_user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND is_business_user = true
    )
  );

CREATE POLICY "Admin influencers can read all products"
  ON products FOR SELECT
  TO authenticated
  USING (is_user_role('admin_influencer'));

CREATE POLICY "Admin influencers can manage all products"
  ON products FOR ALL
  TO authenticated
  USING (is_user_role('admin_influencer'));

-- Scan Events Policies
CREATE POLICY "Anyone can insert scan events"
  ON scan_events FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Business users can read scan events for their products"
  ON scan_events FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM products p
      WHERE p.serial_number = scan_events.serial_number
      AND p.business_user_id = auth.uid()
    )
  );

CREATE POLICY "Admin influencers can read all scan events"
  ON scan_events FOR SELECT
  TO authenticated
  USING (is_user_role('admin_influencer'));

-- Bug Reports Policies
CREATE POLICY "Authenticated users can insert bug reports"
  ON bug_reports FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin influencers can read all bug reports"
  ON bug_reports FOR SELECT
  TO authenticated
  USING (is_user_role('admin_influencer'));

CREATE POLICY "Admin influencers can update bug reports"
  ON bug_reports FOR UPDATE
  TO authenticated
  USING (is_user_role('admin_influencer'));

CREATE POLICY "Admin influencers can delete bug reports"
  ON bug_reports FOR DELETE
  TO authenticated
  USING (is_user_role('admin_influencer'));

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- User profiles indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_referral_code ON user_profiles(referral_code);
CREATE INDEX IF NOT EXISTS idx_user_profiles_referral_code_not_null ON user_profiles(referral_code) WHERE referral_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_business_user ON user_profiles(is_business_user) WHERE is_business_user = true;
CREATE INDEX IF NOT EXISTS idx_user_profiles_company_name ON user_profiles(company_name) WHERE company_name IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_user_profiles_last_activity ON user_profiles(last_activity_at);

-- Assets indexes
CREATE INDEX IF NOT EXISTS idx_assets_user_id ON assets(user_id);
CREATE INDEX IF NOT EXISTS idx_assets_privacy ON assets(privacy);
CREATE INDEX IF NOT EXISTS idx_assets_tags ON assets USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_assets_archive_status ON assets(archive_status);

-- NOK indexes
CREATE INDEX IF NOT EXISTS idx_next_of_kin_user_id ON next_of_kin(user_id);
CREATE INDEX IF NOT EXISTS idx_next_of_kin_email ON next_of_kin(email);
CREATE INDEX IF NOT EXISTS idx_asset_nok_assignments_dms_date ON asset_nok_assignments(dms_date);
CREATE INDEX IF NOT EXISTS idx_asset_nok_assignments_status ON asset_nok_assignments(status);
CREATE INDEX IF NOT EXISTS idx_asset_nok_assignments_original_assigner ON asset_nok_assignments(original_assigner_user_id);

-- Token system indexes
CREATE INDEX IF NOT EXISTS idx_token_transactions_user_id ON token_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_token_transactions_created_at ON token_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);

-- Referral system indexes
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_id ON referrals(referred_id);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_referrals_referral_level ON referrals(referral_level);
CREATE INDEX IF NOT EXISTS idx_referral_rewards_referrer_id ON referral_rewards(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referral_rewards_referral_level ON referral_rewards(referral_level);

-- Business indexes
CREATE INDEX IF NOT EXISTS idx_products_business_user_id ON products(business_user_id);
CREATE INDEX IF NOT EXISTS idx_products_serial_number ON products(serial_number);
CREATE INDEX IF NOT EXISTS idx_scan_events_serial_number ON scan_events(serial_number);

-- Bug reports indexes
CREATE INDEX IF NOT EXISTS idx_bug_reports_user_id ON bug_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_bug_reports_status ON bug_reports(status);
CREATE INDEX IF NOT EXISTS idx_bug_reports_priority ON bug_reports(priority);
CREATE INDEX IF NOT EXISTS idx_bug_reports_created_at ON bug_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bug_reports_user_email ON bug_reports(user_email);

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================================

CREATE TRIGGER set_updated_at_user_profiles
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER set_updated_at_user_wallets
  BEFORE UPDATE ON user_wallets
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER set_updated_at_assets
  BEFORE UPDATE ON assets
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER set_updated_at_next_of_kin
  BEFORE UPDATE ON next_of_kin
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER set_updated_at_asset_nok_assignments
  BEFORE UPDATE ON asset_nok_assignments
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER set_updated_at_subscription_plans
  BEFORE UPDATE ON subscription_plans
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER set_updated_at_token_packages
  BEFORE UPDATE ON token_packages
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER set_updated_at_payments
  BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER set_updated_at_referrals
  BEFORE UPDATE ON referrals
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER set_updated_at_referral_rewards
  BEFORE UPDATE ON referral_rewards
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER set_updated_at_referral_settings
  BEFORE UPDATE ON referral_settings
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER set_updated_at_products
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER set_updated_at_bug_reports
  BEFORE UPDATE ON bug_reports
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ============================================================================
-- CORE FUNCTIONS
-- ============================================================================

-- Function to update user activity for DMS tracking
CREATE OR REPLACE FUNCTION update_user_activity()
RETURNS void AS $$
BEGIN
  UPDATE user_profiles
  SET last_activity_at = now()
  WHERE id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's asset count
CREATE OR REPLACE FUNCTION get_user_asset_count()
RETURNS integer AS $$
DECLARE
  asset_count integer;
  current_user_id uuid;
BEGIN
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN 0;
  END IF;
  
  SELECT COUNT(*) INTO asset_count
  FROM assets
  WHERE user_id = current_user_id;
  
  RETURN COALESCE(asset_count, 0);
  
EXCEPTION WHEN OTHERS THEN
  RETURN 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate unique referral codes
CREATE OR REPLACE FUNCTION generate_referral_code(user_id uuid, username text)
RETURNS text AS $$
DECLARE
  base_code text;
  final_code text;
  counter integer := 0;
BEGIN
  IF username IS NOT NULL AND length(username) > 0 THEN
    base_code := lower(regexp_replace(username, '[^a-zA-Z0-9]', '', 'g'));
  ELSE
    base_code := 'user' || substring(user_id::text, 1, 8);
  END IF;
  
  IF length(base_code) < 3 THEN
    base_code := base_code || substring(user_id::text, 1, 8);
  END IF;
  
  IF length(base_code) > 12 THEN
    base_code := substring(base_code, 1, 12);
  END IF;
  
  final_code := base_code;
  
  WHILE EXISTS (SELECT 1 FROM user_profiles WHERE referral_code = final_code) LOOP
    counter := counter + 1;
    final_code := base_code || counter::text;
    
    IF counter > 999 THEN
      final_code := base_code || substring(gen_random_uuid()::text, 1, 4);
      EXIT;
    END IF;
  END LOOP;
  
  RETURN final_code;
END;
$$ LANGUAGE plpgsql;

-- Function to generate missing referral codes
CREATE OR REPLACE FUNCTION generate_missing_referral_codes()
RETURNS integer AS $$
DECLARE
  user_record record;
  new_code text;
  codes_generated integer := 0;
BEGIN
  FOR user_record IN 
    SELECT id, full_name, email 
    FROM user_profiles 
    WHERE referral_code IS NULL
  LOOP
    new_code := generate_referral_code(user_record.id, user_record.full_name);
    
    UPDATE user_profiles 
    SET referral_code = new_code, updated_at = now()
    WHERE id = user_record.id;
    
    codes_generated := codes_generated + 1;
  END LOOP;
  
  RETURN codes_generated;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- NOK & DEAD MAN'S SWITCH FUNCTIONS
-- ============================================================================

-- Function to assign NOK to asset with DMS
CREATE OR REPLACE FUNCTION assign_nok_to_asset_with_dms(
  p_asset_id uuid,
  p_nok_id uuid,
  p_dms_date timestamptz DEFAULT (now() + interval '1 year')
)
RETURNS jsonb AS $$
DECLARE
  assigner_id uuid := auth.uid();
  asset_owner_id uuid;
  assignment_id uuid;
BEGIN
  SELECT user_id INTO asset_owner_id FROM assets WHERE id = p_asset_id;
  IF asset_owner_id IS NULL OR asset_owner_id != assigner_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized: You do not own this asset.');
  END IF;

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

-- Function for mass assignment of assets to NOK
CREATE OR REPLACE FUNCTION mass_assign_assets_to_nok(
  p_nok_id uuid,
  p_dms_date timestamptz DEFAULT (now() + interval '1 year')
)
RETURNS jsonb AS $$
DECLARE
  assigner_id uuid := auth.uid();
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

-- Function for NOK reassignment
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
  SELECT email INTO user_email FROM user_profiles WHERE id = auth.uid();
  
  SELECT nok_id, original_assigner_user_id INTO current_nok_id, original_assigner
  FROM asset_nok_assignments
  WHERE id = p_assignment_id;

  IF current_nok_id IS NULL OR current_nok_id != (SELECT id FROM next_of_kin WHERE email = user_email) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized: You are not the designated NOK for this assignment.');
  END IF;

  UPDATE asset_nok_assignments
  SET
    nok_id = p_new_nok_id,
    reassigned_by_user_id = auth.uid(),
    reassigned_to_nok_id = p_new_nok_id,
    status = 'pending',
    access_granted_at = NULL,
    updated_at = now()
  WHERE id = p_assignment_id;

  RETURN jsonb_build_object('success', true, 'assignment_id', p_assignment_id, 'message', 'Assignment reassigned successfully.');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get incoming NOK assignments
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
  SELECT email INTO user_email FROM user_profiles WHERE id = auth.uid();
  
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

-- Function to get outgoing NOK assignments
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
  WHERE a.user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get NOK assignment statistics
CREATE OR REPLACE FUNCTION get_nok_assignment_stats()
RETURNS jsonb AS $$
DECLARE
  v_user_id uuid := auth.uid();
  user_email text;
  incoming_count integer;
  outgoing_count integer;
  triggered_incoming integer;
  pending_outgoing integer;
  upcoming_dms_count integer;
BEGIN
  SELECT email INTO user_email FROM user_profiles WHERE id = v_user_id;
  
  SELECT COUNT(*) INTO incoming_count
  FROM asset_nok_assignments ana
  WHERE ana.nok_id IN (SELECT id FROM next_of_kin WHERE email = user_email);
  
  SELECT COUNT(*) INTO outgoing_count
  FROM asset_nok_assignments ana
  JOIN assets a ON ana.asset_id = a.id
  WHERE a.user_id = v_user_id;
  
  SELECT COUNT(*) INTO triggered_incoming
  FROM asset_nok_assignments ana
  WHERE ana.nok_id IN (SELECT id FROM next_of_kin WHERE email = user_email)
  AND ana.status = 'triggered';
  
  SELECT COUNT(*) INTO pending_outgoing
  FROM asset_nok_assignments ana
  JOIN assets a ON ana.asset_id = a.id
  WHERE a.user_id = v_user_id
  AND ana.status IN ('pending', 'active');
  
  SELECT COUNT(*) INTO upcoming_dms_count
  FROM asset_nok_assignments ana
  JOIN assets a ON ana.asset_id = a.id
  WHERE a.user_id = v_user_id
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

-- Function to check and trigger Dead Man's Switch
CREATE OR REPLACE FUNCTION check_and_trigger_dms()
RETURNS jsonb AS $$
DECLARE
  triggered_count integer := 0;
  assignment_record record;
  result jsonb;
BEGIN
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
    IF assignment_record.last_activity_at IS NULL OR assignment_record.last_activity_at < assignment_record.dms_date THEN
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

-- ============================================================================
-- REFERRAL SYSTEM FUNCTIONS
-- ============================================================================

-- Function to process referral rewards
CREATE OR REPLACE FUNCTION process_referral_rewards_v2(referred_user_id uuid)
RETURNS jsonb AS $$
DECLARE
  current_referral record;
  current_level integer := 1;
  reward_amount integer;
  rewards_created integer := 0;
  total_tokens_awarded integer := 0;
  result jsonb;
BEGIN
  result := jsonb_build_object(
    'success', false,
    'rewards_created', 0,
    'total_tokens', 0,
    'levels_processed', 0,
    'errors', '[]'::jsonb
  );
  
  SELECT * INTO current_referral
  FROM referrals
  WHERE referred_id = referred_user_id AND status = 'completed';
  
  IF current_referral.id IS NULL THEN
    result := jsonb_set(result, '{errors}', result->'errors' || jsonb_build_array('No completed referral found'));
    RETURN result;
  END IF;
  
  WHILE current_referral.id IS NOT NULL AND current_level <= 5 LOOP
    SELECT token_reward INTO reward_amount
    FROM referral_settings
    WHERE referral_settings.referral_level = current_level AND active = true;
    
    IF reward_amount IS NOT NULL AND reward_amount > 0 THEN
      IF NOT EXISTS (
        SELECT 1 FROM referral_rewards
        WHERE referrer_id = current_referral.referrer_id
          AND referred_id = referred_user_id
          AND referral_level = current_level
      ) THEN
        BEGIN
          INSERT INTO referral_rewards (
            referral_id,
            referrer_id,
            referred_id,
            referral_level,
            token_amount,
            status,
            paid_at
          ) VALUES (
            current_referral.id,
            current_referral.referrer_id,
            referred_user_id,
            current_level,
            reward_amount,
            'paid',
            now()
          );
          
          UPDATE user_wallets
          SET balance = balance + reward_amount,
              updated_at = now()
          WHERE user_id = current_referral.referrer_id;
          
          INSERT INTO token_transactions (
            user_id,
            amount,
            type,
            source,
            description
          ) VALUES (
            current_referral.referrer_id,
            reward_amount,
            'earned',
            'referral',
            'Level ' || current_level || ' referral reward for user: ' || referred_user_id::text
          );
          
          rewards_created := rewards_created + 1;
          total_tokens_awarded := total_tokens_awarded + reward_amount;
          
        EXCEPTION WHEN OTHERS THEN
          result := jsonb_set(result, '{errors}', result->'errors' || jsonb_build_array('Error at level ' || current_level || ': ' || SQLERRM));
        END;
      END IF;
    END IF;
    
    SELECT * INTO current_referral
    FROM referrals
    WHERE referred_id = current_referral.referrer_id AND status = 'completed';
    
    current_level := current_level + 1;
  END LOOP;
  
  result := jsonb_build_object(
    'success', rewards_created > 0,
    'rewards_created', rewards_created,
    'total_tokens', total_tokens_awarded,
    'levels_processed', current_level - 1,
    'errors', result->'errors'
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Trigger function for automatic referral processing
CREATE OR REPLACE FUNCTION trigger_referral_rewards()
RETURNS trigger AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    PERFORM process_referral_rewards_v2(NEW.referred_id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic referral processing
DROP TRIGGER IF EXISTS referral_completion_trigger ON referrals;
CREATE TRIGGER referral_completion_trigger
  AFTER INSERT OR UPDATE ON referrals
  FOR EACH ROW
  EXECUTE FUNCTION trigger_referral_rewards();

-- ============================================================================
-- BUSINESS FUNCTIONS
-- ============================================================================

-- Function to register business products
CREATE OR REPLACE FUNCTION register_product(
  p_product_name text,
  p_serial_number text,
  p_description text DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
  product_id uuid;
  user_id uuid := auth.uid();
BEGIN
  IF NOT EXISTS (SELECT 1 FROM user_profiles WHERE id = user_id AND is_business_user = true) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized: Business user access required');
  END IF;

  IF EXISTS (SELECT 1 FROM products WHERE serial_number = p_serial_number) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Serial number already exists');
  END IF;

  INSERT INTO products (product_name, serial_number, description, business_user_id)
  VALUES (p_product_name, p_serial_number, p_description, user_id)
  RETURNING id INTO product_id;

  RETURN jsonb_build_object('success', true, 'product_id', product_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to verify product scans
CREATE OR REPLACE FUNCTION verify_product_scan(
  p_serial_number text,
  p_ip_address text,
  p_location text DEFAULT NULL,
  p_device_info text DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
  product_exists boolean;
  scan_count integer;
  recent_scans integer;
  flagged boolean := false;
  scan_history jsonb;
BEGIN
  SELECT EXISTS(SELECT 1 FROM products WHERE serial_number = p_serial_number) INTO product_exists;
  
  IF NOT product_exists THEN
    RETURN jsonb_build_object(
      'authentic', false,
      'message', 'Product not found in our database. This may be a counterfeit item.'
    );
  END IF;

  INSERT INTO scan_events (serial_number, ip_address, location, device_info)
  VALUES (p_serial_number, p_ip_address, p_location, p_device_info);

  SELECT COUNT(*) INTO scan_count FROM scan_events WHERE serial_number = p_serial_number;
  
  SELECT COUNT(*) INTO recent_scans 
  FROM scan_events 
  WHERE serial_number = p_serial_number 
  AND scanned_at >= now() - interval '24 hours';

  IF scan_count > 50 OR recent_scans > 10 THEN
    flagged := true;
  END IF;

  SELECT jsonb_agg(
    jsonb_build_object(
      'scanned_at', scanned_at,
      'location', location,
      'ip_address', ip_address,
      'device_info', device_info
    ) ORDER BY scanned_at DESC
  ) INTO scan_history
  FROM (
    SELECT * FROM scan_events 
    WHERE serial_number = p_serial_number 
    ORDER BY scanned_at DESC 
    LIMIT 10
  ) recent;

  RETURN jsonb_build_object(
    'authentic', true,
    'message', 'Product verified as authentic',
    'scan_count', scan_count,
    'scan_history', scan_history,
    'flagged_for_review', flagged
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get business products
CREATE OR REPLACE FUNCTION get_business_products()
RETURNS TABLE(
  id uuid,
  product_name text,
  serial_number text,
  description text,
  created_at timestamptz,
  updated_at timestamptz,
  business_user_id uuid
) AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_business_user = true) THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT p.id, p.product_name, p.serial_number, p.description, p.created_at, p.updated_at, p.business_user_id
  FROM products p
  WHERE p.business_user_id = auth.uid()
  ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get product scan history
CREATE OR REPLACE FUNCTION get_product_scan_history(p_serial_number text)
RETURNS jsonb AS $$
DECLARE
  scan_history jsonb;
  product_owner uuid;
BEGIN
  SELECT business_user_id INTO product_owner FROM products WHERE serial_number = p_serial_number;
  
  IF product_owner IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Product not found');
  END IF;

  IF product_owner != auth.uid() AND NOT is_user_role('admin_influencer') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  SELECT jsonb_agg(
    jsonb_build_object(
      'id', id,
      'scanned_at', scanned_at,
      'location', location,
      'ip_address', ip_address,
      'device_info', device_info,
      'user_id', user_id
    ) ORDER BY scanned_at DESC
  ) INTO scan_history
  FROM scan_events
  WHERE serial_number = p_serial_number;

  RETURN jsonb_build_object(
    'success', true,
    'scan_history', COALESCE(scan_history, '[]'::jsonb)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- ADMIN FUNCTIONS
-- ============================================================================

-- Function to adjust user tokens (admin only)
CREATE OR REPLACE FUNCTION adjust_user_tokens(
  target_user_id uuid,
  adjustment_amount integer,
  adjustment_reason text DEFAULT 'Admin adjustment'
)
RETURNS jsonb AS $$
DECLARE
  admin_user_id uuid;
  admin_role text;
  current_balance integer;
  new_balance integer;
  transaction_type text;
  result jsonb;
BEGIN
  admin_user_id := auth.uid();
  
  SELECT role INTO admin_role
  FROM user_profiles
  WHERE id = admin_user_id;
  
  IF admin_role != 'admin_influencer' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Unauthorized: Only admin influencers can adjust token balances'
    );
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM user_profiles WHERE id = target_user_id) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Target user not found'
    );
  END IF;
  
  SELECT balance INTO current_balance
  FROM user_wallets
  WHERE user_id = target_user_id;
  
  IF current_balance IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'User wallet not found'
    );
  END IF;
  
  new_balance := current_balance + adjustment_amount;
  
  IF new_balance < 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Insufficient balance for this adjustment'
    );
  END IF;
  
  transaction_type := CASE 
    WHEN adjustment_amount > 0 THEN 'earned'
    ELSE 'spent'
  END;
  
  UPDATE user_wallets
  SET balance = new_balance,
      updated_at = now()
  WHERE user_id = target_user_id;
  
  INSERT INTO token_transactions (
    user_id,
    amount,
    type,
    source,
    description
  ) VALUES (
    target_user_id,
    abs(adjustment_amount),
    transaction_type,
    'admin_reward',
    'Admin adjustment: ' || adjustment_reason || ' (by admin: ' || admin_user_id::text || ')'
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'previous_balance', current_balance,
    'adjustment_amount', adjustment_amount,
    'new_balance', new_balance,
    'transaction_type', transaction_type
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', 'Database error: ' || SQLERRM
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user analytics
CREATE OR REPLACE FUNCTION get_user_analytics()
RETURNS jsonb AS $$
DECLARE
  admin_user_id uuid;
  admin_role text;
  total_users integer;
  new_users_today integer;
  new_users_week integer;
  new_users_month integer;
  total_tokens_distributed integer;
  total_assets integer;
  total_transactions integer;
  result jsonb;
BEGIN
  admin_user_id := auth.uid();
  
  SELECT role INTO admin_role
  FROM user_profiles
  WHERE id = admin_user_id;
  
  IF admin_role != 'admin_influencer' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Unauthorized: Only admin influencers can access analytics'
    );
  END IF;
  
  SELECT COUNT(*) INTO total_users FROM user_profiles;
  
  SELECT COUNT(*) INTO new_users_today
  FROM user_profiles
  WHERE created_at >= CURRENT_DATE;
  
  SELECT COUNT(*) INTO new_users_week
  FROM user_profiles
  WHERE created_at >= CURRENT_DATE - INTERVAL '7 days';
  
  SELECT COUNT(*) INTO new_users_month
  FROM user_profiles
  WHERE created_at >= CURRENT_DATE - INTERVAL '30 days';
  
  SELECT COALESCE(SUM(balance), 0) INTO total_tokens_distributed
  FROM user_wallets;
  
  SELECT COUNT(*) INTO total_assets FROM assets;
  SELECT COUNT(*) INTO total_transactions FROM token_transactions;
  
  result := jsonb_build_object(
    'success', true,
    'user_stats', jsonb_build_object(
      'total_users', total_users,
      'new_users_today', new_users_today,
      'new_users_week', new_users_week,
      'new_users_month', new_users_month
    ),
    'token_stats', jsonb_build_object(
      'total_tokens_distributed', total_tokens_distributed,
      'total_transactions', total_transactions
    ),
    'asset_stats', jsonb_build_object(
      'total_assets', total_assets
    ),
    'generated_at', now()
  );
  
  RETURN result;
  
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', 'Database error: ' || SQLERRM
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- ARWEAVE ARCHIVING FUNCTIONS
-- ============================================================================

-- Function to archive asset to Arweave (mock implementation)
CREATE OR REPLACE FUNCTION archive_tag_now(asset_id uuid)
RETURNS jsonb AS $$
DECLARE
  asset_owner uuid;
  user_balance integer;
  archive_cost integer := 300;
  mock_tx_id text;
BEGIN
  SELECT user_id INTO asset_owner FROM assets WHERE id = asset_id;
  
  IF asset_owner IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Asset not found');
  END IF;
  
  IF asset_owner != auth.uid() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;
  
  SELECT balance INTO user_balance FROM user_wallets WHERE user_id = auth.uid();
  
  IF user_balance < archive_cost THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient tokens');
  END IF;
  
  mock_tx_id := 'arweave_' || gen_random_uuid()::text;
  
  UPDATE user_wallets
  SET balance = balance - archive_cost
  WHERE user_id = auth.uid();
  
  INSERT INTO token_transactions (user_id, amount, type, source, description)
  VALUES (auth.uid(), archive_cost, 'spent', 'blockchain_publish', 'Arweave archiving for asset: ' || asset_id::text);
  
  UPDATE assets
  SET 
    archive_status = 'archived',
    arweave_tx_id = mock_tx_id,
    archive_method = 'instant',
    archive_requested_at = now()
  WHERE id = asset_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'arweave_tx_id', mock_tx_id,
    'tokens_spent', archive_cost
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to refund tokens on asset deletion
CREATE OR REPLACE FUNCTION refund_tokens_on_delete(asset_id uuid)
RETURNS jsonb AS $$
DECLARE
  asset_owner uuid;
  refund_amount integer := 5; -- Base refund amount
BEGIN
  SELECT user_id INTO asset_owner FROM assets WHERE id = asset_id;
  
  IF asset_owner IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Asset not found');
  END IF;
  
  IF asset_owner != auth.uid() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;
  
  DELETE FROM assets WHERE id = asset_id;
  
  UPDATE user_wallets
  SET balance = balance + refund_amount
  WHERE user_id = auth.uid();
  
  INSERT INTO token_transactions (user_id, amount, type, source, description)
  VALUES (auth.uid(), refund_amount, 'earned', 'admin_reward', 'Refund for deleted asset: ' || asset_id::text);
  
  RETURN jsonb_build_object(
    'success', true,
    'refund_amount', refund_amount
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

GRANT EXECUTE ON FUNCTION is_user_role(text) TO authenticated;
GRANT EXECUTE ON FUNCTION update_user_activity() TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_asset_count() TO authenticated;
GRANT EXECUTE ON FUNCTION generate_referral_code(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION generate_missing_referral_codes() TO authenticated;
GRANT EXECUTE ON FUNCTION assign_nok_to_asset_with_dms(uuid, uuid, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION mass_assign_assets_to_nok(uuid, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION reassign_incoming_nok_assignment(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_incoming_nok_assignments() TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_outgoing_nok_assignments() TO authenticated;
GRANT EXECUTE ON FUNCTION get_nok_assignment_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION check_and_trigger_dms() TO service_role;
GRANT EXECUTE ON FUNCTION register_product(text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION verify_product_scan(text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION get_business_products() TO authenticated;
GRANT EXECUTE ON FUNCTION get_product_scan_history(text) TO authenticated;
GRANT EXECUTE ON FUNCTION adjust_user_tokens(uuid, integer, text) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_analytics() TO authenticated;
GRANT EXECUTE ON FUNCTION archive_tag_now(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION refund_tokens_on_delete(uuid) TO authenticated;

-- ============================================================================
-- STORAGE BUCKETS AND POLICIES
-- ============================================================================

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('assets', 'assets', true),
  ('avatars', 'avatars', true),
  ('business-documents', 'business-documents', false),
  ('bug-screenshots', 'bug-screenshots', false)
ON CONFLICT (id) DO NOTHING;

-- Assets storage policies
CREATE POLICY "Users can upload own assets"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'assets' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can read own assets"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'assets' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Public assets are readable"
  ON storage.objects FOR SELECT
  TO authenticated, anon
  USING (bucket_id = 'assets');

-- Avatars storage policies
CREATE POLICY "Users can upload own avatars"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can read own avatars"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Avatars are publicly readable"
  ON storage.objects FOR SELECT
  TO authenticated, anon
  USING (bucket_id = 'avatars');

-- Business documents storage policies
CREATE POLICY "Business users can upload own documents"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'business-documents' 
    AND auth.uid()::text = (storage.foldername(name))[1]
    AND EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND is_business_user = true
    )
  );

CREATE POLICY "Business users can read own documents"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'business-documents' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Admin influencers can read all business documents"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'business-documents'
    AND is_user_role('admin_influencer')
  );

-- Bug screenshots storage policies
CREATE POLICY "Authenticated users can upload bug screenshots"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'bug-screenshots' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can read own bug screenshots"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'bug-screenshots'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Admin influencers can read all bug screenshots"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'bug-screenshots'
    AND is_user_role('admin_influencer')
  );

-- ============================================================================
-- INITIAL DATA
-- ============================================================================

-- Insert default subscription plans
INSERT INTO subscription_plans (name, token_limit, price_gbp, price_xaf, billing_interval, features, active) VALUES
  ('freemium', 50, 0, 0, 'monthly', ARRAY['50 TMT tokens per month', 'Basic asset tagging', 'Limited product verification (5 products)', 'Basic QR code generation', 'Email support'], true),
  ('professional', 1000, 8.99, 6742, 'monthly', ARRAY['1000 TMT tokens per month', 'Unlimited asset tagging', 'Product verification system', 'QR code generation', 'Scan history tracking', 'Business dashboard access', 'Priority email support'], true),
  ('enterprise', 10000, 49.99, 37492, 'monthly', ARRAY['10000 TMT tokens per month', 'Unlimited asset tagging', 'Advanced product verification', 'Bulk QR code generation', 'Advanced analytics dashboard', 'API access for integrations', 'Custom branding options', 'Dedicated account manager', 'Priority phone support', 'SLA guarantees'], true)
ON CONFLICT (name) DO UPDATE SET
  token_limit = EXCLUDED.token_limit,
  price_gbp = EXCLUDED.price_gbp,
  price_xaf = EXCLUDED.price_xaf,
  features = EXCLUDED.features,
  active = EXCLUDED.active,
  updated_at = now();

-- Insert default token packages
INSERT INTO token_packages (name, token_amount, bonus_tokens, price_gbp, price_xaf, active) VALUES
  ('starter', 100, 0, 1.00, 750, true),
  ('power', 500, 0, 4.50, 3375, true),
  ('mega', 5000, 0, 39.99, 29992, true)
ON CONFLICT (name) DO UPDATE SET
  token_amount = EXCLUDED.token_amount,
  bonus_tokens = EXCLUDED.bonus_tokens,
  price_gbp = EXCLUDED.price_gbp,
  price_xaf = EXCLUDED.price_xaf,
  active = EXCLUDED.active,
  updated_at = now();

-- Insert default referral settings
INSERT INTO referral_settings (referral_level, token_reward, active) VALUES
  (1, 50, true),
  (2, 30, true),
  (3, 20, true),
  (4, 10, true),
  (5, 5, true)
ON CONFLICT (referral_level) DO UPDATE SET
  token_reward = EXCLUDED.token_reward,
  active = EXCLUDED.active,
  updated_at = now();

-- Generate referral codes for existing users
SELECT generate_missing_referral_codes();

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE user_profiles IS 'Extended user information with business and referral support';
COMMENT ON TABLE user_wallets IS 'TMT token wallet management for each user';
COMMENT ON TABLE assets IS 'Tagged assets with comprehensive metadata and archiving support';
COMMENT ON TABLE next_of_kin IS 'Next-of-kin relationships for legacy planning';
COMMENT ON TABLE asset_nok_assignments IS 'NOK assignments with Dead Man''s Switch protection';
COMMENT ON TABLE token_transactions IS 'Complete record of all token movements';
COMMENT ON TABLE referrals IS 'Multi-level referral tracking system';
COMMENT ON TABLE referral_rewards IS 'Token rewards for successful referrals';
COMMENT ON TABLE products IS 'Business product registration for verification';
COMMENT ON TABLE scan_events IS 'Product verification scan tracking';
COMMENT ON TABLE bug_reports IS 'In-app bug reporting system';

COMMENT ON COLUMN user_profiles.last_activity_at IS 'Timestamp of user''s last activity for Dead Man''s Switch';
COMMENT ON COLUMN asset_nok_assignments.dms_date IS 'Date when Dead Man''s Switch triggers if user inactive';
COMMENT ON COLUMN asset_nok_assignments.status IS 'Assignment status: pending, active, triggered, cancelled';
COMMENT ON COLUMN asset_nok_assignments.original_assigner_user_id IS 'User who originally created this assignment';

COMMENT ON FUNCTION is_user_role(text) IS 'SECURITY DEFINER function to safely check user roles without RLS recursion';
COMMENT ON FUNCTION get_user_incoming_nok_assignments() IS 'Get assets where current user is designated as NOK';
COMMENT ON FUNCTION get_user_outgoing_nok_assignments() IS 'Get assets current user has assigned to others as NOK';
COMMENT ON FUNCTION mass_assign_assets_to_nok(uuid, timestamptz) IS 'Assign all user assets to single NOK with DMS';
COMMENT ON FUNCTION reassign_incoming_nok_assignment(uuid, uuid) IS 'Allow NOK to reassign incoming assignment to another NOK';