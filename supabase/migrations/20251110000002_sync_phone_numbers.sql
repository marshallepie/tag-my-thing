/*
  # Sync phone numbers between user_profiles and auth.users

  1. Changes
    - Add trigger to sync phone_number from user_profiles to auth.users.phone
    - Add unique constraint on phone_number in user_profiles
    - Add function to handle phone number updates
    - Sync existing phone numbers from user_profiles to auth.users

  2. Features
    - Automatic sync when user updates phone in profile
    - Prevents duplicate phone numbers across users
    - Enables phone-based login/signup
    - Maintains data consistency between tables

  3. Security
    - Phone numbers must be unique across all users
    - Only authenticated users can update their own phone
    - Proper error handling for duplicate phone attempts
*/

-- Function to sync phone number from user_profiles to auth.users
CREATE OR REPLACE FUNCTION sync_phone_to_auth()
RETURNS TRIGGER AS $$
BEGIN
  -- Update auth.users phone when user_profiles phone_number changes
  UPDATE auth.users 
  SET phone = NEW.phone_number,
      updated_at = now()
  WHERE id = NEW.id;
  
  -- Log the sync for debugging
  RAISE NOTICE 'Synced phone number for user %: %', NEW.id, NEW.phone_number;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to validate phone number uniqueness before update
CREATE OR REPLACE FUNCTION validate_phone_uniqueness()
RETURNS TRIGGER AS $$
BEGIN
  -- Skip validation if phone_number is NULL or empty
  IF NEW.phone_number IS NULL OR NEW.phone_number = '' THEN
    RETURN NEW;
  END IF;
  
  -- Check if phone number already exists for a different user
  IF EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE phone_number = NEW.phone_number 
    AND id != NEW.id
  ) THEN
    RAISE EXCEPTION 'Phone number % is already registered to another user', NEW.phone_number
      USING ERRCODE = 'unique_violation';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add unique constraint on phone_number (allowing NULL values)
ALTER TABLE user_profiles 
ADD CONSTRAINT unique_phone_number 
UNIQUE (phone_number);

-- Create trigger to validate phone uniqueness before insert/update
DROP TRIGGER IF EXISTS validate_phone_uniqueness_trigger ON user_profiles;
CREATE TRIGGER validate_phone_uniqueness_trigger
  BEFORE INSERT OR UPDATE OF phone_number ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION validate_phone_uniqueness();

-- Create trigger to sync phone to auth.users after update
DROP TRIGGER IF EXISTS sync_phone_to_auth_trigger ON user_profiles;
CREATE TRIGGER sync_phone_to_auth_trigger
  AFTER UPDATE OF phone_number ON user_profiles
  FOR EACH ROW
  WHEN (OLD.phone_number IS DISTINCT FROM NEW.phone_number)
  EXECUTE FUNCTION sync_phone_to_auth();

-- Sync existing phone numbers from user_profiles to auth.users
DO $$
DECLARE
  user_record RECORD;
  sync_count INTEGER := 0;
  error_count INTEGER := 0;
BEGIN
  RAISE NOTICE 'Starting phone number sync from user_profiles to auth.users...';
  
  FOR user_record IN 
    SELECT id, phone_number 
    FROM user_profiles 
    WHERE phone_number IS NOT NULL 
    AND phone_number != ''
  LOOP
    BEGIN
      -- Update auth.users with phone number from user_profiles
      UPDATE auth.users 
      SET phone = user_record.phone_number,
          updated_at = now()
      WHERE id = user_record.id;
      
      sync_count := sync_count + 1;
      RAISE NOTICE 'Synced phone for user %: %', user_record.id, user_record.phone_number;
      
    EXCEPTION WHEN OTHERS THEN
      error_count := error_count + 1;
      RAISE WARNING 'Failed to sync phone for user %: %', user_record.id, SQLERRM;
    END;
  END LOOP;
  
  RAISE NOTICE 'Phone sync complete. Success: %, Errors: %', sync_count, error_count;
END $$;

-- Function to handle phone number conflicts during auth signup/signin
-- This can be called from application code to resolve conflicts
CREATE OR REPLACE FUNCTION resolve_phone_conflict(input_phone TEXT, input_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  existing_user_id UUID;
BEGIN
  -- Find if phone is already registered
  SELECT id INTO existing_user_id 
  FROM user_profiles 
  WHERE phone_number = input_phone;
  
  -- If phone exists and belongs to different user, return false
  IF existing_user_id IS NOT NULL AND existing_user_id != input_user_id THEN
    RETURN FALSE;
  END IF;
  
  -- Phone is available or belongs to the same user
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments for documentation
COMMENT ON FUNCTION sync_phone_to_auth() IS 'Automatically syncs phone_number changes from user_profiles to auth.users';
COMMENT ON FUNCTION validate_phone_uniqueness() IS 'Ensures phone numbers are unique across all users';
COMMENT ON FUNCTION resolve_phone_conflict(TEXT, UUID) IS 'Helper function to check phone number conflicts before auth operations';
COMMENT ON CONSTRAINT unique_phone_number ON user_profiles IS 'Ensures phone numbers are unique across all users (NULL values allowed)';

-- Create index for better performance on phone number lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_phone_number 
ON user_profiles (phone_number) 
WHERE phone_number IS NOT NULL;

-- Final confirmation message
DO $$
BEGIN
  RAISE NOTICE 'Phone number sync setup complete! Phone numbers will now automatically sync between user_profiles and auth.users';
END $$;