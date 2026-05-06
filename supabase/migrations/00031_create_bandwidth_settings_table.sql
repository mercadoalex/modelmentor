-- Create bandwidth_settings table for managing download bandwidth
CREATE TABLE IF NOT EXISTS bandwidth_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  max_bandwidth_mbps DECIMAL(10,2) DEFAULT 10.0, -- Maximum bandwidth in Mbps
  throttle_enabled BOOLEAN DEFAULT false,
  download_schedule JSONB DEFAULT '{"enabled": false, "start_hour": 22, "end_hour": 6}'::jsonb,
  pause_on_low_battery BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create bandwidth_usage table for tracking bandwidth statistics
CREATE TABLE IF NOT EXISTS bandwidth_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  download_id UUID REFERENCES dataset_downloads(id) ON DELETE CASCADE,
  bytes_downloaded BIGINT DEFAULT 0,
  download_speed_mbps DECIMAL(10,2), -- Average speed in Mbps
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_bandwidth_settings_user_id ON bandwidth_settings(user_id);
CREATE INDEX idx_bandwidth_usage_user_id ON bandwidth_usage(user_id);
CREATE INDEX idx_bandwidth_usage_download_id ON bandwidth_usage(download_id);
CREATE INDEX idx_bandwidth_usage_created_at ON bandwidth_usage(created_at);

-- Add RLS policies for bandwidth_settings
ALTER TABLE bandwidth_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bandwidth settings"
  ON bandwidth_settings
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bandwidth settings"
  ON bandwidth_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bandwidth settings"
  ON bandwidth_settings
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Add RLS policies for bandwidth_usage
ALTER TABLE bandwidth_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bandwidth usage"
  ON bandwidth_usage
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bandwidth usage"
  ON bandwidth_usage
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Function to get user bandwidth statistics
CREATE OR REPLACE FUNCTION get_bandwidth_stats(p_user_id UUID, p_days INTEGER DEFAULT 30)
RETURNS TABLE (
  total_downloaded_gb DECIMAL,
  average_speed_mbps DECIMAL,
  peak_speed_mbps DECIMAL,
  download_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(bytes_downloaded) / 1073741824.0, 0)::DECIMAL(10,2) as total_downloaded_gb,
    COALESCE(AVG(download_speed_mbps), 0)::DECIMAL(10,2) as average_speed_mbps,
    COALESCE(MAX(download_speed_mbps), 0)::DECIMAL(10,2) as peak_speed_mbps,
    COUNT(*)::BIGINT as download_count
  FROM bandwidth_usage
  WHERE user_id = p_user_id
    AND created_at >= NOW() - (p_days || ' days')::INTERVAL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments
COMMENT ON TABLE bandwidth_settings IS 'User bandwidth management settings';
COMMENT ON TABLE bandwidth_usage IS 'Tracks bandwidth usage for downloads';
COMMENT ON COLUMN bandwidth_settings.max_bandwidth_mbps IS 'Maximum bandwidth limit in Mbps';
COMMENT ON COLUMN bandwidth_settings.throttle_enabled IS 'Whether bandwidth throttling is enabled';
COMMENT ON COLUMN bandwidth_settings.download_schedule IS 'JSON object with schedule settings';
COMMENT ON COLUMN bandwidth_usage.bytes_downloaded IS 'Total bytes downloaded';
COMMENT ON COLUMN bandwidth_usage.download_speed_mbps IS 'Average download speed in Mbps';
