# Organization & Group Management Service Implementation

## Overview
This document describes the complete Supabase implementation of organization and group management services, replacing the previous stub implementations with full database operations.

## Database Schema

### Tables

#### `organizations`
Stores school or organization information.

```sql
CREATE TABLE organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
```

#### `groups`
Stores classes or groups within an organization.

```sql
CREATE TABLE groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
```

#### `group_members`
Many-to-many relationship between groups and users.

```sql
CREATE TABLE group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  added_by uuid REFERENCES auth.users(id),
  is_instructor boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(group_id, user_id)
);
```

## Row Level Security (RLS) Policies

### Organizations
- **SELECT**: School admins can view their own organization
- **UPDATE**: School admins can update their own organization
- **INSERT**: Anyone can create an organization (for school admin sign-up)

### Groups
- **SELECT**: Organization members can view groups
- **INSERT**: School admins and teachers can create groups
- **UPDATE**: School admins and teachers can update groups
- **DELETE**: School admins can delete groups

### Group Members
- **SELECT**: Users can view their own memberships; school admins and teachers can view all memberships in their organization
- **INSERT**: School admins and teachers can add members to groups
- **UPDATE**: School admins and teachers can update member status (instructor flag)
- **DELETE**: School admins and teachers can remove members from groups

## Service API

### organizationService

#### `getById(id: string): Promise<Organization | null>`
Get organization by ID.

**Example:**
```typescript
const org = await organizationService.getById(organizationId);
```

#### `getMembersByRole(organizationId: string, role: string): Promise<Profile[]>`
Get all members of an organization filtered by role.

**Example:**
```typescript
const teachers = await organizationService.getMembersByRole(orgId, 'teacher');
const students = await organizationService.getMembersByRole(orgId, 'student');
```

#### `create(data: Partial<Organization>): Promise<Organization | null>`
Create a new organization.

**Example:**
```typescript
const newOrg = await organizationService.create({
  name: 'Springfield High School',
  description: 'A public high school',
  created_by: userId
});
```

#### `update(id: string, data: Partial<Organization>): Promise<boolean>`
Update an organization.

**Example:**
```typescript
const success = await organizationService.update(orgId, {
  name: 'Updated School Name',
  description: 'New description'
});
```

---

### groupService

#### `getByOrganization(organizationId: string): Promise<Group[]>`
Get all groups for an organization.

**Example:**
```typescript
const groups = await groupService.getByOrganization(organizationId);
```

#### `getById(id: string): Promise<Group | null>`
Get a single group by ID.

**Example:**
```typescript
const group = await groupService.getById(groupId);
```

#### `create(data: Partial<Group>): Promise<boolean>`
Create a new group.

**Example:**
```typescript
const success = await groupService.create({
  organization_id: orgId,
  name: 'Math 101',
  description: 'Introduction to Mathematics',
  created_by: userId
});
```

#### `update(id: string, data: Partial<Group>): Promise<boolean>`
Update a group.

**Example:**
```typescript
const success = await groupService.update(groupId, {
  name: 'Advanced Math 101',
  description: 'Updated description'
});
```

#### `delete(id: string): Promise<boolean>`
Delete a group (and all its members via CASCADE).

**Example:**
```typescript
const success = await groupService.delete(groupId);
```

---

### groupMemberService

#### `getByGroup(groupId: string): Promise<GroupMember[]>`
Get all members of a group (basic info).

**Example:**
```typescript
const members = await groupMemberService.getByGroup(groupId);
```

#### `getMemberCount(groupId: string): Promise<number>`
Get the count of members in a group.

**Example:**
```typescript
const count = await groupMemberService.getMemberCount(groupId);
```

#### `getGroupMembers(groupId: string): Promise<GroupMember[]>`
Alias for `getByGroup()`.

#### `getGroupMembersWithDetails(groupId: string): Promise<any[]>`
Get group members with full profile details (joined with profiles table).

**Example:**
```typescript
const membersWithDetails = await groupMemberService.getGroupMembersWithDetails(groupId);
// Returns: [{ id, group_id, user_id, is_instructor, user: { id, email, username, ... } }]
```

#### `addMember(groupId: string, userId: string): Promise<boolean>`
Add a single member to a group.

**Example:**
```typescript
const success = await groupMemberService.addMember(groupId, userId);
```

#### `addMembers(groupId: string, userIds: string[]): Promise<boolean>`
Add multiple members to a group at once.

**Example:**
```typescript
const success = await groupMemberService.addMembers(groupId, [userId1, userId2, userId3]);
```

#### `removeMember(groupId: string, userId: string): Promise<boolean>`
Remove a member from a group.

**Example:**
```typescript
const success = await groupMemberService.removeMember(groupId, userId);
```

#### `setInstructor(groupId: string, userId: string, isInstructor: boolean): Promise<boolean>`
Set or unset instructor status for a group member.

**Example:**
```typescript
// Make user an instructor
await groupMemberService.setInstructor(groupId, userId, true);

// Remove instructor status
await groupMemberService.setInstructor(groupId, userId, false);
```

#### `getUserGroups(userId: string): Promise<Group[]>`
Get all groups a user is a member of.

