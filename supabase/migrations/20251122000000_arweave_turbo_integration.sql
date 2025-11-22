-- Migration: Add Arweave Turbo integration fields
-- Created: 2025-11-22
-- Description: Adds fields for real Arweave permanent storage integration

-- STEP 1: Create encryption_keys table FIRST (before referencing it)
CREATE TABLE IF NOT EXISTS encryption_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  key_encrypted TEXT NOT NULL, -- Encrypted with user's master key
  key_salt TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  last_used_at TIMESTAMPTZ DEFAULT now(),
  is_active BOOLEAN DEFAULT TRUE,
  nok_access_enabled BOOLEAN DEFAULT FALSE,
  dms_reveal_at TIMESTAMPTZ,
  UNIQUE(user_id, id)
);

-- STEP 2: Create arweave_manifests table
CREATE TABLE IF NOT EXISTS arweave_manifests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  manifest_name TEXT NOT NULL,
  arweave_manifest_id TEXT UNIQUE,
  asset_ids UUID[] NOT NULL,
  total_size_bytes BIGINT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'creating', 'created', 'failed'))
);

-- STEP 3: Create arweave_upload_log table
CREATE TABLE IF NOT EXISTS arweave_upload_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID REFERENCES assets(id) ON DELETE CASCADE,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  upload_type TEXT NOT NULL CHECK (upload_type IN ('instant', 'batch', 'retry', 'upgrade')),
  file_size_bytes BIGINT NOT NULL,
  compressed_size_bytes BIGINT,
  was_compressed BOOLEAN DEFAULT FALSE,
  was_encrypted BOOLEAN DEFAULT FALSE,
  turbo_upload_id TEXT,
  arweave_data_item_id TEXT,
  cost_winston BIGINT,
  cost_usd NUMERIC(10, 6),
  was_free_tier BOOLEAN DEFAULT FALSE,
  upload_started_at TIMESTAMPTZ DEFAULT now(),
  upload_completed_at TIMESTAMPTZ,
  upload_failed_at TIMESTAMPTZ,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- STEP 4: NOW add new columns to assets table (after encryption_keys exists)
ALTER TABLE assets 
ADD COLUMN IF NOT EXISTS turbo_upload_id TEXT,
ADD COLUMN IF NOT EXISTS arweave_data_item_id TEXT,
ADD COLUMN IF NOT EXISTS upload_cost_winston BIGINT,
ADD COLUMN IF NOT EXISTS archive_metadata JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS encryption_key_id UUID REFERENCES encryption_keys(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS encryption_iv TEXT,
ADD COLUMN IF NOT EXISTS is_encrypted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS original_size_bytes BIGINT,
ADD COLUMN IF NOT EXISTS compressed_size_bytes BIGINT,
ADD COLUMN IF NOT EXISTS manifest_id TEXT,
ADD COLUMN IF NOT EXISTS backup_expires_at TIMESTAMPTZ;

-- STEP 5: Update archive_status constraint to include new statuses
ALTER TABLE assets
DROP CONSTRAINT IF EXISTS assets_archive_status_check;

ALTER TABLE assets
ADD CONSTRAINT assets_archive_status_check 
CHECK (archive_status IN ('pending', 'uploading', 'archived', 'instant_requested', 'failed', 'upgrade_available'));

-- STEP 6: Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_assets_archive_status ON assets(archive_status) WHERE archive_status != 'archived';
CREATE INDEX IF NOT EXISTS idx_assets_backup_expires ON assets(backup_expires_at) WHERE backup_expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_encryption_keys_user ON encryption_keys(user_id) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_arweave_manifests_user ON arweave_manifests(user_id);
CREATE INDEX IF NOT EXISTS idx_arweave_upload_log_asset ON arweave_upload_log(asset_id);
CREATE INDEX IF NOT EXISTS idx_arweave_upload_log_user ON arweave_upload_log(user_id);

-- STEP 7: Enable RLS on new tables
ALTER TABLE encryption_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE arweave_manifests ENABLE ROW LEVEL SECURITY;
ALTER TABLE arweave_upload_log ENABLE ROW LEVEL SECURITY;

-- STEP 8: RLS policies for encryption_keys
CREATE POLICY "Users can view own encryption keys"
  ON encryption_keys FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own encryption keys"
  ON encryption_keys FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own encryption keys"
  ON encryption_keys FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- STEP 9: RLS policies for arweave_manifests
CREATE POLICY "Users can view own manifests"
  ON arweave_manifests FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own manifests"
  ON arweave_manifests FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- STEP 10: RLS policies for arweave_upload_log
CREATE POLICY "Users can view own upload logs"
  ON arweave_upload_log FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all upload logs"
  ON arweave_upload_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role IN ('admin', 'moderator')
    )
  );

