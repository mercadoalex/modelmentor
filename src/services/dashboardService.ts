import { supabase } from '@/db/supabase';
import type { Profile, StudentProgress, ConceptMastery, AtRiskAlert } from '@/types/types';

export const dashboardService = {
  // Get all students with their progress
  async getAllStudentsProgress(): Promise<StudentProgress[]> {
    try {
      const { data: students, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'user')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get progress for each student
      const progressPromises = (students || []).map(student => this.getStudentProgress(student.id));
      const progressResults = await Promise.all(progressPromises);
      
      return progressResults.filter(p => p !== null) as StudentProgress[];
    } catch (error) {
      console.error('Error getting students progress:', error);
      return [];
    }
  },

  // Get individual student progress
  async getStudentProgress(userId: string): Promise<StudentProgress | null> {
    try {
      const { data: student, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;
      if (!student) return null;

      // Get concept mastery
      const { data: conceptMastery, error: masteryError } = await supabase
        .from('concept_mastery')
        .select('*')
        .eq('user_id', userId);

      if (masteryError) throw masteryError;

      // Get recent activity
      const { data: recentActivity, error: activityError } = await supabase
        .from('student_activity')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (activityError) throw activityError;

      // Get badges
      const { data: badges, error: badgesError } = await supabase
        .from('user_badges')
        .select('*')
        .eq('user_id', userId);

      if (badgesError) throw badgesError;

      // Get alerts
      const { data: alerts, error: alertsError } = await supabase
        .from('at_risk_alerts')
        .select('*')
        .eq('user_id', userId)
        .eq('is_resolved', false);

      if (alertsError) throw alertsError;

      // Get project counts
      const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .select('id, status')
        .eq('user_id', userId);

      if (projectsError) throw projectsError;

      const totalProjects = projects?.length || 0;
      const completedProjects = projects?.filter(p => p.status === 'completed').length || 0;

      // Calculate average score
      const averageScore = conceptMastery && conceptMastery.length > 0
        ? Math.round(conceptMastery.reduce((sum, m) => sum + m.mastery_score, 0) / conceptMastery.length)
        : 0;

      return {
        student,
        totalProjects,
        completedProjects,
        averageScore,
        conceptMastery: conceptMastery || [],
        recentActivity: recentActivity || [],
        badges: badges || [],
        alerts: alerts || []
      };
    } catch (error) {
      console.error('Error getting student progress:', error);
      return null;
    }
  },

  // Get at-risk students
  async getAtRiskStudents(): Promise<StudentProgress[]> {
    try {
      const allProgress = await this.getAllStudentsProgress();
      return allProgress.filter(p => p.alerts.length > 0);
    } catch (error) {
      console.error('Error getting at-risk students:', error);
      return [];
    }
  },

  // Get class statistics
  async getClassStatistics() {
    try {
      const allProgress = await this.getAllStudentsProgress();
      
      const totalStudents = allProgress.length;
      const averageScore = totalStudents > 0
        ? allProgress.reduce((sum, p) => sum + p.averageScore, 0) / totalStudents
        : 0;
      const atRiskCount = allProgress.filter(p => p.alerts.length > 0).length;
      
      // Calculate concept mastery across all students
      const conceptScores: Record<string, number[]> = {};
      allProgress.forEach(progress => {
        progress.conceptMastery.forEach(mastery => {
          if (!conceptScores[mastery.concept_name]) {
            conceptScores[mastery.concept_name] = [];
          }
          conceptScores[mastery.concept_name].push(mastery.mastery_score);
        });
      });

      const conceptAverages = Object.entries(conceptScores).map(([concept, scores]) => ({
        concept,
        average: scores.reduce((sum, score) => sum + score, 0) / scores.length,
        struggling: scores.filter(s => s < 70).length
      }));

      return {
        totalStudents,
        averageScore: Math.round(averageScore),
        atRiskCount,
        conceptAverages
      };
    } catch (error) {
      console.error('Error getting class statistics:', error);
      return {
        totalStudents: 0,
        averageScore: 0,
        atRiskCount: 0,
        conceptAverages: []
      };
    }
  },

  // Resolve an alert
  async resolveAlert(alertId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('at_risk_alerts')
        .update({
          is_resolved: true,
          resolved_at: new Date().toISOString()
        })
        .eq('id', alertId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error resolving alert:', error);
      return false;
    }
  }
};
