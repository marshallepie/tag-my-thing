-- Migration: Add GPS Location Tracking Features
-- Created: 2025-11-27
-- Description: Adds location tracking preferences to user profiles and GPS coordinates to assets

-- Add location tracking preference to user_profiles
DO $$ 
BEGIN
  -- Add location_tracking_enabled column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' 
    AND column_name = 'location_tracking_enabled'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN location_tracking_enabled BOOLEAN DEFAULT false;
    RAISE NOTICE 'Added location_tracking_enabled column to user_profiles';
  END IF;

  -- Add current_latitude column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' 
    AND column_name = 'current_latitude'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN current_latitude DECIMAL(10,8);
    RAISE NOTICE 'Added current_latitude column to user_profiles';
  END IF;

  -- Add current_longitude column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' 
    AND column_name = 'current_longitude'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN current_longitude DECIMAL(11,8);
    RAISE NOTICE 'Added current_longitude column to user_profiles';
  END IF;

  -- Add location_last_updated column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' 
    AND column_name = 'location_last_updated'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN location_last_updated TIMESTAMPTZ;
    RAISE NOTICE 'Added location_last_updated column to user_profiles';
  END IF;

  -- Add formatted_address column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' 
    AND column_name = 'formatted_address'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN formatted_address TEXT;
    RAISE NOTICE 'Added formatted_address column to user_profiles';
  END IF;
END $$;

-- Add GPS coordinates to assets table
DO $$ 
BEGIN
  -- Add latitude column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'assets' 
    AND column_name = 'latitude'
  ) THEN
    ALTER TABLE assets ADD COLUMN latitude DECIMAL(10,8);
    RAISE NOTICE 'Added latitude column to assets';
  END IF;

  -- Add longitude column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'assets' 
    AND column_name = 'longitude'
  ) THEN
    ALTER TABLE assets ADD COLUMN longitude DECIMAL(11,8);
    RAISE NOTICE 'Added longitude column to assets';
  END IF;

  -- Add formatted_address column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'assets' 
    AND column_name = 'formatted_address'
  ) THEN
    ALTER TABLE assets ADD COLUMN formatted_address TEXT;
    RAISE NOTICE 'Added formatted_address column to assets';
  END IF;

  -- Add location_accuracy column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'assets' 
    AND column_name = 'location_accuracy'
  ) THEN
    ALTER TABLE assets ADD COLUMN location_accuracy DECIMAL(8,2);
    RAISE NOTICE 'Added location_accuracy column to assets';
  END IF;
END $$;

-- Create index for location queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_location 
ON user_profiles(current_latitude, current_longitude)
WHERE location_tracking_enabled = true;

CREATE INDEX IF NOT EXISTS idx_assets_location 
ON assets(latitude, longitude)
WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Add helpful comments
COMMENT ON COLUMN user_profiles.location_tracking_enabled IS 'Whether user has enabled GPS tracking';
COMMENT ON COLUMN user_profiles.current_latitude IS 'User current latitude (-90 to 90)';
COMMENT ON COLUMN user_profiles.current_longitude IS 'User current longitude (-180 to 180)';
COMMENT ON COLUMN user_profiles.location_last_updated IS 'Timestamp of last location update';
COMMENT ON COLUMN user_profiles.formatted_address IS 'Human-readable address from reverse geocoding';

COMMENT ON COLUMN assets.latitude IS 'Asset latitude when tagged (-90 to 90)';
COMMENT ON COLUMN assets.longitude IS 'Asset longitude when tagged (-180 to 180)';
COMMENT ON COLUMN assets.formatted_address IS 'Human-readable address where asset was tagged';
COMMENT ON COLUMN assets.location_accuracy IS 'GPS accuracy in meters when asset was tagged';