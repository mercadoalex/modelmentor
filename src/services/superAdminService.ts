// Organization Management Service
// Handles CRUD operations for institutions, colleges, and groups using Supabase

import { supabase } from '@/lib/supabase';

export interface Institution {
  id: string;
  name: string;
  description?: string;
  address?: string;
  contactEmail?: string;
  contactPhone?: string;
  createdAt: string;
  status: 'active' | 'inactive';
}

export interface College {
  id: string;
  name: string;
  description?: string;
  institutionId: string;
  address?: string;
  contactEmail?: string;
  contactPhone?: string;
  createdAt: string;
  status: 'active' | 'inactive';
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  collegeId: string;
  groupType?: string;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  status: 'active' | 'inactive';
}

export interface UserMembership {
  id: string;
  userId: string;
  groupId: string;
  role: 'student' | 'teacher' | 'admin';
  joinedAt: string;
}

// Helper function to convert snake_case to camelCase
function toCamelCase(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const key in obj) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    result[camelKey] = obj[key];
  }
  return result;
}

// Helper function to convert camelCase to snake_case
function toSnakeCase(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const key in obj) {
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    result[snakeKey] = obj[key];
  }
  return result;
}

class OrganizationService {
  // ==================== INSTITUTION OPERATIONS ====================

  async getAllInstitutions(): Promise<Institution[]> {
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching institutions:', error);
      return [];
    }

