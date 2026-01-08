-- Reset all mock Arweave uploads to pending
-- This migration resets any mock/test Arweave uploads so that real uploads can be performed

UPDATE assets
SET 
  arweave_tx_id = NULL,
  archive_status = 'pending',
  archive_requested_at = NULL,
  archive_method = NULL,
  blockchain_hash = NULL,
  blockchain_network = NULL,
  blockchain_status = NULL,
  turbo_upload_id = NULL,
  arweave_data_item_id = NULL,
  upload_cost_winston = NULL,
  archive_metadata = '{}'::jsonb,
  is_encrypted = FALSE,
  original_size_bytes = NULL,
  compressed_size_bytes = NULL
WHERE 
  -- Reset any archived assets (mock or real)
  (archive_status IN ('archived', 'upgrade_available', 'failed'))
  OR 
  -- Reset any assets with arweave data
  (arweave_tx_id IS NOT NULL OR turbo_upload_id IS NOT NULL);

-- Add a comment
COMMENT ON TABLE assets IS 'All mock Arweave uploads have been reset to pending status. Real Arweave uploads will now be performed.';
