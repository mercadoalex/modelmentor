import { supabase } from '@/db/supabase';

export type ActivityType = 'view' | 'filter' | 'export' | 'rollback' | 'note';

export interface ActivityLog {
  id: string;
  admin_id: string;
  organization_id: string;
  activity_type: ActivityType;
  metadata: Record<string, any>;
  created_at: string;
}

export interface ActivityCount {
  date: string;
  count: number;
}

export const activityLogService = {
  async log(
    adminId: string,
    organizationId: string,
    activityType: ActivityType,
    metadata: Record<string, any> = {}
  ): Promise<void> {
    const { error } = await supabase
      .from('activity_logs')
      .insert({
        admin_id: adminId,
        organization_id: organizationId,
        activity_type: activityType,
        metadata
      });

    if (error) {
      console.error('Error logging activity:', error);
    }
  },

  async getActivityCounts(
    organizationId: string,
    adminId?: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<ActivityCount[]> {
    let query = supabase
      .from('activity_logs')
      .select('created_at')
      .eq('organization_id', organizationId);

    if (adminId) {
      query = query.eq('admin_id', adminId);
    }

    if (startDate) {
      query = query.gte('created_at', startDate.toISOString());
    }

    if (endDate) {
      query = query.lte('created_at', endDate.toISOString());
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching activity counts:', error);
      return [];
    }

    // Group by date
    const countsByDate: Record<string, number> = {};
    data?.forEach((log) => {
      const date = new Date(log.created_at).toISOString().split('T')[0];
      countsByDate[date] = (countsByDate[date] || 0) + 1;
    });

    return Object.entries(countsByDate).map(([date, count]) => ({
      date,
      count
    }));
  },

  async getTotalCount(
    organizationId: string,
    adminId?: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<number> {
    let query = supabase
      .from('activity_logs')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', organizationId);

    if (adminId) {
      query = query.eq('admin_id', adminId);
    }

    if (startDate) {
      query = query.gte('created_at', startDate.toISOString());
    }

    if (endDate) {
      query = query.lte('created_at', endDate.toISOString());
    }

    const { count, error } = await query;

    if (error) {
      console.error('Error fetching total count:', error);
      return 0;
    }

    return count || 0;
  }
};
