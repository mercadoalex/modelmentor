# Quick Reference: Organization & Group Management

## Import Services

```typescript
import { 
  organizationService, 
  groupService, 
  groupMemberService 
} from '@/services/organizationService';
```

## Common Operations

### Get Organization Data
```typescript
// Get organization by ID
const org = await organizationService.getById(organizationId);

// Get all teachers in organization
const teachers = await organizationService.getMembersByRole(orgId, 'teacher');

// Get all students in organization
const students = await organizationService.getMembersByRole(orgId, 'student');
```

### Manage Groups
```typescript
// Get all groups for organization
const groups = await groupService.getByOrganization(organizationId);

// Create new group
await groupService.create({
  organization_id: orgId,
  name: 'Math 101',
  description: 'Introduction to Mathematics',
  created_by: userId
});

// Update group
await groupService.update(groupId, {
  name: 'Advanced Math 101',
  description: 'Updated description'
});

// Delete group
await groupService.delete(groupId);
```

### Manage Group Members
```typescript
// Get member count
const count = await groupMemberService.getMemberCount(groupId);

// Get members with profile details
const members = await groupMemberService.getGroupMembersWithDetails(groupId);

// Add single member
await groupMemberService.addMember(groupId, userId);

// Add multiple members
await groupMemberService.addMembers(groupId, [userId1, userId2, userId3]);

// Remove member
await groupMemberService.removeMember(groupId, userId);

// Set instructor status
await groupMemberService.setInstructor(groupId, userId, true);

// Check if user is member
const isMember = await groupMemberService.isMember(groupId, userId);

// Check if user is instructor
const isInstructor = await groupMemberService.isInstructor(groupId, userId);

// Get all instructors
const instructors = await groupMemberService.getInstructors(groupId);

// Get all students
const students = await groupMemberService.getStudents(groupId);

// Get all groups for a user
const userGroups = await groupMemberService.getUserGroups(userId);
```

## Error Handling Pattern

```typescript
const org = await organizationService.getById(orgId);
if (!org) {
  toast.error('Organization not found');
  return;
}

const success = await groupService.create(groupData);
if (!success) {
  toast.error('Failed to create group');
  return;
}

toast.success('Group created successfully');
```

## Loading Dashboard Data

```typescript
const loadDashboardData = async (organizationId: string) => {
  setLoading(true);
  
  try {
    const [org, groups, teachers, students] = await Promise.all([
      organizationService.getById(organizationId),
      groupService.getByOrganization(organizationId),
      organizationService.getMembersByRole(organizationId, 'teacher'),
      organizationService.getMembersByRole(organizationId, 'student')
    ]);
    
    setOrganization(org);
    setGroups(groups);
    setTeachers(teachers);
    setStudents(students);
  } catch (error) {
    console.error('Error loading dashboard:', error);
    toast.error('Failed to load dashboard data');
  } finally {
    setLoading(false);
  }
};
```

## Managing Group Membership

```typescript
const handleAddStudents = async (groupId: string, studentIds: string[]) => {
  const success = await groupMemberService.addMembers(groupId, studentIds);
  
  if (success) {
    toast.success(`Added ${studentIds.length} students to group`);
    await loadMembers(); // Refresh member list
  } else {
    toast.error('Failed to add students');
  }
};

const handleRemoveMember = async (groupId: string, userId: string) => {
  const success = await groupMemberService.removeMember(groupId, userId);
  
  if (success) {
    toast.success('Member removed from group');
    await loadMembers(); // Refresh member list
  } else {
    toast.error('Failed to remove member');
  }
};

const handleToggleInstructor = async (groupId: string, userId: string, isInstructor: boolean) => {
  const success = await groupMemberService.setInstructor(groupId, userId, !isInstructor);
  
  if (success) {
    toast.success(isInstructor ? 'Instructor status removed' : 'User promoted to instructor');
    await loadMembers(); // Refresh member list
  } else {
    toast.error('Failed to update instructor status');
  }
};
```

## TypeScript Types

```typescript
import type { Organization, Group, Profile, GroupMember } from '@/types/types';

// Organization
interface Organization {
  id: string;
  name: string;
  description?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

// Group
interface Group {
  id: string;
  organization_id: string;
  name: string;
  description?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

// GroupMember
interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  added_by?: string;
  is_instructor: boolean;
  created_at: string;
}

// Profile (from types.ts)
interface Profile {
  id: string;
  email: string;
  username: string;
  first_name?: string;
  last_name?: string;
  role: 'student' | 'teacher' | 'school_admin' | 'super_admin';
  organization_id?: string;
  avatar_url?: string;
  // ... other fields
}
```

## Security Notes

- All operations require authentication
- RLS policies enforce role-based access
- School admins can manage their organization
- Teachers can manage groups and members
- Students can only view their own memberships
- Cascade deletes: Deleting a group removes all members

## Performance Tips

1. Use `getMemberCount()` instead of fetching all members just to count
2. Use `getGroupMembers()` for basic info, `getGroupMembersWithDetails()` only when needed
3. Use `addMembers()` for batch operations instead of multiple `addMember()` calls
4. Use `Promise.all()` to fetch multiple resources in parallel

## Common Patterns

### Check Membership Before Adding
```typescript
const isMember = await groupMemberService.isMember(groupId, userId);
if (!isMember) {
  await groupMemberService.addMember(groupId, userId);
}
```

### Filter Available Users
```typescript
const [allStudents, currentMembers] = await Promise.all([
  organizationService.getMembersByRole(orgId, 'student'),
  groupMemberService.getGroupMembers(groupId)
]);

const memberIds = new Set(currentMembers.map(m => m.user_id));
const availableStudents = allStudents.filter(s => !memberIds.has(s.id));
```

### Get Group Statistics
```typescript
const [memberCount, instructors, students] = await Promise.all([
  groupMemberService.getMemberCount(groupId),
  groupMemberService.getInstructors(groupId),
  groupMemberService.getStudents(groupId)
]);

console.log(`Group has ${memberCount} members: ${instructors.length} instructors, ${students.length} students`);
```
