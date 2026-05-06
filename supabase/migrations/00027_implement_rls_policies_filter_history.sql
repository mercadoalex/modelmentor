-- Enable RLS
ALTER TABLE public.filter_history ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is admin of organization
CREATE OR REPLACE FUNCTION can_manage_filter_history(org_id UUID)
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

-- Policy: Admins can view their own filter history
CREATE POLICY "Admins can view own filter history"
  ON public.filter_history
  FOR SELECT
  TO authenticated
  USING (admin_id = auth.uid() AND can_manage_filter_history(organization_id));

-- Policy: Admins can insert their own filter history
CREATE POLICY "Admins can insert own filter history"
  ON public.filter_history
  FOR INSERT
  TO authenticated
  WITH CHECK (admin_id = auth.uid() AND can_manage_filter_history(organization_id));

-- Policy: Admins can update their own filter history
CREATE POLICY "Admins can update own filter history"
  ON public.filter_history
  FOR UPDATE
  TO authenticated
  USING (admin_id = auth.uid() AND can_manage_filter_history(organization_id));

-- Policy: Admins can delete their own filter history
CREATE POLICY "Admins can delete own filter history"
  ON public.filter_history
  FOR DELETE
  TO authenticated
  USING (admin_id = auth.uid() AND can_manage_filter_history(organization_id));