**Example:**
```typescript
const userGroups = await groupMemberService.getUserGroups(userId);
```

#### `isMember(groupId: string, userId: string): Promise<boolean>`
Check if a user is a member of a group.

**Example:**
```typescript
const isMember = await groupMemberService.isMember(groupId, userId);
```

#### `isInstructor(groupId: string, userId: string): Promise<boolean>`
Check if a user is an instructor of a group.

**Example:**
```typescript
const isInstructor = await groupMemberService.isInstructor(groupId, userId);
```

#### `getInstructors(groupId: string): Promise<any[]>`
Get all instructors for a group with profile details.

**Example:**
```typescript
const instructors = await groupMemberService.getInstructors(groupId);
```

#### `getStudents(groupId: string): Promise<any[]>`
Get all students (non-instructors) for a group with profile details.

**Example:**
```typescript
const students = await groupMemberService.getStudents(groupId);
```

## Usage Examples

### Complete Workflow: Creating an Organization and Group

```typescript
import { organizationService, groupService, groupMemberService } from '@/services/organizationService';

// 1. Create an organization
const org = await organizationService.create({
  name: 'Springfield High School',
  description: 'A public high school',
  created_by: currentUserId
});

if (!org) {
  console.error('Failed to create organization');
  return;
}

// 2. Create a group/class
const success = await groupService.create({
  organization_id: org.id,
  name: 'Math 101',
  description: 'Introduction to Mathematics',
  created_by: currentUserId
});

// 3. Get the created group
const groups = await groupService.getByOrganization(org.id);
const mathGroup = groups.find(g => g.name === 'Math 101');

if (!mathGroup) {
  console.error('Group not found');
  return;
}

// 4. Add students to the group
const studentIds = ['user-id-1', 'user-id-2', 'user-id-3'];
await groupMemberService.addMembers(mathGroup.id, studentIds);

// 5. Add a teacher and make them an instructor
await groupMemberService.addMember(mathGroup.id, teacherId);
await groupMemberService.setInstructor(mathGroup.id, teacherId, true);

// 6. Get all members with details
const members = await groupMemberService.getGroupMembersWithDetails(mathGroup.id);
console.log('Group members:', members);

// 7. Get member count
const count = await groupMemberService.getMemberCount(mathGroup.id);
console.log('Total members:', count);
```

### Managing Group Membership

```typescript
// Check if user is a member
const isMember = await groupMemberService.isMember(groupId, userId);

if (!isMember) {
  // Add user to group
  await groupMemberService.addMember(groupId, userId);
}

// Check if user is an instructor
const isInstructor = await groupMemberService.isInstructor(groupId, userId);

if (!isInstructor) {
  // Promote to instructor
  await groupMemberService.setInstructor(groupId, userId, true);
}

// Get all groups for a user
const userGroups = await groupMemberService.getUserGroups(userId);
console.log('User is member of:', userGroups.length, 'groups');
```

### Loading Organization Dashboard Data

```typescript
// Load all data for school admin dashboard
const loadDashboardData = async (organizationId: string) => {
  const [org, groups, teachers, students] = await Promise.all([
    organizationService.getById(organizationId),
    groupService.getByOrganization(organizationId),
    organizationService.getMembersByRole(organizationId, 'teacher'),
    organizationService.getMembersByRole(organizationId, 'student')
  ]);

  return { org, groups, teachers, students };
};
```

## Error Handling

All service methods include try-catch blocks and log errors to the console. They return:
- `null` for single-item queries that fail
- `[]` (empty array) for list queries that fail
- `false` for operations that fail
- `0` for count queries that fail

**Example:**
```typescript
const org = await organizationService.getById(invalidId);
if (!org) {
  toast.error('Organization not found');
  return;
}
```

## Security Considerations

1. **RLS Policies**: All operations are protected by Row Level Security policies
2. **Authentication**: All operations require authentication (except organization creation)
3. **Authorization**: Users can only access data within their organization
4. **Role-Based Access**: School admins and teachers have elevated permissions
5. **Cascade Deletes**: Deleting a group automatically removes all memberships

## Performance Optimizations

1. **Indexes**: All foreign keys have indexes for fast lookups
2. **Batch Operations**: Use `addMembers()` instead of multiple `addMember()` calls
3. **Selective Queries**: Use `getGroupMembers()` for basic info, `getGroupMembersWithDetails()` only when profile data is needed
4. **Count Queries**: Use `getMemberCount()` instead of fetching all members just to count

## Migration History

- **00013**: Created organizations, groups, and group_members tables
- **00014**: Added RLS policies for all tables
- **00016**: Added is_instructor flag to group_members
- **00048**: Added UPDATE policy for group_members

## Testing

To test the implementation:

1. Create an organization as a school admin
2. Create groups within the organization
3. Add students and teachers to groups
4. Set instructor status for teachers
5. Verify RLS policies by attempting unauthorized access
6. Test cascade deletes by removing a group

## Future Enhancements

Potential improvements:
- Bulk member removal
- Group archiving (soft delete)
- Member role history tracking
- Group capacity limits
- Waiting list functionality
- Group templates
- Automated group creation from CSV
