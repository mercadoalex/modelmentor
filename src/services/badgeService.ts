import { supabase } from '@/db/supabase';
import type { ProjectCompletion, UserBadge, BadgeProgress, DifficultyLevel } from '@/types/types';

// Example counts per difficulty level (based on ProjectCreationPage data)
const EXAMPLE_COUNTS = {
  beginner: 9,
  intermediate: 10,
  advanced: 7
};

export const badgeService = {
  // Mark a project as completed
  async markProjectComplete(
    userId: string,
    projectId: string,
    exampleText: string,
    difficulty: DifficultyLevel
  ): Promise<{ success: boolean; badgeEarned?: DifficultyLevel }> {
    try {
      // Insert completion record
      const { error: insertError } = await supabase
        .from('project_completions')
        .insert({
          user_id: userId,
          project_id: projectId,
          example_text: exampleText,
          difficulty: difficulty
        });

      if (insertError) {
        // If duplicate, it's already completed
        if (insertError.code === '23505') {
          return { success: true };
        }
        throw insertError;
      }

      // Check if user has completed all examples for this difficulty level
      const { data: completions, error: countError } = await supabase
        .from('project_completions')
        .select('id')
        .eq('user_id', userId)
        .eq('difficulty', difficulty);

      if (countError) throw countError;

      const completedCount = completions?.length || 0;
      const requiredCount = EXAMPLE_COUNTS[difficulty];

      // If completed all examples, award badge
      if (completedCount >= requiredCount) {
        const { error: badgeError } = await supabase
          .from('user_badges')
          .insert({
            user_id: userId,
            badge_level: difficulty
          });

        // Ignore duplicate badge errors
        if (badgeError && badgeError.code !== '23505') {
          throw badgeError;
        }

        return { success: true, badgeEarned: difficulty };
      }

      return { success: true };
    } catch (error) {
      console.error('Error marking project complete:', error);
      return { success: false };
    }
  },

  // Get user's badge progress
  async getBadgeProgress(userId: string): Promise<BadgeProgress[]> {
    try {
      // Get all completions
      const { data: completions, error: completionsError } = await supabase
        .from('project_completions')
        .select('difficulty')
        .eq('user_id', userId);

      if (completionsError) throw completionsError;

      // Get earned badges
      const { data: badges, error: badgesError } = await supabase
        .from('user_badges')
        .select('*')
        .eq('user_id', userId);

      if (badgesError) throw badgesError;

      // Count completions by difficulty
      const completionCounts: Record<DifficultyLevel, number> = {
        beginner: 0,
        intermediate: 0,
        advanced: 0
      };

      completions?.forEach((completion: { difficulty: string }) => {
        completionCounts[completion.difficulty as DifficultyLevel]++;
      });

      // Build progress array
      const progress: BadgeProgress[] = [];
      const levels: DifficultyLevel[] = ['beginner', 'intermediate', 'advanced'];

      levels.forEach((level) => {
        const badge = badges?.find((b: { badge_level: string }) => b.badge_level === level);
        progress.push({
          level,
          totalExamples: EXAMPLE_COUNTS[level],
          completedExamples: completionCounts[level],
          isEarned: !!badge,
          earnedAt: badge?.earned_at
        });
      });

      return progress;
    } catch (error) {
      console.error('Error getting badge progress:', error);
      return [];
    }
  },

  // Get user's earned badges
  async getUserBadges(userId: string): Promise<UserBadge[]> {
    try {
      const { data, error } = await supabase
        .from('user_badges')
        .select('*')
        .eq('user_id', userId)
        .order('earned_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting user badges:', error);
      return [];
    }
  },

  // Check if user has completed a specific example
  async isExampleCompleted(userId: string, exampleText: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('project_completions')
        .select('id')
        .eq('user_id', userId)
        .eq('example_text', exampleText)
        .maybeSingle();

      if (error) throw error;
      return !!data;
    } catch (error) {
      console.error('Error checking example completion:', error);
      return false;
    }
  },

  // Award tutorial quiz badge
  async awardTutorialBadge(userId: string, tutorialId: string): Promise<boolean> {
    try {
      const badgeType = `tutorial_${tutorialId}`;
      
      // Check if badge already exists
      const { data: existing } = await supabase
        .from('user_badges')
        .select('id')
        .eq('user_id', userId)
        .eq('badge_type', badgeType)
        .maybeSingle();

      if (existing) {
        return true; // Already has badge
      }

      // Award badge
      const { error } = await supabase
        .from('user_badges')
        .insert({
          user_id: userId,
          badge_type: badgeType,
          earned_at: new Date().toISOString(),
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error awarding tutorial badge:', error);
      return false;
    }
  },

  // Get tutorial badges for user
  async getTutorialBadges(userId: string): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('user_badges')
        .select('badge_type')
        .eq('user_id', userId)
        .like('badge_type', 'tutorial_%');

      if (error) throw error;

      return (data || []).map(b => b.badge_type.replace('tutorial_', ''));
    } catch (error) {
      console.error('Error fetching tutorial badges:', error);
      return [];
    }
  },

  // Check if user has specific tutorial badge
  async hasTutorialBadge(userId: string, tutorialId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('user_badges')
        .select('id')
        .eq('user_id', userId)
        .eq('badge_type', `tutorial_${tutorialId}`)
        .maybeSingle();

      if (error) throw error;
      return !!data;
    } catch (error) {
      console.error('Error checking tutorial badge:', error);
      return false;
    }
  },
};
