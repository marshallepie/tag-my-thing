/*
  # Add phone_number field to user_profiles

  1. Changes
    - Add phone_number column to user_profiles table
    - Allow users to store and update their phone numbers

  2. Security
    - Users can only update their own phone number
    - Phone number is optional
*/

-- Add phone_number column to user_profiles table
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS phone_number text;

-- Add comment for documentation
COMMENT ON COLUMN user_profiles.phone_number IS 'User phone number for contact purposes';