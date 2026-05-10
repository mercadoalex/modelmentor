import { supabase } from '@/db/supabase';
import type { SandboxConfiguration, AssignmentCompletion, AssignmentStatus } from '@/types/types';

export interface AssignmentWithCompletion extends SandboxConfiguration {
  completion?: AssignmentCompletion;
  status: AssignmentStatus;
}

export const assignmentService = {
  async getStudentAssignments(userId: string, modelType: string): Promise<AssignmentWithCompletion[]> {
    // Get assignments
    const { data: configs, error: configError } = await supabase
      .from('sandbox_configurations')
      .select('*')
      .eq('is_assignment', true)
      .eq('model_type', modelType)
      .order('created_at', { ascending: false });

    if (configError) throw configError;

    // Get completions
    const { data: completions, error: completionError } = await supabase
      .from('assignment_completions')
      .select('*')
      .eq('student_id', userId);

    if (completionError) throw completionError;

    // Merge
    return (configs || []).map((config) => {
      const completion = completions?.find((c) => c.configuration_id === config.id);
      let status: AssignmentStatus = 'not_started';
      if (completion?.completed_at) status = 'completed';
      else if (completion?.loaded_at) status = 'in_progress';
      return { ...config, completion, status };
    });
  },

  async markAssignmentLoaded(assignmentId: string, userId: string) {
    const now = new Date().toISOString();
    // Check for existing completion
    const { data: existing } = await supabase
      .from('assignment_completions')
      .select('*')
      .eq('configuration_id', assignmentId)
      .eq('student_id', userId)
      .maybeSingle();

    if (existing) {
      await supabase
        .from('assignment_completions')
        .update({
          loaded_at: existing.loaded_at || now,
          updated_at: now,
        })
        .eq('id', existing.id);
    } else {
      await supabase
        .from('assignment_completions')
        .insert({
          configuration_id: assignmentId,
          student_id: userId,
          loaded_at: now,
        });
    }
  },

  async markAssignmentCompleted(completionId: string, loadedAt: string) {
    const now = new Date().toISOString();
    const loaded = new Date(loadedAt);
    const timeSpentSeconds = Math.floor((new Date(now).getTime() - loaded.getTime()) / 1000);

    await supabase
      .from('assignment_completions')
      .update({
        completed_at: now,
        time_spent_seconds: timeSpentSeconds,
        updated_at: now,
      })
      .eq('id', completionId);
  },
};