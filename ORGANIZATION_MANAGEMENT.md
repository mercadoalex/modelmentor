# Organization Management Feature

## Overview
The Organization Management feature enables schools and educational institutions to manage teachers, students, and groups within ModelMentor. This feature introduces role-based access control with three distinct user roles: Students, Teachers, and School Admins.

## User Roles

### Student
- **Purpose**: Individual learners using ModelMentor to create ML projects
- **Capabilities**:
  - Create and manage personal ML projects
  - Complete assignments from teachers
  - Earn badges and track progress
  - View their own data and projects
- **Access Level**: Can only see their own content

### Teacher
- **Purpose**: Educators who create assignments and track student progress
- **Capabilities**:
  - All student capabilities
  - Create and manage groups/classes
  - Assign projects to students
  - View student progress and performance
  - Generate reports on student activity
- **Access Level**: Can see students in their groups and organization

### School Admin
- **Purpose**: Administrators who manage the entire organization
- **Capabilities**:
  - All teacher capabilities
  - Manage organization settings
  - View all teachers and students in organization
  - Create, edit, and delete groups
  - View organization-wide statistics
- **Access Level**: Full access to all organization data

## Database Schema

### Organizations Table
```sql
CREATE TABLE public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
```

**Purpose**: Stores school/organization information

**Fields**:
- `id`: Unique identifier
- `name`: Organization name (e.g., "Lincoln High School")
- `description`: Optional description
- `created_by`: User who created the organization (typically school admin)
- `created_at`, `updated_at`: Timestamps

### Profiles Table Updates
```sql
ALTER TABLE public.profiles
ADD COLUMN organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL;

ALTER TYPE public.user_role ADD VALUE 'student';
ALTER TYPE public.user_role ADD VALUE 'teacher';
ALTER TYPE public.user_role ADD VALUE 'school_admin';
```

**Changes**:
- Added `organization_id` field linking users to organizations
- Extended `user_role` enum with new roles: student, teacher, school_admin

### Groups Table
```sql
CREATE TABLE IF NOT EXISTS public.groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
```

**Purpose**: Stores classes or groups within an organization

**Fields**:
- `id`: Unique identifier
- `organization_id`: Parent organization
- `name`: Group name (e.g., "Grade 10 Computer Science")
- `description`: Optional description
- `created_by`: User who created the group
- `created_at`, `updated_at`: Timestamps

### Group Members Table
```sql
CREATE TABLE IF NOT EXISTS public.group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  added_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(group_id, user_id)
);
```

**Purpose**: Many-to-many relationship between groups and users

**Fields**:
- `id`: Unique identifier
- `group_id`: Group reference
- `user_id`: User reference
- `added_by`: User who added this member
- `created_at`: Timestamp
- **Constraint**: Unique combination of group_id and user_id (prevents duplicate memberships)

## Row Level Security (RLS) Policies

### Organizations Policies
1. **View**: School admins can view their own organization
2. **Update**: School admins can update their own organization
3. **Insert**: Anyone can create an organization (for school admin sign-up)

### Groups Policies
1. **View**: All organization members can view groups in their organization
2. **Insert**: School admins and teachers can create groups
3. **Update**: School admins and teachers can update groups
4. **Delete**: Only school admins can delete groups

### Group Members Policies
1. **View**: Users can view their own memberships; school admins and teachers can view all memberships in their organization
2. **Insert**: School admins and teachers can add members to groups
3. **Delete**: School admins and teachers can remove members from groups

## Sign-Up Flow

### For Students
1. Navigate to sign-up page
2. Fill in: Email, First Name, Last Name, Username, Password
3. Select role: "Student"
4. Agree to terms
5. Submit → Account created with role='student'

### For Teachers
1. Navigate to sign-up page
2. Fill in: Email, First Name, Last Name, Username, Password
3. Select role: "Teacher"
4. Agree to terms
5. Submit → Account created with role='teacher'
6. **Note**: Teacher must be added to an organization by a school admin

### For School Admins
1. Navigate to sign-up page
2. Fill in: Email, First Name, Last Name, Username, Password
3. Select role: "School Admin"
4. Enter: School/Organization Name
5. Agree to terms
6. Submit → Account created with role='school_admin' AND new organization created

