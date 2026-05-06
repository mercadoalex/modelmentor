-- Create user role enum
CREATE TYPE public.user_role AS ENUM ('user', 'admin');

-- Create model type enum
CREATE TYPE public.model_type AS ENUM ('image_classification', 'text_classification', 'regression');

-- Create project status enum
CREATE TYPE public.project_status AS ENUM ('draft', 'data_collection', 'learning', 'training', 'testing', 'completed');

-- Create profiles table
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  username text UNIQUE,
  role public.user_role NOT NULL DEFAULT 'user'::public.user_role,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create user_tries table to track usage before registration
CREATE TABLE public.user_tries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  session_id text NOT NULL,
  tries_count int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(session_id)
);

-- Create projects table
CREATE TABLE public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  session_id text,
  title text NOT NULL,
  description text NOT NULL,
  model_type public.model_type NOT NULL,
  status public.project_status NOT NULL DEFAULT 'draft'::public.project_status,
  is_guided_tour boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create sample_datasets table
CREATE TABLE public.sample_datasets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  model_type public.model_type NOT NULL,
  data_url text,
  preview_image text,
  sample_count int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create datasets table
CREATE TABLE public.datasets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  sample_dataset_id uuid REFERENCES public.sample_datasets(id) ON DELETE SET NULL,
  file_urls text[] NOT NULL DEFAULT '{}',
  labels text[] NOT NULL DEFAULT '{}',
  sample_count int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create training_sessions table
CREATE TABLE public.training_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  dataset_id uuid NOT NULL REFERENCES public.datasets(id) ON DELETE CASCADE,
  epochs int NOT NULL DEFAULT 10,
  current_epoch int NOT NULL DEFAULT 0,
  accuracy numeric(5,2),
  loss numeric(10,6),
  metrics jsonb,
  status text NOT NULL DEFAULT 'pending',
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create test_results table
CREATE TABLE public.test_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  training_session_id uuid NOT NULL REFERENCES public.training_sessions(id) ON DELETE CASCADE,
  test_data jsonb NOT NULL,
  predictions jsonb NOT NULL,
  confusion_matrix jsonb,
  accuracy numeric(5,2),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create storage bucket for images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('model-images', 'model-images', true);

-- Storage policies for model-images bucket
CREATE POLICY "Anyone can view images" ON storage.objects
  FOR SELECT TO public USING (bucket_id = 'model-images');

CREATE POLICY "Authenticated users can upload images" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'model-images');

CREATE POLICY "Users can update their own images" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'model-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own images" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'model-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION public.has_role(uid uuid, role_name text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = uid AND p.role = role_name::public.user_role
  );
$$;

-- Profiles RLS policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins have full access to profiles" ON public.profiles
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id)
  WITH CHECK (role = (SELECT role FROM public.profiles WHERE id = auth.uid()));

-- User tries RLS policies
ALTER TABLE public.user_tries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own tries" ON public.user_tries
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tries" ON public.user_tries
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tries" ON public.user_tries
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Anonymous users can view tries by session" ON public.user_tries
  FOR SELECT TO anon USING (true);

CREATE POLICY "Anonymous users can insert tries" ON public.user_tries
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Anonymous users can update tries by session" ON public.user_tries
  FOR UPDATE TO anon USING (true);

-- Projects RLS policies
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own projects" ON public.projects
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can create projects" ON public.projects
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects" ON public.projects
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects" ON public.projects
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Anonymous users can view projects by session" ON public.projects
  FOR SELECT TO anon USING (true);

CREATE POLICY "Anonymous users can create projects" ON public.projects
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Anonymous users can update projects by session" ON public.projects
  FOR UPDATE TO anon USING (true);

-- Sample datasets RLS policies
ALTER TABLE public.sample_datasets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view sample datasets" ON public.sample_datasets
  FOR SELECT TO public USING (true);

CREATE POLICY "Admins can manage sample datasets" ON public.sample_datasets
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Datasets RLS policies
ALTER TABLE public.datasets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view datasets for their projects" ON public.datasets
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create datasets for their projects" ON public.datasets
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update datasets for their projects" ON public.datasets
  FOR UPDATE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Anonymous users can view datasets" ON public.datasets
  FOR SELECT TO anon USING (true);

CREATE POLICY "Anonymous users can create datasets" ON public.datasets
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Anonymous users can update datasets" ON public.datasets
  FOR UPDATE TO anon USING (true);

-- Training sessions RLS policies
ALTER TABLE public.training_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view training sessions for their projects" ON public.training_sessions
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create training sessions for their projects" ON public.training_sessions
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update training sessions for their projects" ON public.training_sessions
  FOR UPDATE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Anonymous users can view training sessions" ON public.training_sessions
  FOR SELECT TO anon USING (true);

CREATE POLICY "Anonymous users can create training sessions" ON public.training_sessions
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Anonymous users can update training sessions" ON public.training_sessions
  FOR UPDATE TO anon USING (true);

-- Test results RLS policies
ALTER TABLE public.test_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view test results for their projects" ON public.test_results
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.training_sessions ts
      JOIN public.projects p ON p.id = ts.project_id
      WHERE ts.id = training_session_id AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create test results for their projects" ON public.test_results
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.training_sessions ts
      JOIN public.projects p ON p.id = ts.project_id
      WHERE ts.id = training_session_id AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Anonymous users can view test results" ON public.test_results
  FOR SELECT TO anon USING (true);

CREATE POLICY "Anonymous users can create test results" ON public.test_results
  FOR INSERT TO anon WITH CHECK (true);

-- Trigger function for new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  user_count int;
BEGIN
  SELECT COUNT(*) INTO user_count FROM public.profiles;
  
  INSERT INTO public.profiles (id, email, username, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    CASE WHEN user_count = 0 THEN 'admin'::public.user_role ELSE 'user'::public.user_role END
  );
  
  RETURN NEW;
END;
$$;

-- Trigger for user registration
CREATE TRIGGER on_auth_user_confirmed
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (OLD.confirmed_at IS NULL AND NEW.confirmed_at IS NOT NULL)
  EXECUTE FUNCTION public.handle_new_user();

-- Insert sample datasets
INSERT INTO public.sample_datasets (name, description, model_type, sample_count) VALUES
  ('Fruit Ripeness', 'Dataset for classifying fruits as ripe or unripe', 'image_classification', 100),
  ('Animal Classification', 'Dataset for classifying different animals', 'image_classification', 150),
  ('Sentiment Analysis', 'Dataset for analyzing text sentiment (positive/negative)', 'text_classification', 200),
  ('Spam Detection', 'Dataset for detecting spam messages', 'text_classification', 250),
  ('House Price Prediction', 'Dataset for predicting house prices based on features', 'regression', 300),
  ('Temperature Forecasting', 'Dataset for forecasting temperature', 'regression', 180);