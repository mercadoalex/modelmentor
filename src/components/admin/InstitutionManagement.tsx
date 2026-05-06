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
import { Badge } from '@/components/ui/badge';
import { Building2, Plus, Pencil, Trash2, Search, Users } from 'lucide-react';
import { organizationService, Institution } from '@/services/superAdminService';
import { toast } from 'sonner';

export function InstitutionManagement() {
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [filteredInstitutions, setFilteredInstitutions] = useState<Institution[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'users'>('name');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedInstitution, setSelectedInstitution] = useState<Institution | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    contactEmail: '',
    contactPhone: '',
    status: 'active' as 'active' | 'inactive',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [statsCache, setStatsCache] = useState<Record<string, { collegeCount: number; groupCount: number; studentCount: number; teacherCount: number; totalUsers: number }>>({});
  const [deleteStats, setDeleteStats] = useState<{ collegeCount: number; groupCount: number; totalUsers: number } | null>(null);

  useEffect(() => {
    loadInstitutions();
  }, []);

  useEffect(() => {
    filterAndSortInstitutions();
  }, [institutions, searchQuery, statusFilter, sortBy, statsCache]);

  useEffect(() => {
    // Load stats for all institutions
    const loadStats = async () => {
      const cache: Record<string, any> = {};
      for (const inst of institutions) {
        const stats = await organizationService.getInstitutionStats(inst.id);
        cache[inst.id] = stats;
      }
      setStatsCache(cache);
    };
    if (institutions.length > 0) {
      loadStats();
    }
  }, [institutions]);

  useEffect(() => {
    // Load delete stats when institution is selected for deletion
    const loadDeleteStats = async () => {
      if (selectedInstitution && isDeleteDialogOpen) {
        const stats = await organizationService.getInstitutionStats(selectedInstitution.id);
        setDeleteStats(stats);
      } else {
        setDeleteStats(null);
      }
    };
    loadDeleteStats();
  }, [selectedInstitution, isDeleteDialogOpen]);

  const loadInstitutions = async () => {
    setIsLoading(true);
    const data = await organizationService.getAllInstitutions();
    setInstitutions(data);
    setIsLoading(false);
  };

  const filterAndSortInstitutions = () => {
    let filtered = [...institutions];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        inst =>
          inst.name.toLowerCase().includes(query) ||
          inst.description?.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(inst => inst.status === statusFilter);
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

    setFilteredInstitutions(filtered);
  };

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      toast.error('Institution name is required');
      return;
    }

    await organizationService.createInstitution(formData);
    toast.success('Institution created successfully');
    await loadInstitutions();
    setIsCreateDialogOpen(false);
    resetForm();
  };

  const handleEdit = async () => {
    if (!selectedInstitution || !formData.name.trim()) {
      toast.error('Institution name is required');
      return;
    }

    await organizationService.updateInstitution(selectedInstitution.id, formData);
    toast.success('Institution updated successfully');
    await loadInstitutions();
    setIsEditDialogOpen(false);
    resetForm();
  };

  const handleDelete = async () => {
    if (!selectedInstitution || !deleteStats) return;

    await organizationService.deleteInstitution(selectedInstitution.id);
    toast.success(
      `Institution deleted successfully. ${deleteStats.collegeCount} colleges and ${deleteStats.groupCount} groups were also removed.`
    );
    await loadInstitutions();
    setIsDeleteDialogOpen(false);
    setSelectedInstitution(null);
  };

  const openEditDialog = (institution: Institution) => {
    setSelectedInstitution(institution);
    setFormData({
      name: institution.name,
      description: institution.description || '',
      address: institution.address || '',
      contactEmail: institution.contactEmail || '',
      contactPhone: institution.contactPhone || '',
      status: institution.status,
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (institution: Institution) => {
    setSelectedInstitution(institution);
    setIsDeleteDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      address: '',
      contactEmail: '',
      contactPhone: '',
      status: 'active',
    });
    setSelectedInstitution(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-balance">Institution Management</h2>
          <p className="text-sm text-muted-foreground text-pretty">
            Create and manage educational institutions
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Institution
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 md:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search institutions..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
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

      {/* Institution Cards */}
      {filteredInstitutions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-balance">No institutions found</p>
            <p className="text-sm text-muted-foreground text-pretty">
              {searchQuery || statusFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Create your first institution to get started'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredInstitutions.map(institution => {
            const instStats = statsCache[institution.id] || { collegeCount: 0, groupCount: 0, studentCount: 0, teacherCount: 0, totalUsers: 0 };
            return (
              <Card key={institution.id} className="h-full flex flex-col">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-balance">{institution.name}</CardTitle>
                      <CardDescription className="text-pretty">
                        {institution.description || 'No description'}
                      </CardDescription>
                    </div>
                    <Badge variant={institution.status === 'active' ? 'default' : 'secondary'}>
                      {institution.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <div className="space-y-2 text-sm flex-1">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-muted-foreground">Colleges:</span>
                      <span className="font-medium">{instStats.collegeCount}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-muted-foreground">Total Users:</span>
                      <span className="font-medium">{instStats.totalUsers}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Created {new Date(institution.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(institution)}
                      className="flex-1"
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openDeleteDialog(institution)}
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
            <DialogTitle>Create Institution</DialogTitle>
            <DialogDescription>Add a new educational institution to the system</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="create-name">Name *</Label>
              <Input
                id="create-name"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter institution name"
              />
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
                placeholder="contact@institution.edu"
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
            <Button onClick={handleCreate}>Create Institution</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Institution</DialogTitle>
            <DialogDescription>Update institution details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter institution name"
              />
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
                placeholder="contact@institution.edu"
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
            <AlertDialogTitle>Delete Institution</AlertDialogTitle>
            <AlertDialogDescription className="text-pretty">
              Are you sure you want to delete <strong>{selectedInstitution?.name}</strong>? This will
              permanently delete:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>{deleteStats?.collegeCount || 0} colleges</li>
                <li>{deleteStats?.groupCount || 0} groups</li>
                <li>All associated user memberships</li>
              </ul>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete Institution
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