**Special Behavior**: When a school admin signs up, the system automatically:
- Creates a new organization with the provided name
- Links the admin's profile to this organization
- Sets the admin as the organization creator

## School Admin Dashboard

### Access
- URL: `/admin`
- Requires: `role='school_admin'`
- Navigation: Visible in main menu for school admins only

### Features

#### 1. Organization Overview
- Displays organization name and description
- Shows key statistics:
  - Total Teachers
  - Total Students
  - Total Groups

#### 2. Groups Management
**View Groups**:
- Table showing all groups in organization
- Columns: Name, Description, Created Date, Actions

**Create Group**:
- Click "Create Group" button
- Enter group name (required)
- Enter description (optional)
- Submit → Group created

**Edit Group**:
- Click edit icon on group row
- Update name or description
- Submit → Group updated

**Delete Group**:
- Click delete icon on group row
- Confirm deletion
- Group and all memberships deleted

#### 3. Teachers Management
- View all teachers in organization
- Table showing: Name, Username, Email, Join Date
- **Note**: Currently view-only; future versions will support inviting teachers

#### 4. Students Management
- View all students in organization
- Table showing: Name, Username, Email, Join Date
- **Note**: Currently view-only; future versions will support inviting students

## Services API

### organizationService

#### `getById(id: string): Promise<Organization | null>`
Fetches organization by ID

#### `getByUserId(userId: string): Promise<Organization | null>`
Fetches organization for a given user

#### `update(id: string, updates: Partial<Organization>): Promise<boolean>`
Updates organization details

#### `getMembers(organizationId: string): Promise<Profile[]>`
Gets all members of an organization

#### `getMembersByRole(organizationId: string, role: string): Promise<Profile[]>`
Gets members filtered by role (e.g., all teachers)

### groupService

#### `create(group: Omit<Group, 'id' | 'created_at' | 'updated_at'>): Promise<Group | null>`
Creates a new group

#### `getById(id: string): Promise<Group | null>`
Fetches group by ID

#### `getByOrganization(organizationId: string): Promise<Group[]>`
Gets all groups in an organization

#### `update(id: string, updates: Partial<Group>): Promise<boolean>`
Updates group details

#### `delete(id: string): Promise<boolean>`
Deletes a group

### groupMemberService

#### `addMember(groupId: string, userId: string, addedBy: string): Promise<boolean>`
Adds a user to a group

#### `removeMember(groupId: string, userId: string): Promise<boolean>`
Removes a user from a group

#### `getGroupMembers(groupId: string): Promise<Profile[]>`
Gets all members of a group

#### `getUserGroups(userId: string): Promise<Group[]>`
Gets all groups a user belongs to

#### `isMember(groupId: string, userId: string): Promise<boolean>`
Checks if a user is a member of a group

## Authentication Updates

### AuthContext Changes

**Updated Interface**:
```typescript
signUpWithEmail: (
  email: string,
  password: string,
  username: string,
  firstName: string,
  lastName: string,
  role: UserRole,
  organizationName?: string
) => Promise<{ error: Error | null }>;
```

**New Parameters**:
- `role`: User's selected role (student, teacher, school_admin)
- `organizationName`: Required for school_admin, optional for others

**Sign-Up Logic**:
1. Validate username uniqueness
2. If school_admin + organizationName provided:
   - Create organization first
   - Get organization ID
3. Create auth user with metadata
4. Update profile with role and organization_id
5. If school_admin, update organization.created_by

## UI Components

### Sign-Up Form Updates

**New Fields**:
1. **Role Selection Dropdown**
   - Label: "I am a"
   - Options: Student, Teacher, School Admin
   - Default: Student
   - Helper text changes based on selection

2. **Organization Name Input** (conditional)
   - Only shown when role = "School Admin"
   - Label: "School/Organization Name"
   - Placeholder: "e.g., Lincoln High School"
   - Required for school admins
   - Helper text: "This will create a new organization that you will manage"

**Validation**:
- All existing validations remain
- New: Organization name required for school admins

### School Admin Dashboard Components

**Statistics Cards**:
- Total Teachers (with UserCheck icon)
- Total Students (with GraduationCap icon)
- Total Groups (with FolderKanban icon)

