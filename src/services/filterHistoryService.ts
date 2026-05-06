import { supabase } from '@/db/supabase';

export interface FilterHistory {
  id: string;
  organization_id: string;
  admin_id: string;
  filter_url: string;
  accessed_at: string;
  created_at: string;
}

export interface FilterHistoryStats {
  totalFilters: number;
  uniqueFilters: number;
  mostCommonFilter: { filter_url: string; count: number } | null;
  averageFiltersPerDay: number;
}

export const filterHistoryService = {
  async addOrUpdate(
    organizationId: string,
    adminId: string,
    filterUrl: string
  ): Promise<void> {
    // Try to update existing entry
    const { data: existing } = await supabase
      .from('filter_history')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('admin_id', adminId)
      .eq('filter_url', filterUrl)
      .maybeSingle();

    if (existing) {
      // Update accessed_at
      await supabase
        .from('filter_history')
        .update({ accessed_at: new Date().toISOString() })
        .eq('id', existing.id);
    } else {
      // Insert new entry
      await supabase
        .from('filter_history')
        .insert({
          organization_id: organizationId,
          admin_id: adminId,
          filter_url: filterUrl,
          accessed_at: new Date().toISOString()
        });
    }
  },

  async getRecent(
    organizationId: string,
    adminId: string,
    limit: number = 10
  ): Promise<FilterHistory[]> {
    const { data, error } = await supabase
      .from('filter_history')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('admin_id', adminId)
      .order('accessed_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching filter history:', error);
      return [];
    }

    return data || [];
  },

  async getByDateRange(
    organizationId: string,
    adminId: string | null,
    startDate?: Date,
    endDate?: Date
  ): Promise<FilterHistory[]> {
    let query = supabase
      .from('filter_history')
      .select('*')
      .eq('organization_id', organizationId);

    if (adminId) {
      query = query.eq('admin_id', adminId);
    }

    if (startDate) {
      query = query.gte('accessed_at', startDate.toISOString());
    }

    if (endDate) {
      query = query.lte('accessed_at', endDate.toISOString());
    }

    query = query.order('accessed_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching filter history by date range:', error);
      return [];
    }

    return data || [];
  },

  async getStatistics(
    organizationId: string,
    adminId: string | null,
    startDate?: Date,
    endDate?: Date
  ): Promise<FilterHistoryStats> {
    const history = await this.getByDateRange(organizationId, adminId, startDate, endDate);

    if (history.length === 0) {
      return {
        totalFilters: 0,
        uniqueFilters: 0,
        mostCommonFilter: null,
        averageFiltersPerDay: 0
      };
    }

    // Count unique filters
    const uniqueFilters = new Set(history.map(h => h.filter_url)).size;

    // Find most common filter
    const filterCounts: Record<string, number> = {};
    history.forEach(h => {
      filterCounts[h.filter_url] = (filterCounts[h.filter_url] || 0) + 1;
    });

    const mostCommonEntry = Object.entries(filterCounts).reduce((max, [url, count]) =>
      count > (max?.count || 0) ? { filter_url: url, count } : max
    , { filter_url: '', count: 0 });

    // Calculate average filters per day
    const dates = history.map(h => new Date(h.accessed_at).toISOString().split('T')[0]);
    const uniqueDays = new Set(dates).size;
    const averageFiltersPerDay = uniqueDays > 0 ? history.length / uniqueDays : 0;

    return {
      totalFilters: history.length,
      uniqueFilters,
      mostCommonFilter: mostCommonEntry.count > 0 ? mostCommonEntry : null,
      averageFiltersPerDay: Math.round(averageFiltersPerDay * 10) / 10
    };
  },

  async clearAll(organizationId: string, adminId: string): Promise<void> {
    const { error } = await supabase
      .from('filter_history')
      .delete()
      .eq('organization_id', organizationId)
      .eq('admin_id', adminId);

    if (error) {
      console.error('Error clearing filter history:', error);
    }
  },

  async pruneOld(): Promise<void> {
    const { error } = await supabase.rpc('prune_old_filter_history');

    if (error) {
      console.error('Error pruning old filter history:', error);
    }
  }
};
