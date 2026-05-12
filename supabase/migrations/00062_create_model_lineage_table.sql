-- Migration: Create model_lineage table for tracking model version relationships
-- This table stores parent-child relationships between model versions for lineage tracking

CREATE TABLE IF NOT EXISTS model_lineage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_version_id UUID NOT NULL REFERENCES model_versions(id) ON DELETE CASCADE,
  parent_model_version_id UUID REFERENCES model_versions(id) ON DELETE SET NULL,
  relationship_type VARCHAR(50) DEFAULT 'derived_from',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Each model version can only have one lineage record
  UNIQUE(model_version_id)
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_model_lineage_model ON model_lineage(model_version_id);
CREATE INDEX IF NOT EXISTS idx_model_lineage_parent ON model_lineage(parent_model_version_id);

-- Enable Row Level Security
ALTER TABLE model_lineage ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can access lineage for their own model versions
CREATE POLICY "Users can view lineage for their model versions"
  ON model_lineage FOR SELECT
  USING (
    model_version_id IN (
      SELECT mv.id FROM model_versions mv
      JOIN projects p ON mv.project_id = p.id
      WHERE p.user_id = auth.uid() OR p.session_id::text = auth.uid()::text
    )
  );

CREATE POLICY "Users can insert lineage for their model versions"
  ON model_lineage FOR INSERT
  WITH CHECK (
    model_version_id IN (
      SELECT mv.id FROM model_versions mv
      JOIN projects p ON mv.project_id = p.id
      WHERE p.user_id = auth.uid() OR p.session_id::text = auth.uid()::text
    )
  );

CREATE POLICY "Users can update lineage for their model versions"
  ON model_lineage FOR UPDATE
  USING (
    model_version_id IN (
      SELECT mv.id FROM model_versions mv
      JOIN projects p ON mv.project_id = p.id
      WHERE p.user_id = auth.uid() OR p.session_id::text = auth.uid()::text
    )
  );

CREATE POLICY "Users can delete lineage for their model versions"
  ON model_lineage FOR DELETE
  USING (
    model_version_id IN (
      SELECT mv.id FROM model_versions mv
      JOIN projects p ON mv.project_id = p.id
      WHERE p.user_id = auth.uid() OR p.session_id::text = auth.uid()::text
    )
  );

-- Add comments for documentation
COMMENT ON TABLE model_lineage IS 'Tracks parent-child relationships between model versions for lineage visualization';
COMMENT ON COLUMN model_lineage.relationship_type IS 'Type of relationship: derived_from, fine_tuned_from, retrained_from, etc.';
COMMENT ON COLUMN model_lineage.notes IS 'Optional notes describing changes from parent model';
