-- Migration: Row-Level Security policies for subscription integration tables
-- Enables RLS and creates policies for user_subscriptions, usage_events,
-- datasets, and training_sessions.
-- Includes service-role bypass policies for edge functions.
-- This migration is idempotent: uses DROP POLICY IF EXISTS before CREATE.

-- ============================================================
-- 1. Enable RLS on tables
-- ============================================================

ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE datasets ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_sessions ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 2. User policies — authenticated users access their own data
-- ============================================================

-- Users can read their own subscription
DROP POLICY IF EXISTS "Users read own subscription" ON user_subscriptions;
CREATE POLICY "Users read own subscription"
  ON user_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Users can read their own usage events
DROP POLICY IF EXISTS "Users read own usage" ON usage_events;
CREATE POLICY "Users read own usage"
  ON usage_events FOR SELECT
  USING (auth.uid() = user_id);

-- Users can manage (select, insert, update, delete) their own datasets
DROP POLICY IF EXISTS "Users manage own datasets" ON datasets;
CREATE POLICY "Users manage own datasets"
  ON datasets FOR ALL
  USING (auth.uid() = user_id);

-- Users can read their own training sessions
DROP POLICY IF EXISTS "Users read own training sessions" ON training_sessions;
CREATE POLICY "Users read own training sessions"
  ON training_sessions FOR SELECT
  USING (auth.uid() = user_id);

-- ============================================================
-- 3. Service-role bypass policies for edge functions
--    Edge functions use the service_role key which bypasses RLS by default,
--    but these explicit policies allow granular control if RLS is forced
--    on the service role or for future audit clarity.
-- ============================================================

-- Service role can insert usage events (edge functions track usage)
DROP POLICY IF EXISTS "Service role insert usage events" ON usage_events;
CREATE POLICY "Service role insert usage events"
  ON usage_events FOR INSERT
  WITH CHECK (
    current_setting('request.jwt.claims', true)::jsonb ->> 'role' = 'service_role'
  );

-- Service role can update training sessions (edge functions update status/metrics)
DROP POLICY IF EXISTS "Service role update training sessions" ON training_sessions;
CREATE POLICY "Service role update training sessions"
  ON training_sessions FOR UPDATE
  USING (
    current_setting('request.jwt.claims', true)::jsonb ->> 'role' = 'service_role'
  );

-- Service role can insert training sessions (edge functions create new sessions)
DROP POLICY IF EXISTS "Service role insert training sessions" ON training_sessions;
CREATE POLICY "Service role insert training sessions"
  ON training_sessions FOR INSERT
  WITH CHECK (
    current_setting('request.jwt.claims', true)::jsonb ->> 'role' = 'service_role'
  );
