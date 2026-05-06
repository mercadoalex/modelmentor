import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layouts/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/db/supabase';
import { Shield, Search, Users, History, CheckCircle2, XCircle, Loader2, ArrowLeft, UserCog } from 'lucide-react';
import { toast } from 'sonner';
import type { Profile, UserRole, RoleChange, RoleRequest } from '@/types/types';

export default function RoleManagementPage() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  // Users management state
  const [users, setUsers] = useState<Profile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<Profile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  // Role change dialog state
  const [changeDialogOpen, setChangeDialogOpen] = useState(false);
  const [userToChange, setUserToChange] = useState<Profile | null>(null);
  const [newRole, setNewRole] = useState<UserRole>('student');
  const [changeReason, setChangeReason] = useState('');
  const [changing, setChanging] = useState(false);

  // Bulk change dialog state
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [bulkRole, setBulkRole] = useState<UserRole>('student');
  const [bulkReason, setBulkReason] = useState('');

  // Role history state
  const [roleHistory, setRoleHistory] = useState<RoleChange[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Role requests state
  const [roleRequests, setRoleRequests] = useState<RoleRequest[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      toast.error('Please sign in to access this page');
      navigate('/login');
      return;
    }

    if (profile && profile.role !== 'admin' && profile.role !== 'super_admin') {
      toast.error('Access denied. This page is only available to administrators.');
      navigate('/');
      return;
    }

    if (profile) {
      loadUsers();
      loadRoleHistory();
      loadRoleRequests();
    }
  }, [user, profile, navigate]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
      setFilteredUsers(data || []);
    } catch (error) {
      toast.error('Failed to load users');
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRoleHistory = async () => {
    try {
      setHistoryLoading(true);
      const { data, error } = await supabase
        .from('role_changes')
        .select(`
          *,
          user:profiles!role_changes_user_id_fkey(id, username, email, first_name, last_name),
          changed_by_user:profiles!role_changes_changed_by_fkey(id, username, email, first_name, last_name)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setRoleHistory(data || []);
    } catch (error) {
      toast.error('Failed to load role history');
      console.error('Error loading role history:', error);
    } finally {
      setHistoryLoading(false);
    }
  };

  const loadRoleRequests = async () => {
    try {
      setRequestsLoading(true);
      const { data, error } = await supabase
        .from('role_requests')
        .select(`
          *,
          user:profiles!role_requests_user_id_fkey(id, username, email, first_name, last_name),
          reviewer:profiles!role_requests_reviewed_by_fkey(id, username, email, first_name, last_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRoleRequests(data || []);
    } catch (error) {
      toast.error('Failed to load role requests');
      console.error('Error loading role requests:', error);
    } finally {
      setRequestsLoading(false);
    }
  };

  // Filter users based on search and role filter
  useEffect(() => {
    let filtered = users;

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (u) =>
          u.username?.toLowerCase().includes(query) ||
          u.email?.toLowerCase().includes(query) ||
          u.first_name?.toLowerCase().includes(query) ||
          u.last_name?.toLowerCase().includes(query)
      );
    }

    // Apply role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter((u) => u.role === roleFilter);
    }

    setFilteredUsers(filtered);
  }, [searchQuery, roleFilter, users]);

  const handleRoleChange = async () => {
    if (!userToChange || !changeReason.trim()) {
      toast.error('Please provide a reason for the role change');
      return;
    }

    try {
      setChanging(true);

      // Update user role
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userToChange.id);

      if (updateError) throw updateError;

      // Log role change
      const { error: logError } = await supabase
        .from('role_changes')
        .insert({
          user_id: userToChange.id,
          changed_by: user!.id,
          old_role: userToChange.role,
          new_role: newRole,
          reason: changeReason,
        });

      if (logError) throw logError;

      // Send email notification (non-blocking)
      supabase.functions
        .invoke('send-role-notification', {
          body: {
            type: 'role_change',
            userEmail: userToChange.email,
            userName: userToChange.first_name && userToChange.last_name
              ? `${userToChange.first_name} ${userToChange.last_name}`
              : userToChange.username || userToChange.email,
            oldRole: userToChange.role,
            newRole: newRole,
            reason: changeReason,
            changedByName: profile?.first_name && profile?.last_name
              ? `${profile.first_name} ${profile.last_name}`
              : profile?.username || 'Administrator',
          },
        })
        .then(({ error: emailError }) => {
          if (emailError) {
            console.error('Failed to send email notification:', emailError);
          }
        });

      // Create in-app notification
      await supabase
        .from('notifications')
        .insert({
          user_id: userToChange.id,
          type: 'role_change',
          title: 'Role Changed',
          message: `Your role has been changed from ${userToChange.role} to ${newRole}. Reason: ${changeReason}`,
          link: '/settings',
          read: false,
        });

      toast.success(`Role changed successfully for ${userToChange.username || userToChange.email}`);
      setChangeDialogOpen(false);
      setUserToChange(null);
      setChangeReason('');
      loadUsers();
      loadRoleHistory();
    } catch (error) {
      toast.error('Failed to change role');
      console.error('Error changing role:', error);
    } finally {
      setChanging(false);
    }
  };

  const handleBulkRoleChange = async () => {
    if (selectedUsers.size === 0) {
      toast.error('Please select at least one user');
      return;
    }

    if (!bulkReason.trim()) {
      toast.error('Please provide a reason for the role change');
      return;
    }

    try {
      setChanging(true);

      const userIds = Array.from(selectedUsers);
      const usersToChange = users.filter((u) => userIds.includes(u.id));

      // Update all selected users
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ role: bulkRole })
        .in('id', userIds);

      if (updateError) throw updateError;

      // Log all role changes
      const roleChanges = usersToChange.map((u) => ({
        user_id: u.id,
        changed_by: user!.id,
        old_role: u.role,
        new_role: bulkRole,
        reason: bulkReason,
      }));

      const { error: logError } = await supabase
        .from('role_changes')
        .insert(roleChanges);

      if (logError) throw logError;

      // Send email notifications to all affected users (non-blocking)
      usersToChange.forEach((userToNotify) => {
        supabase.functions
          .invoke('send-role-notification', {
            body: {
              type: 'role_change',
              userEmail: userToNotify.email,
              userName: userToNotify.first_name && userToNotify.last_name
                ? `${userToNotify.first_name} ${userToNotify.last_name}`
                : userToNotify.username || userToNotify.email,
              oldRole: userToNotify.role,
              newRole: bulkRole,
              reason: bulkReason,
              changedByName: profile?.first_name && profile?.last_name
                ? `${profile.first_name} ${profile.last_name}`
                : profile?.username || 'Administrator',
            },
          })
          .then(({ error: emailError }) => {
            if (emailError) {
              console.error('Failed to send email notification:', emailError);
            }
          });
      });

      // Create in-app notifications for all affected users
      const notifications = usersToChange.map((userToNotify) => ({
        user_id: userToNotify.id,
        type: 'role_change' as const,
        title: 'Role Changed',
        message: `Your role has been changed from ${userToNotify.role} to ${bulkRole}. Reason: ${bulkReason}`,
        link: '/settings',
        read: false,
      }));

      await supabase
        .from('notifications')
        .insert(notifications);

      toast.success(`Role changed successfully for ${selectedUsers.size} user(s)`);
      setBulkDialogOpen(false);
      setSelectedUsers(new Set());
      setBulkReason('');
      loadUsers();
      loadRoleHistory();
    } catch (error) {
      toast.error('Failed to change roles');
      console.error('Error changing roles:', error);
    } finally {
      setChanging(false);
    }
  };

  const handleApproveRequest = async (request: RoleRequest) => {
    try {
      // Update user role
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ role: request.requested_role })
        .eq('id', request.user_id);

      if (updateError) throw updateError;

      // Update request status
      const { error: requestError } = await supabase
        .from('role_requests')
        .update({
          status: 'approved',
          reviewed_by: user!.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', request.id);

      if (requestError) throw requestError;

      // Log role change
      const userProfile = users.find((u) => u.id === request.user_id);
      if (userProfile) {
        await supabase.from('role_changes').insert({
          user_id: request.user_id,
          changed_by: user!.id,
          old_role: userProfile.role,
          new_role: request.requested_role,
          reason: `Approved role request: ${request.reason}`,
        });
      }

      // Send email notification (non-blocking)
      const requestUser = request.user || users.find((u) => u.id === request.user_id);
      if (requestUser) {
        supabase.functions
          .invoke('send-role-notification', {
            body: {
              type: 'request_approved',
              userEmail: requestUser.email,
              userName: requestUser.first_name && requestUser.last_name
                ? `${requestUser.first_name} ${requestUser.last_name}`
                : requestUser.username || requestUser.email,
              newRole: request.requested_role,
              reason: request.reason,
            },
          })
          .then(({ error: emailError }) => {
            if (emailError) {
              console.error('Failed to send email notification:', emailError);
            }
          });

        // Create in-app notification
        await supabase
          .from('notifications')
          .insert({
            user_id: requestUser.id,
            type: 'role_request',
            title: 'Role Request Approved',
            message: `Your request to become a ${request.requested_role} has been approved!`,
            link: '/settings',
            read: false,
          });
      }

      toast.success('Role request approved');
      loadUsers();
      loadRoleRequests();
      loadRoleHistory();
    } catch (error) {
      toast.error('Failed to approve request');
      console.error('Error approving request:', error);
    }
  };

  const handleRejectRequest = async (request: RoleRequest, adminNotes: string) => {
    try {
      const { error } = await supabase
        .from('role_requests')
        .update({
          status: 'rejected',
          reviewed_by: user!.id,
          reviewed_at: new Date().toISOString(),
          admin_notes: adminNotes,
        })
        .eq('id', request.id);

      if (error) throw error;

      // Send email notification (non-blocking)
      const requestUser = request.user || users.find((u) => u.id === request.user_id);
      if (requestUser) {
        supabase.functions
          .invoke('send-role-notification', {
            body: {
              type: 'request_rejected',
              userEmail: requestUser.email,
              userName: requestUser.first_name && requestUser.last_name
                ? `${requestUser.first_name} ${requestUser.last_name}`
                : requestUser.username || requestUser.email,
              newRole: request.requested_role,
              reason: request.reason,
              adminNotes: adminNotes,
            },
          })
          .then(({ error: emailError }) => {
            if (emailError) {
              console.error('Failed to send email notification:', emailError);
            }
          });

        // Create in-app notification
        await supabase
          .from('notifications')
          .insert({
            user_id: requestUser.id,
            type: 'role_request',
            title: 'Role Request Rejected',
            message: `Your request to become a ${request.requested_role} has been rejected. ${adminNotes ? `Reason: ${adminNotes}` : ''}`,
            link: '/settings',
            read: false,
          });
      }

      toast.success('Role request rejected');
      loadRoleRequests();
    } catch (error) {
      toast.error('Failed to reject request');
      console.error('Error rejecting request:', error);
    }
  };

  const openChangeDialog = (userProfile: Profile) => {
    // Check if regular admin is trying to modify super_admin or admin
    if (profile?.role === 'admin') {
      if (userProfile.role === 'super_admin') {
        toast.error('Only super admins can modify super admin roles');
        return;
      }
      if (userProfile.role === 'admin') {
        toast.error('Only super admins can modify admin roles');
        return;
      }
    }

    setUserToChange(userProfile);
    setNewRole(userProfile.role);
    setChangeReason('');
    setChangeDialogOpen(true);
  };

  const toggleUserSelection = (userId: string) => {
    const userToToggle = users.find((u) => u.id === userId);
    
    // Prevent regular admins from selecting super_admins or admins
    if (profile?.role === 'admin' && userToToggle) {
      if (userToToggle.role === 'super_admin' || userToToggle.role === 'admin') {
        toast.error('Only super admins can modify admin or super admin roles');
        return;
      }
    }

    const newSelection = new Set(selectedUsers);
    if (newSelection.has(userId)) {
      newSelection.delete(userId);
    } else {
      newSelection.add(userId);
    }
    setSelectedUsers(newSelection);
  };

  const canModifyRole = (targetRole: UserRole): boolean => {
    // Super admin can modify any role
    if (profile?.role === 'super_admin') return true;
    
    // Regular admin cannot assign super_admin or admin roles
    if (profile?.role === 'admin') {
      return targetRole !== 'super_admin' && targetRole !== 'admin';
    }
    
    return false;
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'super_admin':
        return 'bg-purple-600 text-white dark:bg-purple-700';
      case 'admin':
        return 'bg-destructive text-destructive-foreground';
      case 'teacher':
        return 'bg-primary text-primary-foreground';
      case 'student':
        return 'bg-secondary text-secondary-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100';
      default:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100';
    }
  };

  if (!user || !profile || (profile.role !== 'admin' && profile.role !== 'super_admin')) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="space-y-6">
          {/* Back Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/dashboard')}
            className="gap-2 -ml-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>

          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-semibold">Role Management</h1>
              <p className="text-muted-foreground">Manage user roles and permissions</p>
            </div>
          </div>

          <Tabs defaultValue="users" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="users">
                <Users className="h-4 w-4 mr-2" />
                Users
              </TabsTrigger>
              <TabsTrigger value="requests">
                <UserCog className="h-4 w-4 mr-2" />
                Role Requests
              </TabsTrigger>
              <TabsTrigger value="history">
                <History className="h-4 w-4 mr-2" />
                Change History
              </TabsTrigger>
            </TabsList>

            {/* Users Tab */}
            <TabsContent value="users" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>User Management</CardTitle>
                  <CardDescription>View and manage user roles</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Search and Filter */}
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search by username, email, or name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Select value={roleFilter} onValueChange={setRoleFilter}>
                      <SelectTrigger className="w-full md:w-48">
                        <SelectValue placeholder="Filter by role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Roles</SelectItem>
                        <SelectItem value="student">Student</SelectItem>
                        <SelectItem value="teacher">Teacher</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="super_admin">Super Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Bulk Actions */}
                  {selectedUsers.size > 0 && (
                    <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                      <span className="text-sm text-muted-foreground">
                        {selectedUsers.size} user(s) selected
                      </span>
                      <Button
                        size="sm"
                        onClick={() => setBulkDialogOpen(true)}
                      >
                        Change Role
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedUsers(new Set())}
                      >
                        Clear Selection
                      </Button>
                    </div>
                  )}

                  {/* Users Table */}
                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : (
                    <div className="border rounded-lg">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-12">
                              <Checkbox
                                checked={selectedUsers.size === filteredUsers.length && filteredUsers.length > 0}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedUsers(new Set(filteredUsers.map((u) => u.id)));
                                  } else {
                                    setSelectedUsers(new Set());
                                  }
                                }}
                              />
                            </TableHead>
                            <TableHead>User</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Current Role</TableHead>
                            <TableHead>Joined</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredUsers.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                No users found
                              </TableCell>
                            </TableRow>
                          ) : (
                            filteredUsers.map((userProfile) => (
                              <TableRow key={userProfile.id}>
                                <TableCell>
                                  <Checkbox
                                    checked={selectedUsers.has(userProfile.id)}
                                    onCheckedChange={() => toggleUserSelection(userProfile.id)}
                                  />
                                </TableCell>
                                <TableCell>
                                  <div>
                                    <div className="font-medium">
                                      {userProfile.first_name && userProfile.last_name
                                        ? `${userProfile.first_name} ${userProfile.last_name}`
                                        : userProfile.username || 'Unknown'}
                                    </div>
                                    {userProfile.username && (
                                      <div className="text-sm text-muted-foreground">
                                        @{userProfile.username}
                                      </div>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                  {userProfile.email}
                                </TableCell>
                                <TableCell>
                                  <Badge className={getRoleBadgeColor(userProfile.role)}>
                                    {userProfile.role}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                  {new Date(userProfile.created_at).toLocaleDateString()}
                                </TableCell>
                                <TableCell className="text-right">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => openChangeDialog(userProfile)}
                                  >
                                    Change Role
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Role Requests Tab */}
            <TabsContent value="requests" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Role Requests</CardTitle>
                  <CardDescription>Review and manage user role requests</CardDescription>
                </CardHeader>
                <CardContent>
                  {requestsLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : (
                    <div className="border rounded-lg">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead>Requested Role</TableHead>
                            <TableHead>Reason</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {roleRequests.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                No role requests found
                              </TableCell>
                            </TableRow>
                          ) : (
                            roleRequests.map((request) => (
                              <TableRow key={request.id}>
                                <TableCell>
                                  <div>
                                    <div className="font-medium">
                                      {request.user?.first_name && request.user?.last_name
                                        ? `${request.user.first_name} ${request.user.last_name}`
                                        : request.user?.username || 'Unknown'}
                                    </div>
                                    {request.user?.email && (
                                      <div className="text-sm text-muted-foreground">
                                        {request.user.email}
                                      </div>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge className={getRoleBadgeColor(request.requested_role)}>
                                    {request.requested_role}
                                  </Badge>
                                </TableCell>
                                <TableCell className="max-w-xs truncate">
                                  {request.reason}
                                </TableCell>
                                <TableCell>
                                  <Badge className={getStatusBadgeColor(request.status)}>
                                    {request.status}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                  {new Date(request.created_at).toLocaleDateString()}
                                </TableCell>
                                <TableCell className="text-right">
                                  {request.status === 'pending' && (
                                    <div className="flex items-center justify-end gap-2">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleApproveRequest(request)}
                                      >
                                        <CheckCircle2 className="h-4 w-4 mr-1" />
                                        Approve
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleRejectRequest(request, '')}
                                      >
                                        <XCircle className="h-4 w-4 mr-1" />
                                        Reject
                                      </Button>
                                    </div>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Role Change History</CardTitle>
                  <CardDescription>Audit log of all role changes</CardDescription>
                </CardHeader>
                <CardContent>
                  {historyLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : (
                    <div className="border rounded-lg">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead>Old Role</TableHead>
                            <TableHead>New Role</TableHead>
                            <TableHead>Changed By</TableHead>
                            <TableHead>Reason</TableHead>
                            <TableHead>Date</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {roleHistory.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                No role changes found
                              </TableCell>
                            </TableRow>
                          ) : (
                            roleHistory.map((change) => (
                              <TableRow key={change.id}>
                                <TableCell>
                                  <div className="font-medium">
                                    {change.user?.username || change.user?.email || 'Unknown'}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge className={getRoleBadgeColor(change.old_role)}>
                                    {change.old_role}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Badge className={getRoleBadgeColor(change.new_role)}>
                                    {change.new_role}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                  {change.changed_by_user?.username || change.changed_by_user?.email || 'Unknown'}
                                </TableCell>
                                <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
                                  {change.reason || '-'}
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                  {new Date(change.created_at).toLocaleString()}
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Single Role Change Dialog */}
      <Dialog open={changeDialogOpen} onOpenChange={setChangeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change User Role</DialogTitle>
            <DialogDescription>
              Change the role for {userToChange?.username || userToChange?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Current Role</Label>
              <div>
                <Badge className={getRoleBadgeColor(userToChange?.role || 'student')}>
                  {userToChange?.role}
                </Badge>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-role">New Role</Label>
              <Select value={newRole} onValueChange={(value) => setNewRole(value as UserRole)}>
                <SelectTrigger id="new-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="teacher">Teacher</SelectItem>
                  {profile?.role === 'super_admin' && (
                    <>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="super_admin">Super Admin</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason">Reason (required)</Label>
              <Textarea
                id="reason"
                placeholder="Explain why this role change is necessary..."
                value={changeReason}
                onChange={(e) => setChangeReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setChangeDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRoleChange} disabled={changing || !changeReason.trim()}>
              {changing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Changing...
                </>
              ) : (
                'Change Role'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Role Change Dialog */}
      <Dialog open={bulkDialogOpen} onOpenChange={setBulkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Role Change</DialogTitle>
            <DialogDescription>
              Change the role for {selectedUsers.size} selected user(s)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="bulk-role">New Role</Label>
              <Select value={bulkRole} onValueChange={(value) => setBulkRole(value as UserRole)}>
                <SelectTrigger id="bulk-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="teacher">Teacher</SelectItem>
                  {profile?.role === 'super_admin' && (
                    <>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="super_admin">Super Admin</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bulk-reason">Reason (required)</Label>
              <Textarea
                id="bulk-reason"
                placeholder="Explain why this role change is necessary..."
                value={bulkReason}
                onChange={(e) => setBulkReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleBulkRoleChange} disabled={changing || !bulkReason.trim()}>
              {changing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Changing...
                </>
              ) : (
                'Change Roles'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