    return (data || []).map(item => toCamelCase(item) as unknown as Institution);
  }

  async getInstitutionById(id: string): Promise<Institution | null> {
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching institution:', error);
      return null;
    }

    return data ? (toCamelCase(data) as unknown as Institution) : null;
  }

  async createInstitution(institutionData: Omit<Institution, 'id' | 'createdAt'>): Promise<Institution | null> {
    const dbData = toSnakeCase(institutionData as Record<string, unknown>);
    
    const { data, error } = await supabase
      .from('organizations')
      .insert(dbData)
      .select()
      .single();

    if (error) {
      console.error('Error creating institution:', error);
      return null;
    }

    return data ? (toCamelCase(data) as unknown as Institution) : null;
  }

  async updateInstitution(id: string, institutionData: Partial<Omit<Institution, 'id' | 'createdAt'>>): Promise<Institution | null> {
    const dbData = toSnakeCase(institutionData as Record<string, unknown>);
    
    const { data, error } = await supabase
      .from('organizations')
      .update(dbData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating institution:', error);
      return null;
    }

    return data ? (toCamelCase(data) as unknown as Institution) : null;
  }

  async deleteInstitution(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('organizations')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting institution:', error);
      return false;
    }

    return true;
  }

  // ==================== COLLEGE OPERATIONS ====================

  async getAllColleges(): Promise<College[]> {
    const { data, error } = await supabase
      .from('colleges')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching colleges:', error);
      return [];
    }

    return (data || []).map(item => toCamelCase(item) as unknown as College);
  }

  async getCollegesByInstitution(institutionId: string): Promise<College[]> {
    const { data, error } = await supabase
      .from('colleges')
      .select('*')
      .eq('organization_id', institutionId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching colleges by institution:', error);
      return [];
    }

    return (data || []).map(item => toCamelCase(item) as unknown as College);
  }

  async getCollegeById(id: string): Promise<College | null> {
    const { data, error } = await supabase
      .from('colleges')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching college:', error);
      return null;
    }

    return data ? (toCamelCase(data) as unknown as College) : null;
  }

  async createCollege(collegeData: Omit<College, 'id' | 'createdAt'>): Promise<College | null> {
    const dbData = toSnakeCase(collegeData as Record<string, unknown>);
    
    const { data, error } = await supabase
      .from('colleges')
      .insert(dbData)
      .select()
      .single();

    if (error) {
      console.error('Error creating college:', error);
      return null;
    }

    return data ? (toCamelCase(data) as unknown as College) : null;
  }

  async updateCollege(id: string, collegeData: Partial<Omit<College, 'id' | 'createdAt'>>): Promise<College | null> {
    const dbData = toSnakeCase(collegeData as Record<string, unknown>);
    
    const { data, error } = await supabase
      .from('colleges')
      .update(dbData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating college:', error);
      return null;
    }

    return data ? (toCamelCase(data) as unknown as College) : null;
  }

  async deleteCollege(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('colleges')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting college:', error);
      return false;
    }

    return true;
  }

  // ==================== GROUP OPERATIONS ====================

  async getAllGroups(): Promise<Group[]> {
    const { data, error } = await supabase
      .from('groups')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching groups:', error);
      return [];
    }

    return (data || []).map(item => toCamelCase(item) as unknown as Group);
  }

  async getGroupsByCollege(collegeId: string): Promise<Group[]> {
    const { data, error } = await supabase
      .from('groups')
      .select('*')
      .eq('college_id', collegeId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching groups by college:', error);
      return [];
    }

    return (data || []).map(item => toCamelCase(item) as unknown as Group);
  }

  async getGroupById(id: string): Promise<Group | null> {
    const { data, error } = await supabase
      .from('groups')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching group:', error);
      return null;
    }

    return data ? (toCamelCase(data) as unknown as Group) : null;
  }

  async createGroup(groupData: Omit<Group, 'id' | 'createdAt'>): Promise<Group | null> {
    const dbData = toSnakeCase(groupData as Record<string, unknown>);
    
    const { data, error } = await supabase
      .from('groups')
      .insert(dbData)
      .select()
      .single();

    if (error) {
      console.error('Error creating group:', error);
      return null;
    }

    return data ? (toCamelCase(data) as unknown as Group) : null;
  }

  async updateGroup(id: string, groupData: Partial<Omit<Group, 'id' | 'createdAt'>>): Promise<Group | null> {
    const dbData = toSnakeCase(groupData as Record<string, unknown>);
    
    const { data, error} = await supabase
      .from('groups')
      .update(dbData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating group:', error);
      return null;
    }

    return data ? (toCamelCase(data) as unknown as Group) : null;
  }

  async deleteGroup(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('groups')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting group:', error);
      return false;
    }

    return true;
  }

  // ==================== MEMBERSHIP OPERATIONS ====================

  async getAllMemberships(): Promise<UserMembership[]> {
    const { data, error } = await supabase
      .from('group_members')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching memberships:', error);
      return [];
    }

    return (data || []).map(item => ({
      id: item.id,
      userId: item.user_id,
      groupId: item.group_id,
      role: item.role || (item.is_instructor ? 'teacher' : 'student'),
      joinedAt: item.created_at,
    }));
  }

  async getMembershipsByGroup(groupId: string): Promise<UserMembership[]> {
    const { data, error } = await supabase
      .from('group_members')
      .select('*')
      .eq('group_id', groupId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching memberships by group:', error);
      return [];
    }

    return (data || []).map(item => ({
      id: item.id,
      userId: item.user_id,
      groupId: item.group_id,
      role: item.role || (item.is_instructor ? 'teacher' : 'student'),
      joinedAt: item.created_at,
    }));
  }

  async getMembershipsByUser(userId: string): Promise<UserMembership[]> {
    const { data, error } = await supabase
      .from('group_members')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching memberships by user:', error);
      return [];
    }

    return (data || []).map(item => ({
      id: item.id,
      userId: item.user_id,
      groupId: item.group_id,
      role: item.role || (item.is_instructor ? 'teacher' : 'student'),
      joinedAt: item.created_at,
    }));
  }

  async addMembership(userId: string, groupId: string, role: 'student' | 'teacher' | 'admin'): Promise<UserMembership | null> {
    const { data, error } = await supabase
      .from('group_members')
      .insert({
        user_id: userId,
        group_id: groupId,
        role,
        is_instructor: role === 'teacher',
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding membership:', error);
      return null;
    }

    return data ? {
      id: data.id,
      userId: data.user_id,
      groupId: data.group_id,
      role: data.role || (data.is_instructor ? 'teacher' : 'student'),
      joinedAt: data.created_at,
    } : null;
  }

  async removeMembership(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('group_members')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error removing membership:', error);
      return false;
    }

    return true;
  }

  async removeMembershipsByGroup(groupId: string): Promise<void> {
    const { error } = await supabase
      .from('group_members')
      .delete()
      .eq('group_id', groupId);

    if (error) {
      console.error('Error removing memberships by group:', error);
    }
  }

  // ==================== STATISTICS ====================

  async getInstitutionStats(institutionId: string) {
    const colleges = await this.getCollegesByInstitution(institutionId);
    const collegeIds = colleges.map(c => c.id);

    let groups: Group[] = [];
    for (const collegeId of collegeIds) {
      const collegeGroups = await this.getGroupsByCollege(collegeId);
      groups = groups.concat(collegeGroups);
    }

    const groupIds = groups.map(g => g.id);
    let memberships: UserMembership[] = [];
    for (const groupId of groupIds) {
      const groupMemberships = await this.getMembershipsByGroup(groupId);
      memberships = memberships.concat(groupMemberships);
    }

    return {
      collegeCount: colleges.length,
      groupCount: groups.length,
      studentCount: memberships.filter(m => m.role === 'student').length,
      teacherCount: memberships.filter(m => m.role === 'teacher').length,
      totalUsers: memberships.length,
    };
  }

  async getCollegeStats(collegeId: string) {
    const groups = await this.getGroupsByCollege(collegeId);
    const groupIds = groups.map(g => g.id);

    let memberships: UserMembership[] = [];
    for (const groupId of groupIds) {
      const groupMemberships = await this.getMembershipsByGroup(groupId);
      memberships = memberships.concat(groupMemberships);
    }

    return {
      groupCount: groups.length,
      studentCount: memberships.filter(m => m.role === 'student').length,
      teacherCount: memberships.filter(m => m.role === 'teacher').length,
      totalUsers: memberships.length,
    };
  }

  async getGroupStats(groupId: string) {
    const memberships = await this.getMembershipsByGroup(groupId);

    return {
      studentCount: memberships.filter(m => m.role === 'student').length,
      teacherCount: memberships.filter(m => m.role === 'teacher').length,
      totalMembers: memberships.length,
    };
  }

  // ==================== HIERARCHY ====================

  async getOrganizationalHierarchy() {
    const institutions = await this.getAllInstitutions();
    const colleges = await this.getAllColleges();
    const groups = await this.getAllGroups();

    return institutions.map(institution => ({
      ...institution,
      colleges: colleges
        .filter(college => college.institutionId === institution.id)
        .map(college => ({
          ...college,
          groups: groups.filter(group => group.collegeId === college.id),
        })),
    }));
  }

  // ==================== INITIALIZATION ====================

  async initializeSampleData(): Promise<void> {
    const institutions = await this.getAllInstitutions();
    if (institutions.length > 0) {
      return; // Already initialized
    }

    const inst1 = await this.createInstitution({
      name: 'Tech University',
      description: 'Leading institution in technology education',
      address: '123 University Ave',
      contactEmail: 'contact@techuniv.edu',
      contactPhone: '+1-555-0100',
      status: 'active',
    });

    const inst2 = await this.createInstitution({
      name: 'Science Academy',
      description: 'Excellence in scientific research and education',
      address: '456 Science Blvd',
      contactEmail: 'info@scienceacademy.edu',
      contactPhone: '+1-555-0200',
      status: 'active',
    });

    if (!inst1 || !inst2) return;

    const college1 = await this.createCollege({
      name: 'Computer Science Department',
      description: 'Advanced computer science programs',
      institutionId: inst1.id,
      address: '123 University Ave, Building A',
      contactEmail: 'cs@techuniv.edu',
      status: 'active',
    });

    const college2 = await this.createCollege({
      name: 'Engineering Department',
      description: 'Comprehensive engineering education',
      institutionId: inst1.id,
      address: '123 University Ave, Building B',
      contactEmail: 'eng@techuniv.edu',
      status: 'active',
    });

    const college3 = await this.createCollege({
      name: 'Physics Department',
      description: 'Cutting-edge physics research',
      institutionId: inst2.id,
      address: '456 Science Blvd, Lab 1',
      contactEmail: 'physics@scienceacademy.edu',
      status: 'active',
    });

    if (!college1 || !college2 || !college3) return;

    await this.createGroup({
      name: 'CS101 - Introduction to Programming',
      description: 'Beginner programming course',
      collegeId: college1.id,
      groupType: 'class',
      status: 'active',
    });

    await this.createGroup({
      name: 'CS201 - Data Structures',
      description: 'Advanced data structures and algorithms',
      collegeId: college1.id,
      groupType: 'class',
      status: 'active',
    });

    await this.createGroup({
      name: 'ENG101 - Engineering Fundamentals',
      description: 'Core engineering principles',
      collegeId: college2.id,
      groupType: 'class',
      status: 'active',
    });

    await this.createGroup({
      name: 'PHY301 - Quantum Mechanics',
      description: 'Advanced quantum physics',
      collegeId: college3.id,
      groupType: 'class',
      status: 'active',
    });
  }
}

export const organizationService = new OrganizationService();
