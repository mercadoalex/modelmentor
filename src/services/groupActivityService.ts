import { supabase } from '@/db/supabase';
import type { GroupActivity, GroupActivityType, Profile } from '@/types/types';

export const groupActivityService = {
  async log(
    groupId: string,
    userId: string,
    targetUserId: string,
    actionType: GroupActivityType,
    notes?: string
  ): Promise<boolean> {
    const { error } = await supabase
      .from('group_activity_log')
      .insert({
        group_id: groupId,
        user_id: userId,
        target_user_id: targetUserId,
        action_type: actionType,
        notes: notes || null
      });

    if (error) {
      console.error('Error logging activity:', error);
      return false;
    }
    return true;
  },

  async getByGroup(
    groupId: string,
    limit: number = 20,
    offset: number = 0,
    actionType?: GroupActivityType,
    startDate?: Date,
    endDate?: Date
  ): Promise<Array<GroupActivity & { actor?: Profile; target?: Profile }>> {
    let query = supabase
      .from('group_activity_log')
      .select(`
        *,
        actor:profiles!user_id (*),
        target:profiles!target_user_id (*)
      `)
      .eq('group_id', groupId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (actionType) {
      query = query.eq('action_type', actionType);
    }

    if (startDate) {
      query = query.gte('created_at', startDate.toISOString());
    }

    if (endDate) {
      query = query.lte('created_at', endDate.toISOString());
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching activity log:', error);
      return [];
    }

    if (!data) return [];

    return data.map((item: any) => ({
      ...item,
      actor: Array.isArray(item.actor) ? item.actor[0] : item.actor,
      target: Array.isArray(item.target) ? item.target[0] : item.target
    }));
  },

  async getCount(
    groupId: string,
    actionType?: GroupActivityType,
    startDate?: Date,
    endDate?: Date
  ): Promise<number> {
    let query = supabase
      .from('group_activity_log')
      .select('*', { count: 'exact', head: true })
      .eq('group_id', groupId);

    if (actionType) {
      query = query.eq('action_type', actionType);
    }

    if (startDate) {
      query = query.gte('created_at', startDate.toISOString());
    }

    if (endDate) {
      query = query.lte('created_at', endDate.toISOString());
    }

    const { count, error } = await query;

    if (error) {
      console.error('Error getting activity count:', error);
      return 0;
    }
    return count || 0;
  },

  async addNote(activityId: string, notes: string): Promise<boolean> {
    const { error } = await supabase
      .from('group_activity_log')
      .update({ notes })
      .eq('id', activityId);

    if (error) {
      console.error('Error adding note:', error);
      return false;
    }
    return true;
  },

  async exportToCSV(groupId: string): Promise<string> {
    const activities = await this.getByGroup(groupId, 1000, 0);
    
    const headers = ['Date', 'Actor', 'Action', 'Target', 'Notes'];
    const rows = activities.map(activity => [
      new Date(activity.created_at).toLocaleString(),
      `${activity.actor?.first_name} ${activity.actor?.last_name}`,
      activity.action_type.replace(/_/g, ' '),
      `${activity.target?.first_name} ${activity.target?.last_name}`,
      activity.notes || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    return csvContent;
  }
};
