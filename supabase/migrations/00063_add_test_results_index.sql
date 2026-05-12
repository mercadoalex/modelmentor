-- Migration: Add index on test_results for faster prediction queries
-- This index improves query performance for the Model Comparison Dashboard

-- Create index on training_session_id for faster joins
CREATE INDEX IF NOT EXISTS idx_test_results_session ON test_results(training_session_id);

-- Add comment for documentation
COMMENT ON INDEX idx_test_results_session IS 'Index for faster prediction queries in model comparison dashboard';
