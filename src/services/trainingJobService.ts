import { supabase } from '@/lib/supabase';
import { TIER_LIMITS, SubscriptionTier } from '@/types/subscription';
import type { TrainModelRequest, TrainModelResponse } from '@/types/subscription';

interface TrainingSession {
  id: string;
  project_id: string;
  user_id: string;
  dataset_id: string;
  model_type: string;
  config: Record<string, unknown>;
  epochs: number;
  current_epoch: number;
  accuracy: number | null;
  loss: number | null;
  precision_score: number | null;
  recall_score: number | null;
  f1_score: number | null;
  metrics: Record<string, unknown> | null;
  status: string;
  model_artifact_url: string | null;
  compute_minutes: number | null;
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

interface TrainingProgressEvent {
  epoch: number;
  total_epochs: number;
  loss: number;
  accuracy: number;
  elapsed_seconds: number;
}

export const trainingJobService = {
  /**
   * Submits a training job by validating quota and calling the train-model edge function.
   */
  async submitTrainingJob(
    request: TrainModelRequest,
    userId: string
  ): Promise<TrainModelResponse> {
    const { data, error } = await supabase.functions.invoke('train-model', {
      body: {
        dataset_id: request.dataset_id,
        model_type: request.model_type,
        config: request.config,
      },
    });

    if (error) {
      throw new Error(`Failed to submit training job: ${error.message}`);
    }

    return {
      session_id: data.session_id,
      status: data.status,
      metrics: data.metrics,
      error: data.error,
    };
  },

  /**
   * Validates a training request against tier limits.
   * Checks epochs, dataset rows, and concurrent jobs.
   */
  async validateTrainingRequest(
    request: TrainModelRequest,
    userId: string,
    tier: SubscriptionTier
  ): Promise<{ valid: boolean; errors: string[] }> {
    const limits = TIER_LIMITS[tier];
    const errors: string[] = [];

    // Check epochs against tier limit
    if (limits.max_epochs !== null && request.config.epochs > limits.max_epochs) {
      errors.push(
        `Epochs (${request.config.epochs}) exceeds the ${tier} tier limit of ${limits.max_epochs}.`
      );
    }

    // Check dataset row count against tier limit
    if (limits.max_dataset_rows !== null) {
      const { data: dataset, error: datasetError } = await supabase
        .from('datasets')
        .select('row_count')
        .eq('id', request.dataset_id)
        .eq('user_id', userId)
        .maybeSingle();

      if (datasetError) {
        errors.push(`Failed to fetch dataset: ${datasetError.message}`);
      } else if (!dataset) {
        errors.push('Dataset not found or does not belong to user.');
      } else if (dataset.row_count !== null && dataset.row_count > limits.max_dataset_rows) {
        errors.push(
          `Dataset rows (${dataset.row_count}) exceeds the ${tier} tier limit of ${limits.max_dataset_rows}.`
        );
      }
    }

    // Check concurrent jobs against tier limit
    const { data: runningJobs, error: jobsError } = await supabase
      .from('training_sessions')
      .select('id')
      .eq('user_id', userId)
      .in('status', ['running', 'pending']);

    if (jobsError) {
      errors.push(`Failed to check concurrent jobs: ${jobsError.message}`);
    } else if (runningJobs && runningJobs.length >= limits.max_concurrent_jobs) {
      errors.push(
        `Concurrent job limit reached (${limits.max_concurrent_jobs} for ${tier} tier). Wait for a running job to complete.`
      );
    }

    return { valid: errors.length === 0, errors };
  },

  /**
   * Fetches a training session by ID with its metrics.
   */
  async getTrainingSession(sessionId: string): Promise<TrainingSession | null> {
    const { data, error } = await supabase
      .from('training_sessions')
      .select('*')
      .eq('id', sessionId)
      .maybeSingle();

    if (error) {
      console.error('getTrainingSession error:', error);
      return null;
    }

    return data;
  },

  /**
   * Lists training sessions for a user, optionally filtered by project.
   */
  async listTrainingSessions(
    userId: string,
    projectId?: string
  ): Promise<TrainingSession[]> {
    let query = supabase
      .from('training_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (projectId) {
      query = query.eq('project_id', projectId);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to list training sessions: ${error.message}`);
    }

    return data || [];
  },

  /**
   * Subscribes to real-time progress updates for a training session.
   * Returns an unsubscribe function to clean up the channel.
   */
  subscribeToProgress(
    sessionId: string,
    callback: (event: TrainingProgressEvent) => void
  ): () => void {
    const channel = supabase.channel(`training:${sessionId}`);

    channel
      .on('broadcast', { event: 'progress' }, (payload) => {
        callback(payload.payload as TrainingProgressEvent);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  /**
   * Polls the training session status as a fallback when Realtime disconnects.
   */
  async pollTrainingStatus(sessionId: string): Promise<TrainingSession | null> {
    const { data, error } = await supabase
      .from('training_sessions')
      .select('*')
      .eq('id', sessionId)
      .maybeSingle();

    if (error) {
      console.error('pollTrainingStatus error:', error);
      return null;
    }

    return data;
  },
};
