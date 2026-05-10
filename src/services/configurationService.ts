import { supabase } from '@/db/supabase';
import type { SandboxConfiguration } from '@/types/types';

// ─────────────────────────────────────────────────────────────────────────────
// configurationService — all DB operations for sandbox_configurations
// and shared_configurations tables
// ─────────────────────────────────────────────────────────────────────────────
export const configurationService = {

  // ── Save a new configuration ──────────────────────────────────────────────
  async save(params: {
    name:          string;
    description?:  string;
    learningRate:  number;
    normalization: boolean;
    batchSize:     number;
    epochs:        number;
    failureMode:   string;
  }): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('sandbox_configurations')
      .insert({
        user_id:       user.id,
        name:          params.name.trim(),
        description:   params.description?.trim() || null,
        model_type:    'image_classification',
        learning_rate: params.learningRate,
        normalization: params.normalization,
        batch_size:    params.batchSize,
        epochs:        params.epochs,
        failure_mode:  params.failureMode,
      });

    if (error) throw error;
  },

  // ── Load all configurations for the current user ──────────────────────────
  async list(): Promise<SandboxConfiguration[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('sandbox_configurations')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data ?? [];
  },

  // ── Delete a configuration by ID ──────────────────────────────────────────
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('sandbox_configurations')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // ── Mark a configuration as an assignment (teachers only) ─────────────────
  async markAsAssignment(id: string): Promise<void> {
    const { error } = await supabase
      .from('sandbox_configurations')
      .update({ is_assignment: true })
      .eq('id', id);

    if (error) throw error;
  },

  // ── Generate or retrieve a share token for a configuration ────────────────
  async getOrCreateShareToken(configurationId: string): Promise<string> {
    // Check if a share record already exists
    const { data: existing } = await supabase
      .from('shared_configurations')
      .select('share_token')
      .eq('configuration_id', configurationId)
      .maybeSingle();

    if (existing) return existing.share_token;

    // Create a new share record — DB generates the token via DEFAULT
    const { data, error } = await supabase
      .from('shared_configurations')
      .insert({ configuration_id: configurationId, is_assignment: false })
      .select('share_token')
      .single();

    if (error) throw error;
    return data.share_token;
  },

  // ── Load a shared configuration by token (public, no auth needed) ─────────
  async getByShareToken(token: string): Promise<SandboxConfiguration | null> {
    const { data, error } = await supabase
      .from('shared_configurations')
      .select('*, sandbox_configurations(*)')
      .eq('share_token', token)
      .single();

    if (error || !data) return null;
    return data.sandbox_configurations as SandboxConfiguration;
  },
};