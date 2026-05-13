import { supabase } from '@/lib/supabase';
import { TIER_LIMITS, SubscriptionTier } from '@/types/subscription';
import { validateFileFormat, buildUserScopedPath } from '@/utils/subscriptionUtils';

interface Dataset {
  id: string;
  project_id: string | null;
  user_id: string;
  file_name: string;
  file_url: string;
  file_size_bytes: number;
  file_format: string;
  row_count: number | null;
  created_at: string;
  updated_at: string;
}

export const datasetStorageService = {
  /**
   * Validates a file upload against format and tier size limits.
   * Returns whether the upload is valid and an error message if not.
   */
  validateUpload(
    file: File,
    tier: SubscriptionTier
  ): { valid: boolean; error?: string } {
    if (!validateFileFormat(file.name)) {
      return { valid: false, error: 'Invalid file format. Allowed formats: csv, json, zip.' };
    }

    const limits = TIER_LIMITS[tier];
    if (limits.max_file_size_mb !== null) {
      const fileSizeMb = file.size / (1024 * 1024);
      if (fileSizeMb > limits.max_file_size_mb) {
        return {
          valid: false,
          error: `File size exceeds the ${limits.max_file_size_mb}MB limit for the ${tier} tier.`,
        };
      }
    }

    return { valid: true };
  },

  /**
   * Returns the total storage used by a user in megabytes.
   * Sums file_size_bytes from the datasets table for the given user.
   */
  async getStorageUsed(userId: string): Promise<number> {
    const { data, error } = await supabase
      .from('datasets')
      .select('file_size_bytes')
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to get storage usage: ${error.message}`);
    }

    const totalBytes = (data || []).reduce(
      (sum, row) => sum + (row.file_size_bytes || 0),
      0
    );

    return totalBytes / (1024 * 1024);
  },

  /**
   * Checks whether a new file upload would exceed the user's storage quota.
   * Returns whether the upload is allowed and the remaining storage in MB.
   */
  async checkStorageQuota(
    userId: string,
    tier: SubscriptionTier,
    newFileSize: number
  ): Promise<{ allowed: boolean; remaining: number }> {
    const limits = TIER_LIMITS[tier];

    if (limits.max_storage_mb === null) {
      return { allowed: true, remaining: Infinity };
    }

    const usedMb = await this.getStorageUsed(userId);
    const newFileMb = newFileSize / (1024 * 1024);
    const remaining = limits.max_storage_mb - usedMb;

    return {
      allowed: usedMb + newFileMb <= limits.max_storage_mb,
      remaining: Math.max(0, remaining),
    };
  },

  /**
   * Uploads a dataset file to the user-datasets bucket and inserts a record in the datasets table.
   * Validates file format and size before uploading.
   */
  async uploadDataset(
    file: File,
    userId: string,
    projectId?: string
  ): Promise<{ url: string; datasetId: string }> {
    const filePath = buildUserScopedPath(userId, file.name);

    const { error: uploadError } = await supabase.storage
      .from('user-datasets')
      .upload(filePath, file);

    if (uploadError) {
      throw new Error(`Failed to upload dataset: ${uploadError.message}`);
    }

    const { data: urlData } = supabase.storage
      .from('user-datasets')
      .getPublicUrl(filePath);

    const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';

    const { data, error: insertError } = await supabase
      .from('datasets')
      .insert({
        user_id: userId,
        project_id: projectId || null,
        file_name: file.name,
        file_url: urlData.publicUrl,
        file_size_bytes: file.size,
        file_format: fileExtension,
        row_count: null,
      })
      .select('id')
      .single();

    if (insertError) {
      // Attempt to clean up the uploaded file on insert failure
      await supabase.storage.from('user-datasets').remove([filePath]);
      throw new Error(`Failed to create dataset record: ${insertError.message}`);
    }

    return { url: urlData.publicUrl, datasetId: data.id };
  },

  /**
   * Returns all datasets belonging to a user.
   */
  async listDatasets(userId: string): Promise<Dataset[]> {
    const { data, error } = await supabase
      .from('datasets')
      .select('id, project_id, user_id, file_name, file_url, file_size_bytes, file_format, row_count, created_at, updated_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to list datasets: ${error.message}`);
    }

    return data || [];
  },

  /**
   * Deletes a dataset file from storage and removes the record from the database.
   */
  async deleteDataset(datasetId: string, userId: string): Promise<void> {
    const { data: dataset, error: fetchError } = await supabase
      .from('datasets')
      .select('file_name')
      .eq('id', datasetId)
      .eq('user_id', userId)
      .single();

    if (fetchError) {
      throw new Error(`Failed to find dataset: ${fetchError.message}`);
    }

    const filePath = buildUserScopedPath(userId, dataset.file_name);

    const { error: storageError } = await supabase.storage
      .from('user-datasets')
      .remove([filePath]);

    if (storageError) {
      throw new Error(`Failed to delete file from storage: ${storageError.message}`);
    }

    const { error: deleteError } = await supabase
      .from('datasets')
      .delete()
      .eq('id', datasetId)
      .eq('user_id', userId);

    if (deleteError) {
      throw new Error(`Failed to delete dataset record: ${deleteError.message}`);
    }
  },

  /**
   * Returns a signed URL for accessing a dataset file.
   */
  async getDatasetUrl(datasetId: string, userId: string): Promise<string> {
    const { data: dataset, error: fetchError } = await supabase
      .from('datasets')
      .select('file_name')
      .eq('id', datasetId)
      .eq('user_id', userId)
      .single();

    if (fetchError) {
      throw new Error(`Failed to find dataset: ${fetchError.message}`);
    }

    const filePath = buildUserScopedPath(userId, dataset.file_name);

    const { data, error: signError } = await supabase.storage
      .from('user-datasets')
      .createSignedUrl(filePath, 3600); // 1 hour expiry

    if (signError) {
      throw new Error(`Failed to create signed URL: ${signError.message}`);
    }

    return data.signedUrl;
  },
};
