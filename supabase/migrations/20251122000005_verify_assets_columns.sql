-- Migration: Verify and fix assets table columns
-- Created: 2025-11-22
-- Description: Ensures assets table has required columns for NOK page
-- Issue: "column assets.media_url does not exist" error on /nok page

-- First, check if media_url column exists, if not add it
DO $$ 
BEGIN
  -- Check if media_url column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'assets' 
    AND column_name = 'media_url'
  ) THEN
    -- Check if there's an alternative column name (file_url, storage_url, etc.)
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'assets' 
      AND column_name = 'file_url'
    ) THEN
      -- Rename file_url to media_url
      ALTER TABLE assets RENAME COLUMN file_url TO media_url;
      RAISE NOTICE 'Renamed assets.file_url to assets.media_url';
    ELSIF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'assets' 
      AND column_name = 'storage_url'
    ) THEN
      -- Rename storage_url to media_url
      ALTER TABLE assets RENAME COLUMN storage_url TO media_url;
      RAISE NOTICE 'Renamed assets.storage_url to assets.media_url';
    ELSIF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'assets' 
      AND column_name = 'url'
    ) THEN
      -- Rename url to media_url
      ALTER TABLE assets RENAME COLUMN url TO media_url;
      RAISE NOTICE 'Renamed assets.url to assets.media_url';
    ELSE
      -- No alternative found, add media_url column with a placeholder
      ALTER TABLE assets ADD COLUMN media_url TEXT DEFAULT '';
      RAISE NOTICE 'Added new media_url column to assets table';
    END IF;
  ELSE
    RAISE NOTICE 'assets.media_url column already exists';
  END IF;
END $$;

-- Ensure media_url is NOT NULL after migration
DO $$
BEGIN
  -- Update any NULL values to empty string first
  UPDATE assets SET media_url = '' WHERE media_url IS NULL;
  
  -- Then add NOT NULL constraint if it doesn't exist
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'assets' 
    AND column_name = 'media_url'
    AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE assets ALTER COLUMN media_url SET NOT NULL;
    RAISE NOTICE 'Set media_url to NOT NULL';
  END IF;
END $$;

COMMENT ON COLUMN assets.media_url IS 'URL to the asset media file (photo or video)';
