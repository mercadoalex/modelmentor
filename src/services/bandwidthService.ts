import { supabase } from '@/db/supabase';

export interface BandwidthSettings {
  id: string;
  user_id: string;
  max_bandwidth_mbps: number;
  throttle_enabled: boolean;
  download_schedule: {
    enabled: boolean;
    start_hour: number;
    end_hour: number;
  };
  pause_on_low_battery: boolean;
  created_at: string;
  updated_at: string;
}

export interface BandwidthUsage {
  id: string;
  user_id: string;
  download_id: string;
  bytes_downloaded: number;
  download_speed_mbps: number;
  started_at: string;
  completed_at: string | null;
  created_at: string;
}

export interface BandwidthStats {
  total_downloaded_gb: number;
  average_speed_mbps: number;
  peak_speed_mbps: number;
  download_count: number;
}

export const bandwidthService = {
  async getOrCreateSettings(): Promise<BandwidthSettings | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Try to get existing settings
    const { data: existing } = await supabase
      .from('bandwidth_settings')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (existing) return existing;

    // Create default settings
    const { data, error } = await supabase
      .from('bandwidth_settings')
      .insert({
        user_id: user.id,
        max_bandwidth_mbps: 10.0,
        throttle_enabled: false,
        download_schedule: {
          enabled: false,
          start_hour: 22,
          end_hour: 6
        },
        pause_on_low_battery: false
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating bandwidth settings:', error);
      return null;
    }

    return data;
  },

  async updateSettings(settings: Partial<BandwidthSettings>): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase
      .from('bandwidth_settings')
      .update({
        ...settings,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id);

    if (error) {
      console.error('Error updating bandwidth settings:', error);
      return false;
    }

    return true;
  },

  async getStats(days: number = 30): Promise<BandwidthStats | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase.rpc('get_bandwidth_stats', {
      p_user_id: user.id,
      p_days: days
    });

    if (error) {
      console.error('Error fetching bandwidth stats:', error);
      return null;
    }

    return data?.[0] || null;
  },

  async trackDownload(downloadId: string, bytesDownloaded: number, speedMbps: number): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('bandwidth_usage')
      .insert({
        user_id: user.id,
        download_id: downloadId,
        bytes_downloaded: bytesDownloaded,
        download_speed_mbps: speedMbps,
        completed_at: new Date().toISOString()
      });
  },

  async getRecentUsage(limit: number = 10): Promise<BandwidthUsage[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('bandwidth_usage')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching bandwidth usage:', error);
      return [];
    }

    return data || [];
  },

  isWithinSchedule(settings: BandwidthSettings): boolean {
    if (!settings.download_schedule.enabled) return true;

    const now = new Date();
    const currentHour = now.getHours();
    const { start_hour, end_hour } = settings.download_schedule;

    // Handle overnight schedules (e.g., 22:00 to 6:00)
    if (start_hour > end_hour) {
      return currentHour >= start_hour || currentHour < end_hour;
    }

    return currentHour >= start_hour && currentHour < end_hour;
  },

  async checkBatteryStatus(): Promise<{ charging: boolean; level: number }> {
    if ('getBattery' in navigator) {
      try {
        const battery = await (navigator as any).getBattery();
        return {
          charging: battery.charging,
          level: battery.level
        };
      } catch (error) {
        console.error('Error checking battery:', error);
      }
    }
    return { charging: true, level: 1 }; // Default to charging/full
  },

  async shouldAllowDownload(settings: BandwidthSettings): Promise<{ allowed: boolean; reason?: string }> {
    // Check schedule
    if (!this.isWithinSchedule(settings)) {
      return {
        allowed: false,
        reason: 'Outside scheduled download hours'
      };
    }

    // Check battery
    if (settings.pause_on_low_battery) {
      const battery = await this.checkBatteryStatus();
      if (!battery.charging && battery.level < 0.2) {
        return {
          allowed: false,
          reason: 'Low battery (below 20%)'
        };
      }
    }

    return { allowed: true };
  },

  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  },

  formatSpeed(mbps: number): string {
    if (mbps < 1) {
      return `${(mbps * 1024).toFixed(0)} Kbps`;
    }
    return `${mbps.toFixed(2)} Mbps`;
  }
};
