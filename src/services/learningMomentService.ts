/**
 * Learning Moment Service
 * 
 * Manages progress tracking, persistence, and gamification integration
 * for the Learning Moments feature (Learn: Data, Learn: Model, Learn: Next Steps).
 */

import { gamificationService } from './gamificationService';
import type { LearningMomentType } from '@/utils/learningMomentContent';

// ─────────────────────────────────────────────────────────────────────────────
// Type Definitions
// ─────────────────────────────────────────────────────────────────────────────

export interface LearningMomentStatus {
  completed: boolean;
  completedAt?: string;
  quizScore?: number;
  quizTotal?: number;
  timeSpentSeconds?: number;
}

export interface LearningMomentPreferences {
  dontShowData: boolean;
  dontShowModel: boolean;
  dontShowNextSteps: boolean;
}

export interface LearningMomentProgress {
  projectId: string;
  userId: string | null;
  sessionId: string;
  moments: {
    data: LearningMomentStatus;
    model: LearningMomentStatus;
    next_steps: LearningMomentStatus;
  };
  preferences: LearningMomentPreferences;
}

export interface LearningMomentResult {
  momentType: LearningMomentType;
  completed: boolean;
  componentType?: string;
  score?: number;
  total?: number;
  quizScore?: number;
  quizTotal?: number;
  timeSpentSeconds: number;
}

export interface GamificationResult {
  pointsAwarded: number;
  bonusPoints: number;
  achievementsUnlocked: string[];
  leveledUp: boolean;
  newLevel?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const STORAGE_KEY_PREFIX = 'modelmentor_learning_moments';
const STORAGE_VERSION = 1;

/** Points awarded for completing each learning moment type */
const MOMENT_POINTS: Record<LearningMomentType, number> = {
  data: 50,
  model: 75,
  next_steps: 100
};

/** Bonus points for perfect quiz score */
const PERFECT_QUIZ_BONUS = 25;

/** Achievement IDs */
const ACHIEVEMENT_COMPLETE_LEARNER = 'complete_learner';
const ACHIEVEMENT_KNOWLEDGE_SEEKER = 'knowledge_seeker_lm';

// ─────────────────────────────────────────────────────────────────────────────
// Local Storage Schema
// ─────────────────────────────────────────────────────────────────────────────

interface LocalStorageLearningMoments {
  version: number;
  sessionId: string;
  projects: {
    [projectId: string]: {
      data: LearningMomentStatus;
      model: LearningMomentStatus;
      next_steps: LearningMomentStatus;
    };
  };
  preferences: LearningMomentPreferences;
  /** Total learning moments completed across all projects */
  totalCompleted: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Service Implementation
// ─────────────────────────────────────────────────────────────────────────────

class LearningMomentService {
  private sessionId: string;

  constructor() {
    this.sessionId = this.getOrCreateSessionId();
  }

  /**
   * Get or create a session ID for anonymous users
   */
  private getOrCreateSessionId(): string {
    const existingId = localStorage.getItem('modelmentor_session_id');
    if (existingId) return existingId;

    const newId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem('modelmentor_session_id', newId);
    return newId;
  }

  /**
   * Get the storage key for the current session
   */
  private getStorageKey(): string {
    return `${STORAGE_KEY_PREFIX}_${this.sessionId}`;
  }

  /**
   * Load data from localStorage
   */
  private loadFromStorage(): LocalStorageLearningMoments {
    try {
      const stored = localStorage.getItem(this.getStorageKey());
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.version === STORAGE_VERSION) {
          return parsed;
        }
      }
    } catch (error) {
      console.error('Error loading learning moments from storage:', error);
    }

    // Return default structure
    return {
      version: STORAGE_VERSION,
      sessionId: this.sessionId,
      projects: {},
      preferences: {
        dontShowData: false,
        dontShowModel: false,
        dontShowNextSteps: false
      },
      totalCompleted: 0
    };
  }

