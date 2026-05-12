-- Migration: Extend model_versions table with efficiency metrics and experiment tracking
-- These columns support the Model Comparison Dashboard efficiency metrics and lineage features

-- Add efficiency metrics columns
ALTER TABLE model_versions
ADD COLUMN IF NOT EXISTS training_time_seconds INTEGER,
ADD COLUMN IF NOT EXISTS inference_time_ms DECIMAL(10, 3),
ADD COLUMN IF NOT EXISTS model_size_bytes BIGINT,
ADD COLUMN IF NOT EXISTS flops BIGINT,
ADD COLUMN IF NOT EXISTS experiment_id VARCHAR(100),
ADD COLUMN IF NOT EXISTS optimizer VARCHAR(50);

-- Create index on experiment_id for experiment tracking queries
CREATE INDEX IF NOT EXISTS idx_model_versions_experiment ON model_versions(experiment_id);

-- Add comments for documentation
COMMENT ON COLUMN model_versions.training_time_seconds IS 'Total training time in seconds';
COMMENT ON COLUMN model_versions.inference_time_ms IS 'Average inference time per sample in milliseconds';
COMMENT ON COLUMN model_versions.model_size_bytes IS 'Model file size in bytes';
COMMENT ON COLUMN model_versions.flops IS 'Floating point operations count for the model';
COMMENT ON COLUMN model_versions.experiment_id IS 'Experiment identifier for grouping related model versions';
COMMENT ON COLUMN model_versions.optimizer IS 'Optimizer used during training (e.g., adam, sgd, rmsprop)';
