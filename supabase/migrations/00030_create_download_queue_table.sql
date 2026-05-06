-- Create download_queue table for managing batch downloads
CREATE TABLE IF NOT EXISTS download_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Download Queue',
  status TEXT NOT NULL DEFAULT 'active', -- active, paused, completed
  max_parallel INTEGER DEFAULT 2, -- maximum parallel downloads
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create download_queue_items table for individual queue items
CREATE TABLE IF NOT EXISTS download_queue_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_id UUID REFERENCES download_queue(id) ON DELETE CASCADE,
  download_id UUID REFERENCES dataset_downloads(id) ON DELETE CASCADE,
  priority INTEGER DEFAULT 0, -- higher number = higher priority
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, downloading, completed, failed, paused
  added_at TIMESTAMPTZ DEFAULT now(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- Create indexes
CREATE INDEX idx_download_queue_user_id ON download_queue(user_id);
CREATE INDEX idx_download_queue_status ON download_queue(status);
CREATE INDEX idx_download_queue_items_queue_id ON download_queue_items(queue_id);
CREATE INDEX idx_download_queue_items_status ON download_queue_items(status);
CREATE INDEX idx_download_queue_items_priority ON download_queue_items(priority DESC);

-- Add RLS policies for download_queue
ALTER TABLE download_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own queues"
  ON download_queue
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own queues"
  ON download_queue
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own queues"
  ON download_queue
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own queues"
  ON download_queue
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Add RLS policies for download_queue_items
ALTER TABLE download_queue_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own queue items"
  ON download_queue_items
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM download_queue
      WHERE download_queue.id = download_queue_items.queue_id
      AND download_queue.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own queue items"
  ON download_queue_items
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM download_queue
      WHERE download_queue.id = download_queue_items.queue_id
      AND download_queue.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own queue items"
  ON download_queue_items
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM download_queue
      WHERE download_queue.id = download_queue_items.queue_id
      AND download_queue.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own queue items"
  ON download_queue_items
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM download_queue
      WHERE download_queue.id = download_queue_items.queue_id
      AND download_queue.user_id = auth.uid()
    )
  );

-- Add comments
COMMENT ON TABLE download_queue IS 'Manages batch download queues for users';
COMMENT ON TABLE download_queue_items IS 'Individual items in download queues';
COMMENT ON COLUMN download_queue.max_parallel IS 'Maximum number of simultaneous downloads';
COMMENT ON COLUMN download_queue_items.priority IS 'Higher number = higher priority';
COMMENT ON COLUMN download_queue_items.retry_count IS 'Number of retry attempts';
