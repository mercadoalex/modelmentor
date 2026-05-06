-- Create project_collaborators table
CREATE TABLE IF NOT EXISTS project_collaborators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'editor', 'viewer')),
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  UNIQUE(project_id, user_id)
);

-- Create shared_experiments table
CREATE TABLE IF NOT EXISTS shared_experiments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  training_session_id UUID REFERENCES training_sessions(id) ON DELETE CASCADE,
  model_version_id UUID REFERENCES model_versions(id) ON DELETE CASCADE,
  shared_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  metrics JSONB,
  config JSONB,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create experiment_comments table
CREATE TABLE IF NOT EXISTS experiment_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_id UUID NOT NULL REFERENCES shared_experiments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  parent_comment_id UUID REFERENCES experiment_comments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create collaboration_activity table
CREATE TABLE IF NOT EXISTS collaboration_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('experiment_shared', 'comment_added', 'collaborator_added', 'model_updated', 'dataset_updated')),
  activity_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_project_collaborators_project ON project_collaborators(project_id);
CREATE INDEX IF NOT EXISTS idx_project_collaborators_user ON project_collaborators(user_id);
CREATE INDEX IF NOT EXISTS idx_shared_experiments_project ON shared_experiments(project_id);
CREATE INDEX IF NOT EXISTS idx_shared_experiments_shared_by ON shared_experiments(shared_by);
CREATE INDEX IF NOT EXISTS idx_experiment_comments_experiment ON experiment_comments(experiment_id);
CREATE INDEX IF NOT EXISTS idx_collaboration_activity_project ON collaboration_activity(project_id);
CREATE INDEX IF NOT EXISTS idx_collaboration_activity_created ON collaboration_activity(created_at DESC);

-- Enable RLS
ALTER TABLE project_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE experiment_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE collaboration_activity ENABLE ROW LEVEL SECURITY;

-- RLS Policies for project_collaborators
CREATE POLICY "Users can view collaborators of their projects"
  ON project_collaborators FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid() OR session_id::text = auth.uid()::text
    ) OR user_id = auth.uid()
  );

CREATE POLICY "Project owners can manage collaborators"
  ON project_collaborators FOR ALL
  USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid() OR session_id::text = auth.uid()::text
    )
  );

-- RLS Policies for shared_experiments
CREATE POLICY "Users can view shared experiments in their projects"
  ON shared_experiments FOR SELECT
  USING (
    is_public = true OR
    project_id IN (
      SELECT project_id FROM project_collaborators 
      WHERE user_id = auth.uid() AND status = 'accepted'
    ) OR
    shared_by = auth.uid()
  );

CREATE POLICY "Collaborators can create shared experiments"
  ON shared_experiments FOR INSERT
  WITH CHECK (
    project_id IN (
      SELECT project_id FROM project_collaborators 
      WHERE user_id = auth.uid() AND status = 'accepted' AND role IN ('owner', 'editor')
    )
  );

CREATE POLICY "Users can update their own shared experiments"
  ON shared_experiments FOR UPDATE
  USING (shared_by = auth.uid());

CREATE POLICY "Users can delete their own shared experiments"
  ON shared_experiments FOR DELETE
  USING (shared_by = auth.uid());

-- RLS Policies for experiment_comments
CREATE POLICY "Users can view comments on accessible experiments"
  ON experiment_comments FOR SELECT
  USING (
    experiment_id IN (
      SELECT id FROM shared_experiments 
      WHERE is_public = true OR
      project_id IN (
        SELECT project_id FROM project_collaborators 
        WHERE user_id = auth.uid() AND status = 'accepted'
      ) OR
      shared_by = auth.uid()
    )
  );

CREATE POLICY "Collaborators can add comments"
  ON experiment_comments FOR INSERT
  WITH CHECK (
    experiment_id IN (
      SELECT id FROM shared_experiments 
      WHERE project_id IN (
        SELECT project_id FROM project_collaborators 
        WHERE user_id = auth.uid() AND status = 'accepted'
      )
    )
  );

CREATE POLICY "Users can update their own comments"
  ON experiment_comments FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own comments"
  ON experiment_comments FOR DELETE
  USING (user_id = auth.uid());

-- RLS Policies for collaboration_activity
CREATE POLICY "Users can view activity in their projects"
  ON collaboration_activity FOR SELECT
  USING (
    project_id IN (
      SELECT project_id FROM project_collaborators 
      WHERE user_id = auth.uid() AND status = 'accepted'
    )
  );

CREATE POLICY "Users can create activity in their projects"
  ON collaboration_activity FOR INSERT
  WITH CHECK (
    project_id IN (
      SELECT project_id FROM project_collaborators 
      WHERE user_id = auth.uid() AND status = 'accepted'
    )
  );