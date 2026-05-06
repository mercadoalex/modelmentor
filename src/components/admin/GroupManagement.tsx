import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Users, Plus, Pencil, Trash2, Search, Building2, GraduationCap, Calendar, UserPlus, X } from 'lucide-react';
import { organizationService, Group, College, Institution, UserMembership } from '@/services/superAdminService';
import { toast } from 'sonner';

const GROUP_TYPES = ['class', 'cohort', 'study_group'];

export function GroupManagement() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [colleges, setColleges] = useState<College[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [filteredGroups, setFilteredGroups] = useState<Group[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [collegeFilter, setCollegeFilter] = useState<string>('all');
  const [institutionFilter, setInstitutionFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'members'>('name');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isMembersDialogOpen, setIsMembersDialogOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    collegeId: '',
    groupType: 'class',
    startDate: '',
    endDate: '',
    status: 'active' as 'active' | 'inactive',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [statsCache, setStatsCache] = useState<Record<string, { studentCount: number; teacherCount: number; totalMembers: number }>>({});
  const [deleteStats, setDeleteStats] = useState<{ studentCount: number; teacherCount: number; totalMembers: number } | null>(null);

  // Member management state
  const [members, setMembers] = useState<UserMembership[]>([]);
  const [newMemberUserId, setNewMemberUserId] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<'student' | 'teacher'>('student');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterAndSortGroups();
  }, [groups, searchQuery, statusFilter, collegeFilter, institutionFilter, typeFilter, sortBy]);

  const loadData = async () => {
    const groupsData = await organizationService.getAllGroups();
    const collegesData = await organizationService.getAllColleges();
    const institutionsData = await organizationService.getAllInstitutions();
    setGroups(groupsData);
    setColleges(collegesData);
    setInstitutions(institutionsData);
  };

  const loadMembers = async (groupId: string) => {
    const membersData = await organizationService.getMembershipsByGroup(groupId);
    setMembers(membersData);
  };

  const filterAndSortGroups = () => {
    let filtered = [...groups];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        group =>
          group.name.toLowerCase().includes(query) ||
          group.description?.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(group => group.status === statusFilter);
    }

    // Apply college filter
    if (collegeFilter !== 'all') {
      filtered = filtered.filter(group => group.collegeId === collegeFilter);
    }

    // Apply institution filter
    if (institutionFilter !== 'all') {
      const collegesInInstitution = colleges.filter(c => c.institutionId === institutionFilter);
      const collegeIds = collegesInInstitution.map(c => c.id);
      filtered = filtered.filter(group => collegeIds.includes(group.collegeId));
    }

    // Apply type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(group => group.groupType === typeFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      } else if (sortBy === 'date') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      } else {
        const statsA = statsCache[a.id] || { totalMembers: 0 };
        const statsB = statsCache[b.id] || { totalMembers: 0 };
        return statsB.totalMembers - statsA.totalMembers;
      }
    });

    setFilteredGroups(filtered);
  };

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      toast.error('Group name is required');
      return;
    }

    if (!formData.collegeId) {
      toast.error('Please select a parent college');
      return;
    }

    await organizationService.createGroup(formData);
    toast.success('Group created successfully');
    await loadData();
    setIsCreateDialogOpen(false);
    resetForm();
  };

  const handleEdit = async () => {
    if (!selectedGroup || !formData.name.trim()) {
      toast.error('Group name is required');
      return;
    }

    if (!formData.collegeId) {
      toast.error('Please select a parent college');
      return;
    }

    await organizationService.updateGroup(selectedGroup.id, formData);
    toast.success('Group updated successfully');
    await loadData();
    setIsEditDialogOpen(false);
    resetForm();
  };

  const handleDelete = async () => {
    if (!selectedGroup || !deleteStats) return;
    await organizationService.deleteGroup(selectedGroup.id);
    toast.success(
      `Group deleted successfully. ${deleteStats.totalMembers} user memberships were also removed.`
    );
    await loadData();
    setIsDeleteDialogOpen(false);
    setSelectedGroup(null);
  };

  const handleAddMember = async () => {
    if (!selectedGroup || !newMemberUserId.trim()) {
      toast.error('User ID is required');
      return;
    }

    organizationService.addMembership(newMemberUserId, selectedGroup.id, newMemberRole);
    toast.success(`${newMemberRole === 'student' ? 'Student' : 'Teacher'} added successfully`);
    loadMembers(selectedGroup.id);
    setNewMemberUserId('');
  };

  const handleRemoveMember = async (membershipId: string) => {
    organizationService.removeMembership(membershipId);
    toast.success('Member removed successfully');
    if (selectedGroup) {
      loadMembers(selectedGroup.id);
    }
  };

  const openEditDialog = (group: Group) => {
    setSelectedGroup(group);
    setFormData({
      name: group.name,
      description: group.description || '',
      collegeId: group.collegeId,
      groupType: group.groupType || 'class',
      startDate: group.startDate || '',
      endDate: group.endDate || '',
      status: group.status,
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (group: Group) => {
    setSelectedGroup(group);
    setIsDeleteDialogOpen(true);
  };

  const openMembersDialog = (group: Group) => {
    setSelectedGroup(group);
    loadMembers(group.id);
    setIsMembersDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      collegeId: '',
      groupType: 'class',
      startDate: '',
      endDate: '',
      status: 'active',
    });
    setSelectedGroup(null);
  };

  const getCollegeName = (collegeId: string) => {
    const college = colleges.find(c => c.id === collegeId);
    return college?.name || 'Unknown College';
  };

  const getInstitutionName = (collegeId: string) => {
    const college = colleges.find(c => c.id === collegeId);
    if (!college) return 'Unknown Institution';
    const institution = institutions.find(inst => inst.id === college.institutionId);
    return institution?.name || 'Unknown Institution';
  };

  const getCollegesByInstitution = (institutionId: string) => {
    return colleges.filter(c => c.institutionId === institutionId && c.status === 'active');
  };

  const activeColleges = colleges.filter(c => c.status === 'active');

  const studentMembers = members.filter(m => m.role === 'student');
  const teacherMembers = members.filter(m => m.role === 'teacher');

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/super-admin" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Institutions
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/super-admin" className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4" />
              Colleges
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Groups
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-balance">Group Management</h2>
          <p className="text-sm text-muted-foreground text-pretty">
            Create and manage groups within colleges
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Group
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-4 md:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search groups..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={institutionFilter} onValueChange={setInstitutionFilter}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Institutions</SelectItem>
              {institutions.map(inst => (
                <SelectItem key={inst.id} value={inst.id}>
                  {inst.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={collegeFilter} onValueChange={setCollegeFilter}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Colleges</SelectItem>
              {colleges.map(college => (
                <SelectItem key={college.id} value={college.id}>
                  {college.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-4 md:flex-row">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full md:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="class">Class</SelectItem>
              <SelectItem value="cohort">Cohort</SelectItem>
              <SelectItem value="study_group">Study Group</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={(value: typeof statusFilter) => setStatusFilter(value)}>
            <SelectTrigger className="w-full md:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={(value: typeof sortBy) => setSortBy(value)}>
            <SelectTrigger className="w-full md:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Sort by Name</SelectItem>
              <SelectItem value="date">Sort by Date</SelectItem>
              <SelectItem value="members">Sort by Members</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Group Cards */}
      {filteredGroups.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-balance">No groups found</p>
            <p className="text-sm text-muted-foreground text-pretty">
              {searchQuery || statusFilter !== 'all' || collegeFilter !== 'all' || institutionFilter !== 'all' || typeFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Create your first group to get started'}
            </p>
            {!searchQuery && statusFilter === 'all' && collegeFilter === 'all' && institutionFilter === 'all' && typeFilter === 'all' && (
              <Button onClick={() => setIsCreateDialogOpen(true)} className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                Create Group
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredGroups.map(group => {
            const groupStats = statsCache[group.id] || { studentCount: 0, teacherCount: 0, totalMembers: 0 };
            return (
              <Card key={group.id} className="h-full flex flex-col">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-balance">{group.name}</CardTitle>
                      <CardDescription className="text-pretty">
                        {group.description || 'No description'}
                      </CardDescription>
                    </div>
                    <Badge variant={group.status === 'active' ? 'default' : 'secondary'}>
                      {group.status}
                    </Badge>
                  </div>
                  <div className="space-y-1 pt-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Building2 className="h-4 w-4 shrink-0" />
                      <span className="truncate">{getInstitutionName(group.collegeId)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <GraduationCap className="h-4 w-4 shrink-0" />
                      <span className="truncate">{getCollegeName(group.collegeId)}</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <div className="space-y-2 text-sm flex-1">
                    {group.groupType && (
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Type:</span>
                        <Badge variant="outline">{group.groupType.replace('_', ' ')}</Badge>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-muted-foreground">Students:</span>
                      <span className="font-medium">{groupStats.studentCount}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-muted-foreground">Teachers:</span>
                      <span className="font-medium">{groupStats.teacherCount}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-muted-foreground">Total Members:</span>
                      <span className="font-medium">{groupStats.totalMembers}</span>
                    </div>
                    {(group.startDate || group.endDate) && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="text-xs text-muted-foreground">
                          {group.startDate && new Date(group.startDate).toLocaleDateString()}
                          {group.startDate && group.endDate && ' - '}
                          {group.endDate && new Date(group.endDate).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground pt-2">
                      Created {new Date(group.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 mt-4 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openMembersDialog(group)}
                      className="w-full"
                    >
                      <UserPlus className="mr-2 h-4 w-4" />
                      Manage Members
                    </Button>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(group)}
                        className="flex-1"
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openDeleteDialog(group)}
                        className="flex-1"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Group</DialogTitle>
            <DialogDescription>Add a new group to a college</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="create-name">Name *</Label>
              <Input
                id="create-name"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter group name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-college">Parent College *</Label>
              <Select
                value={formData.collegeId}
                onValueChange={value => setFormData({ ...formData, collegeId: value })}
              >
                <SelectTrigger id="create-college">
                  <SelectValue placeholder="Select college" />
                </SelectTrigger>
                <SelectContent>
                  {activeColleges.length === 0 ? (
                    <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                      No active colleges available
                    </div>
                  ) : (
                    institutions.map(inst => {
                      const instColleges = getCollegesByInstitution(inst.id);
                      if (instColleges.length === 0) return null;
                      return (
                        <div key={inst.id}>
                          <div className="px-2 py-2 text-xs font-medium text-muted-foreground">
                            {inst.name}
                          </div>
                          {instColleges.map(college => (
                            <SelectItem key={college.id} value={college.id} className="pl-6">
                              {college.name}
                            </SelectItem>
                          ))}
                        </div>
                      );
                    })
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-type">Group Type</Label>
              <Select
                value={formData.groupType}
                onValueChange={value => setFormData({ ...formData, groupType: value })}
              >
                <SelectTrigger id="create-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="class">Class</SelectItem>
                  <SelectItem value="cohort">Cohort</SelectItem>
                  <SelectItem value="study_group">Study Group</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-description">Description</Label>
              <Textarea
                id="create-description"
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter description"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="create-start-date">Start Date</Label>
                <Input
                  id="create-start-date"
                  type="date"
                  value={formData.startDate}
                  onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-end-date">End Date</Label>
                <Input
                  id="create-end-date"
                  type="date"
                  value={formData.endDate}
                  onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: 'active' | 'inactive') =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger id="create-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate}>Create Group</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Group</DialogTitle>
            <DialogDescription>Update group details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter group name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-college">Parent College *</Label>
              <Select
                value={formData.collegeId}
                onValueChange={value => setFormData({ ...formData, collegeId: value })}
              >
                <SelectTrigger id="edit-college">
                  <SelectValue placeholder="Select college" />
                </SelectTrigger>
                <SelectContent>
                  {activeColleges.length === 0 ? (
                    <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                      No active colleges available
                    </div>
                  ) : (
                    institutions.map(inst => {
                      const instColleges = getCollegesByInstitution(inst.id);
                      if (instColleges.length === 0) return null;
                      return (
                        <div key={inst.id}>
                          <div className="px-2 py-2 text-xs font-medium text-muted-foreground">
                            {inst.name}
                          </div>
                          {instColleges.map(college => (
                            <SelectItem key={college.id} value={college.id} className="pl-6">
                              {college.name}
                            </SelectItem>
                          ))}
                        </div>
                      );
                    })
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-type">Group Type</Label>
              <Select
                value={formData.groupType}
                onValueChange={value => setFormData({ ...formData, groupType: value })}
              >
                <SelectTrigger id="edit-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="class">Class</SelectItem>
                  <SelectItem value="cohort">Cohort</SelectItem>
                  <SelectItem value="study_group">Study Group</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter description"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-start-date">Start Date</Label>
                <Input
                  id="edit-start-date"
                  type="date"
                  value={formData.startDate}
                  onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-end-date">End Date</Label>
                <Input
                  id="edit-end-date"
                  type="date"
                  value={formData.endDate}
                  onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: 'active' | 'inactive') =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger id="edit-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Group</AlertDialogTitle>
            <AlertDialogDescription className="text-pretty">
              Are you sure you want to delete <strong>{selectedGroup?.name}</strong>? This will
              permanently remove:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>{deleteStats?.studentCount || 0} student memberships</li>
                <li>{deleteStats?.teacherCount || 0} teacher memberships</li>
                <li>{deleteStats?.totalMembers || 0} total memberships</li>
              </ul>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete Group
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Members Management Dialog */}
      <Dialog open={isMembersDialogOpen} onOpenChange={setIsMembersDialogOpen}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-2xl max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Members - {selectedGroup?.name}</DialogTitle>
            <DialogDescription>Add or remove students and teachers</DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="students" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="students">
                Students ({studentMembers.length})
              </TabsTrigger>
              <TabsTrigger value="teachers">
                Teachers ({teacherMembers.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="students" className="space-y-4">
              {/* Add Student */}
              <div className="flex gap-2">
                <Input
                  placeholder="Enter student user ID"
                  value={newMemberUserId}
                  onChange={e => setNewMemberUserId(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      setNewMemberRole('student');
                      handleAddMember();
                    }
                  }}
                />
                <Button
                  onClick={() => {
                    setNewMemberRole('student');
                    handleAddMember();
                  }}
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add
                </Button>
              </div>

              {/* Student List */}
              <div className="space-y-2">
                {studentMembers.length === 0 ? (
                  <div className="text-center py-8 text-sm text-muted-foreground">
                    No students in this group
                  </div>
                ) : (
                  studentMembers.map(member => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-3 border rounded"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">User ID: {member.userId}</p>
                        <p className="text-xs text-muted-foreground">
                          Joined {new Date(member.joinedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveMember(member.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="teachers" className="space-y-4">
              {/* Add Teacher */}
              <div className="flex gap-2">
                <Input
                  placeholder="Enter teacher user ID"
                  value={newMemberUserId}
                  onChange={e => setNewMemberUserId(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      setNewMemberRole('teacher');
                      handleAddMember();
                    }
                  }}
                />
                <Button
                  onClick={() => {
                    setNewMemberRole('teacher');
                    handleAddMember();
                  }}
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add
                </Button>
              </div>

              {/* Teacher List */}
              <div className="space-y-2">
                {teacherMembers.length === 0 ? (
                  <div className="text-center py-8 text-sm text-muted-foreground">
                    No teachers in this group
                  </div>
                ) : (
                  teacherMembers.map(member => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-3 border rounded"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">User ID: {member.userId}</p>
                        <p className="text-xs text-muted-foreground">
                          Joined {new Date(member.joinedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveMember(member.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button onClick={() => setIsMembersDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
