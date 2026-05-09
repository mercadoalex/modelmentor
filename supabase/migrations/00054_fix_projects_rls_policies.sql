DROP POLICY IF EXISTS "Users create projects" ON projects;
DROP POLICY IF EXISTS "Users delete own projects" ON projects;
DROP POLICY IF EXISTS "Users update own projects" ON projects;
DROP POLICY IF EXISTS "Users view own projects" ON projects;

CREATE POLICY "Users create projects" ON projects
  FOR INSERT WITH CHECK (
    auth.uid() = user_id OR user_id IS NULL OR session_id IS NOT NULL
  );

CREATE POLICY "Users view own projects" ON projects
  FOR SELECT USING (
    auth.uid() = user_id OR user_id IS NULL OR session_id IS NOT NULL
  );

CREATE POLICY "Users update own projects" ON projects
  FOR UPDATE USING (
    auth.uid() = user_id OR user_id IS NULL OR session_id IS NOT NULL
  );

CREATE POLICY "Users delete own projects" ON projects
  FOR DELETE USING (
    auth.uid() = user_id OR user_id IS NULL OR session_id IS NOT NULL
  );
