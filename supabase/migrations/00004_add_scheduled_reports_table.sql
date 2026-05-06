-- Create scheduled_reports table
CREATE TABLE scheduled_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  report_name text NOT NULL,
  report_type text NOT NULL CHECK (report_type IN ('student_progress', 'concept_mastery', 'at_risk', 'class_summary')),
  frequency text NOT NULL CHECK (frequency IN ('weekly', 'monthly')),
  delivery_day integer, -- Day of week (0-6) for weekly, day of month (1-31) for monthly
  recipients text[] NOT NULL, -- Array of email addresses
  filters jsonb DEFAULT '{}'::jsonb, -- Stores student_ids, concept_names, date_range
  format text NOT NULL CHECK (format IN ('pdf', 'csv')),
  include_charts boolean DEFAULT true,
  is_active boolean DEFAULT true,
  last_sent_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create index for efficient queries
CREATE INDEX idx_scheduled_reports_user_id ON scheduled_reports(user_id);
CREATE INDEX idx_scheduled_reports_active ON scheduled_reports(is_active) WHERE is_active = true;

-- RLS policies
ALTER TABLE scheduled_reports ENABLE ROW LEVEL SECURITY;

-- Admins can manage their own scheduled reports
CREATE POLICY "Admins can view their own scheduled reports"
  ON scheduled_reports FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() AND EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Admins can create scheduled reports"
  ON scheduled_reports FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() AND EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Admins can update their own scheduled reports"
  ON scheduled_reports FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() AND EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Admins can delete their own scheduled reports"
  ON scheduled_reports FOR DELETE
  TO authenticated
  USING (user_id = auth.uid() AND EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  ));