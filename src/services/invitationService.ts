import { supabase } from '@/db/supabase';
import type { Invitation, UserRole } from '@/types/types';

// Generate a random invitation code
function generateInvitationCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude similar looking characters
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export const invitationService = {
  async create(
    organizationId: string,
    email: string,
    role: UserRole,
    invitedBy: string,
    expiresInDays: number = 7
  ): Promise<Invitation | null> {
    const code = generateInvitationCode();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    const { data, error } = await supabase
      .from('invitations')
      .insert({
        organization_id: organizationId,
        email: email.toLowerCase(),
        role,
        code,
        status: 'pending',
        expires_at: expiresAt.toISOString(),
        invited_by: invitedBy
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating invitation:', error);
      return null;
    }
    return data;
  },

  async createBulk(
    organizationId: string,
    invitations: Array<{ email: string; role: UserRole }>,
    invitedBy: string,
    expiresInDays: number = 7
  ): Promise<Invitation[]> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    const invitationsData = invitations.map(inv => ({
      organization_id: organizationId,
      email: inv.email.toLowerCase(),
      role: inv.role,
      code: generateInvitationCode(),
      status: 'pending' as const,
      expires_at: expiresAt.toISOString(),
      invited_by: invitedBy
    }));

    const { data, error } = await supabase
      .from('invitations')
      .insert(invitationsData)
      .select();

    if (error) {
      console.error('Error creating bulk invitations:', error);
      return [];
    }
    return data || [];
  },

  async getByCode(code: string): Promise<Invitation | null> {
    // First expire old invitations
    await supabase.rpc('expire_old_invitations');

    const { data, error } = await supabase
      .from('invitations')
      .select('*')
      .eq('code', code.toUpperCase())
      .maybeSingle();

    if (error) {
      console.error('Error fetching invitation by code:', error);
      return null;
    }
    return data;
  },

  async getByOrganization(organizationId: string): Promise<Invitation[]> {
    const { data, error } = await supabase
      .from('invitations')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching invitations:', error);
      return [];
    }
    return data || [];
  },

  async accept(code: string, userId: string): Promise<boolean> {
    const { error } = await supabase
      .from('invitations')
      .update({
        status: 'accepted',
        accepted_by: userId,
        accepted_at: new Date().toISOString()
      })
      .eq('code', code.toUpperCase())
      .eq('status', 'pending');

    if (error) {
      console.error('Error accepting invitation:', error);
      return false;
    }
    return true;
  },

  async cancel(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('invitations')
      .update({ status: 'cancelled' })
      .eq('id', id)
      .eq('status', 'pending');

    if (error) {
      console.error('Error cancelling invitation:', error);
      return false;
    }
    return true;
  },

  async resend(id: string, expiresInDays: number = 7): Promise<Invitation | null> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    const { data, error } = await supabase
      .from('invitations')
      .update({
        code: generateInvitationCode(),
        status: 'pending',
        expires_at: expiresAt.toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error resending invitation:', error);
      return null;
    }
    return data;
  },

  async validateCode(code: string): Promise<{
    valid: boolean;
    invitation?: Invitation;
    error?: string;
  }> {
    const invitation = await this.getByCode(code);

    if (!invitation) {
      return { valid: false, error: 'Invalid invitation code' };
    }

    if (invitation.status !== 'pending') {
      return { valid: false, error: `Invitation is ${invitation.status}` };
    }

    if (new Date(invitation.expires_at) < new Date()) {
      return { valid: false, error: 'Invitation has expired' };
    }

    return { valid: true, invitation };
  },

  async getStatsByOrganization(organizationId: string): Promise<{
    total: number;
    pending: number;
    accepted: number;
    expired: number;
    cancelled: number;
  }> {
    const invitations = await this.getByOrganization(organizationId);

    return {
      total: invitations.length,
      pending: invitations.filter(inv => inv.status === 'pending').length,
      accepted: invitations.filter(inv => inv.status === 'accepted').length,
      expired: invitations.filter(inv => inv.status === 'expired').length,
      cancelled: invitations.filter(inv => inv.status === 'cancelled').length
    };
  }
};
