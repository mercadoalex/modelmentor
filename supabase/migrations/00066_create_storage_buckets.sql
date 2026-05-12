-- Migration: Create storage buckets for user datasets and model artifacts
-- Creates private buckets with RLS policies that scope access by user_id path prefix.
-- Storage path convention: {user_id}/{filename}
-- This migration is idempotent (uses ON CONFLICT DO NOTHING and DROP POLICY IF EXISTS).

-- ============================================================
-- 1. Create storage buckets
-- ============================================================

-- user-datasets bucket: stores CSV, JSON, and ZIP dataset files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'user-datasets',
  'user-datasets',
  false,
  524288000, -- 500 MB max (highest tier limit; per-user limits enforced in application)
  ARRAY['text/csv', 'application/json', 'application/zip', 'application/x-zip-compressed', 'application/octet-stream']
)
ON CONFLICT (id) DO NOTHING;

-- model-artifacts bucket: stores trained model weights and configurations
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'model-artifacts',
  'model-artifacts',
  false,
  null, -- no file size limit for model artifacts
  null  -- allow any mime type for model artifacts
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 2. Storage policies for user-datasets bucket
--    Users can only access files under their own user_id/ prefix.
-- ============================================================

-- Users can upload datasets under their own user_id prefix
DROP POLICY IF EXISTS "Users can upload own datasets" ON storage.objects;
CREATE POLICY "Users can upload own datasets"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'user-datasets' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can read their own datasets
DROP POLICY IF EXISTS "Users can read own datasets" ON storage.objects;
CREATE POLICY "Users can read own datasets"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'user-datasets' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can update their own datasets
DROP POLICY IF EXISTS "Users can update own datasets" ON storage.objects;
CREATE POLICY "Users can update own datasets"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'user-datasets' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can delete their own datasets
DROP POLICY IF EXISTS "Users can delete own datasets" ON storage.objects;
CREATE POLICY "Users can delete own datasets"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'user-datasets' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- ============================================================
-- 3. Storage policies for model-artifacts bucket
--    Users can read their own model artifacts.
--    Only service role (edge functions) can write model artifacts.
-- ============================================================

-- Users can read their own model artifacts
DROP POLICY IF EXISTS "Users can read own model artifacts" ON storage.objects;
CREATE POLICY "Users can read own model artifacts"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'model-artifacts' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can upload model artifacts under their own prefix
-- (allows direct upload if needed, but primarily written by edge functions via service role)
DROP POLICY IF EXISTS "Users can upload own model artifacts" ON storage.objects;
CREATE POLICY "Users can upload own model artifacts"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'model-artifacts' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can delete their own model artifacts
DROP POLICY IF EXISTS "Users can delete own model artifacts" ON storage.objects;
CREATE POLICY "Users can delete own model artifacts"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'model-artifacts' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );
