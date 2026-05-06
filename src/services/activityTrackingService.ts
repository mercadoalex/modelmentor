import { supabase } from '@/db/supabase';
import type { ConceptName } from '@/types/types';

export const activityTrackingService = {
  // Track project creation
  async trackProjectCreation(userId: string, projectId: string, projectType: string, description: string) {
    try {
      const { error } = await supabase
        .from('student_activity')
        .insert({
          user_id: userId,
          activity_type: 'project_created',
          activity_data: {
            project_id: projectId,
            project_type: projectType,
            description: description
          }
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error tracking project creation:', error);
    }
  },

  // Track concept viewing with time spent
  async trackConceptView(userId: string, conceptName: ConceptName, durationSeconds: number) {
    try {
      const { error } = await supabase
        .from('student_activity')
        .insert({
          user_id: userId,
          activity_type: 'concept_viewed',
          activity_data: {
            concept_name: conceptName
          },
          duration_seconds: durationSeconds
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error tracking concept view:', error);
    }
  },

  // Track quiz completion
  async trackQuizCompletion(
    userId: string,
    conceptName: ConceptName,
    questionId: string,
    isCorrect: boolean,
    answerGiven: string,
    timeSpentSeconds: number
  ) {
    try {
      // Insert quiz result
      const { error: quizError } = await supabase
        .from('quiz_results')
        .insert({
          user_id: userId,
          concept_name: conceptName,
          question_id: questionId,
          is_correct: isCorrect,
          answer_given: answerGiven,
          time_spent_seconds: timeSpentSeconds
        });

      if (quizError) throw quizError;

      // Insert activity record
      const { error: activityError } = await supabase
        .from('student_activity')
        .insert({
          user_id: userId,
          activity_type: 'quiz_completed',
          activity_data: {
            concept_name: conceptName,
            question_id: questionId,
            is_correct: isCorrect
          },
          duration_seconds: timeSpentSeconds
        });

      if (activityError) throw activityError;

      // Update concept mastery
      await this.updateConceptMastery(userId, conceptName);
    } catch (error) {
      console.error('Error tracking quiz completion:', error);
    }
  },

  // Track training completion
  async trackTrainingCompletion(
    userId: string,
    projectId: string,
    modelType: string,
    durationSeconds: number,
    finalAccuracy: number | null
  ) {
    try {
      const { error } = await supabase
        .from('student_activity')
        .insert({
          user_id: userId,
          activity_type: 'training_completed',
          activity_data: {
            project_id: projectId,
            model_type: modelType,
            final_accuracy: finalAccuracy
          },
          duration_seconds: durationSeconds
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error tracking training completion:', error);
    }
  },

  // Update concept mastery based on quiz performance
  async updateConceptMastery(userId: string, conceptName: ConceptName) {
    try {
      // Get all quiz results for this concept
      const { data: quizResults, error: queryError } = await supabase
        .from('quiz_results')
        .select('is_correct')
        .eq('user_id', userId)
        .eq('concept_name', conceptName);

      if (queryError) throw queryError;

      if (!quizResults || quizResults.length === 0) return;

      // Calculate mastery score
      const correctCount = quizResults.filter(r => r.is_correct).length;
      const totalCount = quizResults.length;
      const masteryScore = Math.round((correctCount / totalCount) * 100);

      // Upsert concept mastery
      const { error: upsertError } = await supabase
        .from('concept_mastery')
        .upsert({
          user_id: userId,
          concept_name: conceptName,
          mastery_score: masteryScore,
          attempts: totalCount,
          last_attempt_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,concept_name'
        });

      if (upsertError) throw upsertError;

      // Check if student is at risk
      await this.checkAndCreateAlerts(userId, conceptName, masteryScore, totalCount);
    } catch (error) {
      console.error('Error updating concept mastery:', error);
    }
  },

  // Check and create at-risk alerts
  async checkAndCreateAlerts(
    userId: string,
    conceptName: ConceptName,
    masteryScore: number,
    attempts: number
  ) {
    try {
      const alerts = [];

      // Low score alert
      if (masteryScore < 60) {
        alerts.push({
          user_id: userId,
          concept_name: conceptName,
          alert_type: 'low_score',
          severity: masteryScore < 50 ? 'high' : 'medium'
        });
      }

      // Repeated errors alert
      if (attempts >= 5 && masteryScore < 70) {
        alerts.push({
          user_id: userId,
          concept_name: conceptName,
          alert_type: 'repeated_errors',
          severity: 'medium'
        });
      }

      // Insert alerts if any
      if (alerts.length > 0) {
        // First, delete existing unresolved alerts for this concept
        await supabase
          .from('at_risk_alerts')
          .delete()
          .eq('user_id', userId)
          .eq('concept_name', conceptName)
          .eq('is_resolved', false);

        // Insert new alerts
        const { error } = await supabase
          .from('at_risk_alerts')
          .insert(alerts);

        if (error) throw error;
      }
    } catch (error) {
      console.error('Error creating alerts:', error);
    }
  },

  // Get time tracking helper
  createTimeTracker() {
    const startTime = Date.now();
    return {
      getElapsedSeconds: () => Math.floor((Date.now() - startTime) / 1000)
    };
  }
};
