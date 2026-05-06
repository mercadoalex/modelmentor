-- Create activity type enum
CREATE TYPE activity_type AS ENUM ('view', 'filter', 'export', 'rollback', 'note');

-- Add comment
COMMENT ON TYPE activity_type IS 'Types of admin activities in bulk action history';