-- Migration: Fix Next of Kin RLS Policies
-- Created: 2025-11-22
-- Description: Ensures next_of_kin table has proper RLS policies to allow users to access their NOK data
-- Issue: NOK page shows "Failed to load Data" because RLS is enabled but policies may be missing

-- Ensure RLS is enabled (idempotent)
ALTER TABLE next_of_kin ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to ensure clean slate)
DROP POLICY IF EXISTS "Users can read own NOKs" ON next_of_kin;
DROP POLICY IF EXISTS "Users can insert own NOKs" ON next_of_kin;
DROP POLICY IF EXISTS "Users can update own NOKs" ON next_of_kin;
DROP POLICY IF EXISTS "Users can delete own NOKs" ON next_of_kin;

-- Create policies for next_of_kin table
CREATE POLICY "Users can read own NOKs"
  ON next_of_kin FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own NOKs"
  ON next_of_kin FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own NOKs"
  ON next_of_kin FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own NOKs"
  ON next_of_kin FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Add helpful comment
COMMENT ON TABLE next_of_kin IS 'Next-of-kin relationships for legacy planning and Dead Man''s Switch functionality';
