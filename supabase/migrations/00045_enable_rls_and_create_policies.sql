-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE colleges ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_generation_history ENABLE ROW LEVEL SECURITY;

-- Organizations policies (public read, authenticated write)
CREATE POLICY "Anyone can view organizations" ON organizations FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create organizations" ON organizations FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update organizations" ON organizations FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete organizations" ON organizations FOR DELETE USING (auth.uid() IS NOT NULL);

-- Colleges policies (public read, authenticated write)
CREATE POLICY "Anyone can view colleges" ON colleges FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create colleges" ON colleges FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update colleges" ON colleges FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete colleges" ON colleges FOR DELETE USING (auth.uid() IS NOT NULL);

-- Groups policies (public read, authenticated write)
CREATE POLICY "Anyone can view groups" ON groups FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create groups" ON groups FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update groups" ON groups FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete groups" ON groups FOR DELETE USING (auth.uid() IS NOT NULL);

-- Group members policies (members can view, authenticated can manage)
CREATE POLICY "Anyone can view group members" ON group_members FOR SELECT USING (true);
CREATE POLICY "Authenticated users can add group members" ON group_members FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can remove group members" ON group_members FOR DELETE USING (auth.uid() IS NOT NULL);

-- Quizzes policies (users can manage their own quizzes)
CREATE POLICY "Users can view their own quizzes" ON quizzes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own quizzes" ON quizzes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own quizzes" ON quizzes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own quizzes" ON quizzes FOR DELETE USING (auth.uid() = user_id);

-- User progress policies (users can manage their own progress)
CREATE POLICY "Users can view their own progress" ON user_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own progress" ON user_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own progress" ON user_progress FOR UPDATE USING (auth.uid() = user_id);

-- Generated questions policies (public read, authenticated write)
CREATE POLICY "Anyone can view approved questions" ON generated_questions FOR SELECT USING (status = 'approved' OR auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can create questions" ON generated_questions FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update questions" ON generated_questions FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete questions" ON generated_questions FOR DELETE USING (auth.uid() IS NOT NULL);

-- Question generation history policies (users can view their own history)
CREATE POLICY "Users can view their own generation history" ON question_generation_history FOR SELECT USING (auth.uid() = created_by OR auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can create generation history" ON question_generation_history FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);