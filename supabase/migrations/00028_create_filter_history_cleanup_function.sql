-- Create function to prune old filter history
CREATE OR REPLACE FUNCTION prune_old_filter_history()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.filter_history
  WHERE accessed_at < now() - INTERVAL '30 days';
END;
$$;

-- Add comment
COMMENT ON FUNCTION prune_old_filter_history() IS 'Deletes filter history entries older than 30 days';