import { supabase } from '@/db/supabase';
import { datasetDownloadService } from './datasetDownloadService';

export interface DownloadQueue {
  id: string;
  user_id: string;
  name: string;
  status: 'active' | 'paused' | 'completed';
  max_parallel: number;
  created_at: string;
  updated_at: string;
}

export interface DownloadQueueItem {
  id: string;
  queue_id: string;
  download_id: string;
  priority: number;
  retry_count: number;
  max_retries: number;
  status: 'pending' | 'downloading' | 'completed' | 'failed' | 'paused';
  added_at: string;
  started_at: string | null;
  completed_at: string | null;
}

export interface QueueStats {
  total: number;
  pending: number;
  downloading: number;
  completed: number;
  failed: number;
  paused: number;
}

export const downloadQueueService = {
  async createQueue(name: string = 'Download Queue', maxParallel: number = 2): Promise<DownloadQueue | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('download_queue')
      .insert({
        user_id: user.id,
        name,
        max_parallel: maxParallel,
        status: 'active'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating queue:', error);
      return null;
    }

    return data;
  },

  async getOrCreateDefaultQueue(): Promise<DownloadQueue | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Try to get existing active queue
    const { data: existingQueue } = await supabase
      .from('download_queue')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingQueue) return existingQueue;

    // Create new queue if none exists
    return await this.createQueue();
  },

  async addToQueue(
    queueId: string,
    datasetName: string,
    datasetUrl: string,
    platform: string,
    priority: number = 0
  ): Promise<DownloadQueueItem | null> {
    try {
      // Create download record
      const download = await datasetDownloadService.createDownload(
        datasetName,
        datasetUrl,
        platform
      );

      if (!download) {
        throw new Error('Failed to create download');
      }

      // Add to queue
      const { data, error } = await supabase
        .from('download_queue_items')
        .insert({
          queue_id: queueId,
          download_id: download.id,
          priority,
          status: 'pending'
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding to queue:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in addToQueue:', error);
      return null;
    }
  },

  async processQueue(queueId: string): Promise<void> {
    const queue = await this.getQueueById(queueId);
    if (!queue || queue.status !== 'active') return;

    // Get pending items ordered by priority
    const { data: pendingItems } = await supabase
      .from('download_queue_items')
      .select('*, dataset_downloads(*)')
      .eq('queue_id', queueId)
      .eq('status', 'pending')
      .order('priority', { ascending: false })
      .order('added_at', { ascending: true });

    if (!pendingItems || pendingItems.length === 0) {
      // Check if all items are completed
      const stats = await this.getQueueStats(queueId);
      if (stats.pending === 0 && stats.downloading === 0) {
        await this.updateQueueStatus(queueId, 'completed');
      }
      return;
    }

    // Get currently downloading items
    const { data: downloadingItems } = await supabase
      .from('download_queue_items')
      .select('*')
      .eq('queue_id', queueId)
      .eq('status', 'downloading');

    const currentlyDownloading = downloadingItems?.length || 0;
    const availableSlots = queue.max_parallel - currentlyDownloading;

    if (availableSlots <= 0) return;

    // Start downloads for available slots
    const itemsToStart = pendingItems.slice(0, availableSlots);

    for (const item of itemsToStart) {
      await this.startQueueItem(item);
    }
  },

  async startQueueItem(item: any): Promise<void> {
    try {
      // Update item status to downloading
      await supabase
        .from('download_queue_items')
        .update({
          status: 'downloading',
          started_at: new Date().toISOString()
        })
        .eq('id', item.id);

      const download = item.dataset_downloads;
      
      // Start the download
      const success = await datasetDownloadService.startDownload(
        download.id,
        download.dataset_url,
        download.dataset_name,
        download.platform
      );

      if (success) {
        // Subscribe to download completion
        this.subscribeToDownloadCompletion(item.id, download.id, item.queue_id);
      } else {
        await this.handleQueueItemFailure(item.id, item.queue_id);
      }
    } catch (error) {
      console.error('Error starting queue item:', error);
      await this.handleQueueItemFailure(item.id, item.queue_id);
    }
  },

  subscribeToDownloadCompletion(itemId: string, downloadId: string, queueId: string) {
    const channel = supabase
      .channel(`queue-item-${itemId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'dataset_downloads',
          filter: `id=eq.${downloadId}`
        },
        async (payload) => {
          const download = payload.new as any;
          
          if (download.status === 'completed') {
            await supabase
              .from('download_queue_items')
              .update({
                status: 'completed',
                completed_at: new Date().toISOString()
              })
              .eq('id', itemId);

            // Process next items in queue
            await this.processQueue(queueId);
          } else if (download.status === 'failed') {
            await this.handleQueueItemFailure(itemId, queueId);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  async handleQueueItemFailure(itemId: string, queueId: string): Promise<void> {
    const { data: item } = await supabase
      .from('download_queue_items')
      .select('*')
      .eq('id', itemId)
      .single();

    if (!item) return;

    const newRetryCount = item.retry_count + 1;

    if (newRetryCount < item.max_retries) {
      // Retry with exponential backoff
      const backoffMs = Math.pow(2, newRetryCount) * 1000; // 2s, 4s, 8s...
      
      await supabase
        .from('download_queue_items')
        .update({
          status: 'pending',
          retry_count: newRetryCount
        })
        .eq('id', itemId);

      setTimeout(() => {
        this.processQueue(queueId);
      }, backoffMs);
    } else {
      // Max retries reached, mark as failed
      await supabase
        .from('download_queue_items')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString()
        })
        .eq('id', itemId);

      // Continue processing queue
      await this.processQueue(queueId);
    }
  },

  async pauseQueue(queueId: string): Promise<boolean> {
    const { error } = await supabase
      .from('download_queue')
      .update({
        status: 'paused',
        updated_at: new Date().toISOString()
      })
      .eq('id', queueId);

    if (error) {
      console.error('Error pausing queue:', error);
      return false;
    }

    // Pause all downloading items
    await supabase
      .from('download_queue_items')
      .update({ status: 'paused' })
      .eq('queue_id', queueId)
      .in('status', ['pending', 'downloading']);

    return true;
  },

  async resumeQueue(queueId: string): Promise<boolean> {
    const { error } = await supabase
      .from('download_queue')
      .update({
        status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('id', queueId);

    if (error) {
      console.error('Error resuming queue:', error);
      return false;
    }

    // Resume paused items
    await supabase
      .from('download_queue_items')
      .update({ status: 'pending' })
      .eq('queue_id', queueId)
      .eq('status', 'paused');

    // Start processing
    await this.processQueue(queueId);

    return true;
  },

  async updateQueueStatus(queueId: string, status: 'active' | 'paused' | 'completed'): Promise<void> {
    await supabase
      .from('download_queue')
      .update({
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', queueId);
  },

  async getQueueById(queueId: string): Promise<DownloadQueue | null> {
    const { data, error } = await supabase
      .from('download_queue')
      .select('*')
      .eq('id', queueId)
      .single();

    if (error) {
      console.error('Error fetching queue:', error);
      return null;
    }

    return data;
  },

  async getUserQueues(): Promise<DownloadQueue[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('download_queue')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching queues:', error);
      return [];
    }

    return data || [];
  },

  async getQueueItems(queueId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('download_queue_items')
      .select('*, dataset_downloads(*)')
      .eq('queue_id', queueId)
      .order('priority', { ascending: false })
      .order('added_at', { ascending: true });

    if (error) {
      console.error('Error fetching queue items:', error);
      return [];
    }

    return data || [];
  },

  async getQueueStats(queueId: string): Promise<QueueStats> {
    const items = await this.getQueueItems(queueId);

    return {
      total: items.length,
      pending: items.filter(i => i.status === 'pending').length,
      downloading: items.filter(i => i.status === 'downloading').length,
      completed: items.filter(i => i.status === 'completed').length,
      failed: items.filter(i => i.status === 'failed').length,
      paused: items.filter(i => i.status === 'paused').length
    };
  },

  async updateItemPriority(itemId: string, priority: number): Promise<boolean> {
    const { error } = await supabase
      .from('download_queue_items')
      .update({ priority })
      .eq('id', itemId);

    if (error) {
      console.error('Error updating priority:', error);
      return false;
    }

    return true;
  },

  async removeFromQueue(itemId: string): Promise<boolean> {
    const { error } = await supabase
      .from('download_queue_items')
      .delete()
      .eq('id', itemId);

    if (error) {
      console.error('Error removing from queue:', error);
      return false;
    }

    return true;
  },

  async deleteQueue(queueId: string): Promise<boolean> {
    const { error } = await supabase
      .from('download_queue')
      .delete()
      .eq('id', queueId);

    if (error) {
      console.error('Error deleting queue:', error);
      return false;
    }

    return true;
  }
};
