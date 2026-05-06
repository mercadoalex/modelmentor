import { supabase } from '@/db/supabase';
import type { ModelVersion } from '@/types/types';

export interface VersionChanges {
  data?: {
    feature_count?: { old: number; new: number };
    sample_count?: { old: number; new: number };
    class_labels?: { old: string[]; new: string[] };
  };
  hyperparameters?: {
    epochs?: { old: number; new: number };
    batch_size?: { old: number; new: number };
    learning_rate?: { old: number; new: number };
  };
  performance?: {
    accuracy?: { old: number; new: number; change: number };
    loss?: { old: number; new: number; change: number };
  };
}

export interface VersionComparison {
  version1: ModelVersion;
  version2: ModelVersion;
  changes: VersionChanges;
  performanceImprovement: boolean;
  summary: string[];
}

export const modelVersionService = {
  /**
   * Create a new model version
   */
  async createVersion(
    projectId: string,
    versionData: Partial<ModelVersion>
  ): Promise<ModelVersion | null> {
    try {
      // Get the next version number
      const { data: versions } = await supabase
        .from('model_versions')
        .select('version_number')
        .eq('project_id', projectId)
        .order('version_number', { ascending: false })
        .limit(1);

      const nextVersionNumber = versions && versions.length > 0 
        ? versions[0].version_number + 1 
        : 1;

      // Get previous version for change tracking
      const previousVersion = versions && versions.length > 0
        ? await this.getVersion(projectId, versions[0].version_number)
        : null;

      // Calculate changes from previous version
      const changes = previousVersion
        ? this.calculateChanges(previousVersion, versionData as ModelVersion)
        : null;

      // Deactivate all previous versions
      await supabase
        .from('model_versions')
        .update({ is_active: false })
        .eq('project_id', projectId);

      // Create new version
      const { data, error } = await supabase
        .from('model_versions')
        .insert({
          project_id: projectId,
          version_number: nextVersionNumber,
          version_name: versionData.version_name || `v${nextVersionNumber}`,
          ...versionData,
          changes_from_previous: changes,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating model version:', error);
      return null;
    }
  },

  /**
   * Get all versions for a project
   */
  async getVersions(projectId: string): Promise<ModelVersion[]> {
    try {
      const { data, error } = await supabase
        .from('model_versions')
        .select('*')
        .eq('project_id', projectId)
        .order('version_number', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching model versions:', error);
      return [];
    }
  },

  /**
   * Get a specific version
   */
  async getVersion(projectId: string, versionNumber: number): Promise<ModelVersion | null> {
    try {
      const { data, error } = await supabase
        .from('model_versions')
        .select('*')
        .eq('project_id', projectId)
        .eq('version_number', versionNumber)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching model version:', error);
      return null;
    }
  },

  /**
   * Get active version
   */
  async getActiveVersion(projectId: string): Promise<ModelVersion | null> {
    try {
      const { data, error } = await supabase
        .from('model_versions')
        .select('*')
        .eq('project_id', projectId)
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching active version:', error);
      return null;
    }
  },

  /**
   * Rollback to a previous version
   */
  async rollbackToVersion(projectId: string, versionNumber: number): Promise<boolean> {
    try {
      // Deactivate all versions
      await supabase
        .from('model_versions')
        .update({ is_active: false })
        .eq('project_id', projectId);

      // Activate the target version
      const { error } = await supabase
        .from('model_versions')
        .update({ is_active: true })
        .eq('project_id', projectId)
        .eq('version_number', versionNumber);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error rolling back version:', error);
      return false;
    }
  },

  /**
   * Compare two versions
   */
  async compareVersions(
    projectId: string,
    version1Number: number,
    version2Number: number
  ): Promise<VersionComparison | null> {
    try {
      const version1 = await this.getVersion(projectId, version1Number);
      const version2 = await this.getVersion(projectId, version2Number);

      if (!version1 || !version2) return null;

      const changes = this.calculateChanges(version1, version2);
      const performanceImprovement = (version2.accuracy || 0) > (version1.accuracy || 0);
      const summary = this.generateComparisonSummary(version1, version2, changes);

      return {
        version1,
        version2,
        changes,
        performanceImprovement,
        summary,
      };
    } catch (error) {
      console.error('Error comparing versions:', error);
      return null;
    }
  },

  /**
   * Calculate changes between versions
   */
  calculateChanges(oldVersion: ModelVersion, newVersion: ModelVersion): VersionChanges {
    const changes: VersionChanges = {};

    // Data changes
    if (oldVersion.feature_count !== newVersion.feature_count ||
        oldVersion.sample_count !== newVersion.sample_count) {
      changes.data = {};
      
      if (oldVersion.feature_count !== newVersion.feature_count) {
        changes.data.feature_count = {
          old: oldVersion.feature_count || 0,
          new: newVersion.feature_count || 0,
        };
      }
      
      if (oldVersion.sample_count !== newVersion.sample_count) {
        changes.data.sample_count = {
          old: oldVersion.sample_count || 0,
          new: newVersion.sample_count || 0,
        };
      }
    }

    // Hyperparameter changes
    if (oldVersion.epochs !== newVersion.epochs ||
        oldVersion.batch_size !== newVersion.batch_size ||
        oldVersion.learning_rate !== newVersion.learning_rate) {
      changes.hyperparameters = {};
      
      if (oldVersion.epochs !== newVersion.epochs) {
        changes.hyperparameters.epochs = {
          old: oldVersion.epochs || 0,
          new: newVersion.epochs || 0,
        };
      }
      
      if (oldVersion.batch_size !== newVersion.batch_size) {
        changes.hyperparameters.batch_size = {
          old: oldVersion.batch_size || 0,
          new: newVersion.batch_size || 0,
        };
      }
      
      if (oldVersion.learning_rate !== newVersion.learning_rate) {
        changes.hyperparameters.learning_rate = {
          old: oldVersion.learning_rate || 0,
          new: newVersion.learning_rate || 0,
        };
      }
    }

    // Performance changes
    if (oldVersion.accuracy !== newVersion.accuracy ||
        oldVersion.loss !== newVersion.loss) {
      changes.performance = {};
      
      if (oldVersion.accuracy !== newVersion.accuracy) {
        const oldAcc = oldVersion.accuracy || 0;
        const newAcc = newVersion.accuracy || 0;
        changes.performance.accuracy = {
          old: oldAcc,
          new: newAcc,
          change: newAcc - oldAcc,
        };
      }
      
      if (oldVersion.loss !== newVersion.loss) {
        const oldLoss = oldVersion.loss || 0;
        const newLoss = newVersion.loss || 0;
        changes.performance.loss = {
          old: oldLoss,
          new: newLoss,
          change: newLoss - oldLoss,
        };
      }
    }

    return changes;
  },

  /**
   * Generate comparison summary
   */
  generateComparisonSummary(
    version1: ModelVersion,
    version2: ModelVersion,
    changes: VersionChanges
  ): string[] {
    const summary: string[] = [];

    // Performance summary
    if (changes.performance?.accuracy) {
      const change = changes.performance.accuracy.change;
      if (change > 0) {
        summary.push(`Accuracy improved by ${(change * 100).toFixed(2)}%`);
      } else if (change < 0) {
        summary.push(`Accuracy decreased by ${(Math.abs(change) * 100).toFixed(2)}%`);
      }
    }

    if (changes.performance?.loss) {
      const change = changes.performance.loss.change;
      if (change < 0) {
        summary.push(`Loss improved (decreased) by ${Math.abs(change).toFixed(4)}`);
      } else if (change > 0) {
        summary.push(`Loss worsened (increased) by ${change.toFixed(4)}`);
      }
    }

    // Data changes summary
    if (changes.data?.sample_count) {
      const diff = changes.data.sample_count.new - changes.data.sample_count.old;
      summary.push(`Training data ${diff > 0 ? 'increased' : 'decreased'} by ${Math.abs(diff)} samples`);
    }

    if (changes.data?.feature_count) {
      const diff = changes.data.feature_count.new - changes.data.feature_count.old;
      summary.push(`Feature count ${diff > 0 ? 'increased' : 'decreased'} by ${Math.abs(diff)}`);
    }

    // Hyperparameter changes summary
    if (changes.hyperparameters?.epochs) {
      summary.push(`Epochs changed from ${changes.hyperparameters.epochs.old} to ${changes.hyperparameters.epochs.new}`);
    }

    if (changes.hyperparameters?.learning_rate) {
      summary.push(`Learning rate changed from ${changes.hyperparameters.learning_rate.old} to ${changes.hyperparameters.learning_rate.new}`);
    }

    if (summary.length === 0) {
      summary.push('No significant changes detected');
    }

    return summary;
  },

  /**
   * Update version notes
   */
  async updateVersionNotes(
    projectId: string,
    versionNumber: number,
    notes: string
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('model_versions')
        .update({ notes })
        .eq('project_id', projectId)
        .eq('version_number', versionNumber);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating version notes:', error);
      return false;
    }
  },

  /**
   * Delete a version
   */
  async deleteVersion(projectId: string, versionNumber: number): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('model_versions')
        .delete()
        .eq('project_id', projectId)
        .eq('version_number', versionNumber);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting version:', error);
      return false;
    }
  },
};
