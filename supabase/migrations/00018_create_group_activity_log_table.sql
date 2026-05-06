-- Create activity type enum
CREATE TYPE public.group_activity_type AS ENUM (
  'member_added',
  'member_removed',
  'instructor_assigned',
  'instructor_removed'
);

-- Create group_activity_log table
CREATE TABLE IF NOT EXISTS public.group_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  target_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  action_type public.group_activity_type NOT NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_group_activity_log_group_id ON public.group_activity_log(group_id);
CREATE INDEX IF NOT EXISTS idx_group_activity_log_created_at ON public.group_activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_group_activity_log_action_type ON public.group_activity_log(action_type);

-- Enable RLS
ALTER TABLE public.group_activity_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for group_activity_log
-- Organization members can view activity logs for their organization's groups
CREATE POLICY "Organization members can view group activity logs"
  ON public.group_activity_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.groups
      JOIN public.profiles ON profiles.organization_id = groups.organization_id
      WHERE groups.id = group_activity_log.group_id
      AND profiles.id = auth.uid()
    )
  );

-- School admins can insert activity logs
CREATE POLICY "School admins can insert activity logs"
  ON public.group_activity_log FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.groups
      JOIN public.profiles ON profiles.organization_id = groups.organization_id
      WHERE groups.id = group_activity_log.group_id
      AND profiles.id = auth.uid()
      AND profiles.role = 'school_admin'
    )
  );

-- School admins can update activity logs (for adding notes)
CREATE POLICY "School admins can update activity logs"
  ON public.group_activity_log FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.groups
      JOIN public.profiles ON profiles.organization_id = groups.organization_id
      WHERE groups.id = group_activity_log.group_id
      AND profiles.id = auth.uid()
      AND profiles.role = 'school_admin'
    )
  );

-- Add comments
COMMENT ON TABLE public.group_activity_log IS 'Activity log tracking all group membership changes';
COMMENT ON COLUMN public.group_activity_log.user_id IS 'User who performed the action (actor)';
COMMENT ON COLUMN public.group_activity_log.target_user_id IS 'User who was affected by the action';
COMMENT ON COLUMN public.group_activity_log.action_type IS 'Type of action: member_added, member_removed, instructor_assigned, instructor_removed';
COMMENT ON COLUMN public.group_activity_log.notes IS 'Optional notes added by admins for audit purposes';