/**
 * Gamification Service
 * Tracks student progress, achievements, and learning milestones
 */

import { supabase } from '@/lib/supabase';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  points: number;
  unlocked: boolean;
  unlockedAt?: Date;
  category: 'training' | 'exploration' | 'mastery' | 'special';
}

export interface LearningMilestone {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  completedAt?: Date;
  order: number;
}

export interface StudentProgress {
  level: number;
  totalPoints: number;
  pointsToNextLevel: number;
  achievements: Achievement[];
  completedMilestones: string[];
  currentStreak: number;
  longestStreak: number;
  modelsTrained: number;
  datasetsUploaded: number;
  workshopsCompleted: string[];
  lastActiveDate?: Date;
}

class GamificationService {
  private readonly POINTS_PER_LEVEL = 1000;
  private readonly STORAGE_KEY = 'modelmentor_progress';

  /**
   * Initialize or load student progress
   */
  async getProgress(userId: string): Promise<StudentProgress> {
    try {
      const { data, error } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching progress:', error);
        return this.getDefaultProgress();
      }

      if (!data) {
        return this.getDefaultProgress();
      }

      // Convert database format to StudentProgress
      return {
        level: data.level || 1,
        totalPoints: data.xp || 0,
        pointsToNextLevel: this.POINTS_PER_LEVEL - ((data.xp || 0) % this.POINTS_PER_LEVEL),
        achievements: Array.isArray(data.achievements) ? data.achievements : this.initializeAchievements(),
        completedMilestones: [],
        currentStreak: data.streak_days || 0,
        longestStreak: data.streak_days || 0,
        modelsTrained: 0,
        datasetsUploaded: 0,
        workshopsCompleted: [],
        lastActiveDate: data.last_activity_date ? new Date(data.last_activity_date) : new Date()
      };
    } catch (error) {
      console.error('Error in getProgress:', error);
      return this.getDefaultProgress();
    }
  }

  private getDefaultProgress(): StudentProgress {
    return {
      level: 1,
      totalPoints: 0,
      pointsToNextLevel: this.POINTS_PER_LEVEL,
      achievements: this.initializeAchievements(),
      completedMilestones: [],
      currentStreak: 0,
      longestStreak: 0,
      modelsTrained: 0,
      datasetsUploaded: 0,
      workshopsCompleted: [],
      lastActiveDate: new Date()
    };
  }

  /**
   * Save progress to database
   */
  async saveProgress(userId: string, progress: StudentProgress): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_progress')
        .upsert({
          user_id: userId,
          level: progress.level,
          xp: progress.totalPoints,
          achievements: progress.achievements,
          badges: [],
          streak_days: progress.currentStreak,
          last_activity_date: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('Error saving progress:', error);
      }
    } catch (error) {
      console.error('Error in saveProgress:', error);
    }
  }

  /**
   * Add points and check for level up
   */
  async addPoints(userId: string, points: number): Promise<{ leveledUp: boolean; newLevel?: number; progress: StudentProgress }> {
    const progress = await this.getProgress(userId);
    progress.totalPoints += points;

    let leveledUp = false;
    let newLevel = progress.level;

    while (progress.totalPoints >= progress.level * this.POINTS_PER_LEVEL) {
      progress.level++;
      leveledUp = true;
      newLevel = progress.level;
    }

    progress.pointsToNextLevel = (progress.level * this.POINTS_PER_LEVEL) - progress.totalPoints;
    await this.saveProgress(userId, progress);

    return { leveledUp, newLevel, progress };
  }

  /**
   * Unlock achievement
   */
  async unlockAchievement(userId: string, achievementId: string): Promise<{ unlocked: boolean; achievement?: Achievement; progress: StudentProgress }> {
    const progress = await this.getProgress(userId);
    const achievement = progress.achievements.find(a => a.id === achievementId);

    if (!achievement || achievement.unlocked) {
      return { unlocked: false, progress };
    }

    achievement.unlocked = true;
    achievement.unlockedAt = new Date();
    
    // Add points for achievement
    const result = await this.addPoints(userId, achievement.points);

    return { unlocked: true, achievement, progress: result.progress };
  }

  /**
   * Complete milestone
   */
  async completeMilestone(userId: string, milestoneId: string): Promise<StudentProgress> {
    const progress = await this.getProgress(userId);
    
    if (!progress.completedMilestones.includes(milestoneId)) {
      progress.completedMilestones.push(milestoneId);
      await this.addPoints(userId, 100); // Bonus points for milestone
    }

    await this.saveProgress(userId, progress);
    return progress;
  }

  /**
   * Record model training
   */
  async recordModelTraining(userId: string, accuracy: number): Promise<{ achievements: Achievement[]; progress: StudentProgress }> {
    const progress = await this.getProgress(userId);
    progress.modelsTrained++;

    const newAchievements: Achievement[] = [];

    // Check for training achievements
    if (progress.modelsTrained === 1) {
      const result = await this.unlockAchievement(userId, 'first_model');
      if (result.unlocked && result.achievement) {
        newAchievements.push(result.achievement);
      }
    } else if (progress.modelsTrained === 10) {
      const result = await this.unlockAchievement(userId, 'model_enthusiast');
      if (result.unlocked && result.achievement) {
        newAchievements.push(result.achievement);
      }
    } else if (progress.modelsTrained === 50) {
      const result = await this.unlockAchievement(userId, 'model_master');
      if (result.unlocked && result.achievement) {
        newAchievements.push(result.achievement);
      }
    }

    // Check for accuracy achievements
    if (accuracy >= 0.95) {
      const result = await this.unlockAchievement(userId, 'accuracy_expert');
      if (result.unlocked && result.achievement) {
        newAchievements.push(result.achievement);
      }
    }

    // Add points for training
    await this.addPoints(userId, 50);

    await this.saveProgress(userId, progress);
    return { achievements: newAchievements, progress };
  }

  /**
   * Record dataset upload
   */
  async recordDatasetUpload(userId: string): Promise<StudentProgress> {
    const progress = await this.getProgress(userId);
    progress.datasetsUploaded++;

    if (progress.datasetsUploaded === 1) {
      await this.unlockAchievement(userId, 'data_collector');
    }

    await this.addPoints(userId, 25);
    await this.saveProgress(userId, progress);
    return progress;
  }

  /**
   * Record workshop completion
   */
  async recordWorkshopCompletion(userId: string, workshopId: string): Promise<{ achievements: Achievement[]; progress: StudentProgress }> {
    const progress = await this.getProgress(userId);
    
    if (!progress.workshopsCompleted.includes(workshopId)) {
      progress.workshopsCompleted.push(workshopId);
      await this.addPoints(userId, 100);
    }

    const newAchievements: Achievement[] = [];

    // Check for exploration achievements
    if (progress.workshopsCompleted.length === 3) {
      const result = await this.unlockAchievement(userId, 'explorer');
      if (result.unlocked && result.achievement) {
        newAchievements.push(result.achievement);
      }
    } else if (progress.workshopsCompleted.length === 10) {
      const result = await this.unlockAchievement(userId, 'knowledge_seeker');
      if (result.unlocked && result.achievement) {
        newAchievements.push(result.achievement);
      }
    }

    await this.saveProgress(userId, progress);
    return { achievements: newAchievements, progress };
  }

  /**
   * Update daily streak
   */
  async updateStreak(userId: string): Promise<StudentProgress> {
    const progress = await this.getProgress(userId);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (progress.lastActiveDate) {
      const lastActive = new Date(progress.lastActiveDate);
      lastActive.setHours(0, 0, 0, 0);

      const daysDiff = Math.floor((today.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24));

      if (daysDiff === 1) {
        // Consecutive day
        progress.currentStreak++;
        if (progress.currentStreak > progress.longestStreak) {
          progress.longestStreak = progress.currentStreak;
        }

        // Check streak achievements
        if (progress.currentStreak === 7) {
          await this.unlockAchievement(userId, 'week_warrior');
        } else if (progress.currentStreak === 30) {
          await this.unlockAchievement(userId, 'dedication_master');
        }
      } else if (daysDiff > 1) {
        // Streak broken
        progress.currentStreak = 1;
      }
    } else {
      progress.currentStreak = 1;
    }

    progress.lastActiveDate = new Date();
    await this.saveProgress(userId, progress);
    return progress;
  }

  /**
   * Get learning milestones
   */
  async getLearningMilestones(userId: string): Promise<LearningMilestone[]> {
    const progress = await this.getProgress(userId);
    
    return [
      {
        id: 'upload_data',
        title: 'Upload Your First Dataset',
        description: 'Learn how to prepare and upload data for training',
        completed: progress.completedMilestones.includes('upload_data'),
        order: 1
      },
      {
        id: 'train_model',
        title: 'Train Your First Model',
        description: 'Experience the magic of machine learning',
        completed: progress.completedMilestones.includes('train_model'),
        order: 2
      },
      {
        id: 'understand_metrics',
        title: 'Understand Model Metrics',
        description: 'Learn what accuracy, loss, and other metrics mean',
        completed: progress.completedMilestones.includes('understand_metrics'),
        order: 3
      },
      {
        id: 'tune_hyperparameters',
        title: 'Tune Hyperparameters',
        description: 'Improve your model by adjusting settings',
        completed: progress.completedMilestones.includes('tune_hyperparameters'),
        order: 4
      },
      {
        id: 'explore_workshop',
        title: 'Complete a Workshop',
        description: 'Dive deeper into advanced ML topics',
        completed: progress.completedMilestones.includes('explore_workshop'),
        order: 5
      },
      {
        id: 'achieve_high_accuracy',
        title: 'Achieve 90%+ Accuracy',
        description: 'Train a highly accurate model',
        completed: progress.completedMilestones.includes('achieve_high_accuracy'),
        order: 6
      }
    ];
  }

  /**
   * Initialize all achievements
   */
  private initializeAchievements(): Achievement[] {
    return [
      // Training achievements
      {
        id: 'first_model',
        title: 'First Steps',
        description: 'Train your first machine learning model',
        icon: '🎯',
        points: 100,
        unlocked: false,
        category: 'training'
      },
      {
        id: 'model_enthusiast',
        title: 'Model Enthusiast',
        description: 'Train 10 models',
        icon: '🚀',
        points: 250,
        unlocked: false,
        category: 'training'
      },
      {
        id: 'model_master',
        title: 'Model Master',
        description: 'Train 50 models',
        icon: '👑',
        points: 500,
        unlocked: false,
        category: 'mastery'
      },
      {
        id: 'accuracy_expert',
        title: 'Accuracy Expert',
        description: 'Achieve 95%+ accuracy on a model',
        icon: '🎖️',
        points: 200,
        unlocked: false,
        category: 'mastery'
      },
      // Exploration achievements
      {
        id: 'data_collector',
        title: 'Data Collector',
        description: 'Upload your first dataset',
        icon: '📊',
        points: 50,
        unlocked: false,
        category: 'exploration'
      },
      {
        id: 'explorer',
        title: 'Explorer',
        description: 'Complete 3 different workshops',
        icon: '🗺️',
        points: 150,
        unlocked: false,
        category: 'exploration'
      },
      {
        id: 'knowledge_seeker',
        title: 'Knowledge Seeker',
        description: 'Complete 10 workshops',
        icon: '📚',
        points: 400,
        unlocked: false,
        category: 'mastery'
      },
      // Streak achievements
      {
        id: 'week_warrior',
        title: 'Week Warrior',
        description: 'Maintain a 7-day learning streak',
        icon: '🔥',
        points: 300,
        unlocked: false,
        category: 'special'
      },
      {
        id: 'dedication_master',
        title: 'Dedication Master',
        description: 'Maintain a 30-day learning streak',
        icon: '💎',
        points: 1000,
        unlocked: false,
        category: 'special'
      }
    ];
  }

  /**
   * Get level title based on level number
   */
  getLevelTitle(level: number): string {
    if (level < 5) return 'Beginner';
    if (level < 10) return 'Apprentice';
    if (level < 20) return 'Practitioner';
    if (level < 30) return 'Expert';
    return 'Master';
  }

  /**
   * Reset progress (for testing)
   */
  async resetProgress(userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_progress')
        .delete()
        .eq('user_id', userId);

      if (error) {
        console.error('Error resetting progress:', error);
      }
    } catch (error) {
      console.error('Error in resetProgress:', error);
    }
  }
}

export const gamificationService = new GamificationService();
