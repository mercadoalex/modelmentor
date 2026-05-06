-- Create student_activity table to track all student actions
CREATE TABLE IF NOT EXISTS student_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  activity_type text NOT NULL CHECK (activity_type IN ('project_created', 'quiz_completed', 'training_completed', 'concept_viewed')),
  activity_data jsonb,
  duration_seconds integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create concept_mastery table to track student understanding of ML concepts
CREATE TABLE IF NOT EXISTS concept_mastery (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  concept_name text NOT NULL CHECK (concept_name IN ('gradient_descent', 'overfitting', 'bias_variance', 'regularization', 'model_evaluation')),
  mastery_score integer NOT NULL CHECK (mastery_score >= 0 AND mastery_score <= 100),
  attempts integer NOT NULL DEFAULT 1,
  last_attempt_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, concept_name)
);

-- Create quiz_results table to store quiz performance
CREATE TABLE IF NOT EXISTS quiz_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  concept_name text NOT NULL,
  question_id text NOT NULL,
  is_correct boolean NOT NULL,
  answer_given text,
  time_spent_seconds integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create at_risk_alerts table for flagging struggling students
CREATE TABLE IF NOT EXISTS at_risk_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  concept_name text NOT NULL,
  alert_type text NOT NULL CHECK (alert_type IN ('low_score', 'extended_time', 'repeated_errors', 'no_activity')),
  severity text NOT NULL CHECK (severity IN ('low', 'medium', 'high')),
  is_resolved boolean NOT NULL DEFAULT false,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_student_activity_user_id ON student_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_student_activity_created_at ON student_activity(created_at);
CREATE INDEX IF NOT EXISTS idx_concept_mastery_user_id ON concept_mastery(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_results_user_id ON quiz_results(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_results_concept ON quiz_results(concept_name);
CREATE INDEX IF NOT EXISTS idx_at_risk_alerts_user_id ON at_risk_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_at_risk_alerts_resolved ON at_risk_alerts(is_resolved);

-- Enable RLS
ALTER TABLE student_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE concept_mastery ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE at_risk_alerts ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(uid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM profiles p
    WHERE p.id = uid AND p.role = 'admin'
  );
$$;

-- Policies for student_activity
CREATE POLICY "Users can view their own activity" ON student_activity
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own activity" ON student_activity
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all activity" ON student_activity
  FOR SELECT TO authenticated USING (is_admin(auth.uid()));

-- Policies for concept_mastery
CREATE POLICY "Users can view their own mastery" ON concept_mastery
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own mastery" ON concept_mastery
  FOR ALL TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all mastery" ON concept_mastery
  FOR SELECT TO authenticated USING (is_admin(auth.uid()));

-- Policies for quiz_results
CREATE POLICY "Users can view their own quiz results" ON quiz_results
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own quiz results" ON quiz_results
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all quiz results" ON quiz_results
  FOR SELECT TO authenticated USING (is_admin(auth.uid()));

-- Policies for at_risk_alerts
CREATE POLICY "Admins can manage all alerts" ON at_risk_alerts
  FOR ALL TO authenticated USING (is_admin(auth.uid()));