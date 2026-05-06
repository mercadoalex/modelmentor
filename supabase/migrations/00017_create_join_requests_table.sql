-- Create join request status enum
CREATE TYPE public.join_request_status AS ENUM ('pending', 'approved', 'rejected');

-- Create join_requests table
CREATE TABLE IF NOT EXISTS public.join_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status public.join_request_status NOT NULL DEFAULT 'pending',
  message text,
  admin_message text,
  processed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(organization_id, user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_join_requests_organization_id ON public.join_requests(organization_id);
CREATE INDEX IF NOT EXISTS idx_join_requests_user_id ON public.join_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_join_requests_status ON public.join_requests(status);

-- Enable RLS
ALTER TABLE public.join_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for join_requests
-- Users can view their own join requests
CREATE POLICY "Users can view own join requests"
  ON public.join_requests FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create join requests
CREATE POLICY "Users can create join requests"
  ON public.join_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- School admins can view join requests for their organization
CREATE POLICY "School admins can view organization join requests"
  ON public.join_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.organization_id = join_requests.organization_id
      AND profiles.role = 'school_admin'
    )
  );

-- School admins can update join requests for their organization
CREATE POLICY "School admins can update join requests"
  ON public.join_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.organization_id = join_requests.organization_id
      AND profiles.role = 'school_admin'
    )
  );

-- Add comments
COMMENT ON TABLE public.join_requests IS 'Join requests from users wanting to join organizations';
COMMENT ON COLUMN public.join_requests.message IS 'Optional message from user explaining why they want to join';
COMMENT ON COLUMN public.join_requests.admin_message IS 'Optional message from admin when approving/rejecting';
COMMENT ON COLUMN public.join_requests.status IS 'Current status: pending, approved, or rejected';