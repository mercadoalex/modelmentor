// Organization Service - Full Supabase implementation
import { supabase } from '@/lib/supabase';
import type { Organization, Group, Profile, GroupMember } from '@/types/types';

export const organizationService = {
  /**
   * Get organization by ID
   */
  async getById(id: string): Promise<Organization | null> {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching organization:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getById:', error);
      return null;
    }
  },

  /**
   * Get all members of an organization by role
   */
  async getMembersByRole(organizationId: string, role: string): Promise<Profile[]> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('role', role)
        .order('username', { ascending: true });

      if (error) {
        console.error('Error fetching members by role:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getMembersByRole:', error);
      return [];
    }
  },

  /**
   * Create a new organization
   */
  async create(data: Partial<Organization>): Promise<Organization | null> {
    try {
      const { data: newOrg, error } = await supabase
        .from('organizations')
        .insert({
          name: data.name,
          description: data.description,
          created_by: data.created_by
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating organization:', error);
        return null;
      }

      return newOrg;
    } catch (error) {
      console.error('Error in create:', error);
      return null;
    }
  },

  /**
   * Update an organization
   */
  async update(id: string, data: Partial<Organization>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('organizations')
        .update({
          name: data.name,
          description: data.description,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) {
        console.error('Error updating organization:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in update:', error);
      return false;
    }
  },
};

export const groupService = {
  /**
   * Get all groups for an organization
   */
  async getByOrganization(organizationId: string): Promise<Group[]> {
    try {
      const { data, error } = await supabase
        .from('groups')
        .select('*')
        .eq('organization_id', organizationId)
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching groups:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getByOrganization:', error);
      return [];
    }
  },

  /**
   * Get a single group by ID
   */
  async getById(id: string): Promise<Group | null> {
    try {
      const { data, error } = await supabase
        .from('groups')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching group:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getById:', error);
      return null;
    }
  },

  /**
   * Create a new group
   */
  async create(data: Partial<Group>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('groups')
        .insert({
          organization_id: data.organization_id,
          name: data.name,
          description: data.description,
          created_by: data.created_by
        });

      if (error) {
        console.error('Error creating group:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in create:', error);
      return false;
    }
  },

  /**
   * Update a group
   */
  async update(id: string, data: Partial<Group>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('groups')
        .update({
          name: data.name,
          description: data.description,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) {
        console.error('Error updating group:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in update:', error);
      return false;
    }
  },

  /**
   * Delete a group
   */
  async delete(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('groups')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting group:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in delete:', error);
      return false;
    }
  },
};

export const groupMemberService = {
  /**
   * Get all members of a group (basic info)
   */
  async getByGroup(groupId: string): Promise<GroupMember[]> {
    try {
      const { data, error } = await supabase
        .from('group_members')
        .select('*')
        .eq('group_id', groupId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching group members:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getByGroup:', error);
      return [];
    }
  },

  /**
   * Get member count for a group
   */
  async getMemberCount(groupId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('group_members')
        .select('*', { count: 'exact', head: true })
        .eq('group_id', groupId);

      if (error) {
        console.error('Error counting group members:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('Error in getMemberCount:', error);
      return 0;
    }
  },

  /**
   * Get group members (alias for getByGroup)
   */
  async getGroupMembers(groupId: string): Promise<GroupMember[]> {
    return this.getByGroup(groupId);
  },

  /**
   * Get group members with full profile details
   */
  async getGroupMembersWithDetails(groupId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('group_members')
        .select(`
          *,
          user:profiles!group_members_user_id_fkey (
            id,
            email,
            username,
            first_name,
            last_name,
            role,
            avatar_url
          )
        `)
        .eq('group_id', groupId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching group members with details:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getGroupMembersWithDetails:', error);
      return [];
    }
  },

  /**
   * Add a single member to a group
   */
  async addMember(groupId: string, userId: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('group_members')
        .insert({
          group_id: groupId,
          user_id: userId,
          added_by: user?.id || null,
          is_instructor: false
        });

      if (error) {
        // Check if it's a duplicate key error
        if (error.code === '23505') {
          console.log('User is already a member of this group');
          return true;
        }
        console.error('Error adding group member:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in addMember:', error);
      return false;
    }
  },

  /**
   * Add multiple members to a group
   */
  async addMembers(groupId: string, userIds: string[]): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const members = userIds.map(userId => ({
        group_id: groupId,
        user_id: userId,
        added_by: user?.id || null,
        is_instructor: false
      }));

      const { error } = await supabase
        .from('group_members')
        .insert(members);

      if (error) {
        console.error('Error adding group members:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in addMembers:', error);
      return false;
    }
  },

  /**
   * Remove a member from a group
   */
  async removeMember(groupId: string, userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', userId);

      if (error) {
        console.error('Error removing group member:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in removeMember:', error);
      return false;
    }
  },

  /**
   * Set or unset instructor status for a group member
   */
  async setInstructor(groupId: string, userId: string, isInstructor: boolean): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('group_members')
        .update({ is_instructor: isInstructor })
        .eq('group_id', groupId)
        .eq('user_id', userId);

      if (error) {
        console.error('Error setting instructor status:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in setInstructor:', error);
      return false;
    }
  },

  /**
   * Get all groups a user is a member of
   */
  async getUserGroups(userId: string): Promise<Group[]> {
    try {
      const { data, error } = await supabase
        .from('group_members')
        .select(`
          group:groups (
            id,
            organization_id,
            name,
            description,
            created_by,
            created_at,
            updated_at
          )
        `)
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching user groups:', error);
        return [];
      }

      return data?.map((item: any) => item.group).filter(Boolean) || [];
    } catch (error) {
      console.error('Error in getUserGroups:', error);
      return [];
    }
  },

  /**
   * Check if a user is a member of a group
   */
  async isMember(groupId: string, userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('group_members')
        .select('id')
        .eq('group_id', groupId)
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error checking membership:', error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error('Error in isMember:', error);
      return false;
    }
  },

  /**
   * Check if a user is an instructor of a group
   */
  async isInstructor(groupId: string, userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('group_members')
        .select('is_instructor')
        .eq('group_id', groupId)
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error checking instructor status:', error);
        return false;
      }

      return data?.is_instructor || false;
    } catch (error) {
      console.error('Error in isInstructor:', error);
      return false;
    }
  },

  /**
   * Get all instructors for a group
   */
  async getInstructors(groupId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('group_members')
        .select(`
          *,
          user:profiles!group_members_user_id_fkey (
            id,
            email,
            username,
            first_name,
            last_name,
            role,
            avatar_url
          )
        `)
        .eq('group_id', groupId)
        .eq('is_instructor', true)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching instructors:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getInstructors:', error);
      return [];
    }
  },

  /**
   * Get all students (non-instructors) for a group
   */
  async getStudents(groupId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('group_members')
        .select(`
          *,
          user:profiles!group_members_user_id_fkey (
            id,
            email,
            username,
            first_name,
            last_name,
            role,
            avatar_url
          )
        `)
        .eq('group_id', groupId)
        .eq('is_instructor', false)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching students:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getStudents:', error);
      return [];
    }
  },
};
