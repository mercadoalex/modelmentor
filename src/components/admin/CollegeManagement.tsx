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
import { Badge } from '@/components/ui/badge';
import { GraduationCap, Plus, Pencil, Trash2, Search, Users, Building2 } from 'lucide-react';
import { organizationService, College, Institution } from '@/services/superAdminService';
import { toast } from 'sonner';

export function CollegeManagement() {
  const [colleges, setColleges] = useState<College[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [filteredColleges, setFilteredColleges] = useState<College[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [institutionFilter, setInstitutionFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'users'>('name');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCollege, setSelectedCollege] = useState<College | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    institutionId: '',
    address: '',
    contactEmail: '',
    contactPhone: '',
    status: 'active' as 'active' | 'inactive',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [statsCache, setStatsCache] = useState<Record<string, { groupCount: number; studentCount: number; teacherCount: number; totalUsers: number }>>({});
  const [deleteStats, setDeleteStats] = useState<{ groupCount: number; totalUsers: number } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterAndSortColleges();
  }, [colleges, searchQuery, statusFilter, institutionFilter, sortBy]);

  const loadData = async () => {
    const collegesData = await organizationService.getAllColleges();
    const institutionsData = await organizationService.getAllInstitutions();
    setColleges(collegesData);
    setInstitutions(institutionsData);
  };

  const filterAndSortColleges = () => {
    let filtered = [...colleges];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        college =>
          college.name.toLowerCase().includes(query) ||
          college.description?.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(college => college.status === statusFilter);
    }

    // Apply institution filter
    if (institutionFilter !== 'all') {
      filtered = filtered.filter(college => college.institutionId === institutionFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      } else if (sortBy === 'date') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      } else {
        const statsA = statsCache[a.id] || { totalUsers: 0 };
        const statsB = statsCache[b.id] || { totalUsers: 0 };
        return statsB.totalUsers - statsA.totalUsers;
      }
    });

    setFilteredColleges(filtered);
  };

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      toast.error('College name is required');
      return;
    }

    if (!formData.institutionId) {
      toast.error('Please select a parent institution');
      return;
    }

    await organizationService.createCollege(formData);
    toast.success('College created successfully');
    await loadData();
    setIsCreateDialogOpen(false);
    resetForm();
  };

  const handleEdit = async () => {
    if (!selectedCollege || !formData.name.trim()) {
      toast.error('College name is required');
      return;
    }

    if (!formData.institutionId) {
      toast.error('Please select a parent institution');
      return;
    }

    await organizationService.updateCollege(selectedCollege.id, formData);
    toast.success('College updated successfully');
    await loadData();
    setIsEditDialogOpen(false);
    resetForm();
  };

  const handleDelete = async () => {
    if (!selectedCollege || !deleteStats) return;
    await organizationService.deleteCollege(selectedCollege.id);
    toast.success(
      `College deleted successfully. ${deleteStats.groupCount} groups and ${deleteStats.totalUsers} user memberships were also removed.`
    );
    await loadData();
    setIsDeleteDialogOpen(false);
    setSelectedCollege(null);
  };

  const openEditDialog = (college: College) => {
    setSelectedCollege(college);
    setFormData({
      name: college.name,
      description: college.description || '',
      institutionId: college.institutionId,
      address: college.address || '',
      contactEmail: college.contactEmail || '',
      contactPhone: college.contactPhone || '',
      status: college.status,
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (college: College) => {
    setSelectedCollege(college);
    setIsDeleteDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      institutionId: '',
      address: '',
      contactEmail: '',
      contactPhone: '',
      status: 'active',
    });
    setSelectedCollege(null);
  };

  const getInstitutionName = (institutionId: string) => {
    const institution = institutions.find(inst => inst.id === institutionId);
    return institution?.name || 'Unknown Institution';
  };

  const activeInstitutions = institutions.filter(inst => inst.status === 'active');

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
            <BreadcrumbPage className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4" />
              Colleges
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-balance">College Management</h2>
          <p className="text-sm text-muted-foreground text-pretty">
            Create and manage colleges within institutions
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create College
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 md:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search colleges..."
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
            <SelectItem value="users">Sort by Users</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* College Cards */}
      {filteredColleges.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <GraduationCap className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-balance">No colleges found</p>
            <p className="text-sm text-muted-foreground text-pretty">
              {searchQuery || statusFilter !== 'all' || institutionFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Create your first college to get started'}
            </p>
            {!searchQuery && statusFilter === 'all' && institutionFilter === 'all' && (
              <Button onClick={() => setIsCreateDialogOpen(true)} className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                Create College
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredColleges.map(college => {
            const collegeStats = statsCache[college.id] || { groupCount: 0, studentCount: 0, teacherCount: 0, totalUsers: 0 };
            return (
              <Card key={college.id} className="h-full flex flex-col">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-balance">{college.name}</CardTitle>
                      <CardDescription className="text-pretty">
                        {college.description || 'No description'}
                      </CardDescription>
                    </div>
                    <Badge variant={college.status === 'active' ? 'default' : 'secondary'}>
                      {college.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2">
                    <Building2 className="h-4 w-4 shrink-0" />
                    <span className="truncate">{getInstitutionName(college.institutionId)}</span>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <div className="space-y-2 text-sm flex-1">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-muted-foreground">Groups:</span>
                      <span className="font-medium">{collegeStats.groupCount}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-muted-foreground">Students:</span>
                      <span className="font-medium">{collegeStats.studentCount}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-muted-foreground">Teachers:</span>
                      <span className="font-medium">{collegeStats.teacherCount}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-muted-foreground">Total Users:</span>
                      <span className="font-medium">{collegeStats.totalUsers}</span>
                    </div>
                    <div className="text-xs text-muted-foreground pt-2">
                      Created {new Date(college.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(college)}
                      className="flex-1"
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openDeleteDialog(college)}
                      className="flex-1"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
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
            <DialogTitle>Create College</DialogTitle>
            <DialogDescription>Add a new college to an institution</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="create-name">Name *</Label>
              <Input
                id="create-name"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter college name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-institution">Parent Institution *</Label>
              <Select
                value={formData.institutionId}
                onValueChange={value => setFormData({ ...formData, institutionId: value })}
              >
                <SelectTrigger id="create-institution">
                  <SelectValue placeholder="Select institution" />
                </SelectTrigger>
                <SelectContent>
                  {activeInstitutions.length === 0 ? (
                    <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                      No active institutions available
                    </div>
                  ) : (
                    activeInstitutions.map(inst => (
                      <SelectItem key={inst.id} value={inst.id}>
                        {inst.name}
                      </SelectItem>
                    ))
                  )}
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
            <div className="space-y-2">
              <Label htmlFor="create-address">Address</Label>
              <Input
                id="create-address"
                value={formData.address}
                onChange={e => setFormData({ ...formData, address: e.target.value })}
                placeholder="Enter address"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-email">Contact Email</Label>
              <Input
                id="create-email"
                type="email"
                value={formData.contactEmail}
                onChange={e => setFormData({ ...formData, contactEmail: e.target.value })}
                placeholder="contact@college.edu"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-phone">Contact Phone</Label>
              <Input
                id="create-phone"
                value={formData.contactPhone}
                onChange={e => setFormData({ ...formData, contactPhone: e.target.value })}
                placeholder="+1-555-0100"
              />
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
            <Button onClick={handleCreate}>Create College</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit College</DialogTitle>
            <DialogDescription>Update college details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter college name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-institution">Parent Institution *</Label>
              <Select
                value={formData.institutionId}
                onValueChange={value => setFormData({ ...formData, institutionId: value })}
              >
                <SelectTrigger id="edit-institution">
                  <SelectValue placeholder="Select institution" />
                </SelectTrigger>
                <SelectContent>
                  {activeInstitutions.length === 0 ? (
                    <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                      No active institutions available
                    </div>
                  ) : (
                    activeInstitutions.map(inst => (
                      <SelectItem key={inst.id} value={inst.id}>
                        {inst.name}
                      </SelectItem>
                    ))
                  )}
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
            <div className="space-y-2">
              <Label htmlFor="edit-address">Address</Label>
              <Input
                id="edit-address"
                value={formData.address}
                onChange={e => setFormData({ ...formData, address: e.target.value })}
                placeholder="Enter address"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Contact Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.contactEmail}
                onChange={e => setFormData({ ...formData, contactEmail: e.target.value })}
                placeholder="contact@college.edu"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone">Contact Phone</Label>
              <Input
                id="edit-phone"
                value={formData.contactPhone}
                onChange={e => setFormData({ ...formData, contactPhone: e.target.value })}
                placeholder="+1-555-0100"
              />
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
            <AlertDialogTitle>Delete College</AlertDialogTitle>
            <AlertDialogDescription className="text-pretty">
              Are you sure you want to delete <strong>{selectedCollege?.name}</strong>? This will
              permanently delete:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>{deleteStats?.groupCount || 0} groups</li>
                <li>{deleteStats?.totalUsers || 0} user memberships</li>
              </ul>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete College
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
