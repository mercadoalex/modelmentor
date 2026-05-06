import { supabase } from '@/db/supabase';
import type { TutorialQuizResult } from './quizService';

export interface QuestionAnalytics {
  question_id: string;
  question_text: string;
  total_attempts: number;
  correct_attempts: number;
  success_rate: number;
  tutorial_id: string;
}

export interface TutorialAnalytics {
  tutorial_id: string;
  tutorial_title: string;
  total_attempts: number;
  unique_students: number;
  average_score: number;
  pass_rate: number;
  completion_rate: number;
}

export interface StudentPerformance {
  user_id: string;
  user_email: string;
  total_quizzes_taken: number;
  quizzes_passed: number;
  average_score: number;
  total_time_spent: number;
}

export const quizAnalyticsService = {
  /**
   * Get analytics for all tutorials
   */
  async getTutorialAnalytics(organizationId?: string): Promise<TutorialAnalytics[]> {
    try {
      // Get all quiz results
      let query = supabase
        .from('tutorial_quiz_results')
        .select(`
          *,
          user:user_id (
            id,
            email
          )
        `);

      // If organization filter is provided, join with profiles
      if (organizationId) {
        const { data: orgUsers } = await supabase
          .from('profiles')
          .select('id')
          .eq('organization_id', organizationId);

        if (orgUsers && orgUsers.length > 0) {
          const userIds = orgUsers.map(u => u.id);
          query = query.in('user_id', userIds);
        }
      }

      const { data: results, error } = await query;

      if (error) throw error;

      // Group by tutorial_id
      const tutorialMap = new Map<string, TutorialQuizResult[]>();
      (results || []).forEach((result: TutorialQuizResult) => {
        if (!tutorialMap.has(result.tutorialId)) {
          tutorialMap.set(result.tutorialId, []);
        }
        tutorialMap.get(result.tutorialId)!.push(result);
      });

      // Calculate analytics for each tutorial
      const analytics: TutorialAnalytics[] = [];
      tutorialMap.forEach((tutorialResults, tutorialId) => {
        const uniqueStudents = new Set(tutorialResults.map(r => r.userId)).size;
        const totalAttempts = tutorialResults.length;
        const passedAttempts = tutorialResults.filter(r => r.passed).length;
        const totalScore = tutorialResults.reduce((sum, r) => sum + (r.score || 0), 0);
        const averageScore = totalScore / totalAttempts;

        // Calculate completion rate (students who passed / unique students)
        const studentsWhoPassedSet = new Set(
          tutorialResults.filter(r => r.passed).map(r => r.userId)
        );
        const completionRate = (studentsWhoPassedSet.size / uniqueStudents) * 100;

        analytics.push({
          tutorial_id: tutorialId,
          tutorial_title: this.getTutorialTitle(tutorialId),
          total_attempts: totalAttempts,
          unique_students: uniqueStudents,
          average_score: Math.round(averageScore),
          pass_rate: Math.round((passedAttempts / totalAttempts) * 100),
          completion_rate: Math.round(completionRate),
        });
      });

      return analytics.sort((a, b) => b.total_attempts - a.total_attempts);
    } catch (error) {
      console.error('Error fetching tutorial analytics:', error);
      return [];
    }
  },

  /**
   * Get question-level analytics for a specific tutorial
   */
  async getQuestionAnalytics(tutorialId: string, organizationId?: string): Promise<QuestionAnalytics[]> {
    try {
      // Get all quiz results for this tutorial
      let query = supabase
        .from('tutorial_quiz_results')
        .select('*')
        .eq('tutorial_id', tutorialId);

      if (organizationId) {
        const { data: orgUsers } = await supabase
          .from('profiles')
          .select('id')
          .eq('organization_id', organizationId);

        if (orgUsers && orgUsers.length > 0) {
          const userIds = orgUsers.map(u => u.id);
          query = query.in('user_id', userIds);
        }
      }

      const { data: results, error } = await query;

      if (error) throw error;

      // Aggregate by question
      const questionMap = new Map<string, { correct: number; total: number }>();

      (results || []).forEach((result: TutorialQuizResult) => {
        if (result.answers && Array.isArray(result.answers)) {
          result.answers.forEach((answer: { question_id: string; is_correct: boolean }) => {
            if (!questionMap.has(answer.question_id)) {
              questionMap.set(answer.question_id, { correct: 0, total: 0 });
            }
            const stats = questionMap.get(answer.question_id)!;
            stats.total += 1;
            if (answer.is_correct) {
              stats.correct += 1;
            }
          });
        }
      });

      // Convert to analytics array
      const analytics: QuestionAnalytics[] = [];
      questionMap.forEach((stats, questionId) => {
        const successRate = (stats.correct / stats.total) * 100;
        analytics.push({
          question_id: questionId,
          question_text: this.getQuestionText(tutorialId, questionId),
          total_attempts: stats.total,
          correct_attempts: stats.correct,
          success_rate: Math.round(successRate),
          tutorial_id: tutorialId,
        });
      });

      // Sort by success rate (struggling questions first)
      return analytics.sort((a, b) => a.success_rate - b.success_rate);
    } catch (error) {
      console.error('Error fetching question analytics:', error);
      return [];
    }
  },

  /**
   * Get student performance data
   */
  async getStudentPerformance(organizationId?: string): Promise<StudentPerformance[]> {
    try {
      let query = supabase
        .from('tutorial_quiz_results')
        .select(`
          *,
          user:user_id (
            id,
            email
          )
        `);

      if (organizationId) {
        const { data: orgUsers } = await supabase
          .from('profiles')
          .select('id')
          .eq('organization_id', organizationId);

        if (orgUsers && orgUsers.length > 0) {
          const userIds = orgUsers.map(u => u.id);
          query = query.in('user_id', userIds);
        }
      }

      const { data: results, error } = await query;

      if (error) throw error;

      // Group by user
      const userMap = new Map<string, { email: string; results: TutorialQuizResult[] }>();
      (results || []).forEach((result: any) => {
        if (!userMap.has(result.user_id)) {
          userMap.set(result.user_id, {
            email: result.user?.email || 'Unknown',
            results: [],
          });
        }
        userMap.get(result.user_id)!.results.push(result);
      });

      // Calculate performance for each student
      const performance: StudentPerformance[] = [];
      userMap.forEach((userData, userId) => {
        const { email, results: userResults } = userData;
        const totalQuizzes = userResults.length;
        const quizzesPassed = userResults.filter(r => r.passed).length;
        const totalScore = userResults.reduce((sum, r) => sum + (r.score || 0), 0);
        const averageScore = totalScore / totalQuizzes;
        const totalTimeSpent = userResults.reduce((sum, r) => sum + (r.time_taken || 0), 0);

        performance.push({
          user_id: userId,
          user_email: email,
          total_quizzes_taken: totalQuizzes,
          quizzes_passed: quizzesPassed,
          average_score: Math.round(averageScore),
          total_time_spent: totalTimeSpent,
        });
      });

      return performance.sort((a, b) => b.average_score - a.average_score);
    } catch (error) {
      console.error('Error fetching student performance:', error);
      return [];
    }
  },

  /**
   * Get overall statistics
   */
  async getOverallStatistics(organizationId?: string): Promise<{
    total_students: number;
    total_quiz_attempts: number;
    average_score: number;
    pass_rate: number;
  }> {
    try {
      let query = supabase
        .from('tutorial_quiz_results')
        .select('*');

      if (organizationId) {
        const { data: orgUsers } = await supabase
          .from('profiles')
          .select('id')
          .eq('organization_id', organizationId);

        if (orgUsers && orgUsers.length > 0) {
          const userIds = orgUsers.map(u => u.id);
          query = query.in('user_id', userIds);
        }
      }

      const { data: results, error } = await query;

      if (error) throw error;

      const totalStudents = new Set((results || []).map(r => r.user_id)).size;
      const totalAttempts = (results || []).length;
      const passedAttempts = (results || []).filter(r => r.passed).length;
      const totalScore = (results || []).reduce((sum, r) => sum + r.score, 0);

      return {
        total_students: totalStudents,
        total_quiz_attempts: totalAttempts,
        average_score: totalAttempts > 0 ? Math.round(totalScore / totalAttempts) : 0,
        pass_rate: totalAttempts > 0 ? Math.round((passedAttempts / totalAttempts) * 100) : 0,
      };
    } catch (error) {
      console.error('Error fetching overall statistics:', error);
      return {
        total_students: 0,
        total_quiz_attempts: 0,
        average_score: 0,
        pass_rate: 0,
      };
    }
  },

  /**
   * Helper: Get tutorial title from ID
   */
  getTutorialTitle(tutorialId: string): string {
    const titles: Record<string, string> = {
      'dashboard-tour': 'Dashboard Tour',
      'project-creation': 'Project Creation',
      'data-upload': 'Data Upload',
      'model-training': 'Model Training',
      'model-testing': 'Model Testing',
    };
    return titles[tutorialId] || tutorialId;
  },

  /**
   * Helper: Get question text from tutorial and question ID
   */
  getQuestionText(tutorialId: string, questionId: string): string {
    // Import quiz data dynamically
    try {
      // This is a workaround since we can't import at runtime easily
      // In a real app, you'd query this from the database
      const questionMap: Record<string, Record<string, string>> = {
        'dashboard-tour': {
          'dt-q1': 'Where do you click to create a new ML project?',
          'dt-q2': 'What information can you see in the quick stats section?',
          'dt-q3': 'Where can you access tutorials and help?',
        },
        'project-creation': {
          'pc-q1': 'What should you do first when creating a new project?',
          'pc-q2': 'Which of these is a valid model type in ModelMentor?',
          'pc-q3': 'Why is it important to describe your project goal clearly?',
          'pc-q4': 'After creating a project, what is the next step?',
        },
        'data-upload': {
          'du-q1': 'What file format is typically used for uploading training data?',
          'du-q2': 'What are "features" in machine learning?',
          'du-q3': 'What is a "label" in machine learning?',
          'du-q4': 'Why is it important to preview your data before training?',
        },
        'model-training': {
          'mt-q1': 'What does "epoch" mean in machine learning?',
          'mt-q2': 'What does "loss" indicate during training?',
          'mt-q3': 'What does "accuracy" represent?',
          'mt-q4': 'Why should you monitor training metrics in real-time?',
          'mt-q5': 'What should you do if the loss is not decreasing?',
        },
        'model-testing': {
          'mtest-q1': 'What is the purpose of testing a trained model?',
          'mtest-q2': 'What does "confidence score" indicate?',
          'mtest-q3': 'What is a confusion matrix used for?',
          'mtest-q4': 'What is batch testing?',
        },
      };

      return questionMap[tutorialId]?.[questionId] || `Question ${questionId}`;
    } catch (error) {
      return `Question ${questionId}`;
    }
  },
};
