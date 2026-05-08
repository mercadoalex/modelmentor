-- Enable pg_cron and pg_net extensions (required for HTTP calls from cron)
create extension if not exists pg_cron  with schema extensions;
create extension if not exists pg_net   with schema extensions;

-- Schedule the Edge Function to run daily at 8:00 AM UTC
-- This checks all active scheduled_reports and sends those whose delivery_day matches today
select cron.schedule(
  'send-scheduled-reports-daily',      -- job name (must be unique)
  '0 8 * * *',                         -- cron expression: every day at 08:00 UTC
  $$
  select net.http_post(
    url     := current_setting('app.supabase_url') || '/functions/v1/send-scheduled-report',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || current_setting('app.service_role_key')
    ),
    body    := '{}'::jsonb
  );
  $$
);