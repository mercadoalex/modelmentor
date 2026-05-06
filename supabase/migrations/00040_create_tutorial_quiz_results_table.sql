-- Create tutorial_quiz_results table to track tutorial quiz attempts and scores
CREATE TABLE IF NOT EXISTS tutorial_quiz_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tutorial_id TEXT NOT NULL,
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  total_questions INTEGER NOT NULL,
  correct_answers INTEGER NOT NULL,
  answers JSONB DEFAULT '[]',
  passed BOOLEAN NOT NULL DEFAULT false,
  time_taken INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_tutorial_quiz_results_user_id ON tutorial_quiz_results(user_id);
CREATE INDEX IF NOT EXISTS idx_tutorial_quiz_results_tutorial_id ON tutorial_quiz_results(tutorial_id);
CREATE INDEX IF NOT EXISTS idx_tutorial_quiz_results_passed ON tutorial_quiz_results(passed);

-- Enable RLS
ALTER TABLE tutorial_quiz_results ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own tutorial quiz results"
  ON tutorial_quiz_results
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tutorial quiz results"
  ON tutorial_quiz_results
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_tutorial_quiz_results_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER tutorial_quiz_results_updated_at
  BEFORE UPDATE ON tutorial_quiz_results
  FOR EACH ROW
  EXECUTE FUNCTION update_tutorial_quiz_results_updated_at();