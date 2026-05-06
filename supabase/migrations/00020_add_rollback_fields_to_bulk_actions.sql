-- Add rollback tracking fields to bulk_actions table
ALTER TABLE public.bulk_actions
ADD COLUMN rollback_at timestamptz,
ADD COLUMN rollback_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create index for rollback queries
CREATE INDEX IF NOT EXISTS idx_bulk_actions_rollback_at ON public.bulk_actions(rollback_at);

-- Add comments
COMMENT ON COLUMN public.bulk_actions.rollback_at IS 'Timestamp when this bulk action was rolled back (null if not rolled back)';
COMMENT ON COLUMN public.bulk_actions.rollback_by IS 'Admin who performed the rollback (null if not rolled back)';