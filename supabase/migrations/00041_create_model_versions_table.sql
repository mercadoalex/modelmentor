-- Create model_versions table
CREATE TABLE IF NOT EXISTS model_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  version_name TEXT,
  
  -- Training metadata
  training_session_id UUID REFERENCES training_sessions(id) ON DELETE SET NULL,
  dataset_id UUID REFERENCES datasets(id) ON DELETE SET NULL,
  
  -- Performance metrics
  accuracy DECIMAL(5,4),
  loss DECIMAL(10,6),
  precision DECIMAL(5,4),
  recall DECIMAL(5,4),
  f1_score DECIMAL(5,4),
  
  -- Training configuration
  epochs INTEGER,
  batch_size INTEGER,
  learning_rate DECIMAL(10,8),
  
  -- Data information
  feature_count INTEGER,
  sample_count INTEGER,
  class_labels TEXT[],
  
  -- Change tracking
  changes_from_previous JSONB,
  notes TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT false,
  is_deployed BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  UNIQUE(project_id, version_number)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_model_versions_project_id ON model_versions(project_id);
CREATE INDEX IF NOT EXISTS idx_model_versions_created_at ON model_versions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_model_versions_active ON model_versions(project_id, is_active) WHERE is_active = true;

-- Enable RLS
ALTER TABLE model_versions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own model versions"
  ON model_versions FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid() OR session_id::text = auth.uid()::text
    )
  );

CREATE POLICY "Users can create model versions for their projects"
  ON model_versions FOR INSERT
  WITH CHECK (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid() OR session_id::text = auth.uid()::text
    )
  );

CREATE POLICY "Users can update their own model versions"
  ON model_versions FOR UPDATE
  USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid() OR session_id::text = auth.uid()::text
    )
  );

CREATE POLICY "Users can delete their own model versions"
  ON model_versions FOR DELETE
  USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid() OR session_id::text = auth.uid()::text
    )
  );