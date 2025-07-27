/*
  # Add Business Details to User Profiles

  1. New Columns
    - `company_name` - Store the business's registered name
    - `tax_id` - Store the business's tax identification number  
    - `business_document_url` - Store URL to uploaded business verification document

  2. Storage
    - Create storage bucket for business documents
    - Add RLS policies for secure document access

  3. Security
    - Only business users can upload/access their own documents
    - Maintain existing RLS policies for user_profiles
*/

-- Add business-specific columns to user_profiles table
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS company_name text,
ADD COLUMN IF NOT EXISTS tax_id text,
ADD COLUMN IF NOT EXISTS business_document_url text;

-- Create storage bucket for business documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('business-documents', 'business-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for business documents
CREATE POLICY "Business users can upload own documents"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'business-documents' 
    AND auth.uid()::text = (storage.foldername(name))[1]
    AND EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND is_business_user = true
    )
  );

CREATE POLICY "Business users can read own documents"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'business-documents' 
    AND auth.uid()::text = (storage.foldername(name))[1]
    AND EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND is_business_user = true
    )
  );

CREATE POLICY "Business users can update own documents"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'business-documents' 
    AND auth.uid()::text = (storage.foldername(name))[1]
    AND EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND is_business_user = true
    )
  );

CREATE POLICY "Business users can delete own documents"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'business-documents' 
    AND auth.uid()::text = (storage.foldername(name))[1]
    AND EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND is_business_user = true
    )
  );

-- Admin influencers can read all business documents for verification
CREATE POLICY "Admin influencers can read all business documents"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'business-documents'
    AND is_user_role('admin_influencer')
  );

-- Add indexes for better performance on business queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_business_user 
ON user_profiles(is_business_user) WHERE is_business_user = true;

CREATE INDEX IF NOT EXISTS idx_user_profiles_company_name 
ON user_profiles(company_name) WHERE company_name IS NOT NULL;

-- Add comment to document the changes
COMMENT ON COLUMN user_profiles.company_name IS 'Business name for business users';
COMMENT ON COLUMN user_profiles.tax_id IS 'Tax identification number for business users';
COMMENT ON COLUMN user_profiles.business_document_url IS 'URL to uploaded business verification document';