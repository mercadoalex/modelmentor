-- Enable RLS on new tables
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies for organizations
-- School admins can view their own organization
CREATE POLICY "School admins can view their organization"
  ON public.organizations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.organization_id = organizations.id
      AND profiles.role = 'school_admin'
    )
  );

-- School admins can update their own organization
CREATE POLICY "School admins can update their organization"
  ON public.organizations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.organization_id = organizations.id
      AND profiles.role = 'school_admin'
    )
  );

-- Anyone can create an organization (for school admin sign-up)
CREATE POLICY "Anyone can create organization"
  ON public.organizations FOR INSERT
  WITH CHECK (true);

-- RLS Policies for groups
-- Members of organization can view groups
CREATE POLICY "Organization members can view groups"
  ON public.groups FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.organization_id = groups.organization_id
    )
  );

-- School admins and teachers can create groups
CREATE POLICY "School admins and teachers can create groups"
  ON public.groups FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.organization_id = groups.organization_id
      AND profiles.role IN ('school_admin', 'teacher')
    )
  );

-- School admins and teachers can update groups
CREATE POLICY "School admins and teachers can update groups"
  ON public.groups FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.organization_id = groups.organization_id
      AND profiles.role IN ('school_admin', 'teacher')
    )
  );

-- School admins can delete groups
CREATE POLICY "School admins can delete groups"
  ON public.groups FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.organization_id = groups.organization_id
      AND profiles.role = 'school_admin'
    )
  );

-- RLS Policies for group_members
-- Group members can view their own memberships
CREATE POLICY "Users can view group memberships"
  ON public.group_members FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.groups g ON g.id = group_members.group_id
      WHERE p.id = auth.uid()
      AND p.organization_id = g.organization_id
      AND p.role IN ('school_admin', 'teacher')
    )
  );

-- School admins and teachers can add members to groups
CREATE POLICY "School admins and teachers can add group members"
  ON public.group_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.groups g ON g.id = group_members.group_id
      WHERE p.id = auth.uid()
      AND p.organization_id = g.organization_id
      AND p.role IN ('school_admin', 'teacher')
    )
  );

-- School admins and teachers can remove members from groups
CREATE POLICY "School admins and teachers can remove group members"
  ON public.group_members FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.groups g ON g.id = group_members.group_id
      WHERE p.id = auth.uid()
      AND p.organization_id = g.organization_id
      AND p.role IN ('school_admin', 'teacher')
    )
  );