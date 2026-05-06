-- Create sandbox_configurations table
CREATE TABLE IF NOT EXISTS sandbox_configurations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  model_type text NOT NULL,
  learning_rate numeric NOT NULL,
  normalization boolean NOT NULL,
  batch_size integer NOT NULL,
  epochs integer NOT NULL,
  failure_mode text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create shared_configurations table
CREATE TABLE IF NOT EXISTS shared_configurations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  configuration_id uuid NOT NULL REFERENCES sandbox_configurations(id) ON DELETE CASCADE,
  share_token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  is_assignment boolean NOT NULL DEFAULT false,
  assignment_instructions text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_sandbox_configurations_user_id ON sandbox_configurations(user_id);
CREATE INDEX IF NOT EXISTS idx_sandbox_configurations_created_at ON sandbox_configurations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_shared_configurations_token ON shared_configurations(share_token);
CREATE INDEX IF NOT EXISTS idx_shared_configurations_config_id ON shared_configurations(configuration_id);

-- Enable RLS
ALTER TABLE sandbox_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_configurations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for sandbox_configurations
CREATE POLICY "Users can view their own configurations"
  ON sandbox_configurations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own configurations"
  ON sandbox_configurations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own configurations"
  ON sandbox_configurations FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own configurations"
  ON sandbox_configurations FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for shared_configurations
CREATE POLICY "Anyone can view shared configurations"
  ON shared_configurations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Configuration owners can share"
  ON shared_configurations FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sandbox_configurations
      WHERE id = configuration_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Configuration owners can update shares"
  ON shared_configurations FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sandbox_configurations
      WHERE id = configuration_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Configuration owners can delete shares"
  ON shared_configurations FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sandbox_configurations
      WHERE id = configuration_id AND user_id = auth.uid()
    )
  );