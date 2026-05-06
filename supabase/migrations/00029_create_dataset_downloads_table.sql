-- Create dataset_downloads table for tracking dataset downloads
CREATE TABLE IF NOT EXISTS dataset_downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  dataset_name TEXT NOT NULL,
  dataset_url TEXT NOT NULL,
  platform TEXT NOT NULL, -- kaggle, huggingface, tensorflow, github, other
  file_path TEXT, -- path in storage bucket
  file_size BIGINT, -- size in bytes
  format TEXT, -- csv, json, images, etc.
  status TEXT NOT NULL DEFAULT 'pending', -- pending, downloading, completed, failed
  progress INTEGER DEFAULT 0, -- 0-100
  error_message TEXT,
  downloaded_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ, -- cache expiration (30 days from download)
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for user lookups
CREATE INDEX idx_dataset_downloads_user_id ON dataset_downloads(user_id);

-- Create index for status lookups
CREATE INDEX idx_dataset_downloads_status ON dataset_downloads(status);

-- Create index for expiration lookups
CREATE INDEX idx_dataset_downloads_expires_at ON dataset_downloads(expires_at);

-- Add RLS policies
ALTER TABLE dataset_downloads ENABLE ROW LEVEL SECURITY;

-- Users can view their own downloads
CREATE POLICY "Users can view own downloads"
  ON dataset_downloads
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert their own downloads
CREATE POLICY "Users can insert own downloads"
  ON dataset_downloads
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own downloads
CREATE POLICY "Users can update own downloads"
  ON dataset_downloads
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can delete their own downloads
CREATE POLICY "Users can delete own downloads"
  ON dataset_downloads
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Add comments
COMMENT ON TABLE dataset_downloads IS 'Tracks dataset downloads and caching';
COMMENT ON COLUMN dataset_downloads.user_id IS 'User who downloaded the dataset';
COMMENT ON COLUMN dataset_downloads.dataset_name IS 'Name of the dataset';
COMMENT ON COLUMN dataset_downloads.dataset_url IS 'Original URL of the dataset';
COMMENT ON COLUMN dataset_downloads.platform IS 'Platform source (kaggle, huggingface, etc.)';
COMMENT ON COLUMN dataset_downloads.file_path IS 'Path in Supabase Storage bucket';
COMMENT ON COLUMN dataset_downloads.file_size IS 'Size in bytes';
COMMENT ON COLUMN dataset_downloads.status IS 'Download status (pending, downloading, completed, failed)';
COMMENT ON COLUMN dataset_downloads.expires_at IS 'Cache expiration date (30 days from download)';
