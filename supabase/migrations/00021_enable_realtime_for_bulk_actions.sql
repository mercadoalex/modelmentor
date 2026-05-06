-- Enable real-time replication for bulk_actions table
ALTER PUBLICATION supabase_realtime ADD TABLE public.bulk_actions;

-- Add comment
COMMENT ON TABLE public.bulk_actions IS 'Bulk action history with real-time updates enabled';