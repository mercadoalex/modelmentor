import { supabase } from '@/db/supabase';

export interface DatasetDownload {
  id: string;
  user_id: string;
  dataset_name: string;
  dataset_url: string;
  platform: string;
  file_path: string | null;
  file_size: number | null;
  format: string | null;
  status: 'pending' | 'downloading' | 'completed' | 'failed';
  progress: number;
  error_message: string | null;
  downloaded_at: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export const datasetDownloadService = {
  async createDownload(
    datasetName: string,
    datasetUrl: string,
    platform: string
  ): Promise<DatasetDownload | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('dataset_downloads')
      .insert({
        user_id: user.id,
        dataset_name: datasetName,
        dataset_url: datasetUrl,
        platform,
        status: 'pending',
        progress: 0
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating download:', error);
      return null;
    }

    return data;
  },

  async startDownload(downloadId: string, datasetUrl: string, datasetName: string, platform: string): Promise<boolean> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session');

      const { data, error } = await supabase.functions.invoke('download-dataset', {
        body: {
          datasetUrl,
          datasetName,
          platform,
          downloadId
        }
      });

      if (error) {
        console.error('Download function error:', error);
        await this.updateDownloadStatus(downloadId, 'failed', 0, error.message);
        return false;
      }

      return data.success;
    } catch (error) {
      console.error('Error starting download:', error);
      await this.updateDownloadStatus(downloadId, 'failed', 0, (error as Error).message);
      return false;
    }
  },

  async updateDownloadStatus(
    downloadId: string,
    status: 'pending' | 'downloading' | 'completed' | 'failed',
    progress: number,
    errorMessage?: string
  ): Promise<void> {
    const updates: any = {
      status,
      progress,
      updated_at: new Date().toISOString()
    };

    if (errorMessage) {
      updates.error_message = errorMessage;
    }

    await supabase
      .from('dataset_downloads')
      .update(updates)
      .eq('id', downloadId);
  },

  async getDownloadById(downloadId: string): Promise<DatasetDownload | null> {
    const { data, error } = await supabase
      .from('dataset_downloads')
      .select('*')
      .eq('id', downloadId)
      .single();

    if (error) {
      console.error('Error fetching download:', error);
      return null;
    }

    return data;
  },

  async getUserDownloads(): Promise<DatasetDownload[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('dataset_downloads')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching downloads:', error);
      return [];
    }

    return data || [];
  },

  async getCompletedDownloads(): Promise<DatasetDownload[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('dataset_downloads')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .gt('expires_at', now) // Not expired
      .order('downloaded_at', { ascending: false });

    if (error) {
      console.error('Error fetching completed downloads:', error);
      return [];
    }

    return data || [];
  },

  async checkExistingDownload(datasetUrl: string): Promise<DatasetDownload | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('dataset_downloads')
      .select('*')
      .eq('user_id', user.id)
      .eq('dataset_url', datasetUrl)
      .eq('status', 'completed')
      .gt('expires_at', now)
      .order('downloaded_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error checking existing download:', error);
      return null;
    }

    return data;
  },

  async deleteDownload(downloadId: string): Promise<boolean> {
    const download = await this.getDownloadById(downloadId);
    if (!download) return false;

    // Delete from storage if file exists
    if (download.file_path) {
      const { error: storageError } = await supabase.storage
        .from('datasets')
        .remove([download.file_path]);

      if (storageError) {
        console.error('Error deleting file from storage:', storageError);
      }
    }

    // Delete from database
    const { error } = await supabase
      .from('dataset_downloads')
      .delete()
      .eq('id', downloadId);

    if (error) {
      console.error('Error deleting download:', error);
      return false;
    }

    return true;
  },

  async getDownloadUrl(filePath: string): Promise<string | null> {
    const { data } = await supabase.storage
      .from('datasets')
      .createSignedUrl(filePath, 3600); // 1 hour expiry

    return data?.signedUrl || null;
  },

  subscribeToDownload(downloadId: string, callback: (download: DatasetDownload) => void) {
    const channel = supabase
      .channel(`download-${downloadId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'dataset_downloads',
          filter: `id=eq.${downloadId}`
        },
        (payload) => {
          callback(payload.new as DatasetDownload);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
};
