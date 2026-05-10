-- sandbox_configurations table
CREATE TABLE IF NOT EXISTS sandbox_configurations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  description   TEXT,
  model_type    TEXT NOT NULL DEFAULT 'image_classification',
  learning_rate FLOAT NOT NULL,
  normalization BOOLEAN NOT NULL DEFAULT true,
  batch_size    INTEGER NOT NULL,
  epochs        INTEGER NOT NULL,
  failure_mode  TEXT,
  is_assignment BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS
ALTER TABLE sandbox_configurations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own configurations" ON sandbox_configurations
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- shared_configurations table
CREATE TABLE IF NOT EXISTS shared_configurations (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  configuration_id  UUID REFERENCES sandbox_configurations(id) ON DELETE CASCADE,
  share_token       TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  is_assignment     BOOLEAN NOT NULL DEFAULT false,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Public read for shared configs (no auth needed to view a shared link)
ALTER TABLE shared_configurations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read shared configurations" ON shared_configurations
  FOR SELECT USING (true);
CREATE POLICY "Owners create shared configurations" ON shared_configurations
  FOR INSERT WITH CHECK (true);