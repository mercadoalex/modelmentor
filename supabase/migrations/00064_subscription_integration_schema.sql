-- Migration: Subscription Integration Schema
-- Adds enum types, extends existing tables, and creates new tables for
-- the backend subscription integration feature.
-- This migration is idempotent where possible (using IF NOT EXISTS / DO $$ blocks).

-- ============================================================
-- 1. Create enum types (idempotent via DO $$ block)
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_tier') THEN
    CREATE TYPE subscription_tier AS ENUM ('free', 'pro', 'enterprise');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_status') THEN
    CREATE TYPE subscription_status AS ENUM ('active', 'trial', 'cancelled', 'expired', 'past_due');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'resource_type') THEN
    CREATE TYPE resource_type AS ENUM ('project', 'training', 'storage', 'api_call', 'report');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'training_status') THEN
    CREATE TYPE training_status AS ENUM ('pending', 'queued', 'running', 'completed', 'failed', 'timeout');
  END IF;
END
$$;

-- Add 'classification' to existing model_type enum if not already present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'classification'
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'model_type')
  ) THEN
    ALTER TYPE model_type ADD VALUE 'classification';
  END IF;
END
$$;

-- ============================================================
-- 2. Alter user_subscriptions table
--    - Add new columns
--    - Migrate tier/status from TEXT to enum types
-- ============================================================

-- Add new columns (idempotent with IF NOT EXISTS)
ALTER TABLE user_subscriptions ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ;
ALTER TABLE user_subscriptions ADD COLUMN IF NOT EXISTS current_period_start TIMESTAMPTZ;
ALTER TABLE user_subscriptions ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ;
ALTER TABLE user_subscriptions ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;

-- Migrate tier column from TEXT to subscription_tier enum
DO $$
BEGIN
  -- Only migrate if the column is still TEXT type
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_subscriptions'
      AND column_name = 'tier'
      AND data_type = 'text'
  ) THEN
    -- Drop the existing CHECK constraint on tier
    ALTER TABLE user_subscriptions DROP CONSTRAINT IF EXISTS user_subscriptions_tier_check;

    -- Alter column type using USING clause to cast existing values
    ALTER TABLE user_subscriptions
      ALTER COLUMN tier TYPE subscription_tier
      USING tier::subscription_tier;

    -- Set default
    ALTER TABLE user_subscriptions
      ALTER COLUMN tier SET DEFAULT 'free'::subscription_tier;
  END IF;
END
$$;

-- Migrate status column from TEXT to subscription_status enum
DO $$
BEGIN
  -- Only migrate if the column is still TEXT type
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_subscriptions'
      AND column_name = 'status'
      AND data_type = 'text'
  ) THEN
    -- Drop the existing CHECK constraint on status
    ALTER TABLE user_subscriptions DROP CONSTRAINT IF EXISTS user_subscriptions_status_check;

    -- Alter column type using USING clause to cast existing values
    ALTER TABLE user_subscriptions
      ALTER COLUMN status TYPE subscription_status
      USING status::subscription_status;

    -- Set default
    ALTER TABLE user_subscriptions
      ALTER COLUMN status SET DEFAULT 'active'::subscription_status;
  END IF;
END
$$;

-- Add UNIQUE constraint on user_id if not already present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'user_subscriptions_user_id_key'
      AND conrelid = 'user_subscriptions'::regclass
  ) THEN
    ALTER TABLE user_subscriptions ADD CONSTRAINT user_subscriptions_user_id_key UNIQUE (user_id);
  END IF;
END
$$;

-- ============================================================
-- 3. Create usage_events table (new event-based tracking)
-- ============================================================

CREATE TABLE IF NOT EXISTS usage_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  resource_type resource_type NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 1,
  compute_minutes NUMERIC,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for monthly aggregation queries
CREATE INDEX IF NOT EXISTS idx_usage_events_user_resource_created
  ON usage_events (user_id, resource_type, created_at);

-- ============================================================
-- 4. Extend datasets table
-- ============================================================

ALTER TABLE datasets ADD COLUMN IF NOT EXISTS file_size_bytes BIGINT;
ALTER TABLE datasets ADD COLUMN IF NOT EXISTS file_format TEXT;
ALTER TABLE datasets ADD COLUMN IF NOT EXISTS row_count INTEGER;
ALTER TABLE datasets ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Add CHECK constraint on file_format if not already present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'datasets_file_format_check'
      AND conrelid = 'datasets'::regclass
  ) THEN
    ALTER TABLE datasets ADD CONSTRAINT datasets_file_format_check
      CHECK (file_format IS NULL OR file_format IN ('csv', 'json', 'zip'));
  END IF;
END
$$;

-- ============================================================
-- 5. Extend training_sessions table
-- ============================================================

ALTER TABLE training_sessions ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
-- dataset_id already exists from initial schema
ALTER TABLE training_sessions ADD COLUMN IF NOT EXISTS config JSONB;
-- current_epoch already exists from initial schema
ALTER TABLE training_sessions ADD COLUMN IF NOT EXISTS precision_score NUMERIC;
ALTER TABLE training_sessions ADD COLUMN IF NOT EXISTS recall_score NUMERIC;
ALTER TABLE training_sessions ADD COLUMN IF NOT EXISTS f1_score NUMERIC;
ALTER TABLE training_sessions ADD COLUMN IF NOT EXISTS model_artifact_url TEXT;
ALTER TABLE training_sessions ADD COLUMN IF NOT EXISTS compute_minutes NUMERIC;
ALTER TABLE training_sessions ADD COLUMN IF NOT EXISTS error_message TEXT;
-- started_at already exists from initial schema
-- completed_at already exists from initial schema

-- Migrate status column to training_status enum if it's still TEXT
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'training_sessions'
      AND column_name = 'status'
      AND data_type = 'text'
  ) THEN
    -- Alter column type, mapping existing values
    ALTER TABLE training_sessions
      ALTER COLUMN status TYPE training_status
      USING status::training_status;

    -- Set default
    ALTER TABLE training_sessions
      ALTER COLUMN status SET DEFAULT 'pending'::training_status;
  END IF;
END
$$;

-- ============================================================
-- 6. Create platform_config table
-- ============================================================

CREATE TABLE IF NOT EXISTS platform_config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Seed daily compute budget (idempotent via ON CONFLICT)
INSERT INTO platform_config (key, value)
VALUES ('daily_compute_budget', '{"limit_minutes": 1440, "reset_hour_utc": 0}')
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- 7. Create daily_compute_usage table
-- ============================================================

CREATE TABLE IF NOT EXISTS daily_compute_usage (
  date DATE PRIMARY KEY DEFAULT CURRENT_DATE,
  total_minutes NUMERIC DEFAULT 0,
  job_count INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now()
);
