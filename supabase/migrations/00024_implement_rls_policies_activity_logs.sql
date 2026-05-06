-- Enable RLS
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is admin of organization
CREATE OR REPLACE FUNCTION can_view_activity_logs(org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organizations
    WHERE id = org_id
      AND created_by = auth.uid()
  );
$$;

-- Policy: Organization admins can view activity logs
CREATE POLICY "Organization admins can view activity logs"
  ON public.activity_logs
  FOR SELECT
  TO authenticated
  USING (can_view_activity_logs(organization_id));

-- Policy: Organization admins can insert activity logs
CREATE POLICY "Organization admins can insert activity logs"
  ON public.activity_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (can_view_activity_logs(organization_id));