ALTER TABLE shared_experiments ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id);
