-- Create invitation status enum
CREATE TYPE public.invitation_status AS ENUM ('pending', 'accepted', 'expired', 'cancelled');

-- Create invitations table
CREATE TABLE IF NOT EXISTS public.invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  email text NOT NULL,
  role public.user_role NOT NULL,
  code text UNIQUE NOT NULL,
  status public.invitation_status NOT NULL DEFAULT 'pending',
  expires_at timestamptz NOT NULL,
  invited_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  accepted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  accepted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_invitations_organization_id ON public.invitations(organization_id);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON public.invitations(email);
CREATE INDEX IF NOT EXISTS idx_invitations_code ON public.invitations(code);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON public.invitations(status);

-- Enable RLS
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for invitations
-- School admins can view invitations for their organization
CREATE POLICY "School admins can view organization invitations"
  ON public.invitations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.organization_id = invitations.organization_id
      AND profiles.role = 'school_admin'
    )
  );

-- School admins can create invitations for their organization
CREATE POLICY "School admins can create invitations"
  ON public.invitations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.organization_id = invitations.organization_id
      AND profiles.role = 'school_admin'
    )
  );

-- School admins can update invitations for their organization
CREATE POLICY "School admins can update invitations"
  ON public.invitations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.organization_id = invitations.organization_id
      AND profiles.role = 'school_admin'
    )
  );

-- Anyone can view invitation by code (for sign-up validation)
CREATE POLICY "Anyone can view invitation by code"
  ON public.invitations FOR SELECT
  USING (true);

-- Function to automatically expire old invitations
CREATE OR REPLACE FUNCTION expire_old_invitations()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.invitations
  SET status = 'expired'
  WHERE status = 'pending'
  AND expires_at < now();
END;
$$;

-- Add comments
COMMENT ON TABLE public.invitations IS 'Invitations sent by school admins to invite teachers and students';
COMMENT ON COLUMN public.invitations.code IS 'Unique invitation code used for sign-up';
COMMENT ON COLUMN public.invitations.expires_at IS 'Expiration timestamp for the invitation';
COMMENT ON COLUMN public.invitations.status IS 'Current status: pending, accepted, expired, or cancelled';