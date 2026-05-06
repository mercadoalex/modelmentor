-- Drop policy if it exists and recreate
DROP POLICY IF EXISTS "School admins and teachers can update group members" ON public.group_members;

-- Add UPDATE policy for group_members to allow updating instructor status
CREATE POLICY "School admins and teachers can update group members"
  ON public.group_members FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.groups g ON g.id = group_members.group_id
      WHERE p.id = auth.uid()
      AND p.organization_id = g.organization_id
      AND p.role IN ('school_admin', 'teacher')
    )
  );