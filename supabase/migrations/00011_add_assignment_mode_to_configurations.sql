-- Add assignment fields to sandbox_configurations table
ALTER TABLE sandbox_configurations
ADD COLUMN IF NOT EXISTS is_assignment boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS assignment_title text,
ADD COLUMN IF NOT EXISTS assignment_instructions text,
ADD COLUMN IF NOT EXISTS assignment_due_date timestamptz,
ADD COLUMN IF NOT EXISTS notify_students boolean NOT NULL DEFAULT false;

-- Create assignment_completions table
CREATE TABLE IF NOT EXISTS assignment_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  configuration_id uuid NOT NULL REFERENCES sandbox_configurations(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  viewed_at timestamptz,
  loaded_at timestamptz,
  completed_at timestamptz,
  time_spent_seconds integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT unique_assignment_per_student UNIQUE (configuration_id, student_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_assignment_completions_config_id ON assignment_completions(configuration_id);
CREATE INDEX IF NOT EXISTS idx_assignment_completions_student_id ON assignment_completions(student_id);
CREATE INDEX IF NOT EXISTS idx_assignment_completions_completed_at ON assignment_completions(completed_at);
CREATE INDEX IF NOT EXISTS idx_sandbox_configs_is_assignment ON sandbox_configurations(is_assignment);

-- Enable RLS
ALTER TABLE assignment_completions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for assignment_completions
CREATE POLICY "Students can view their own completions"
  ON assignment_completions FOR SELECT
  TO authenticated
  USING (auth.uid() = student_id);

CREATE POLICY "Teachers can view completions for their assignments"
  ON assignment_completions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM sandbox_configurations
      WHERE sandbox_configurations.id = assignment_completions.configuration_id
      AND sandbox_configurations.user_id = auth.uid()
    )
  );

CREATE POLICY "Students can insert their own completions"
  ON assignment_completions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can update their own completions"
  ON assignment_completions FOR UPDATE
  TO authenticated
  USING (auth.uid() = student_id)
  WITH CHECK (auth.uid() = student_id);