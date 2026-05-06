import { supabase } from '@/db/supabase';
import type { BulkAction, BulkActionType, BulkActionItemStatus, Profile } from '@/types/types';

export const bulkActionService = {
  async create(
    organizationId: string,
    adminId: string,
    actionType: BulkActionType,
    requestCount: number,
    successCount: number,
    failedCount: number,
    message?: string
  ): Promise<string | null> {
    const { data, error } = await supabase
      .from('bulk_actions')
      .insert({
        organization_id: organizationId,
        admin_id: adminId,
        action_type: actionType,
        request_count: requestCount,
        success_count: successCount,
        failed_count: failedCount,
        message: message || null
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error creating bulk action:', error);
      return null;
    }
    return data?.id || null;
  },

  async addItems(
    bulkActionId: string,
    items: Array<{ requestId: string; status: BulkActionItemStatus; errorMessage?: string }>
  ): Promise<boolean> {
    const itemsData = items.map(item => ({
      bulk_action_id: bulkActionId,
      request_id: item.requestId,
      status: item.status,
      error_message: item.errorMessage || null
    }));

    const { error } = await supabase
      .from('bulk_action_items')
      .insert(itemsData);

    if (error) {
      console.error('Error adding bulk action items:', error);
      return false;
    }
    return true;
  },

  async getByOrganization(
    organizationId: string,
    limit: number = 20,
    offset: number = 0,
    actionType?: BulkActionType,
    startDate?: Date,
    endDate?: Date
  ): Promise<Array<BulkAction & { admin?: Profile }>> {
    let query = supabase
      .from('bulk_actions')
      .select(`
        *,
        admin:profiles!admin_id (*)
      `)
      .eq('organization_id', organizationId)
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
      console.error('Error fetching bulk actions:', error);
      return [];
    }

    if (!data) return [];

    return data.map((item: any) => ({
      ...item,
      admin: Array.isArray(item.admin) ? item.admin[0] : item.admin
    }));
  },

  async getCount(
    organizationId: string,
    actionType?: BulkActionType,
    startDate?: Date,
    endDate?: Date
  ): Promise<number> {
    let query = supabase
      .from('bulk_actions')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId);

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
      console.error('Error getting bulk action count:', error);
      return 0;
    }
    return count || 0;
  },

  async getItems(bulkActionId: string): Promise<Array<any>> {
    const { data, error } = await supabase
      .from('bulk_action_items')
      .select(`
        *,
        join_requests!request_id (
          *,
          profiles!user_id (*)
        )
      `)
      .eq('bulk_action_id', bulkActionId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching bulk action items:', error);
      return [];
    }

    if (!data) return [];

    return data.map((item: any) => ({
      ...item,
      request: Array.isArray(item.join_requests) ? item.join_requests[0] : item.join_requests,
      user: item.join_requests?.profiles
    }));
  },

  async addNote(bulkActionId: string, notes: string): Promise<boolean> {
    const { error } = await supabase
      .from('bulk_actions')
      .update({ notes })
      .eq('id', bulkActionId);

    if (error) {
      console.error('Error adding note:', error);
      return false;
    }
    return true;
  },

  async exportToCSV(organizationId: string): Promise<string> {
    const actions = await this.getByOrganization(organizationId, 1000, 0);
    
    const headers = ['Date', 'Admin', 'Action Type', 'Total Requests', 'Success', 'Failed', 'Message', 'Notes'];
    const rows = actions.map(action => [
      new Date(action.created_at).toLocaleString(),
      `${action.admin?.first_name} ${action.admin?.last_name}`,
      action.action_type.replace(/_/g, ' '),
      action.request_count.toString(),
      action.success_count.toString(),
      action.failed_count.toString(),
      action.message || '',
      action.notes || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    return csvContent;
  },

  async rollback(
    bulkActionId: string,
    adminId: string
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    const result = { success: 0, failed: 0, errors: [] as string[] };

    try {
      // Get the bulk action and its items
      const { data: bulkAction, error: actionError } = await supabase
        .from('bulk_actions')
        .select('*')
        .eq('id', bulkActionId)
        .single();

      if (actionError || !bulkAction) {
        result.errors.push('Failed to fetch bulk action');
        return result;
      }

      // Only allow rollback for bulk_approve actions
      if (bulkAction.action_type !== 'bulk_approve') {
        result.errors.push('Only bulk approve actions can be rolled back');
        return result;
      }

      // Check if already rolled back
      if (bulkAction.rollback_at) {
        result.errors.push('This bulk action has already been rolled back');
        return result;
      }

      // Get all successful items
      const items = await this.getItems(bulkActionId);
      const successfulItems = items.filter(item => item.status === 'success');

      // Rollback each successful item
      for (const item of successfulItems) {
        try {
          // Revert organization_id to null
          const { error: profileError } = await supabase
            .from('profiles')
            .update({ organization_id: null })
            .eq('id', item.request?.user_id);

          if (profileError) {
            result.failed++;
            result.errors.push(`Failed to revert profile for ${item.user?.email}`);
            continue;
          }

          // Revert request status to pending
          const { error: requestError } = await supabase
            .from('join_requests')
            .update({
              status: 'pending',
              processed_by: null,
              processed_at: null,
              admin_message: null
            })
            .eq('id', item.request_id);

          if (requestError) {
            result.failed++;
            result.errors.push(`Failed to revert request for ${item.user?.email}`);
          } else {
            result.success++;
          }
        } catch (error) {
          result.failed++;
          result.errors.push(`Error processing ${item.user?.email}`);
        }
      }

      // Update bulk_action with rollback info
      await supabase
        .from('bulk_actions')
        .update({
          rollback_at: new Date().toISOString(),
          rollback_by: adminId
        })
        .eq('id', bulkActionId);

      // Create new bulk_undo entry
      const undoActionId = await this.create(
        bulkAction.organization_id,
        adminId,
        'bulk_undo',
        successfulItems.length,
        result.success,
        result.failed,
        `Rollback of bulk action from ${new Date(bulkAction.created_at).toLocaleString()}`
      );

      // Add items to undo entry
      if (undoActionId) {
        const undoItems = successfulItems.map(item => ({
          requestId: item.request_id,
          status: (result.success > 0 ? 'success' : 'failed') as BulkActionItemStatus,
          errorMessage: result.failed > 0 ? 'Partial rollback' : undefined
        }));
        await this.addItems(undoActionId, undoItems);
      }

      return result;
    } catch (error) {
      console.error('Error during rollback:', error);
      result.errors.push('Unexpected error during rollback');
      return result;
    }
  }
};
