-- Add is_instructor flag to group_members
ALTER TABLE public.group_members
ADD COLUMN IF NOT EXISTS is_instructor boolean NOT NULL DEFAULT false;

-- Create index for filtering instructors
CREATE INDEX IF NOT EXISTS idx_group_members_is_instructor ON public.group_members(is_instructor);

-- Add comment
COMMENT ON COLUMN public.group_members.is_instructor IS 'Whether this member is an instructor/teacher for the group';