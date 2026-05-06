import { supabase } from '@/db/supabase';
import type { JoinRequest, Organization } from '@/types/types';

export const joinRequestService = {
  async create(organizationId: string, userId: string, message?: string): Promise<JoinRequest | null> {
    const { data, error } = await supabase
      .from('join_requests')
      .insert({
        organization_id: organizationId,
        user_id: userId,
        message: message || null,
        status: 'pending'
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating join request:', error);
      return null;
    }
    return data;
  },

  async getByUser(userId: string): Promise<JoinRequest[]> {
    const { data, error } = await supabase
      .from('join_requests')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user join requests:', error);
      return [];
    }
    return data || [];
  },

  async getByOrganization(organizationId: string): Promise<JoinRequest[]> {
    const { data, error } = await supabase
      .from('join_requests')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching organization join requests:', error);
      return [];
    }
    return data || [];
  },

  async getPendingByOrganization(organizationId: string): Promise<JoinRequest[]> {
    const { data, error } = await supabase
      .from('join_requests')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching pending join requests:', error);
      return [];
    }
    return data || [];
  },

  async approve(requestId: string, adminId: string, adminMessage?: string): Promise<boolean> {
    const { error } = await supabase
      .from('join_requests')
      .update({
        status: 'approved',
        processed_by: adminId,
        processed_at: new Date().toISOString(),
        admin_message: adminMessage || null
      })
      .eq('id', requestId)
      .eq('status', 'pending');

    if (error) {
      console.error('Error approving join request:', error);
      return false;
    }
    return true;
  },

  async reject(requestId: string, adminId: string, adminMessage?: string): Promise<boolean> {
    const { error } = await supabase
      .from('join_requests')
      .update({
        status: 'rejected',
        processed_by: adminId,
        processed_at: new Date().toISOString(),
        admin_message: adminMessage || null
      })
      .eq('id', requestId)
      .eq('status', 'pending');

    if (error) {
      console.error('Error rejecting join request:', error);
      return false;
    }
    return true;
  },

  async hasExistingRequest(organizationId: string, userId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('join_requests')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('user_id', userId)
      .eq('status', 'pending')
      .maybeSingle();

    if (error) {
      console.error('Error checking existing request:', error);
      return false;
    }
    return !!data;
  },

  async getPendingCount(organizationId: string): Promise<number> {
    const { count, error } = await supabase
      .from('join_requests')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
      .eq('status', 'pending');

    if (error) {
      console.error('Error getting pending count:', error);
      return 0;
    }
    return count || 0;
  },

  async getRequestWithDetails(requestId: string): Promise<(JoinRequest & { user?: any; organization?: Organization }) | null> {
    const { data, error } = await supabase
      .from('join_requests')
      .select(`
        *,
        profiles!user_id (*),
        organizations!organization_id (*)
      `)
      .eq('id', requestId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching request details:', error);
      return null;
    }

    if (!data) return null;

    return {
      ...data,
      user: Array.isArray(data.profiles) ? data.profiles[0] : data.profiles,
      organization: Array.isArray(data.organizations) ? data.organizations[0] : data.organizations
    };
  },

  async getPendingWithUserDetails(organizationId: string): Promise<Array<JoinRequest & { user: any }>> {
    const { data, error } = await supabase
      .from('join_requests')
      .select(`
        *,
        profiles!user_id (*)
      `)
      .eq('organization_id', organizationId)
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching pending requests with details:', error);
      return [];
    }

    if (!data) return [];

    return data.map((item: any) => ({
      ...item,
      user: Array.isArray(item.profiles) ? item.profiles[0] : item.profiles
    }));
  }
};
