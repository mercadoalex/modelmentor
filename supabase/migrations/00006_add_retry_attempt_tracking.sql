-- Add retry attempt tracking to delivery_logs
ALTER TABLE delivery_logs
ADD COLUMN retry_attempts integer DEFAULT 0;

-- Add comment to clarify the field
COMMENT ON COLUMN delivery_logs.retry_attempts IS 'Number of retry attempts before successful delivery (0 = first attempt succeeded)';

-- Update error_message column to allow storing retry information
COMMENT ON COLUMN delivery_logs.error_message IS 'Error message for failed deliveries, or retry information for successful deliveries after retries';