/*
  # Influencer Referral System

  1. New Tables
    - `referrals` - Track referral relationships and hierarchy
    - `referral_rewards` - Track token rewards for referrals
    - `referral_settings` - Configure reward amounts per level

  2. Updates
    - Add `referral_code` to user_profiles
    - Add `influencer` role option
    - Add referral tracking fields

  3. Security
    - Enable RLS on all new tables
    - Add policies for referral management
*/

-- Add referral_code to user_profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'referral_code'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN referral_code text UNIQUE;
  END IF;
END $$;

-- Update role constraint to include influencer
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_role_check;
ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_role_check 
  CHECK (role = ANY (ARRAY['user'::text, 'nok'::text, 'moderator'::text, 'admin'::text, 'influencer'::text]));

-- Create referrals table
CREATE TABLE IF NOT EXISTS referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  referred_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  referral_code text NOT NULL,
  level integer NOT NULL DEFAULT 1 CHECK (level >= 1 AND level <= 5),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(referred_id) -- Each user can only be referred once
);

-- Create referral_rewards table
CREATE TABLE IF NOT EXISTS referral_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_id uuid REFERENCES referrals(id) ON DELETE CASCADE NOT NULL,
  referrer_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  referred_id uuid REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  level integer NOT NULL CHECK (level >= 1 AND level <= 5),
  token_amount integer NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
  paid_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create referral_settings table
CREATE TABLE IF NOT EXISTS referral_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  level integer NOT NULL UNIQUE CHECK (level >= 1 AND level <= 5),
  token_reward integer NOT NULL,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_settings ENABLE ROW LEVEL SECURITY;

-- Referrals policies
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

-- Referral rewards policies
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

-- Referral settings policies (public read)
CREATE POLICY "Anyone can read referral settings"
  ON referral_settings FOR SELECT
  TO authenticated
  USING (active = true);

-- Admin policies for referral settings
CREATE POLICY "Admins can manage referral settings"
  ON referral_settings FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_id ON referrals(referred_id);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_referrals_level ON referrals(level);
CREATE INDEX IF NOT EXISTS idx_referral_rewards_referrer_id ON referral_rewards(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referral_rewards_level ON referral_rewards(level);
CREATE INDEX IF NOT EXISTS idx_user_profiles_referral_code ON user_profiles(referral_code);

-- Insert default referral settings
INSERT INTO referral_settings (level, token_reward) VALUES
  (1, 50),
  (2, 30),
  (3, 20),
  (4, 10),
  (5, 5)
ON CONFLICT (level) DO NOTHING;

-- Create function to generate unique referral code
CREATE OR REPLACE FUNCTION generate_referral_code(user_id uuid, username text)
RETURNS text AS $$
DECLARE
  base_code text;
  final_code text;
  counter integer := 0;
BEGIN
  -- Create base code from username or user_id
  IF username IS NOT NULL AND length(username) > 0 THEN
    base_code := lower(regexp_replace(username, '[^a-zA-Z0-9]', '', 'g'));
  ELSE
    base_code := 'user' || substring(user_id::text, 1, 8);
  END IF;
  
  -- Ensure minimum length
  IF length(base_code) < 3 THEN
    base_code := base_code || substring(user_id::text, 1, 8);
  END IF;
  
  final_code := base_code;
  
  -- Check for uniqueness and add counter if needed
  WHILE EXISTS (SELECT 1 FROM user_profiles WHERE referral_code = final_code) LOOP
    counter := counter + 1;
    final_code := base_code || counter::text;
  END LOOP;
  
  RETURN final_code;
END;
$$ LANGUAGE plpgsql;

-- Create function to process referral rewards
CREATE OR REPLACE FUNCTION process_referral_rewards(referred_user_id uuid)
RETURNS void AS $$
DECLARE
  referral_record record;
  current_user_id uuid := referred_user_id;
  current_level integer := 1;
  reward_amount integer;
BEGIN
  -- Process up to 5 levels of referrals
  WHILE current_level <= 5 LOOP
    -- Find the referrer for current user
    SELECT r.*, rr.referrer_id INTO referral_record
    FROM referrals r
    LEFT JOIN referrals rr ON rr.referred_id = r.referrer_id
    WHERE r.referred_id = current_user_id AND r.status = 'completed';
    
    -- Exit if no referrer found
    EXIT WHEN referral_record.referrer_id IS NULL;
    
    -- Get reward amount for this level
    SELECT token_reward INTO reward_amount
    FROM referral_settings
    WHERE level = current_level AND active = true;
    
    -- Create reward record if amount found
    IF reward_amount IS NOT NULL AND reward_amount > 0 THEN
      INSERT INTO referral_rewards (
        referral_id,
        referrer_id,
        referred_id,
        level,
        token_amount,
        status
      ) VALUES (
        referral_record.id,
        referral_record.referrer_id,
        referred_user_id,
        current_level,
        reward_amount,
        'pending'
      );
      
      -- Add tokens to referrer's wallet
      UPDATE user_wallets
      SET balance = balance + reward_amount
      WHERE user_id = referral_record.referrer_id;
      
      -- Create transaction record
      INSERT INTO token_transactions (
        user_id,
        amount,
        type,
        source,
        description
      ) VALUES (
        referral_record.referrer_id,
        reward_amount,
        'earned',
        'referral',
        'Level ' || current_level || ' referral reward for user: ' || referred_user_id
      );
      
      -- Mark reward as paid
      UPDATE referral_rewards
      SET status = 'paid', paid_at = now()
      WHERE referrer_id = referral_record.referrer_id
        AND referred_id = referred_user_id
        AND level = current_level;
    END IF;
    
    -- Move to next level
    current_user_id := referral_record.referrer_id;
    current_level := current_level + 1;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER set_updated_at_referrals
  BEFORE UPDATE ON referrals
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER set_updated_at_referral_rewards
  BEFORE UPDATE ON referral_rewards
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER set_updated_at_referral_settings
  BEFORE UPDATE ON referral_settings
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();