-- Create project_completions table to track which projects users have completed
CREATE TABLE IF NOT EXISTS project_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  example_text text NOT NULL,
  difficulty text NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  completed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, example_text)
);

-- Create user_badges table to store earned badges
CREATE TABLE IF NOT EXISTS user_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  badge_level text NOT NULL CHECK (badge_level IN ('beginner', 'intermediate', 'advanced')),
  earned_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_level)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_project_completions_user_id ON project_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_project_completions_difficulty ON project_completions(difficulty);
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON user_badges(user_id);

-- Enable RLS
ALTER TABLE project_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

-- Policies for project_completions
CREATE POLICY "Users can view their own completions" ON project_completions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own completions" ON project_completions
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Policies for user_badges
CREATE POLICY "Users can view their own badges" ON user_badges
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can view all badges for public display" ON user_badges
  FOR SELECT TO authenticated USING (true);