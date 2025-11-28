-- Add GPS location tracking features to existing tables

-- Add GPS columns to user_profiles if they don't exist
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS location_tracking_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS current_latitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS current_longitude DOUBLE PRECISION;

-- Add GPS columns to assets if they don't exist  
ALTER TABLE public.assets
ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

-- Create index for location queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_location ON public.user_profiles(current_latitude, current_longitude) WHERE current_latitude IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_assets_location ON public.assets(latitude, longitude) WHERE latitude IS NOT NULL;

-- Update RLS policies for new columns (if they don't exist)
DO $$ 
BEGIN
  -- Allow users to update their own location preferences
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'user_profiles' 
    AND policyname = 'Users can update own profile location'
  ) THEN
    CREATE POLICY "Users can update own profile location" ON public.user_profiles
      FOR UPDATE TO authenticated
      USING (auth.uid() = id);
  END IF;

  -- Allow users to read location data for asset tagging
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'assets' 
    AND policyname = 'Users can read location data'
  ) THEN
    CREATE POLICY "Users can read location data" ON public.assets
      FOR SELECT TO authenticated
      USING (user_id = auth.uid());
  END IF;
END $$;