-- Function to update archive_tag_now with real Arweave upload
-- This will be called by the Edge Function
CREATE OR REPLACE FUNCTION archive_tag_now_v2(
  asset_id uuid,
  turbo_id text,
  data_item_id text,
  cost_winston bigint,
  file_size bigint,
  was_compressed boolean DEFAULT false,
  was_encrypted boolean DEFAULT false
)
RETURNS jsonb AS $$
DECLARE
  asset_owner uuid;
  user_balance integer;
  archive_cost integer := 300;
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
  
  -- Deduct tokens
  UPDATE user_wallets
  SET balance = balance - archive_cost
  WHERE user_id = auth.uid();
  
  -- Record transaction
  INSERT INTO token_transactions (user_id, amount, type, source, description)
  VALUES (auth.uid(), archive_cost, 'spent', 'blockchain_publish', 'Arweave archiving for asset: ' || asset_id::text);
  
  -- Update asset with real Arweave data
  UPDATE assets
  SET 
    archive_status = 'archived',
    arweave_tx_id = data_item_id,
    turbo_upload_id = turbo_id,
    arweave_data_item_id = data_item_id,
    upload_cost_winston = cost_winston,
    archive_method = 'instant',
    archive_requested_at = now(),
    original_size_bytes = file_size,
    compressed_size_bytes = CASE WHEN was_compressed THEN file_size ELSE NULL END,
    is_encrypted = was_encrypted,
    backup_expires_at = now() + interval '90 days', -- Keep backup for 90 days
    archive_metadata = jsonb_build_object(
      'turbo_upload_id', turbo_id,
      'data_item_id', data_item_id,
      'cost_winston', cost_winston,
      'was_compressed', was_compressed,
      'was_encrypted', was_encrypted,
      'upload_timestamp', now()
    )
  WHERE id = asset_id;
  
  -- Log the upload
  INSERT INTO arweave_upload_log (
    asset_id,
    user_id,
    upload_type,
    file_size_bytes,
    compressed_size_bytes,
    was_compressed,
    was_encrypted,
    turbo_upload_id,
    arweave_data_item_id,
    cost_winston,
    was_free_tier,
    upload_completed_at
  ) VALUES (
    asset_id,
    auth.uid(),
    'instant',
    file_size,
    CASE WHEN was_compressed THEN file_size ELSE NULL END,
    was_compressed,
    was_encrypted,
    turbo_id,
    data_item_id,
    cost_winston,
    file_size < 102400, -- Under 100 KiB
    now()
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'arweave_tx_id', data_item_id,
    'turbo_upload_id', turbo_id,
    'tokens_spent', archive_cost,
    'backup_expires_at', now() + interval '90 days'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cleanup expired backups (scheduled job)
CREATE OR REPLACE FUNCTION cleanup_expired_backups()
RETURNS void AS $$
DECLARE
  expired_asset RECORD;
BEGIN
  FOR expired_asset IN 
    SELECT id, media_items 
    FROM assets 
    WHERE backup_expires_at < now() 
    AND archive_status = 'archived'
    AND arweave_tx_id IS NOT NULL
  LOOP
    -- Note: Actual file deletion would be handled by a scheduled job
    -- This just marks them for deletion
    UPDATE assets 
    SET archive_metadata = archive_metadata || jsonb_build_object('backup_deleted', now())
    WHERE id = expired_asset.id;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- STEP 13: Mark old mock archives as upgrade_available
UPDATE assets
SET archive_status = 'upgrade_available'
WHERE archive_status = 'archived'
AND arweave_tx_id LIKE 'arweave_%'
AND turbo_upload_id IS NULL;

-- Add comment for upgrade_available status
COMMENT ON CONSTRAINT assets_archive_status_check ON assets IS 
'Archive statuses: pending (not archived), uploading (in progress), archived (on Arweave), instant_requested (queued), failed (upload failed), upgrade_available (mock archive, can upgrade to real Arweave)';
