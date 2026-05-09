ALTER TABLE user_tutorials ADD CONSTRAINT user_tutorials_user_id_tutorial_id_key UNIQUE (user_id, tutorial_id);