**Tabs**:
- Groups: Manage groups with create/edit/delete
- Teachers: View all teachers
- Students: View all students

**Groups Table**:
- Columns: Name, Description, Created, Actions
- Actions: Edit (pencil icon), Delete (trash icon)
- Empty state: "No groups created yet"

**Create/Edit Group Dialog**:
- Group Name input (required)
- Description textarea (optional)
- Submit button (Create/Update based on mode)

## User Workflows

### School Admin Creates Organization
1. Visit sign-up page
2. Enter personal details
3. Select "School Admin" role
4. Enter organization name
5. Complete sign-up
6. Redirected to email verification
7. After verification, access School Admin dashboard

### School Admin Creates Group
1. Navigate to `/admin`
2. Click "Groups" tab
3. Click "Create Group" button
4. Enter group name and description
5. Click "Create Group"
6. Group appears in table

### School Admin Views Members
1. Navigate to `/admin`
2. Click "Teachers" or "Students" tab
3. View table of all members
4. See names, usernames, emails, join dates

### Teacher/Student Joins Organization
**Current**: Manual process (future: invitation system)
1. Sign up with teacher/student role
2. School admin manually updates their profile with organization_id
3. User gains access to organization resources

## Future Enhancements

### Phase 2: Invitations
- School admins can invite teachers and students via email
- Invitation codes for easy joining
- Bulk import from CSV

### Phase 3: Group Member Management
- Add/remove students to/from groups in UI
- Assign teachers to groups
- View group rosters

### Phase 4: Organization Settings
- Customize organization branding
- Set organization-wide policies
- Configure default settings for new users

### Phase 5: Advanced Permissions
- Custom roles beyond the three defaults
- Fine-grained permissions per feature
- Delegate admin responsibilities

### Phase 6: Analytics
- Organization-wide usage statistics
- Group performance comparisons
- Teacher effectiveness metrics

## Security Considerations

### RLS Enforcement
- All queries automatically filtered by RLS policies
- Users can only access data they're authorized to see
- Organization boundaries strictly enforced

### Role Validation
- Frontend checks role for UI display
- Backend RLS policies enforce role-based access
- No client-side role manipulation possible

### Organization Isolation
- Users in different organizations cannot see each other
- Groups cannot span multiple organizations
- Data leakage prevented by foreign key constraints

## Testing Checklist

### Sign-Up Testing
- [ ] Student sign-up works without organization
- [ ] Teacher sign-up works without organization
- [ ] School admin sign-up creates organization
- [ ] Organization name validation works
- [ ] Role selection persists correctly

### School Admin Dashboard Testing
- [ ] Dashboard accessible only to school admins
- [ ] Statistics display correctly
- [ ] Groups tab shows all groups
- [ ] Teachers tab shows all teachers
- [ ] Students tab shows all students

### Group Management Testing
- [ ] Create group works
- [ ] Edit group updates correctly
- [ ] Delete group removes group and memberships
- [ ] Empty states display properly
- [ ] Validation errors show correctly

### RLS Testing
- [ ] Students cannot access admin dashboard
- [ ] Teachers cannot delete groups
- [ ] Users cannot see other organizations' data
- [ ] School admins can only manage their organization

## Related Files

### Database Migrations
- `/supabase/migrations/00012_add_new_user_roles.sql`
- `/supabase/migrations/00013_create_organizations_and_groups_tables.sql`
- `/supabase/migrations/00014_add_rls_policies_for_organizations.sql`

### Type Definitions
- `/src/types/types.ts` - Updated UserRole, added Organization, Group, GroupMember

### Services
- `/src/services/organizationService.ts` - Organization, group, and member management

### Pages
- `/src/pages/LoginPage.tsx` - Updated sign-up form with role selection
- `/src/pages/SchoolAdminPage.tsx` - School admin dashboard

### Context
- `/src/contexts/AuthContext.tsx` - Updated sign-up logic

### Routes
- `/src/routes.tsx` - Added `/admin` route

## Support

For questions or issues with organization management:
1. Check RLS policies are correctly applied
2. Verify user role is set correctly in profiles table
3. Ensure organization_id is populated for school admins
4. Check browser console for error messages
5. Review Supabase logs for database errors