  /**
   * Save data to localStorage
   */
  private saveToStorage(data: LocalStorageLearningMoments): void {
    try {
      localStorage.setItem(this.getStorageKey(), JSON.stringify(data));
    } catch (error) {
      console.error('Error saving learning moments to storage:', error);
      // If storage is full, try to clear old data
      this.clearOldData();
      try {
        localStorage.setItem(this.getStorageKey(), JSON.stringify(data));
      } catch {
        console.error('Failed to save even after clearing old data');
      }
    }
  }

  /**
   * Clear old learning moment data to free up space
   */
  private clearOldData(): void {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(STORAGE_KEY_PREFIX) && key !== this.getStorageKey()) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
  }

  /**
   * Get default status for a learning moment
   */
  private getDefaultStatus(): LearningMomentStatus {
    return {
      completed: false
    };
  }

  /**
   * Get progress for a specific project
   */
  async getProgress(projectId: string): Promise<LearningMomentProgress> {
    const storage = this.loadFromStorage();
    
    const projectProgress = storage.projects[projectId] || {
      data: this.getDefaultStatus(),
      model: this.getDefaultStatus(),
      next_steps: this.getDefaultStatus()
    };

    return {
      projectId,
      userId: null, // Will be set by caller if authenticated
      sessionId: this.sessionId,
      moments: projectProgress,
      preferences: storage.preferences
    };
  }

  /**
   * Check if a learning moment should be shown
   */
  async shouldShowMoment(
    projectId: string,
    momentType: LearningMomentType,
    isGuidedTour: boolean
  ): Promise<boolean> {
    const progress = await this.getProgress(projectId);
    
    // Don't show if already completed for this project
    if (progress.moments[momentType].completed) {
      return false;
    }

    // In guided tour mode, always show (ignore preferences)
    if (isGuidedTour) {
      return true;
    }

    // Check "don't show again" preference
    const preferenceKey = `dontShow${momentType.charAt(0).toUpperCase()}${momentType.slice(1).replace('_', '')}` as keyof LearningMomentPreferences;
    
    // Map moment type to preference key
    const prefMap: Record<LearningMomentType, keyof LearningMomentPreferences> = {
      data: 'dontShowData',
      model: 'dontShowModel',
      next_steps: 'dontShowNextSteps'
    };
    
    return !progress.preferences[prefMap[momentType]];
  }

  /**
   * Record completion of a learning moment
   */
  async recordCompletion(
    projectId: string,
    result: LearningMomentResult
  ): Promise<void> {
    const storage = this.loadFromStorage();
    
    // Initialize project if needed
    if (!storage.projects[projectId]) {
      storage.projects[projectId] = {
        data: this.getDefaultStatus(),
        model: this.getDefaultStatus(),
        next_steps: this.getDefaultStatus()
      };
    }

    // Update the moment status
    storage.projects[projectId][result.momentType] = {
      completed: result.completed,
      completedAt: new Date().toISOString(),
      quizScore: result.score ?? result.quizScore,
      quizTotal: result.total ?? result.quizTotal,
      timeSpentSeconds: result.timeSpentSeconds
    };

    // Update total completed count
    if (result.completed) {
      storage.totalCompleted++;
    }

    this.saveToStorage(storage);
  }

  /**
   * Set "Don't show again" preference for a moment type
   */
  async setDontShowPreference(
    momentType: LearningMomentType,
    dontShow: boolean
  ): Promise<void> {
    const storage = this.loadFromStorage();
    
    const prefMap: Record<LearningMomentType, keyof LearningMomentPreferences> = {
      data: 'dontShowData',
      model: 'dontShowModel',
      next_steps: 'dontShowNextSteps'
    };
    
    storage.preferences[prefMap[momentType]] = dontShow;
    this.saveToStorage(storage);
  }

  /**
   * Get "Don't show again" preference for a moment type
   */
  async getDontShowPreference(momentType: LearningMomentType): Promise<boolean> {
    const storage = this.loadFromStorage();
    
    const prefMap: Record<LearningMomentType, keyof LearningMomentPreferences> = {
      data: 'dontShowData',
      model: 'dontShowModel',
      next_steps: 'dontShowNextSteps'
    };
    
    return storage.preferences[prefMap[momentType]];
  }

  /**
   * Award points and check achievements for completing a learning moment
   */
  async awardPoints(
    userId: string,
    projectId: string,
    momentType: LearningMomentType,
    quizScore: number,
    quizTotal: number
  ): Promise<GamificationResult> {
    const basePoints = MOMENT_POINTS[momentType];
    const isPerfectScore = quizScore === quizTotal && quizTotal > 0;
    const bonusPoints = isPerfectScore ? PERFECT_QUIZ_BONUS : 0;
    const totalPoints = basePoints + bonusPoints;

    const achievementsUnlocked: string[] = [];
    let leveledUp = false;
    let newLevel: number | undefined;

    try {
      // Award points via gamification service
      const pointsResult = await gamificationService.addPoints(userId, totalPoints);
      leveledUp = pointsResult.leveledUp;
      newLevel = pointsResult.newLevel;

      // Check for "Complete Learner" achievement (all 3 moments for a project)
      const progress = await this.getProgress(projectId);
      const allCompleted = 
        progress.moments.data.completed &&
        progress.moments.model.completed &&
        progress.moments.next_steps.completed;

      if (allCompleted) {
        const achievementResult = await gamificationService.unlockAchievement(
          userId,
          ACHIEVEMENT_COMPLETE_LEARNER
        );
        if (achievementResult.unlocked) {
          achievementsUnlocked.push(ACHIEVEMENT_COMPLETE_LEARNER);
        }
      }

      // Check for "Knowledge Seeker" achievement (5 learning moments total)
      const storage = this.loadFromStorage();
      if (storage.totalCompleted >= 5) {
        const achievementResult = await gamificationService.unlockAchievement(
          userId,
          ACHIEVEMENT_KNOWLEDGE_SEEKER
        );
        if (achievementResult.unlocked) {
          achievementsUnlocked.push(ACHIEVEMENT_KNOWLEDGE_SEEKER);
        }
      }
    } catch (error) {
      console.error('Error awarding points:', error);
    }

    return {
      pointsAwarded: basePoints,
      bonusPoints,
      achievementsUnlocked,
      leveledUp,
      newLevel
    };
  }

  /**
   * Get total learning moments completed across all projects
   */
  getTotalCompleted(): number {
    const storage = this.loadFromStorage();
    return storage.totalCompleted;
  }

  /**
   * Check if all learning moments are completed for a project
   */
  async isProjectComplete(projectId: string): Promise<boolean> {
    const progress = await this.getProgress(projectId);
    return (
      progress.moments.data.completed &&
      progress.moments.model.completed &&
      progress.moments.next_steps.completed
    );
  }

  /**
   * Get completion status for all moments in a project
   */
  async getCompletionStatus(projectId: string): Promise<{
    data: boolean;
    model: boolean;
    next_steps: boolean;
  }> {
    const progress = await this.getProgress(projectId);
    return {
      data: progress.moments.data.completed,
      model: progress.moments.model.completed,
      next_steps: progress.moments.next_steps.completed
    };
  }

  /**
   * Reset progress for a project (for testing)
   */
  async resetProjectProgress(projectId: string): Promise<void> {
    const storage = this.loadFromStorage();
    
    if (storage.projects[projectId]) {
      // Decrement total completed count
      const projectMoments = storage.projects[projectId];
      let completedCount = 0;
      if (projectMoments.data.completed) completedCount++;
      if (projectMoments.model.completed) completedCount++;
      if (projectMoments.next_steps.completed) completedCount++;
      storage.totalCompleted = Math.max(0, storage.totalCompleted - completedCount);
      
      // Reset project progress
      delete storage.projects[projectId];
      this.saveToStorage(storage);
    }
  }

  /**
   * Reset all preferences (for testing)
   */
  async resetPreferences(): Promise<void> {
    const storage = this.loadFromStorage();
    storage.preferences = {
      dontShowData: false,
      dontShowModel: false,
      dontShowNextSteps: false
    };
    this.saveToStorage(storage);
  }

  /**
   * Reset all data (for testing)
   */
  async resetAll(): Promise<void> {
    localStorage.removeItem(this.getStorageKey());
  }
}

// Export singleton instance
export const learningMomentService = new LearningMomentService();
