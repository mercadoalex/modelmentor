import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserPlus, CheckCircle, XCircle, Clock, Undo2, Search, X, Calendar as CalendarIcon, Filter } from 'lucide-react';
import { joinRequestService } from '@/services/joinRequestService';
import { bulkActionService } from '@/services/bulkActionService';
import { filterHistoryService } from '@/services/filterHistoryService';
import { supabase } from '@/db/supabase';
import { toast } from 'sonner';
import type { JoinRequest, BulkActionItemStatus, UserRole, JoinRequestStatus } from '@/types/types';
import { format } from 'date-fns';
import { RecentFiltersDropdown } from './RecentFiltersDropdown';


interface JoinRequestManagerProps {
  organizationId: string;
  adminId: string;
  onRequestProcessed?: () => void;
}

interface BulkResult {
  success: number;
  failed: number;
  errors: string[];
}

export function JoinRequestManager({ organizationId, adminId, onRequestProcessed }: JoinRequestManagerProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [requests, setRequests] = useState<Array<JoinRequest & { user: any }>>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<(JoinRequest & { user: any }) | null>(null);
  const [adminMessage, setAdminMessage] = useState('');
  const [isApproving, setIsApproving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve');
  const [isOrgAdmin, setIsOrgAdmin] = useState(false);
  
  // Bulk operations state
  const [selectedRequests, setSelectedRequests] = useState<Set<string>>(new Set());
  const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false);
  const [bulkActionType, setBulkActionType] = useState<'approve' | 'reject'>('approve');
  const [bulkMessage, setBulkMessage] = useState('');
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const [bulkProgress, setBulkProgress] = useState(0);
  const [bulkTotal, setBulkTotal] = useState(0);
  const [showUndoToast, setShowUndoToast] = useState(false);
  const [undoData, setUndoData] = useState<Array<{ requestId: string; userId: string }>>([]);
  const undoTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [undoCountdown, setUndoCountdown] = useState(10);

  // Filter state
  const [filterRoles, setFilterRoles] = useState<Set<UserRole>>(new Set());
  const [filterStatus, setFilterStatus] = useState<JoinRequestStatus | 'all'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined
  });
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize filters from URL on mount
  useEffect(() => {
    const rolesParam = searchParams.get('roles');
    const statusParam = searchParams.get('status');
    const searchParam = searchParams.get('search');
    const fromParam = searchParams.get('from');
    const toParam = searchParams.get('to');

    // Parse roles
    if (rolesParam) {
      const roles = rolesParam.split(',').filter(r => r === 'student' || r === 'teacher') as UserRole[];
      setFilterRoles(new Set(roles));
    }

    // Parse status
    if (statusParam && (statusParam === 'all' || statusParam === 'pending' || statusParam === 'approved' || statusParam === 'rejected')) {
      setFilterStatus(statusParam as JoinRequestStatus | 'all');
    }

    // Parse search
    if (searchParam) {
      setSearchQuery(searchParam);
    }

    // Parse dates
    if (fromParam) {
      const fromDate = new Date(fromParam);
      if (!isNaN(fromDate.getTime())) {
        setDateRange(prev => ({ ...prev, from: fromDate }));
      }
    }
    if (toParam) {
      const toDate = new Date(toParam);
      if (!isNaN(toDate.getTime())) {
        setDateRange(prev => ({ ...prev, to: toDate }));
      }
    }

    setIsInitialized(true);
  }, []);

  // Sync filters to URL
  useEffect(() => {
    if (!isInitialized) return;

    const params = new URLSearchParams();

    // Serialize roles
    if (filterRoles.size > 0) {
      params.set('roles', Array.from(filterRoles).join(','));
    }

    // Serialize status (only if not default)
    if (filterStatus !== 'pending') {
      params.set('status', filterStatus);
    }

    // Serialize search
    if (searchQuery.trim()) {
      params.set('search', searchQuery.trim());
    }

    // Serialize dates
    if (dateRange.from) {
      params.set('from', dateRange.from.toISOString().split('T')[0]);
    }
    if (dateRange.to) {
      params.set('to', dateRange.to.toISOString().split('T')[0]);
    }

    setSearchParams(params, { replace: true });
  }, [filterRoles, filterStatus, searchQuery, dateRange, isInitialized, setSearchParams]);

  // Track filter history (debounced)
  useEffect(() => {
    if (!isInitialized) return;

    const params = new URLSearchParams();

    // Serialize filters
    if (filterRoles.size > 0) {
      params.set('roles', Array.from(filterRoles).join(','));
    }
    if (filterStatus !== 'pending') {
      params.set('status', filterStatus);
    }
    if (searchQuery.trim()) {
      params.set('search', searchQuery.trim());
    }
    if (dateRange.from) {
      params.set('from', dateRange.from.toISOString().split('T')[0]);
    }
    if (dateRange.to) {
      params.set('to', dateRange.to.toISOString().split('T')[0]);
    }

    const filterUrl = params.toString();

    // Debounce: only save after 2 seconds of no changes
    const timer = setTimeout(() => {
      if (filterUrl) {
        filterHistoryService.addOrUpdate(organizationId, adminId, filterUrl);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [filterRoles, filterStatus, searchQuery, dateRange, isInitialized, organizationId, adminId]);

  // Prune old filter history on mount
  useEffect(() => {
    filterHistoryService.pruneOld();
  }, []);

  // Check if user is organization admin
  useEffect(() => {
    const checkOrgAdmin = async () => {
      const { data } = await supabase
        .from('organizations')
        .select('created_by')
        .eq('id', organizationId)
        .maybeSingle();
      
      if (data) {
        setIsOrgAdmin(data.created_by === adminId);
      }
    };
    checkOrgAdmin();
  }, [organizationId, adminId]);

  useEffect(() => {
    loadRequests();
  }, [organizationId]);

  const loadRequests = async () => {
    // Load all requests (not just pending) for filtering
    const { data, error } = await supabase
      .from('join_requests')
      .select(`
        *,
        user:profiles!user_id (*)
      `)
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading requests:', error);
      return;
    }

    setRequests(data || []);
  };

  const handleApprove = async () => {
    if (!selectedRequest) return;

    setIsApproving(true);
    try {
      // Approve the request
      const success = await joinRequestService.approve(
        selectedRequest.id,
        adminId,
        adminMessage.trim() || undefined
      );

      if (!success) {
        toast.error('Failed to approve request');
        return;
      }

      // Update user's organization_id
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ organization_id: organizationId })
        .eq('id', selectedRequest.user_id);

      if (profileError) {
        console.error('Error updating profile:', profileError);
        toast.error('Request approved but failed to update user profile');
      } else {
        toast.success('Request approved! User has been added to your organization.');
      }

      // Reload requests and close dialog
      await loadRequests();
      setIsDialogOpen(false);
      setSelectedRequest(null);
      setAdminMessage('');
      onRequestProcessed?.();
    } catch (error) {
      toast.error('Failed to approve request');
      console.error(error);
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest) return;

    setIsApproving(true);
    try {
      const success = await joinRequestService.reject(
        selectedRequest.id,
        adminId,
        adminMessage.trim() || undefined
      );

      if (success) {
        toast.success('Request rejected');
        await loadRequests();
        setIsDialogOpen(false);
        setSelectedRequest(null);
        setAdminMessage('');
        onRequestProcessed?.();
      } else {
        toast.error('Failed to reject request');
      }
    } catch (error) {
      toast.error('Failed to reject request');
      console.error(error);
    } finally {
      setIsApproving(false);
    }
  };

  const openApproveDialog = (request: JoinRequest & { user: any }) => {
    setSelectedRequest(request);
    setActionType('approve');
    setAdminMessage('');
    setIsDialogOpen(true);
  };

  const openRejectDialog = (request: JoinRequest & { user: any }) => {
    setSelectedRequest(request);
    setActionType('reject');
    setAdminMessage('');
    setIsDialogOpen(true);
  };

  const getInitials = (firstName: string | null, lastName: string | null) => {
    const first = firstName?.charAt(0) || '';
    const last = lastName?.charAt(0) || '';
    return (first + last).toUpperCase() || '?';
  };

  // Bulk operations
  const openBulkApproveDialog = () => {
    setBulkActionType('approve');
    setBulkMessage('');
    setIsBulkDialogOpen(true);
  };

  const openBulkRejectDialog = () => {
    setBulkActionType('reject');
    setBulkMessage('');
    setIsBulkDialogOpen(true);
  };

  const handleBulkApprove = async () => {
    const selectedRequestsList = filteredRequests.filter(r => selectedRequests.has(r.id));
    if (selectedRequestsList.length === 0) return;

    setIsBulkProcessing(true);
    setBulkTotal(selectedRequestsList.length);
    setBulkProgress(0);

    const result: BulkResult = {
      success: 0,
      failed: 0,
      errors: []
    };

    const approvedUsers: Array<{ requestId: string; userId: string }> = [];
    const bulkActionItems: Array<{ requestId: string; status: BulkActionItemStatus; errorMessage?: string }> = [];

    for (let i = 0; i < selectedRequestsList.length; i++) {
      const request = selectedRequestsList[i];
      try {
        // Approve request
        const success = await joinRequestService.approve(
          request.id,
          adminId,
          bulkMessage.trim() || undefined
        );

        if (success) {
          // Update user's organization_id
          const { error: profileError } = await supabase
            .from('profiles')
            .update({ organization_id: organizationId })
            .eq('id', request.user_id);

          if (profileError) {
            result.failed++;
            result.errors.push(`Failed to update profile for ${request.user?.email}`);
            bulkActionItems.push({
              requestId: request.id,
              status: 'failed',
              errorMessage: `Failed to update profile for ${request.user?.email}`
            });
          } else {
            result.success++;
            approvedUsers.push({ requestId: request.id, userId: request.user_id });
            bulkActionItems.push({
              requestId: request.id,
              status: 'success'
            });
          }
        } else {
          result.failed++;
          result.errors.push(`Failed to approve request for ${request.user?.email}`);
          bulkActionItems.push({
            requestId: request.id,
            status: 'failed',
            errorMessage: `Failed to approve request for ${request.user?.email}`
          });
        }
      } catch (error) {
        result.failed++;
        result.errors.push(`Error processing ${request.user?.email}`);
        bulkActionItems.push({
          requestId: request.id,
          status: 'failed',
          errorMessage: `Error processing ${request.user?.email}`
        });
      }
      setBulkProgress(i + 1);
    }

    // Log bulk action
    const bulkActionId = await bulkActionService.create(
      organizationId,
      adminId,
      'bulk_approve',
      selectedRequestsList.length,
      result.success,
      result.failed,
      bulkMessage.trim() || undefined
    );

    if (bulkActionId) {
      await bulkActionService.addItems(bulkActionId, bulkActionItems);
    }

    setIsBulkProcessing(false);
    setIsBulkDialogOpen(false);
    setSelectedRequests(new Set());
    await loadRequests();
    onRequestProcessed?.();

    // Show results
    if (result.success > 0) {
      toast.success(`Successfully approved ${result.success} request(s)`);
      
      // Show undo option
      setUndoData(approvedUsers);
      setShowUndoToast(true);
      setUndoCountdown(10);
      
      // Start countdown
      const countdownInterval = setInterval(() => {
        setUndoCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            setShowUndoToast(false);
            return 10;
          }
          return prev - 1;
        });
      }, 1000);

      // Auto-hide after 10 seconds
      undoTimerRef.current = setTimeout(() => {
        setShowUndoToast(false);
        setUndoData([]);
        clearInterval(countdownInterval);
      }, 10000);
    }

    if (result.failed > 0) {
      toast.error(`Failed to approve ${result.failed} request(s)`, {
        description: result.errors.slice(0, 3).join(', ')
      });
    }
  };

  const handleBulkReject = async () => {
    const selectedRequestsList = filteredRequests.filter(r => selectedRequests.has(r.id));
    if (selectedRequestsList.length === 0) return;

    setIsBulkProcessing(true);
    setBulkTotal(selectedRequestsList.length);
    setBulkProgress(0);

    const result: BulkResult = {
      success: 0,
      failed: 0,
      errors: []
    };

    const bulkActionItems: Array<{ requestId: string; status: BulkActionItemStatus; errorMessage?: string }> = [];

    for (let i = 0; i < selectedRequestsList.length; i++) {
      const request = selectedRequestsList[i];
      try {
        const success = await joinRequestService.reject(
          request.id,
          adminId,
          bulkMessage.trim() || undefined
        );

        if (success) {
          result.success++;
          bulkActionItems.push({
            requestId: request.id,
            status: 'success'
          });
        } else {
          result.failed++;
          result.errors.push(`Failed to reject request for ${request.user?.email}`);
          bulkActionItems.push({
            requestId: request.id,
            status: 'failed',
            errorMessage: `Failed to reject request for ${request.user?.email}`
          });
        }
      } catch (error) {
        result.failed++;
        result.errors.push(`Error processing ${request.user?.email}`);
        bulkActionItems.push({
          requestId: request.id,
          status: 'failed',
          errorMessage: `Error processing ${request.user?.email}`
        });
      }
      setBulkProgress(i + 1);
    }

    // Log bulk action
    const bulkActionId = await bulkActionService.create(
      organizationId,
      adminId,
      'bulk_reject',
      selectedRequestsList.length,
      result.success,
      result.failed,
      bulkMessage.trim() || undefined
    );

    if (bulkActionId) {
      await bulkActionService.addItems(bulkActionId, bulkActionItems);
    }

    setIsBulkProcessing(false);
    setIsBulkDialogOpen(false);
    setSelectedRequests(new Set());
    await loadRequests();
    onRequestProcessed?.();

    // Show results
    if (result.success > 0) {
      toast.success(`Successfully rejected ${result.success} request(s)`);
    }
    if (result.failed > 0) {
      toast.error(`Failed to reject ${result.failed} request(s)`, {
        description: result.errors.slice(0, 3).join(', ')
      });
    }
  };

  const handleUndo = async () => {
    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current);
    }
    setShowUndoToast(false);

    toast.loading('Undoing approvals...');

    try {
      // Revert organization_id for all approved users
      for (const { userId } of undoData) {
        await supabase
          .from('profiles')
          .update({ organization_id: null })
          .eq('id', userId);
      }

      // Revert request status back to pending
      for (const { requestId } of undoData) {
        await supabase
          .from('join_requests')
          .update({
            status: 'pending',
            processed_by: null,
            processed_at: null,
            admin_message: null
          })
          .eq('id', requestId);
      }

      // Log undo action
      const bulkActionItems = undoData.map(item => ({
        requestId: item.requestId,
        status: 'success' as BulkActionItemStatus
      }));

      const bulkActionId = await bulkActionService.create(
        organizationId,
        adminId,
        'bulk_undo',
        undoData.length,
        undoData.length,
        0
      );

      if (bulkActionId) {
        await bulkActionService.addItems(bulkActionId, bulkActionItems);
      }

      toast.dismiss();
      toast.success('Approvals undone successfully');
      setUndoData([]);
      await loadRequests();
      onRequestProcessed?.();
    } catch (error) {
      toast.dismiss();
      toast.error('Failed to undo approvals');
      console.error(error);
    }
  };

  const clearSelection = () => {
    setSelectedRequests(new Set());
  };

  // Filter logic
  const filteredRequests = requests.filter(request => {
    // Status filter
    if (filterStatus !== 'all' && request.status !== filterStatus) {
      return false;
    }

    // Role filter
    if (filterRoles.size > 0 && !filterRoles.has(request.user?.role)) {
      return false;
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const firstName = request.user?.first_name?.toLowerCase() || '';
      const lastName = request.user?.last_name?.toLowerCase() || '';
      const email = request.user?.email?.toLowerCase() || '';
      const fullName = `${firstName} ${lastName}`;
      
      if (!fullName.includes(query) && !email.includes(query)) {
        return false;
      }
    }

    // Date range filter
    if (dateRange.from || dateRange.to) {
      const requestDate = new Date(request.created_at);
      if (dateRange.from && requestDate < dateRange.from) {
        return false;
      }
      if (dateRange.to) {
        const toEndOfDay = new Date(dateRange.to);
        toEndOfDay.setHours(23, 59, 59, 999);
        if (requestDate > toEndOfDay) {
          return false;
        }
      }
    }

    return true;
  });

  const toggleRoleFilter = (role: UserRole) => {
    const newRoles = new Set(filterRoles);
    if (newRoles.has(role)) {
      newRoles.delete(role);
    } else {
      newRoles.add(role);
    }
    setFilterRoles(newRoles);
  };

  const clearAllFilters = () => {
    setFilterRoles(new Set());
    setFilterStatus('pending');
    setSearchQuery('');
    setDateRange({ from: undefined, to: undefined });
  };

  const removeRoleFilter = (role: UserRole) => {
    const newRoles = new Set(filterRoles);
    newRoles.delete(role);
    setFilterRoles(newRoles);
  };

  const hasActiveFilters = filterRoles.size > 0 || searchQuery.trim() !== '' || dateRange.from || dateRange.to || filterStatus !== 'pending';

  const toggleSelectAll = () => {
    if (selectedRequests.size === filteredRequests.length && filteredRequests.length > 0) {
      setSelectedRequests(new Set());
    } else {
      setSelectedRequests(new Set(filteredRequests.map(r => r.id)));
    }
  };

  const toggleSelectRequest = (requestId: string) => {
    const newSelected = new Set(selectedRequests);
    if (newSelected.has(requestId)) {
      newSelected.delete(requestId);
    } else {
      newSelected.add(requestId);
    }
    setSelectedRequests(newSelected);
  };

  if (requests.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Join Requests
          </CardTitle>
          <CardDescription>
            No pending join requests at this time
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Checkbox
                checked={selectedRequests.size === filteredRequests.length && filteredRequests.length > 0}
                onCheckedChange={toggleSelectAll}
              />
              <div>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5" />
                  Join Requests
                </CardTitle>
                <CardDescription>
                  Review and approve requests to join your organization
                </CardDescription>
              </div>
            </div>
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
              {filteredRequests.filter(r => r.status === 'pending').length} Pending
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters Section */}
          <div className="mb-6 space-y-4">
            {/* Status Tabs */}
            <Tabs value={filterStatus} onValueChange={(value) => setFilterStatus(value as JoinRequestStatus | 'all')}>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="approved">Approved</TabsTrigger>
                <TabsTrigger value="rejected">Rejected</TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Filter Controls */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Search */}
              <div className="relative flex-1 min-w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Role Filter */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Filter className="h-4 w-4" />
                    Role
                    {filterRoles.size > 0 && (
                      <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 flex items-center justify-center">
                        {filterRoles.size}
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-48" align="start">
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Filter by Role</p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="role-student"
                          checked={filterRoles.has('student')}
                          onCheckedChange={() => toggleRoleFilter('student')}
                        />
                        <label htmlFor="role-student" className="text-sm cursor-pointer">
                          Student
                        </label>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="role-teacher"
                          checked={filterRoles.has('teacher')}
                          onCheckedChange={() => toggleRoleFilter('teacher')}
                        />
                        <label htmlFor="role-teacher" className="text-sm cursor-pointer">
                          Teacher
                        </label>
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              {/* Date Range Filter */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <CalendarIcon className="h-4 w-4" />
                    Date Range
                    {(dateRange.from || dateRange.to) && (
                      <Badge variant="secondary" className="ml-1">
                        ✓
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    selected={{ from: dateRange.from, to: dateRange.to }}
                    onSelect={(range) => setDateRange({ from: range?.from, to: range?.to })}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>

              {/* Recent Filters */}
              <RecentFiltersDropdown
                organizationId={organizationId}
                adminId={adminId}
                currentFilterUrl={searchParams.toString()}
                isOrgAdmin={isOrgAdmin}
              />

              {/* Clear All Filters */}
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                  Clear All
                </Button>
              )}
            </div>

            {/* Active Filter Chips */}
            {hasActiveFilters && (
              <div className="flex flex-wrap items-center gap-2">
                {Array.from(filterRoles).map(role => (
                  <Badge key={role} variant="secondary" className="gap-1 pr-1">
                    Role: {role}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 hover:bg-transparent"
                      onClick={() => removeRoleFilter(role)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
                {searchQuery.trim() && (
                  <Badge variant="secondary" className="gap-1 pr-1">
                    Search: {searchQuery}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 hover:bg-transparent"
                      onClick={() => setSearchQuery('')}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                )}
                {dateRange.from && (
                  <Badge variant="secondary" className="gap-1 pr-1">
                    From: {format(dateRange.from, 'MMM d, yyyy')}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 hover:bg-transparent"
                      onClick={() => setDateRange({ ...dateRange, from: undefined })}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                )}
                {dateRange.to && (
                  <Badge variant="secondary" className="gap-1 pr-1">
                    To: {format(dateRange.to, 'MMM d, yyyy')}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 hover:bg-transparent"
                      onClick={() => setDateRange({ ...dateRange, to: undefined })}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                )}
              </div>
            )}
          </div>

          {/* Bulk Action Toolbar */}
          {selectedRequests.size > 0 && (
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="font-medium">
                  {selectedRequests.size} of {filteredRequests.length} request(s) selected
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={clearSelection}
                >
                  Clear Selection
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={openBulkApproveDialog}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve Selected
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={openBulkRejectDialog}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject Selected
                </Button>
              </div>
            </div>
          )}

          {/* Undo Toast */}
          {showUndoToast && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="font-medium">
                  Approvals completed. Undo in {undoCountdown}s
                </span>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={handleUndo}
              >
                <Undo2 className="h-4 w-4 mr-2" />
                Undo
              </Button>
            </div>
          )}

          {/* Request List */}
          {filteredRequests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No requests match the current filters
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRequests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-start justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-start gap-4 flex-1">
                    <Checkbox
                      checked={selectedRequests.has(request.id)}
                      onCheckedChange={() => toggleSelectRequest(request.id)}
                    />
                  <Avatar>
                    <AvatarFallback>
                      {getInitials(request.user?.first_name, request.user?.last_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-2">
                    <div>
                      <p className="font-medium">
                        {request.user?.first_name} {request.user?.last_name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {request.user?.email}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Role: {request.user?.role}
                      </p>
                    </div>
                    {request.message && (
                      <div className="bg-muted p-3 rounded">
                        <p className="text-sm font-medium mb-1">Message:</p>
                        <p className="text-sm text-muted-foreground">{request.message}</p>
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Requested: {new Date(request.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openApproveDialog(request)}
                    disabled={loading}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openRejectDialog(request)}
                    disabled={loading}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
          )}
        </CardContent>
      </Card>

      {/* Approve/Reject Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'approve' ? 'Approve' : 'Reject'} Join Request
            </DialogTitle>
            <DialogDescription>
              {actionType === 'approve'
                ? `Approve ${selectedRequest?.user?.first_name} ${selectedRequest?.user?.last_name} to join your organization?`
                : `Reject ${selectedRequest?.user?.first_name} ${selectedRequest?.user?.last_name}'s request to join?`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="adminMessage">Message to User (Optional)</Label>
              <Textarea
                id="adminMessage"
                placeholder={
                  actionType === 'approve'
                    ? 'Welcome message or additional instructions...'
                    : 'Reason for rejection or alternative suggestions...'
                }
                value={adminMessage}
                onChange={(e) => setAdminMessage(e.target.value)}
                rows={4}
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={actionType === 'approve' ? handleApprove : handleReject}
                disabled={isApproving}
                className="flex-1"
                variant={actionType === 'approve' ? 'default' : 'destructive'}
              >
                {isApproving
                  ? 'Processing...'
                  : actionType === 'approve'
                  ? 'Approve Request'
                  : 'Reject Request'}
              </Button>
              <Button
                onClick={() => setIsDialogOpen(false)}
                disabled={isApproving}
                variant="outline"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Action Dialog */}
      <Dialog open={isBulkDialogOpen} onOpenChange={setIsBulkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {bulkActionType === 'approve' ? 'Approve' : 'Reject'} {selectedRequests.size} Request(s)
            </DialogTitle>
            <DialogDescription>
              {bulkActionType === 'approve'
                ? `Approve ${selectedRequests.size} request(s) to join your organization?`
                : `Reject ${selectedRequests.size} request(s)?`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {isBulkProcessing ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span>Processing requests...</span>
                  <span className="font-medium">
                    {bulkProgress} / {bulkTotal}
                  </span>
                </div>
                <Progress value={(bulkProgress / bulkTotal) * 100} />
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="bulkMessage">
                    Message to Users (Optional)
                  </Label>
                  <Textarea
                    id="bulkMessage"
                    placeholder={
                      bulkActionType === 'approve'
                        ? 'Welcome message or additional instructions...'
                        : 'Reason for rejection or alternative suggestions...'
                    }
                    value={bulkMessage}
                    onChange={(e) => setBulkMessage(e.target.value)}
                    rows={4}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={bulkActionType === 'approve' ? handleBulkApprove : handleBulkReject}
                    disabled={isBulkProcessing}
                    className="flex-1"
                    variant={bulkActionType === 'approve' ? 'default' : 'destructive'}
                  >
                    {bulkActionType === 'approve'
                      ? `Approve ${selectedRequests.size} Request(s)`
                      : `Reject ${selectedRequests.size} Request(s)`}
                  </Button>
                  <Button
                    onClick={() => setIsBulkDialogOpen(false)}
                    disabled={isBulkProcessing}
                    variant="outline"
                  >
                    Cancel
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
