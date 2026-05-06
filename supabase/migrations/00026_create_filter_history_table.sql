-- Create filter_history table
CREATE TABLE IF NOT EXISTS public.filter_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  admin_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  filter_url TEXT NOT NULL,
  accessed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_filter_history_organization_id ON public.filter_history(organization_id);
CREATE INDEX idx_filter_history_admin_id ON public.filter_history(admin_id);
CREATE INDEX idx_filter_history_accessed_at ON public.filter_history(accessed_at DESC);

-- Create unique constraint to prevent duplicate filter URLs per admin
CREATE UNIQUE INDEX idx_filter_history_unique ON public.filter_history(organization_id, admin_id, filter_url);

-- Add comments
COMMENT ON TABLE public.filter_history IS 'Tracks filter history for join request manager';
COMMENT ON COLUMN public.filter_history.filter_url IS 'Query string representing filter state';
COMMENT ON COLUMN public.filter_history.accessed_at IS 'Last time this filter was accessed';