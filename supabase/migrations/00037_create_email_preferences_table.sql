-- Create email_preferences table
CREATE TABLE IF NOT EXISTS email_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role_change_notifications boolean NOT NULL DEFAULT true,
  role_request_notifications boolean NOT NULL DEFAULT true,
  weekly_digest boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_email_preferences_user_id ON email_preferences(user_id);

-- Enable RLS
ALTER TABLE email_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only view and update their own preferences
CREATE POLICY "Users can view their own email preferences"
  ON email_preferences FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own email preferences"
  ON email_preferences FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own email preferences"
  ON email_preferences FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Create function to automatically create default preferences for new users
CREATE OR REPLACE FUNCTION create_default_email_preferences()
RETURNS TRIGGER
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO email_preferences (user_id, role_change_notifications, role_request_notifications, weekly_digest)
  VALUES (NEW.id, true, true, false)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Create trigger to run after profile creation
DROP TRIGGER IF EXISTS trigger_create_default_email_preferences ON profiles;
CREATE TRIGGER trigger_create_default_email_preferences
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_default_email_preferences();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_email_preferences_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Create trigger to update updated_at on changes
DROP TRIGGER IF EXISTS trigger_update_email_preferences_updated_at ON email_preferences;
CREATE TRIGGER trigger_update_email_preferences_updated_at
  BEFORE UPDATE ON email_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_email_preferences_updated_at();