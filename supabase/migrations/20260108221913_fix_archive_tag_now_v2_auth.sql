-- Fix archive_tag_now_v2 to work with service role calls
-- The issue: auth.uid() returns null when called from edge functions with service role
-- Solution: Use the asset_owner variable instead

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
  -- Get the asset owner
  SELECT user_id INTO asset_owner FROM assets WHERE id = asset_id;
  
  IF asset_owner IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Asset not found');
  END IF;
  
  -- Check balance using asset_owner instead of auth.uid()
  SELECT balance INTO user_balance FROM user_wallets WHERE user_id = asset_owner;
  
  IF user_balance < archive_cost THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient tokens');
  END IF;
  
  -- Deduct tokens using asset_owner
  UPDATE user_wallets
  SET balance = balance - archive_cost
  WHERE user_id = asset_owner;
  
  -- Record transaction using asset_owner
  INSERT INTO token_transactions (user_id, amount, type, source, description)
  VALUES (asset_owner, archive_cost, 'spent', 'blockchain_publish', 'Arweave archiving for asset: ' || asset_id::text);
  
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
    backup_expires_at = now() + interval '90 days',
    archive_metadata = jsonb_build_object(
      'turbo_upload_id', turbo_id,
      'data_item_id', data_item_id,
      'cost_winston', cost_winston,
      'was_compressed', was_compressed,
      'was_encrypted', was_encrypted,
      'upload_timestamp', now()
    )
  WHERE id = asset_id;
  
  -- Log the upload using asset_owner
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
    asset_owner,
    'instant',
    file_size,
    CASE WHEN was_compressed THEN file_size ELSE NULL END,
    was_compressed,
    was_encrypted,
    turbo_id,
    data_item_id,
    cost_winston,
    file_size < 102400,
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
