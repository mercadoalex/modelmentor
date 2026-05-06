-- Add delivery status tracking fields to scheduled_reports
ALTER TABLE scheduled_reports
ADD COLUMN delivery_status text DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'success', 'error')),
ADD COLUMN last_error text,
ADD COLUMN delivery_count integer DEFAULT 0;

-- Create delivery_logs table for detailed tracking
CREATE TABLE delivery_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scheduled_report_id uuid NOT NULL REFERENCES scheduled_reports(id) ON DELETE CASCADE,
  status text NOT NULL CHECK (status IN ('success', 'error')),
  email_id text, -- Resend email ID
  error_message text,
  recipients text[] NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create index for efficient queries
CREATE INDEX idx_delivery_logs_report_id ON delivery_logs(scheduled_report_id);
CREATE INDEX idx_delivery_logs_created_at ON delivery_logs(created_at DESC);

-- RLS policies for delivery_logs
ALTER TABLE delivery_logs ENABLE ROW LEVEL SECURITY;

-- Admins can view delivery logs for their own scheduled reports
CREATE POLICY "Admins can view their own delivery logs"
  ON delivery_logs FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM scheduled_reports 
    WHERE scheduled_reports.id = delivery_logs.scheduled_report_id 
    AND scheduled_reports.user_id = auth.uid()
    AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  ));