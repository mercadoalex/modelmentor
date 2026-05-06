-- Create user_tutorials table to track tutorial progress
CREATE TABLE IF NOT EXISTS user_tutorials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tutorial_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('not_started', 'in_progress', 'completed', 'skipped')),
  progress JSONB DEFAULT '{}',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  last_step INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, tutorial_id)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_tutorials_user_id ON user_tutorials(user_id);
CREATE INDEX IF NOT EXISTS idx_user_tutorials_status ON user_tutorials(status);

-- Enable RLS
ALTER TABLE user_tutorials ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own tutorial progress"
  ON user_tutorials
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tutorial progress"
  ON user_tutorials
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tutorial progress"
  ON user_tutorials
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_tutorials_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER user_tutorials_updated_at
  BEFORE UPDATE ON user_tutorials
  FOR EACH ROW
  EXECUTE FUNCTION update_user_tutorials_updated_at();

-- Insert default tutorials for existing users (optional)
-- This will be handled by the application when users first log in