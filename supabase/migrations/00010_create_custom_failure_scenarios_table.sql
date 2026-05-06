-- Create custom_failure_scenarios table
CREATE TABLE IF NOT EXISTS custom_failure_scenarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  model_type text NOT NULL,
  learning_rate numeric NOT NULL,
  normalization boolean NOT NULL,
  batch_size integer NOT NULL,
  epochs integer NOT NULL,
  usage_count integer NOT NULL DEFAULT 0,
  share_token text UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  is_public boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT unique_scenario_name_per_user UNIQUE (user_id, name)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_custom_scenarios_user_id ON custom_failure_scenarios(user_id);
CREATE INDEX IF NOT EXISTS idx_custom_scenarios_created_at ON custom_failure_scenarios(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_custom_scenarios_share_token ON custom_failure_scenarios(share_token);
CREATE INDEX IF NOT EXISTS idx_custom_scenarios_usage_count ON custom_failure_scenarios(usage_count DESC);

-- Enable RLS
ALTER TABLE custom_failure_scenarios ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own scenarios"
  ON custom_failure_scenarios FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view public scenarios"
  ON custom_failure_scenarios FOR SELECT
  TO authenticated
  USING (is_public = true);

CREATE POLICY "Users can insert their own scenarios"
  ON custom_failure_scenarios FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scenarios"
  ON custom_failure_scenarios FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own scenarios"
  ON custom_failure_scenarios FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);