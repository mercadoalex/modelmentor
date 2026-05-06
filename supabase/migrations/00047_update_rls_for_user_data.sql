-- Update RLS policies for quizzes table
DROP POLICY IF EXISTS "Users can view own quizzes" ON quizzes;
DROP POLICY IF EXISTS "Users can insert own quizzes" ON quizzes;
DROP POLICY IF EXISTS "Users can update own quizzes" ON quizzes;
DROP POLICY IF EXISTS "Users can delete own quizzes" ON quizzes;
DROP POLICY IF EXISTS "Public read for quizzes" ON quizzes;
DROP POLICY IF EXISTS "Authenticated users can write quizzes" ON quizzes;

CREATE POLICY "Users can view own quizzes" ON quizzes
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own quizzes" ON quizzes
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own quizzes" ON quizzes
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own quizzes" ON quizzes
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Update RLS policies for user_progress table
DROP POLICY IF EXISTS "Users can view own progress" ON user_progress;
DROP POLICY IF EXISTS "Users can insert own progress" ON user_progress;
DROP POLICY IF EXISTS "Users can update own progress" ON user_progress;
DROP POLICY IF EXISTS "Public read for user_progress" ON user_progress;
DROP POLICY IF EXISTS "Authenticated users can write user_progress" ON user_progress;

CREATE POLICY "Users can view own progress" ON user_progress
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress" ON user_progress
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress" ON user_progress
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);