import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layouts/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, GraduationCap, UserCheck, FolderKanban, Plus, Trash2, Edit } from 'lucide-react';
import { organizationService, groupService, groupMemberService } from '@/services/organizationService';
import { InvitationManager } from '@/components/InvitationManager';
import { BulkActionHistory } from '@/components/BulkActionHistory';
import { JoinRequestManager } from '@/components/JoinRequestManager';
import { GroupMemberManager } from '@/components/GroupMemberManager';
import { toast } from 'sonner';
import type { Organization, Group, Profile } from '@/types/types';

export default function SchoolAdminPage() {
  const { profile } = useAuth();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [teachers, setTeachers] = useState<Profile[]>([]);
  const [students, setStudents] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Group management state
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [profile]);

  const loadData = async () => {
    if (!profile?.organization_id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [orgData, groupsData, teachersData, studentsData] = await Promise.all([
        organizationService.getById(profile.organization_id),
        groupService.getByOrganization(profile.organization_id),
        organizationService.getMembersByRole(profile.organization_id, 'teacher'),
        organizationService.getMembersByRole(profile.organization_id, 'student')
      ]);

      setOrganization(orgData);
      setGroups(groupsData);
      setTeachers(teachersData);
      setStudents(studentsData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load organization data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim() || !profile?.organization_id) {
      toast.error('Please enter a group name');
      return;
    }

    const success = await groupService.create({
      organization_id: profile.organization_id,
      name: newGroupName,
      description: newGroupDescription,
      created_by: profile.id
    });

    if (success) {
      toast.success('Group created successfully');
      setNewGroupName('');
      setNewGroupDescription('');
      setIsGroupDialogOpen(false);
      loadData();
    } else {
      toast.error('Failed to create group');
    }
  };

  const handleUpdateGroup = async () => {
    if (!editingGroup || !newGroupName.trim()) {
      toast.error('Please enter a group name');
      return;
    }

    const success = await groupService.update(editingGroup.id, {
      name: newGroupName,
      description: newGroupDescription
    });

    if (success) {
      toast.success('Group updated successfully');
      setEditingGroup(null);
      setNewGroupName('');
      setNewGroupDescription('');
      setIsGroupDialogOpen(false);
      loadData();
    } else {
      toast.error('Failed to update group');
    }
  };

  const handleDeleteGroup = (groupId: string) => {
    setItemToDelete(groupId);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteGroup = async () => {
    if (!itemToDelete) return;
    const success = await groupService.delete(itemToDelete);
    if (success) {
      toast.success('Group deleted successfully');
      loadData();
    } else {
      toast.error('Failed to delete group');
    }
    setDeleteDialogOpen(false);
    setItemToDelete(null);
  };

  const openEditDialog = (group: Group) => {
    setEditingGroup(group);
    setNewGroupName(group.name);
    setNewGroupDescription(group.description || '');
    setIsGroupDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingGroup(null);
    setNewGroupName('');
    setNewGroupDescription('');
    setIsGroupDialogOpen(true);
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </AppLayout>
    );
  }

  if (profile?.role !== 'school_admin' && profile?.role !== 'super_admin') {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle>Access Denied</CardTitle>
              <CardDescription>
                This page is only accessible to school administrators.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">School Administration</h1>
            <p className="text-muted-foreground">
              Manage your organization, teachers, students, and groups
            </p>
          </div>
          {profile && organization && (
            <InvitationManager
              organizationId={organization.id}
              invitedBy={profile.id}
              onInvitationSent={loadData}
            />
          )}
        </div>

        {/* Organization Info */}
        {organization && (
          <Card>
            <CardHeader>
              <CardTitle>{organization.name}</CardTitle>
              <CardDescription>{organization.description}</CardDescription>
            </CardHeader>
          </Card>
        )}

        {/* Statistics Cards */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Teachers</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{teachers.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{students.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Groups</CardTitle>
              <FolderKanban className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{groups.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Join Requests */}
        {profile && organization && (
          <JoinRequestManager
            organizationId={organization.id}
            adminId={profile.id}
            onRequestProcessed={loadData}
          />
        )}

        {/* Tabs for different management sections */}
        <Tabs defaultValue="groups" className="space-y-6">
          <TabsList>
            <TabsTrigger value="groups">Groups</TabsTrigger>
            <TabsTrigger value="teachers">Teachers</TabsTrigger>
            <TabsTrigger value="students">Students</TabsTrigger>
            <TabsTrigger value="history">Bulk Action History</TabsTrigger>
          </TabsList>

          {/* Groups Tab */}
          <TabsContent value="groups" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Groups</h2>
                <p className="text-muted-foreground">Manage classes and student groups</p>
              </div>
              <Dialog open={isGroupDialogOpen} onOpenChange={setIsGroupDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={openCreateDialog}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Group
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingGroup ? 'Edit Group' : 'Create New Group'}</DialogTitle>
                    <DialogDescription>
                      {editingGroup ? 'Update group information' : 'Create a new group or class for your organization'}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="groupName">Group Name</Label>
                      <Input
                        id="groupName"
                        placeholder="e.g., Grade 10 Computer Science"
                        value={newGroupName}
                        onChange={(e) => setNewGroupName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="groupDescription">Description (Optional)</Label>
                      <Textarea
                        id="groupDescription"
                        placeholder="Brief description of the group"
                        value={newGroupDescription}
                        onChange={(e) => setNewGroupDescription(e.target.value)}
                        rows={3}
                      />
                    </div>
                    <Button
                      onClick={editingGroup ? handleUpdateGroup : handleCreateGroup}
                      className="w-full"
                    >
                      {editingGroup ? 'Update Group' : 'Create Group'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Members</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {groups.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                          No groups created yet. Click "Create Group" to get started.
                        </TableCell>
                      </TableRow>
                    ) : (
                      groups.map((group) => (
                        <TableRow key={group.id}>
                          <TableCell className="font-medium">{group.name}</TableCell>
                          <TableCell>{group.description || '-'}</TableCell>
                          <TableCell>
                            {profile && organization && (
                              <GroupMemberManager
                                group={group}
                                organizationId={organization.id}
                                currentUserId={profile.id}
                                onMembersChanged={loadData}
                              />
                            )}
                          </TableCell>
                          <TableCell>{new Date(group.created_at).toLocaleDateString()}</TableCell>
                          <TableCell className="text-right space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditDialog(group)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteGroup(group.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Teachers Tab */}
          <TabsContent value="teachers" className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold">Teachers</h2>
              <p className="text-muted-foreground">View and manage teachers in your organization</p>
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Username</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Joined</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teachers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                          No teachers in your organization yet.
                        </TableCell>
                      </TableRow>
                    ) : (
                      teachers.map((teacher) => (
                        <TableRow key={teacher.id}>
                          <TableCell className="font-medium">
                            {teacher.first_name} {teacher.last_name}
                          </TableCell>
                          <TableCell>{teacher.username}</TableCell>
                          <TableCell>{teacher.email}</TableCell>
                          <TableCell>{new Date(teacher.created_at).toLocaleDateString()}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Students Tab */}
          <TabsContent value="students" className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold">Students</h2>
              <p className="text-muted-foreground">View and manage students in your organization</p>
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Username</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Joined</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                          No students in your organization yet.
                        </TableCell>
                      </TableRow>
                    ) : (
                      students.map((student) => (
                        <TableRow key={student.id}>
                          <TableCell className="font-medium">
                            {student.first_name} {student.last_name}
                          </TableCell>
                          <TableCell>{student.username}</TableCell>
                          <TableCell>{student.email}</TableCell>
                          <TableCell>{new Date(student.created_at).toLocaleDateString()}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Bulk Action History Tab */}
          <TabsContent value="history">
            {profile && organization && (
              <BulkActionHistory
                organizationId={organization.id}
                currentUserId={profile.id}
              />
            )}
          </TabsContent>
        </Tabs>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Group</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this group? This action cannot be undone and will remove all member associations.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setItemToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteGroup}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
