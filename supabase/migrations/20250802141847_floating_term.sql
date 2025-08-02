/*
  # Add updated_at column to asset_nok_assignments table

  1. Problem
    - The asset_nok_assignments table is missing the updated_at column
    - Functions like mass_assign_assets_to_nok reference this column but it doesn't exist
    - This causes PostgreSQL error 42703: column "updated_at" does not exist

  2. Solution
    - Add updated_at column with default value of now()
    - Create trigger to automatically update the timestamp on row updates
    - Ensure consistency with other tables in the schema

  3. Security
    - Maintains existing RLS policies
    - No changes to access control or permissions
*/

-- Add updated_at column to asset_nok_assignments table
ALTER TABLE asset_nok_assignments 
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Update existing records to have the current timestamp
UPDATE asset_nok_assignments 
SET updated_at = now() 
WHERE updated_at IS NULL;

-- Create trigger to automatically update the updated_at timestamp
CREATE TRIGGER set_updated_at_asset_nok_assignments
  BEFORE UPDATE ON asset_nok_assignments
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Add comment to document the change
COMMENT ON COLUMN asset_nok_assignments.updated_at IS 'Timestamp of when the NOK assignment was last updated, automatically maintained by trigger';

-- Verify the column was added successfully
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'asset_nok_assignments' AND column_name = 'updated_at'
  ) THEN
    RAISE NOTICE 'SUCCESS: updated_at column added to asset_nok_assignments table';
  ELSE
    RAISE EXCEPTION 'FAILED: updated_at column was not added to asset_nok_assignments table';
  END IF;
END $$;