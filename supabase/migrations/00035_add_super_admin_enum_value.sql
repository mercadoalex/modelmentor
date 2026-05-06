-- Add super_admin to the user_role enum type
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'super_admin';