-- Add first_name and last_name fields to profiles table
ALTER TABLE profiles
ADD COLUMN first_name text,
ADD COLUMN last_name text;

-- Add comment to clarify the fields
COMMENT ON COLUMN profiles.first_name IS 'User first name collected during registration';
COMMENT ON COLUMN profiles.last_name IS 'User last name collected during registration';