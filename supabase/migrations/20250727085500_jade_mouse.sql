/*
  # Business Subscription RLS Policies

  1. Enhanced Policies
    - Business users can access features based on subscription tier
    - Subscription-based access control for products table
    - Admin influencers can manage all business data

  2. Security
    - Maintain data isolation between business users
    - Enforce subscription limits through RLS
    - Protect sensitive business information
*/

-- Enhanced RLS policies for products table based on subscription
DROP POLICY IF EXISTS "Business users can read own products" ON products;
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

DROP POLICY IF EXISTS "Business users can insert own products" ON products;
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

DROP POLICY IF EXISTS "Business users can update own products" ON products;
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

DROP POLICY IF EXISTS "Business users can delete own products" ON products;
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

-- Admin influencers can manage all business data
CREATE POLICY "Admin influencers can read all products"
  ON products FOR SELECT
  TO authenticated
  USING (is_user_role('admin_influencer'));

CREATE POLICY "Admin influencers can manage all products"
  ON products FOR ALL
  TO authenticated
  USING (is_user_role('admin_influencer'));

-- Enhanced scan_events policies
DROP POLICY IF EXISTS "Anyone can insert scan events" ON scan_events;
CREATE POLICY "Anyone can insert scan events"
  ON scan_events FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);  -- Allow public scanning

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

-- Create function to enforce subscription limits on product creation
CREATE OR REPLACE FUNCTION enforce_product_creation_limit()
RETURNS trigger AS $$
DECLARE
  current_count integer;
  limit_check jsonb;
BEGIN
  -- Count current products for this user
  SELECT COUNT(*) INTO current_count
  FROM products
  WHERE business_user_id = NEW.business_user_id;
  
  -- Check subscription limit
  SELECT check_business_subscription_limit(
    NEW.business_user_id,
    'products',
    current_count
  ) INTO limit_check;
  
  -- Prevent insertion if limit exceeded
  IF NOT (limit_check->>'allowed')::boolean THEN
    RAISE EXCEPTION 'Product creation limit exceeded: %', limit_check->>'message';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to enforce product limits
DROP TRIGGER IF EXISTS enforce_product_limit_trigger ON products;
CREATE TRIGGER enforce_product_limit_trigger
  BEFORE INSERT ON products
  FOR EACH ROW
  EXECUTE FUNCTION enforce_product_creation_limit();

-- Create function to get business user statistics
CREATE OR REPLACE FUNCTION get_business_user_stats(target_user_id uuid DEFAULT NULL)
RETURNS jsonb AS $$
DECLARE
  user_id uuid;
  user_plan text;
  stats jsonb;
  product_count integer;
  scan_count integer;
  recent_scans integer;
BEGIN
  -- Use provided user_id or current authenticated user
  user_id := COALESCE(target_user_id, auth.uid());
  
  -- Verify user is a business user (unless admin is requesting)
  IF target_user_id IS NULL THEN
    SELECT subscription_plan INTO user_plan
    FROM user_profiles
    WHERE id = user_id AND is_business_user = true;
    
    IF user_plan IS NULL THEN
      RETURN jsonb_build_object('error', 'User is not a business user');
    END IF;
  ELSE
    -- Admin requesting stats for another user
    IF NOT is_user_role('admin_influencer') THEN
      RETURN jsonb_build_object('error', 'Unauthorized');
    END IF;
    
    SELECT subscription_plan INTO user_plan
    FROM user_profiles
    WHERE id = user_id;
  END IF;
  
  -- Get product count
  SELECT COUNT(*) INTO product_count
  FROM products
  WHERE business_user_id = user_id;
  
  -- Get total scan count
  SELECT COUNT(*) INTO scan_count
  FROM scan_events se
  WHERE EXISTS (
    SELECT 1 FROM products p
    WHERE p.serial_number = se.serial_number
    AND p.business_user_id = user_id
  );
  
  -- Get recent scans (last 30 days)
  SELECT COUNT(*) INTO recent_scans
  FROM scan_events se
  WHERE se.scanned_at >= NOW() - INTERVAL '30 days'
  AND EXISTS (
    SELECT 1 FROM products p
    WHERE p.serial_number = se.serial_number
    AND p.business_user_id = user_id
  );
  
  -- Build stats object
  stats := jsonb_build_object(
    'user_id', user_id,
    'subscription_plan', user_plan,
    'product_count', product_count,
    'total_scans', scan_count,
    'recent_scans', recent_scans,
    'generated_at', now()
  );
  
  RETURN stats;
  
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'error', 'Failed to get business stats: ' || SQLERRM
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_business_user_stats(uuid) TO authenticated;

-- Add comments
COMMENT ON FUNCTION enforce_product_creation_limit() IS 'Trigger function to enforce subscription-based product creation limits';
COMMENT ON FUNCTION get_business_user_stats(uuid) IS 'Get comprehensive statistics for business users based on their subscription plan';