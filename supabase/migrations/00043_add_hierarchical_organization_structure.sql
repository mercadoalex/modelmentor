-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add missing fields to organizations table to make it work as institutions
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS contact_email TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS contact_phone TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- Add constraint for status if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'organizations_status_check'
  ) THEN
    ALTER TABLE organizations ADD CONSTRAINT organizations_status_check CHECK (status IN ('active', 'inactive'));
  END IF;
END $$;

-- Create colleges table as intermediate layer between organizations and groups
CREATE TABLE IF NOT EXISTS colleges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  address TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add college_id to groups table (nullable for backward compatibility)
ALTER TABLE groups ADD COLUMN IF NOT EXISTS college_id UUID REFERENCES colleges(id) ON DELETE CASCADE;

-- Add group_type, start_date, end_date, status to groups table
ALTER TABLE groups ADD COLUMN IF NOT EXISTS group_type TEXT DEFAULT 'class';
ALTER TABLE groups ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE groups ADD COLUMN IF NOT EXISTS end_date DATE;
ALTER TABLE groups ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- Add constraints for new columns
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'groups_group_type_check'
  ) THEN
    ALTER TABLE groups ADD CONSTRAINT groups_group_type_check CHECK (group_type IN ('class', 'cohort', 'study_group'));
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'groups_status_check'
  ) THEN
    ALTER TABLE groups ADD CONSTRAINT groups_status_check CHECK (status IN ('active', 'inactive'));
  END IF;
END $$;

-- Add role column to group_members (map is_instructor to role)
ALTER TABLE group_members ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'student';

-- Add constraint for role
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'group_members_role_check'
  ) THEN
    ALTER TABLE group_members ADD CONSTRAINT group_members_role_check CHECK (role IN ('student', 'teacher', 'admin'));
  END IF;
END $$;

-- Update existing group_members to set role based on is_instructor
UPDATE group_members SET role = CASE WHEN is_instructor THEN 'teacher' ELSE 'student' END WHERE role = 'student' AND is_instructor = true;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_colleges_organization_id ON colleges(organization_id);
CREATE INDEX IF NOT EXISTS idx_groups_college_id ON groups(college_id);

-- Create updated_at trigger for colleges
DROP TRIGGER IF EXISTS update_colleges_updated_at ON colleges;
CREATE TRIGGER update_colleges_updated_at BEFORE UPDATE ON colleges
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();