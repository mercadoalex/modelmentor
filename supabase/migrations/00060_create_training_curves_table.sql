-- Migration: Create training_curves table for epoch-by-epoch training metrics
-- This table stores detailed training progress data for model comparison

CREATE TABLE IF NOT EXISTS training_curves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  training_session_id UUID NOT NULL REFERENCES training_sessions(id) ON DELETE CASCADE,
  epoch INTEGER NOT NULL,
  train_loss DECIMAL(10, 6),
  val_loss DECIMAL(10, 6),
  train_accuracy DECIMAL(10, 6),
  val_accuracy DECIMAL(10, 6),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure unique epoch per training session
  UNIQUE(training_session_id, epoch)
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_training_curves_session ON training_curves(training_session_id);
CREATE INDEX IF NOT EXISTS idx_training_curves_epoch ON training_curves(training_session_id, epoch);

-- Enable Row Level Security
ALTER TABLE training_curves ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can access training curves for their own projects
CREATE POLICY "Users can view training curves for their projects"
  ON training_curves FOR SELECT
  USING (
    training_session_id IN (
      SELECT ts.id FROM training_sessions ts
      JOIN projects p ON ts.project_id = p.id
      WHERE p.user_id = auth.uid() OR p.session_id::text = auth.uid()::text
    )
  );

CREATE POLICY "Users can insert training curves for their projects"
  ON training_curves FOR INSERT
  WITH CHECK (
    training_session_id IN (
      SELECT ts.id FROM training_sessions ts
      JOIN projects p ON ts.project_id = p.id
      WHERE p.user_id = auth.uid() OR p.session_id::text = auth.uid()::text
    )
  );

CREATE POLICY "Users can update training curves for their projects"
  ON training_curves FOR UPDATE
  USING (
    training_session_id IN (
      SELECT ts.id FROM training_sessions ts
      JOIN projects p ON ts.project_id = p.id
      WHERE p.user_id = auth.uid() OR p.session_id::text = auth.uid()::text
    )
  );

CREATE POLICY "Users can delete training curves for their projects"
  ON training_curves FOR DELETE
  USING (
    training_session_id IN (
      SELECT ts.id FROM training_sessions ts
      JOIN projects p ON ts.project_id = p.id
      WHERE p.user_id = auth.uid() OR p.session_id::text = auth.uid()::text
    )
  );

-- Add comment for documentation
COMMENT ON TABLE training_curves IS 'Stores epoch-by-epoch training metrics for model comparison dashboard';
COMMENT ON COLUMN training_curves.train_loss IS 'Training loss value at this epoch';
COMMENT ON COLUMN training_curves.val_loss IS 'Validation loss value at this epoch';
COMMENT ON COLUMN training_curves.train_accuracy IS 'Training accuracy value at this epoch (0-1)';
COMMENT ON COLUMN training_curves.val_accuracy IS 'Validation accuracy value at this epoch (0-1)';
