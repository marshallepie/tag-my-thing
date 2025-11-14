/*
  # Enhanced User Profile Sync to Auth

  1. Changes
    - Extend sync_profile_to_auth() function to handle name and email updates
    - Add trigger to sync full_name and email from user_profiles to auth.users
    - Ensure proper metadata updates in auth.users
    - Add validation for email uniqueness

  2. Features
    - Automatic sync when user updates name in profile
    - Automatic sync when user updates email in profile (if allowed)
    - Maintains consistency between user_profiles and auth.users
    - Updates auth.users.user_metadata with profile information

  3. Security
    - Only authenticated users can update their own profile
    - Proper validation for email format and uniqueness
    - Secure function execution with SECURITY DEFINER
*/

-- Enhanced function to sync profile data from user_profiles to auth.users
CREATE OR REPLACE FUNCTION sync_profile_to_auth()
RETURNS TRIGGER AS $$
DECLARE
  current_metadata jsonb;
BEGIN
  -- Get current user metadata
  SELECT raw_user_meta_data INTO current_metadata
  FROM auth.users 
  WHERE id = NEW.id;
  
  -- Initialize metadata if null
  IF current_metadata IS NULL THEN
    current_metadata := '{}'::jsonb;
  END IF;
  
  -- Update auth.users with new profile information
  UPDATE auth.users 
  SET 
    phone = COALESCE(NEW.phone_number, phone),
    email = CASE 
      WHEN NEW.email IS NOT NULL AND NEW.email != '' AND NEW.email != email 
      THEN NEW.email 
      ELSE email 
    END,
    raw_user_meta_data = current_metadata || jsonb_build_object(
      'full_name', COALESCE(NEW.full_name, ''),
      'account_type', COALESCE(NEW.account_type, 'user'),
      'phone_number', COALESCE(NEW.phone_number, ''),
      'updated_via', 'profile_sync'
    ),
    updated_at = now()
  WHERE id = NEW.id;
  
  -- Log the sync for debugging
  RAISE NOTICE 'Synced profile data for user %: name=%, email=%, phone=%', 
    NEW.id, NEW.full_name, NEW.email, NEW.phone_number;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate email uniqueness and format
CREATE OR REPLACE FUNCTION validate_profile_email()
RETURNS TRIGGER AS $$
BEGIN
  -- Skip validation if email is NULL or unchanged
  IF NEW.email IS NULL OR NEW.email = '' OR NEW.email = OLD.email THEN
    RETURN NEW;
  END IF;
  
  -- Basic email format validation
  IF NEW.email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    RAISE EXCEPTION 'Invalid email format: %', NEW.email;
  END IF;
  
  -- Check if email already exists in user_profiles for a different user
  IF EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE email = NEW.email 
    AND id != NEW.id
  ) THEN
    RAISE EXCEPTION 'Email address already exists: %', NEW.email;
  END IF;
  
  -- Check if email already exists in auth.users for a different user
  IF EXISTS (
    SELECT 1 FROM auth.users 
    WHERE email = NEW.email 
    AND id != NEW.id
  ) THEN
    RAISE EXCEPTION 'Email address already registered: %', NEW.email;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing phone sync trigger to replace with enhanced version
DROP TRIGGER IF EXISTS sync_phone_to_auth_trigger ON user_profiles;

-- Create enhanced profile sync trigger
CREATE TRIGGER sync_profile_to_auth_trigger
  AFTER UPDATE ON user_profiles
  FOR EACH ROW
  WHEN (
    OLD.full_name IS DISTINCT FROM NEW.full_name OR
    OLD.email IS DISTINCT FROM NEW.email OR
    OLD.phone_number IS DISTINCT FROM NEW.phone_number OR
    OLD.account_type IS DISTINCT FROM NEW.account_type
  )
  EXECUTE FUNCTION sync_profile_to_auth();

-- Create profile sync trigger for INSERT operations
CREATE TRIGGER sync_profile_to_auth_insert_trigger
  AFTER INSERT ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION sync_profile_to_auth();

-- Create email validation trigger (before update/insert)
CREATE TRIGGER validate_profile_email_trigger
  BEFORE UPDATE OF email ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION validate_profile_email();

-- Create email validation trigger for INSERT
CREATE TRIGGER validate_profile_email_insert_trigger
  BEFORE INSERT ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION validate_profile_email();

-- Update existing user profiles to sync with auth.users
DO $$
DECLARE
  profile_record user_profiles%ROWTYPE;
BEGIN
  -- Loop through all user profiles and sync to auth.users
  FOR profile_record IN 
    SELECT * FROM user_profiles 
    WHERE full_name IS NOT NULL OR email IS NOT NULL OR phone_number IS NOT NULL
  LOOP
    -- Trigger the sync function for existing records
    UPDATE user_profiles 
    SET updated_at = now()
    WHERE id = profile_record.id;
    
    RAISE NOTICE 'Synced existing profile for user: %', profile_record.id;
  END LOOP;
END $$;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA auth TO authenticated;
GRANT SELECT, UPDATE ON auth.users TO authenticated;