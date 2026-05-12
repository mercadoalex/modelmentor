/**
 * Workshop Integration Hook
 * 
 * Integrates the Feature Engineering Workshop with:
 * - tutorialService (for persisting tutorial progress)
 * - gamificationService (for badges and achievements)
 */

import { useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { tutorialService } from '@/services/tutorialService';
import { gamificationService } from '@/services/gamificationService';
import { toast } from 'sonner';

// Workshop-specific achievement IDs
const WORKSHOP_ACHIEVEMENTS = {
  FIRST_TRANSFORMATION: 'workshop_first_transform',
  FIVE_TRANSFORMATIONS: 'workshop_five_transforms',
  TEN_TRANSFORMATIONS: 'workshop_ten_transforms',
  FEATURE_EXPLORER: 'workshop_feature_explorer',
  TUTORIAL_BEGINNER: 'workshop_tutorial_beginner',
  TUTORIAL_INTERMEDIATE: 'workshop_tutorial_intermediate',
  TUTORIAL_MASTER: 'workshop_tutorial_master',
  IMPROVEMENT_SEEKER: 'workshop_improvement_seeker',
} as const;

// Workshop tutorial IDs (prefixed for uniqueness)
const WORKSHOP_TUTORIAL_PREFIX = 'fe-workshop-';

export interface WorkshopIntegrationResult {
  // Tutorial integration
  startWorkshopTutorial: (tutorialId: string) => Promise<void>;
  updateTutorialProgress: (tutorialId: string, step: number) => Promise<void>;
  completeWorkshopTutorial: (tutorialId: string) => Promise<void>;
  getCompletedTutorials: () => Promise<string[]>;
  
  // Achievement integration
  checkTransformationAchievements: (count: number) => Promise<void>;
  checkExplorationAchievements: (featureTypesExplored: string[]) => Promise<void>;
  checkTutorialAchievements: (completedCount: number) => Promise<void>;
  checkImprovementAchievements: (improvement: number) => Promise<void>;
  
  // Combined tracking
  recordWorkshopActivity: () => Promise<void>;
}

export function useWorkshopIntegration(): WorkshopIntegrationResult {
  const { user } = useAuth();
  const userId = user?.id;

  // ─────────────────────────────────────────────────────────────────────────
  // Tutorial Integration
  // ─────────────────────────────────────────────────────────────────────────

  const startWorkshopTutorial = useCallback(async (tutorialId: string) => {
    if (!userId) return;
    
    const fullTutorialId = `${WORKSHOP_TUTORIAL_PREFIX}${tutorialId}`;
    try {
      await tutorialService.startTutorial(userId, fullTutorialId);
    } catch (error) {
      console.error('Failed to start workshop tutorial:', error);
    }
  }, [userId]);

  const updateTutorialProgress = useCallback(async (tutorialId: string, step: number) => {
    if (!userId) return;
    
    const fullTutorialId = `${WORKSHOP_TUTORIAL_PREFIX}${tutorialId}`;
    try {
      await tutorialService.updateProgress(userId, fullTutorialId, step);
    } catch (error) {
      console.error('Failed to update tutorial progress:', error);
    }
  }, [userId]);

  const completeWorkshopTutorial = useCallback(async (tutorialId: string) => {
    if (!userId) return;
    
    const fullTutorialId = `${WORKSHOP_TUTORIAL_PREFIX}${tutorialId}`;
    try {
      await tutorialService.completeTutorial(userId, fullTutorialId);
      
      // Also record in gamification service
      await gamificationService.recordWorkshopCompletion(userId, fullTutorialId);
      
      toast.success('Tutorial Completed!', {
        description: 'Great job! You\'ve earned points for completing this tutorial.',
      });
    } catch (error) {
      console.error('Failed to complete workshop tutorial:', error);
    }
  }, [userId]);

  const getCompletedTutorials = useCallback(async (): Promise<string[]> => {
    if (!userId) return [];
    
    try {
      const tutorials = await tutorialService.getAllTutorials(userId);
      return tutorials
        .filter(t => t.status === 'completed' && t.tutorial_id.startsWith(WORKSHOP_TUTORIAL_PREFIX))
        .map(t => t.tutorial_id.replace(WORKSHOP_TUTORIAL_PREFIX, ''));
    } catch (error) {
      console.error('Failed to get completed tutorials:', error);
      return [];
    }
  }, [userId]);

  // ─────────────────────────────────────────────────────────────────────────
  // Achievement Integration
  // ─────────────────────────────────────────────────────────────────────────

  const checkTransformationAchievements = useCallback(async (count: number) => {
    if (!userId) return;
    
    try {
      if (count === 1) {
        const result = await gamificationService.unlockAchievement(userId, WORKSHOP_ACHIEVEMENTS.FIRST_TRANSFORMATION);
        if (result.unlocked) {
          toast.success('Achievement Unlocked!', {
            description: '🎯 First Steps - Applied your first transformation!',
          });
        }
      } else if (count === 5) {
        const result = await gamificationService.unlockAchievement(userId, WORKSHOP_ACHIEVEMENTS.FIVE_TRANSFORMATIONS);
        if (result.unlocked) {
          toast.success('Achievement Unlocked!', {
            description: '🚀 Getting Started - Applied 5 transformations!',
          });
        }
      } else if (count === 10) {
        const result = await gamificationService.unlockAchievement(userId, WORKSHOP_ACHIEVEMENTS.TEN_TRANSFORMATIONS);
        if (result.unlocked) {
          toast.success('Achievement Unlocked!', {
            description: '👑 Transformation Pro - Applied 10 transformations!',
          });
        }
      }
    } catch (error) {
      console.error('Failed to check transformation achievements:', error);
    }
  }, [userId]);

  const checkExplorationAchievements = useCallback(async (featureTypesExplored: string[]) => {
    if (!userId) return;
    
    try {
      if (featureTypesExplored.length >= 3) {
        const result = await gamificationService.unlockAchievement(userId, WORKSHOP_ACHIEVEMENTS.FEATURE_EXPLORER);
        if (result.unlocked) {
          toast.success('Achievement Unlocked!', {
            description: '🗺️ Feature Explorer - Explored all feature types!',
          });
        }
      }
    } catch (error) {
      console.error('Failed to check exploration achievements:', error);
    }
  }, [userId]);

  const checkTutorialAchievements = useCallback(async (completedCount: number) => {
    if (!userId) return;
    
    try {
      if (completedCount === 1) {
        const result = await gamificationService.unlockAchievement(userId, WORKSHOP_ACHIEVEMENTS.TUTORIAL_BEGINNER);
        if (result.unlocked) {
          toast.success('Achievement Unlocked!', {
            description: '📚 Eager Learner - Completed your first tutorial!',
          });
        }
      } else if (completedCount === 3) {
        const result = await gamificationService.unlockAchievement(userId, WORKSHOP_ACHIEVEMENTS.TUTORIAL_INTERMEDIATE);
        if (result.unlocked) {
          toast.success('Achievement Unlocked!', {
            description: '🎓 Knowledge Seeker - Completed 3 tutorials!',
          });
        }
      } else if (completedCount === 6) {
        const result = await gamificationService.unlockAchievement(userId, WORKSHOP_ACHIEVEMENTS.TUTORIAL_MASTER);
        if (result.unlocked) {
          toast.success('Achievement Unlocked!', {
            description: '🏆 Tutorial Master - Completed all tutorials!',
          });
        }
      }
    } catch (error) {
      console.error('Failed to check tutorial achievements:', error);
    }
  }, [userId]);

  const checkImprovementAchievements = useCallback(async (improvement: number) => {
    if (!userId) return;
    
    try {
      // Check if cumulative improvement exceeds 10%
      if (improvement >= 0.10) {
        const result = await gamificationService.unlockAchievement(userId, WORKSHOP_ACHIEVEMENTS.IMPROVEMENT_SEEKER);
        if (result.unlocked) {
          toast.success('Achievement Unlocked!', {
            description: '📈 Improvement Seeker - Achieved 10%+ cumulative improvement!',
          });
        }
      }
    } catch (error) {
      console.error('Failed to check improvement achievements:', error);
    }
  }, [userId]);

  // ─────────────────────────────────────────────────────────────────────────
  // Combined Tracking
  // ─────────────────────────────────────────────────────────────────────────

  const recordWorkshopActivity = useCallback(async () => {
    if (!userId) return;
    
    try {
      // Update streak
      await gamificationService.updateStreak(userId);
      
      // Add points for workshop activity
      await gamificationService.addPoints(userId, 10);
    } catch (error) {
      console.error('Failed to record workshop activity:', error);
    }
  }, [userId]);

  return {
    startWorkshopTutorial,
    updateTutorialProgress,
    completeWorkshopTutorial,
    getCompletedTutorials,
    checkTransformationAchievements,
    checkExplorationAchievements,
    checkTutorialAchievements,
    checkImprovementAchievements,
    recordWorkshopActivity,
  };
}

export { WORKSHOP_ACHIEVEMENTS, WORKSHOP_TUTORIAL_PREFIX };
