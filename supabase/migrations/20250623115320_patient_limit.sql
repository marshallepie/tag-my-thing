/*
  # TagMyThing Initial Database Schema

  1. New Tables
    - `user_profiles` - Extended user information beyond Supabase auth
    - `user_wallets` - TMT token wallet for each user
    - `assets` - Tagged assets (photos/videos) with metadata
    - `next_of_kin` - Next of Kin assignments for users
    - `asset_nok_assignments` - Links assets to specific NOKs
    - `token_transactions` - Record of all token earnings and spending
    - `subscription_plans` - Available subscription plans
    - `token_packages` - Available token purchase packages
    - `payments` - Payment records for subscriptions and token purchases

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    - Admin-only access for configuration tables
    - Public read access for plan metadata
*/

-- Create user profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text,
  avatar_url text,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'nok', 'moderator', 'admin')),
  subscription_plan text NOT NULL DEFAULT 'freemium' CHECK (subscription_plan IN ('freemium', 'pro', 'enterprise')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  location text,
  language text DEFAULT 'en',
  PRIMARY KEY (id)
);

-- Create user wallets table
CREATE TABLE IF NOT EXISTS user_wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  balance integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Create assets table
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
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create next of kin table
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

-- Create asset NOK assignments table
CREATE TABLE IF NOT EXISTS asset_nok_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid REFERENCES assets(id) ON DELETE CASCADE NOT NULL,
  nok_id uuid REFERENCES next_of_kin(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(asset_id, nok_id)
);

-- Create token transactions table
CREATE TABLE IF NOT EXISTS token_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  amount integer NOT NULL,
  type text NOT NULL CHECK (type IN ('earned', 'spent')),
  source text NOT NULL CHECK (source IN ('signup', 'referral', 'daily_login', 'admin_reward', 'purchase', 'tag_asset', 'edit_asset', 'upload_media', 'assign_nok', 'blockchain_publish')),
  description text,
  created_at timestamptz DEFAULT now()
);

-- Create subscription plans table
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

-- Create token packages table
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

-- Create payments table
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

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE next_of_kin ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_nok_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

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

-- Assets Policies
CREATE POLICY "Users can read own assets"
  ON assets FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can read public assets"
  ON assets FOR SELECT
  TO authenticated
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
      WHERE assets.id = asset_id AND assets.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own asset NOK assignments"
  ON asset_nok_assignments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM assets
      WHERE assets.id = asset_id AND assets.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own asset NOK assignments"
  ON asset_nok_assignments FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM assets
      WHERE assets.id = asset_id AND assets.user_id = auth.uid()
    )
  );

-- Token Transactions Policies
CREATE POLICY "Users can read own transactions"
  ON token_transactions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own transactions"
  ON token_transactions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Subscription Plans Policies (Public Read)
CREATE POLICY "Anyone can read active subscription plans"
  ON subscription_plans FOR SELECT
  TO authenticated
  USING (active = true);

-- Token Packages Policies (Public Read)
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_assets_user_id ON assets(user_id);
CREATE INDEX IF NOT EXISTS idx_assets_privacy ON assets(privacy);
CREATE INDEX IF NOT EXISTS idx_assets_tags ON assets USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_token_transactions_user_id ON token_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_token_transactions_created_at ON token_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_next_of_kin_user_id ON next_of_kin(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);

-- Insert default subscription plans
INSERT INTO subscription_plans (name, token_limit, price_gbp, price_xaf, billing_interval, features) VALUES
  ('freemium', 50, 0, 0, 'monthly', ARRAY['50 TMT tokens per month', 'Basic asset tagging']),
  ('pro-monthly', 250, 1, 250, 'monthly', ARRAY['Unlimited tokens', 'Blockchain publishing', 'NOK assignments']),
  ('pro-yearly', 3000, 10, 2500, 'yearly', ARRAY['Unlimited tokens', 'Blockchain publishing', 'NOK assignments', 'Priority support']),
  ('enterprise-monthly', -1, 10, 1000, 'monthly', ARRAY['Unlimited everything', 'Advanced analytics', 'Custom integrations', 'Dedicated support']),
  ('enterprise-yearly', -1, 100, 10000, 'yearly', ARRAY['Unlimited everything', 'Advanced analytics', 'Custom integrations', 'Dedicated support']);

-- Insert default token packages
INSERT INTO token_packages (name, token_amount, bonus_tokens, price_gbp, price_xaf) VALUES
  ('Starter Pack', 100, 0, 1, 500),
  ('Value Pack', 250, 25, 2.50, 1250),
  ('Power Pack', 500, 75, 4.50, 2250),
  ('Mega Pack', 1000, 200, 7.99, 4000);

-- Create storage bucket for assets
INSERT INTO storage.buckets (id, name, public) VALUES ('assets', 'assets', true);

-- Create storage policy for assets
CREATE POLICY "Users can upload own assets"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'assets' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can read own assets"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'assets' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own assets"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'assets' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own assets"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'assets' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create function to handle updated_at timestamps
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
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

CREATE TRIGGER set_updated_at_subscription_plans
  BEFORE UPDATE ON subscription_plans
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER set_updated_at_token_packages
  BEFORE UPDATE ON token_packages
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER set_updated_at_payments
  BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();