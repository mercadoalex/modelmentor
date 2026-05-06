-- Add email_notifications column to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS email_notifications boolean DEFAULT true;

-- Add comment
COMMENT ON COLUMN profiles.email_notifications IS 'User preference for receiving email notifications';
