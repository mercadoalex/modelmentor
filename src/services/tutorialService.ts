import { supabase } from '@/db/supabase';

export interface UserTutorial {
  id: string;
  user_id: string;
  tutorial_id: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'skipped';
  progress: Record<string, unknown>;
  started_at: string | null;
  completed_at: string | null;
  last_step: number;
  created_at: string;
  updated_at: string;
}

export const tutorialService = {
  /**
   * Get tutorial progress for a user
   */
  async getTutorialProgress(userId: string, tutorialId: string): Promise<UserTutorial | null> {
    const { data, error } = await supabase
      .from('user_tutorials')
      .select('*')
      .eq('user_id', userId)
      .eq('tutorial_id', tutorialId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching tutorial progress:', error);
      return null;
    }

    return data;
  },

  /**
   * Get all tutorials for a user
   */
  async getAllTutorials(userId: string): Promise<UserTutorial[]> {
    const { data, error } = await supabase
      .from('user_tutorials')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching tutorials:', error);
      return [];
    }

    return data || [];
  },

  /**
   * Start a tutorial
   */
  async startTutorial(userId: string, tutorialId: string): Promise<UserTutorial | null> {
    const existing = await this.getTutorialProgress(userId, tutorialId);

    if (existing) {
      // Update existing
      const { data, error } = await supabase
        .from('user_tutorials')
        .update({
          status: 'in_progress',
          started_at: existing.started_at || new Date().toISOString(),
          last_step: 0,
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating tutorial:', error);
        return null;
      }

      return data;
    } else {
      // Create new
      const { data, error } = await supabase
        .from('user_tutorials')
        .insert({
          user_id: userId,
          tutorial_id: tutorialId,
          status: 'in_progress',
          started_at: new Date().toISOString(),
          last_step: 0,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating tutorial:', error);
        return null;
      }

      return data;
    }
  },

  /**
   * Update tutorial progress
   */
  async updateProgress(
    userId: string,
    tutorialId: string,
    lastStep: number,
    progress?: Record<string, unknown>
  ): Promise<boolean> {
    const existing = await this.getTutorialProgress(userId, tutorialId);

    if (!existing) {
      await this.startTutorial(userId, tutorialId);
    }

    const { error } = await supabase
      .from('user_tutorials')
      .update({
        last_step: lastStep,
        progress: progress || {},
      })
      .eq('user_id', userId)
      .eq('tutorial_id', tutorialId);

    if (error) {
      console.error('Error updating tutorial progress:', error);
      return false;
    }

    return true;
  },

  /**
   * Complete a tutorial
   */
  async completeTutorial(userId: string, tutorialId: string): Promise<boolean> {
    const { error } = await supabase
      .from('user_tutorials')
      .upsert({
        user_id: userId,
        tutorial_id: tutorialId,
        status: 'completed',
        completed_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,tutorial_id',
      });

    if (error) {
      console.error('Error completing tutorial:', error);
      return false;
    }

    return true;
  },

  /**
   * Skip a tutorial
   */
  async skipTutorial(userId: string, tutorialId: string): Promise<boolean> {
    const { error } = await supabase
      .from('user_tutorials')
      .upsert({
        user_id: userId,
        tutorial_id: tutorialId,
        status: 'skipped',
      }, {
        onConflict: 'user_id,tutorial_id',
      });

    if (error) {
      console.error('Error skipping tutorial:', error);
      return false;
    }

    return true;
  },

  /**
   * Check if user has completed onboarding
   */
  async hasCompletedOnboarding(userId: string): Promise<boolean> {
    const tutorial = await this.getTutorialProgress(userId, 'welcome-onboarding');
    return tutorial?.status === 'completed' || tutorial?.status === 'skipped';
  },

  /**
   * Reset tutorial progress
   */
  async resetTutorial(userId: string, tutorialId: string): Promise<boolean> {
    const { error } = await supabase
      .from('user_tutorials')
      .update({
        status: 'not_started',
        last_step: 0,
        started_at: null,
        completed_at: null,
        progress: {},
      })
      .eq('user_id', userId)
      .eq('tutorial_id', tutorialId);

    if (error) {
      console.error('Error resetting tutorial:', error);
      return false;
    }

    return true;
  },
};
