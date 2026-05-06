-- Update the user mercadoalex@gmail.com to super_admin role
UPDATE profiles
SET role = 'super_admin'
WHERE email = 'mercadoalex@gmail.com';

-- Update RLS policies to include super_admin

-- Drop existing policies for role_changes
DROP POLICY IF EXISTS "Admins can view all role changes" ON role_changes;
DROP POLICY IF EXISTS "Admins can insert role changes" ON role_changes;

-- Create new policies that include super_admin
CREATE POLICY "Admins and super admins can view all role changes"
  ON role_changes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins and super admins can insert role changes"
  ON role_changes FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Drop existing policies for role_requests
DROP POLICY IF EXISTS "Admins can update role requests" ON role_requests;

-- Create new policy that includes super_admin
CREATE POLICY "Admins and super admins can update role requests"
  ON role_requests FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Update the existing SELECT policy for role_requests to include super_admin
DROP POLICY IF EXISTS "Users can view their own role requests" ON role_requests;

CREATE POLICY "Users can view their own role requests"
  ON role_requests FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );