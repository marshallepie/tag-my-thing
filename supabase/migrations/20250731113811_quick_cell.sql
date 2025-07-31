/*
  # Bug Reporting System

  1. New Tables
    - `bug_reports` - Store bug report metadata and details
    
  2. Storage
    - Create storage bucket for bug screenshots
    - Add RLS policies for secure screenshot access

  3. Security
    - Enable RLS on bug_reports table
    - Add policies for user submissions and admin access
    - Secure screenshot storage with proper access controls
*/

-- Create bug_reports table
CREATE TABLE IF NOT EXISTS bug_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email text,
  user_name text,
  error_message text NOT NULL,
  console_logs text,
  screenshot_url text,
  page_url text,
  user_agent text,
  metadata jsonb DEFAULT '{}',
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'triaged', 'in_progress', 'resolved', 'wont_fix')),
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  admin_notes text
);

-- Enable Row Level Security
ALTER TABLE bug_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Authenticated users can insert their own bug reports
CREATE POLICY "Authenticated users can insert bug reports"
  ON bug_reports FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

-- RLS Policy: Admin influencers can read all bug reports
CREATE POLICY "Admin influencers can read all bug reports"
  ON bug_reports FOR SELECT
  TO authenticated
  USING ((select is_user_role('admin_influencer')));

-- RLS Policy: Admin influencers can update bug reports (status, priority, notes)
CREATE POLICY "Admin influencers can update bug reports"
  ON bug_reports FOR UPDATE
  TO authenticated
  USING ((select is_user_role('admin_influencer')));

-- RLS Policy: Admin influencers can delete bug reports
CREATE POLICY "Admin influencers can delete bug reports"
  ON bug_reports FOR DELETE
  TO authenticated
  USING ((select is_user_role('admin_influencer')));

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_bug_reports_user_id ON bug_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_bug_reports_status ON bug_reports(status);
CREATE INDEX IF NOT EXISTS idx_bug_reports_priority ON bug_reports(priority);
CREATE INDEX IF NOT EXISTS idx_bug_reports_created_at ON bug_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bug_reports_user_email ON bug_reports(user_email);

-- Create trigger for updated_at
CREATE TRIGGER set_updated_at_bug_reports
  BEFORE UPDATE ON bug_reports
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Create storage bucket for bug screenshots
INSERT INTO storage.buckets (id, name, public) 
VALUES ('bug-screenshots', 'bug-screenshots', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS Policies for bug screenshots

-- Policy: Authenticated users can upload bug screenshots
CREATE POLICY "Authenticated users can upload bug screenshots"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'bug-screenshots' 
    AND (select auth.uid())::text = (storage.foldername(name))[1]
  );

-- Policy: Admin influencers can read all bug screenshots
CREATE POLICY "Admin influencers can read all bug screenshots"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'bug-screenshots'
    AND (select is_user_role('admin_influencer'))
  );

-- Policy: Users can read their own bug screenshots
CREATE POLICY "Users can read own bug screenshots"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'bug-screenshots'
    AND (select auth.uid())::text = (storage.foldername(name))[1]
  );

-- Add comment to document the changes
COMMENT ON TABLE bug_reports IS 'In-app bug reporting system - stores user-submitted bug reports with screenshots and metadata';