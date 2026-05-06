import { supabase } from '@/db/supabase';
import type { ProjectCollaborator, SharedExperiment, ExperimentComment, CollaborationActivity } from '@/types/types';

export const collaborationService = {
  /**
   * Invite a collaborator to a project
   */
  async inviteCollaborator(
    projectId: string,
    userEmail: string,
    role: 'editor' | 'viewer'
  ): Promise<ProjectCollaborator | null> {
    try {
      // Get user by email
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', userEmail)
        .maybeSingle();

      if (userError || !userData) {
        throw new Error('User not found');
      }

      const { data, error } = await supabase
        .from('project_collaborators')
        .insert({
          project_id: projectId,
          user_id: userData.id,
          role,
          invited_by: (await supabase.auth.getUser()).data.user?.id,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;

      // Log activity
      await this.logActivity(projectId, 'collaborator_added', {
        collaborator_email: userEmail,
        role,
      });

      return data;
    } catch (error) {
      console.error('Error inviting collaborator:', error);
      return null;
    }
  },

  /**
   * Get collaborators for a project
   */
  async getCollaborators(projectId: string): Promise<ProjectCollaborator[]> {
    try {
      const { data, error } = await supabase
        .from('project_collaborators')
        .select('*')
        .eq('project_id', projectId)
        .order('invited_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching collaborators:', error);
      return [];
    }
  },

  /**
   * Accept collaboration invitation
   */
  async acceptInvitation(collaboratorId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('project_collaborators')
        .update({
          status: 'accepted',
          accepted_at: new Date().toISOString(),
        })
        .eq('id', collaboratorId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error accepting invitation:', error);
      return false;
    }
  },

  /**
   * Remove collaborator
   */
  async removeCollaborator(collaboratorId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('project_collaborators')
        .delete()
        .eq('id', collaboratorId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error removing collaborator:', error);
      return false;
    }
  },

  /**
   * Share an experiment
   */
  async shareExperiment(
    projectId: string,
    title: string,
    description: string,
    metrics: Record<string, unknown>,
    config: Record<string, unknown>,
    trainingSessionId?: string,
    modelVersionId?: string
  ): Promise<SharedExperiment | null> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('shared_experiments')
        .insert({
          project_id: projectId,
          training_session_id: trainingSessionId,
          model_version_id: modelVersionId,
          shared_by: user.user.id,
          title,
          description,
          metrics,
          config,
        })
        .select()
        .single();

      if (error) throw error;

      // Log activity
      await this.logActivity(projectId, 'experiment_shared', {
        experiment_title: title,
      });

      return data;
    } catch (error) {
      console.error('Error sharing experiment:', error);
      return null;
    }
  },

  /**
   * Get shared experiments for a project
   */
  async getSharedExperiments(projectId: string): Promise<SharedExperiment[]> {
    try {
      const { data, error } = await supabase
        .from('shared_experiments')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching shared experiments:', error);
      return [];
    }
  },

  /**
   * Add comment to experiment
   */
  async addComment(
    experimentId: string,
    comment: string,
    parentCommentId?: string
  ): Promise<ExperimentComment | null> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('experiment_comments')
        .insert({
          experiment_id: experimentId,
          user_id: user.user.id,
          comment,
          parent_comment_id: parentCommentId,
        })
        .select()
        .single();

      if (error) throw error;

      // Get experiment to log activity
      const { data: experiment } = await supabase
        .from('shared_experiments')
        .select('project_id')
        .eq('id', experimentId)
        .single();

      if (experiment) {
        await this.logActivity(experiment.project_id, 'comment_added', {
          experiment_id: experimentId,
        });
      }

      return data;
    } catch (error) {
      console.error('Error adding comment:', error);
      return null;
    }
  },

  /**
   * Get comments for an experiment
   */
  async getComments(experimentId: string): Promise<ExperimentComment[]> {
    try {
      const { data, error } = await supabase
        .from('experiment_comments')
        .select('*')
        .eq('experiment_id', experimentId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching comments:', error);
      return [];
    }
  },

  /**
   * Log collaboration activity
   */
  async logActivity(
    projectId: string,
    activityType: CollaborationActivity['activity_type'],
    activityData: Record<string, unknown>
  ): Promise<void> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      await supabase
        .from('collaboration_activity')
        .insert({
          project_id: projectId,
          user_id: user.user.id,
          activity_type: activityType,
          activity_data: activityData,
        });
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  },

  /**
   * Get activity feed for a project
   */
  async getActivityFeed(projectId: string, limit: number = 20): Promise<CollaborationActivity[]> {
    try {
      const { data, error } = await supabase
        .from('collaboration_activity')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching activity feed:', error);
      return [];
    }
  },

  /**
   * Compare experiments
   */
  compareExperiments(experiments: SharedExperiment[]): {
    bestAccuracy: SharedExperiment | null;
    fastestTraining: SharedExperiment | null;
    comparison: {
      experiment: SharedExperiment;
      metrics: {
        accuracy: number;
        loss: number;
        trainingTime: number;
      };
    }[];
  } {
    if (experiments.length === 0) {
      return {
        bestAccuracy: null,
        fastestTraining: null,
        comparison: [],
      };
    }

    const comparison = experiments.map(exp => ({
      experiment: exp,
      metrics: {
        accuracy: (exp.metrics?.accuracy as number) || 0,
        loss: (exp.metrics?.loss as number) || 0,
        trainingTime: (exp.metrics?.trainingTime as number) || 0,
      },
    }));

    const bestAccuracy = comparison.reduce((best, current) =>
      current.metrics.accuracy > best.metrics.accuracy ? current : best
    ).experiment;

    const fastestTraining = comparison.reduce((fastest, current) =>
      current.metrics.trainingTime < fastest.metrics.trainingTime ? current : fastest
    ).experiment;

    return {
      bestAccuracy,
      fastestTraining,
      comparison,
    };
  },
};
