-- Create bulk action type enum
CREATE TYPE public.bulk_action_type AS ENUM (
  'bulk_approve',
  'bulk_reject',
  'bulk_undo'
);

-- Create bulk action item status enum
CREATE TYPE public.bulk_action_item_status AS ENUM (
  'success',
  'failed'
);

-- Create bulk_actions table
CREATE TABLE IF NOT EXISTS public.bulk_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  admin_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  action_type public.bulk_action_type NOT NULL,
  request_count integer NOT NULL DEFAULT 0,
  success_count integer NOT NULL DEFAULT 0,
  failed_count integer NOT NULL DEFAULT 0,
  message text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create bulk_action_items junction table
CREATE TABLE IF NOT EXISTS public.bulk_action_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bulk_action_id uuid NOT NULL REFERENCES public.bulk_actions(id) ON DELETE CASCADE,
  request_id uuid NOT NULL REFERENCES public.join_requests(id) ON DELETE CASCADE,
  status public.bulk_action_item_status NOT NULL,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_bulk_actions_organization_id ON public.bulk_actions(organization_id);
CREATE INDEX IF NOT EXISTS idx_bulk_actions_admin_id ON public.bulk_actions(admin_id);
CREATE INDEX IF NOT EXISTS idx_bulk_actions_action_type ON public.bulk_actions(action_type);
CREATE INDEX IF NOT EXISTS idx_bulk_actions_created_at ON public.bulk_actions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bulk_action_items_bulk_action_id ON public.bulk_action_items(bulk_action_id);
CREATE INDEX IF NOT EXISTS idx_bulk_action_items_request_id ON public.bulk_action_items(request_id);

-- Enable RLS
ALTER TABLE public.bulk_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bulk_action_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for bulk_actions
-- Organization members can view bulk actions for their organization
CREATE POLICY "Organization members can view bulk actions"
  ON public.bulk_actions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.organization_id = bulk_actions.organization_id
    )
  );

-- School admins can insert bulk actions
CREATE POLICY "School admins can insert bulk actions"
  ON public.bulk_actions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.organization_id = bulk_actions.organization_id
      AND profiles.role = 'school_admin'
    )
  );

-- School admins can update bulk actions (for adding notes)
CREATE POLICY "School admins can update bulk actions"
  ON public.bulk_actions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.organization_id = bulk_actions.organization_id
      AND profiles.role = 'school_admin'
    )
  );

-- RLS Policies for bulk_action_items
-- Organization members can view bulk action items for their organization's bulk actions
CREATE POLICY "Organization members can view bulk action items"
  ON public.bulk_action_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.bulk_actions
      JOIN public.profiles ON profiles.organization_id = bulk_actions.organization_id
      WHERE bulk_actions.id = bulk_action_items.bulk_action_id
      AND profiles.id = auth.uid()
    )
  );

-- School admins can insert bulk action items
CREATE POLICY "School admins can insert bulk action items"
  ON public.bulk_action_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.bulk_actions
      JOIN public.profiles ON profiles.organization_id = bulk_actions.organization_id
      WHERE bulk_actions.id = bulk_action_items.bulk_action_id
      AND profiles.id = auth.uid()
      AND profiles.role = 'school_admin'
    )
  );

-- Add comments
COMMENT ON TABLE public.bulk_actions IS 'Audit log tracking all bulk join request operations';
COMMENT ON COLUMN public.bulk_actions.admin_id IS 'Admin who performed the bulk action';
COMMENT ON COLUMN public.bulk_actions.action_type IS 'Type of bulk action: bulk_approve, bulk_reject, bulk_undo';
COMMENT ON COLUMN public.bulk_actions.request_count IS 'Total number of requests processed in this bulk action';
COMMENT ON COLUMN public.bulk_actions.success_count IS 'Number of successfully processed requests';
COMMENT ON COLUMN public.bulk_actions.failed_count IS 'Number of failed requests';
COMMENT ON COLUMN public.bulk_actions.message IS 'Shared message sent to all users in this bulk action';
COMMENT ON COLUMN public.bulk_actions.notes IS 'Optional notes added by admins for audit purposes';

COMMENT ON TABLE public.bulk_action_items IS 'Individual request results for each bulk action';
COMMENT ON COLUMN public.bulk_action_items.bulk_action_id IS 'Reference to the parent bulk action';
COMMENT ON COLUMN public.bulk_action_items.request_id IS 'Reference to the join request';
COMMENT ON COLUMN public.bulk_action_items.status IS 'Result status: success or failed';
COMMENT ON COLUMN public.bulk_action_items.error_message IS 'Error message if status is failed';