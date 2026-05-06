import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Download, FileText, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, History, Undo2, AlertTriangle } from 'lucide-react';
import { bulkActionService } from '@/services/bulkActionService';
import { activityLogService } from '@/services/activityLogService';
import { supabase } from '@/db/supabase';
import { toast } from 'sonner';
import type { BulkAction, BulkActionType, Profile } from '@/types/types';
import { ActivityHeatmap } from './ActivityHeatmap';


interface BulkActionHistoryProps {
  organizationId: string;
  currentUserId: string;
}

interface PresenceState {
  admin_id: string;
  admin_name: string;
  viewing_since: string;
  is_active: boolean;
}

export function BulkActionHistory({ organizationId, currentUserId }: BulkActionHistoryProps) {
  const [actions, setActions] = useState<Array<BulkAction & { admin?: Profile }>>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [filterActionType, setFilterActionType] = useState<BulkActionType | 'all'>('all');
  const [expandedActions, setExpandedActions] = useState<Set<string>>(new Set());
  const [actionItems, setActionItems] = useState<Record<string, any[]>>({});
  const [selectedAction, setSelectedAction] = useState<(BulkAction & { admin?: Profile }) | null>(null);
  const [noteText, setNoteText] = useState('');
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false);
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [isRollbackDialogOpen, setIsRollbackDialogOpen] = useState(false);
  const [rollbackAction, setRollbackAction] = useState<(BulkAction & { admin?: Profile }) | null>(null);
  const [isRollingBack, setIsRollingBack] = useState(false);
  const [rollbackProgress, setRollbackProgress] = useState(0);
  const [rollbackTotal, setRollbackTotal] = useState(0);
  const [newActionIds, setNewActionIds] = useState<Set<string>>(new Set());
  const [onlineAdmins, setOnlineAdmins] = useState<PresenceState[]>([]);
  const [currentAdminName, setCurrentAdminName] = useState('');
  const [isActive, setIsActive] = useState(true);

  const pageSize = 20;

  // Fetch current admin name
  useEffect(() => {
    const fetchAdminName = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('id', currentUserId)
        .maybeSingle();
      
      if (data) {
        setCurrentAdminName(`${data.first_name} ${data.last_name}`);
      }
    };
    fetchAdminName();
  }, [currentUserId]);

  // Log view activity on mount
  useEffect(() => {
    activityLogService.log(currentUserId, organizationId, 'view');
  }, [currentUserId, organizationId]);

  useEffect(() => {
    loadActions();
    loadCount();
    
    // Log filter activity (skip initial load)
    if (filterActionType !== 'all' || page !== 0) {
      activityLogService.log(currentUserId, organizationId, 'filter', {
        filter_type: filterActionType,
        page
      });
    }
  }, [organizationId, page, filterActionType]);

  // Realtime subscription for new bulk actions
  useEffect(() => {
    const channel = supabase
      .channel('bulk-actions-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'bulk_actions',
          filter: `organization_id=eq.${organizationId}`
        },
        async (payload) => {
          const newAction = payload.new as BulkAction;

          // Fetch admin profile for the new action
          const { data: adminProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', newAction.admin_id)
            .maybeSingle();

          const actionWithAdmin = {
            ...newAction,
            admin: adminProfile
          };

          // Check if action matches current filter
          const matchesFilter = filterActionType === 'all' || newAction.action_type === filterActionType;

          if (matchesFilter && page === 0) {
            // Prepend to actions list if on first page and matches filter
            setActions(prev => [actionWithAdmin, ...prev.slice(0, pageSize - 1)]);
            setNewActionIds(prev => new Set([...prev, newAction.id]));

            // Remove highlight after 3 seconds
            setTimeout(() => {
              setNewActionIds(prev => {
                const next = new Set(prev);
                next.delete(newAction.id);
                return next;
              });
            }, 3000);
          }

          // Update total count
          setTotalCount(prev => prev + 1);

          // Show toast notification
          const actionLabel = getActionLabel(newAction.action_type);
          const adminName = adminProfile ? `${adminProfile.first_name} ${adminProfile.last_name}` : 'Admin';
          toast.info(`New bulk action: ${adminName} performed ${actionLabel.toLowerCase()} on ${newAction.request_count} request(s)`);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [organizationId, page, filterActionType]);

  // Activity tracking
  useEffect(() => {
    let inactivityTimer: NodeJS.Timeout;

    const handleActivity = () => {
      setIsActive(true);
      
      // Clear existing timer
      clearTimeout(inactivityTimer);
      
      // Set new timer for 2 minutes of inactivity
      inactivityTimer = setTimeout(() => {
        setIsActive(false);
      }, 120000); // 2 minutes
    };

    // Add event listeners
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('click', handleActivity);
    window.addEventListener('scroll', handleActivity);

    // Initialize timer
    handleActivity();

    return () => {
      clearTimeout(inactivityTimer);
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('scroll', handleActivity);
    };
  }, []);

  // Presence tracking for online admins
  useEffect(() => {
    if (!currentAdminName) return;

    const presenceChannel = supabase.channel(`bulk-history-presence:${organizationId}`, {
      config: {
        presence: {
          key: currentUserId
        }
      }
    });

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        const admins: PresenceState[] = [];
        
        Object.values(state).forEach((presences: any) => {
          presences.forEach((presence: any) => {
            admins.push(presence as PresenceState);
          });
        });

        // Sort admins: active first, then idle
        admins.sort((a, b) => {
          if (a.is_active === b.is_active) return 0;
          return a.is_active ? -1 : 1;
        });

        setOnlineAdmins(admins);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({
            admin_id: currentUserId,
            admin_name: currentAdminName,
            viewing_since: new Date().toISOString(),
            is_active: isActive
          });
        }
      });

    // Update presence every 30 seconds
    const presenceInterval = setInterval(async () => {
      await presenceChannel.track({
        admin_id: currentUserId,
        admin_name: currentAdminName,
        viewing_since: new Date().toISOString(),
        is_active: isActive
      });
    }, 30000);

    return () => {
      clearInterval(presenceInterval);
      presenceChannel.untrack();
      supabase.removeChannel(presenceChannel);
    };
  }, [organizationId, currentUserId, currentAdminName, isActive]);

  // Update presence immediately when activity status changes
  useEffect(() => {
    if (!currentAdminName) return;

    const updatePresence = async () => {
      const channel = supabase.getChannels().find(ch => ch.topic === `bulk-history-presence:${organizationId}`);
      if (channel) {
        await channel.track({
          admin_id: currentUserId,
          admin_name: currentAdminName,
          viewing_since: new Date().toISOString(),
          is_active: isActive
        });
      }
    };

    updatePresence();
  }, [isActive, organizationId, currentUserId, currentAdminName]);

  const loadActions = async () => {
    setLoading(true);
    try {
      const data = await bulkActionService.getByOrganization(
        organizationId,
        pageSize,
        page * pageSize,
        filterActionType === 'all' ? undefined : filterActionType
      );
      setActions(data);
    } catch (error) {
      console.error('Error loading bulk actions:', error);
      toast.error('Failed to load bulk action history');
    } finally {
      setLoading(false);
    }
  };

  const loadCount = async () => {
    const count = await bulkActionService.getCount(
      organizationId,
      filterActionType === 'all' ? undefined : filterActionType
    );
    setTotalCount(count);
  };

  const toggleExpand = async (actionId: string) => {
    const newExpanded = new Set(expandedActions);
    if (newExpanded.has(actionId)) {
      newExpanded.delete(actionId);
    } else {
      newExpanded.add(actionId);
      // Load items if not already loaded
      if (!actionItems[actionId]) {
        const items = await bulkActionService.getItems(actionId);
        setActionItems(prev => ({ ...prev, [actionId]: items }));
      }
    }
    setExpandedActions(newExpanded);
  };

  const handleExportCSV = async () => {
    try {
      const csv = await bulkActionService.exportToCSV(organizationId);
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bulk-action-history-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      // Log export activity
      await activityLogService.log(currentUserId, organizationId, 'export');
      
      toast.success('Bulk action history exported successfully');
    } catch (error) {
      toast.error('Failed to export bulk action history');
      console.error(error);
    }
  };

  const openNoteDialog = (action: BulkAction & { admin?: Profile }) => {
    setSelectedAction(action);
    setNoteText(action.notes || '');
    setIsNoteDialogOpen(true);
  };

  const handleSaveNote = async () => {
    if (!selectedAction) return;

    setIsSavingNote(true);
    try {
      const success = await bulkActionService.addNote(selectedAction.id, noteText.trim());
      if (success) {
        toast.success('Note saved successfully');
        setIsNoteDialogOpen(false);
        await loadActions();
      } else {
        toast.error('Failed to save note');
      }
    } catch (error) {
      toast.error('Failed to save note');
      console.error(error);
    } finally {
      setIsSavingNote(false);
    }
  };

  const openRollbackDialog = async (action: BulkAction & { admin?: Profile }) => {
    // Load items to get count of successful items
    const items = await bulkActionService.getItems(action.id);
    const successfulCount = items.filter(item => item.status === 'success').length;
    
    setRollbackAction(action);
    setRollbackTotal(successfulCount);
    setIsRollbackDialogOpen(true);
  };

  const handleRollback = async () => {
    if (!rollbackAction) return;

    setIsRollingBack(true);
    setRollbackProgress(0);

    try {
      const result = await bulkActionService.rollback(rollbackAction.id, currentUserId);

      setIsRollingBack(false);
      setIsRollbackDialogOpen(false);
      setRollbackProgress(0);
      setRollbackTotal(0);

      await loadActions();

      if (result.success > 0) {
        toast.success(`Successfully rolled back ${result.success} request(s)`);
      }

      if (result.failed > 0) {
        toast.error(`Failed to rollback ${result.failed} request(s)`, {
          description: result.errors.slice(0, 3).join(', ')
        });
      }

      if (result.errors.length > 0 && result.success === 0) {
        toast.error('Rollback failed', {
          description: result.errors[0]
        });
      }
    } catch (error) {
      setIsRollingBack(false);
      toast.error('Failed to rollback bulk action');
      console.error(error);
    }
  };

  const getInitials = (firstName: string | null, lastName: string | null) => {
    const first = firstName?.charAt(0) || '';
    const last = lastName?.charAt(0) || '';
    return (first + last).toUpperCase() || '?';
  };

  const getActionLabel = (actionType: BulkActionType): string => {
    const labels: Record<BulkActionType, string> = {
      bulk_approve: 'Bulk Approve',
      bulk_reject: 'Bulk Reject',
      bulk_undo: 'Bulk Undo'
    };
    return labels[actionType];
  };

  const getActionColor = (actionType: BulkActionType): string => {
    const colors: Record<BulkActionType, string> = {
      bulk_approve: 'bg-green-100 text-green-800',
      bulk_reject: 'bg-red-100 text-red-800',
      bulk_undo: 'bg-gray-100 text-gray-800'
    };
    return colors[actionType];
  };

  const getRelativeTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  if (actions.length === 0 && !loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Bulk Action History
          </CardTitle>
          <CardDescription>
            No bulk actions have been performed yet
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <>
      {/* Activity Heatmap */}
      <ActivityHeatmap organizationId={organizationId} />

      {/* Bulk Action History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Bulk Action History
              </CardTitle>
              <CardDescription>
                View audit log of all bulk join request operations
              </CardDescription>
            </div>
          <Button onClick={handleExportCSV} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>

        {/* Presence Indicator */}
        {onlineAdmins.length > 0 && (
          <div className="mt-4 flex items-center gap-3 text-sm text-muted-foreground">
            <span>Currently viewing:</span>
            <div className="flex items-center gap-2">
              {onlineAdmins.slice(0, 5).map((admin) => (
                <div key={admin.admin_id} className="relative group">
                  <Avatar className="h-7 w-7 border-2 border-background">
                    <AvatarFallback className="text-xs">
                      {admin.admin_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {/* Activity status indicator */}
                  <div 
                    className={`absolute bottom-0 right-0 h-2 w-2 rounded-full border border-background ${
                      admin.is_active ? 'bg-green-500' : 'bg-gray-400'
                    }`}
                  />
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-foreground text-background text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                    <div>{admin.admin_name}</div>
                    <div className="text-[10px] opacity-75">
                      {admin.is_active ? 'Active' : 'Idle'}
                    </div>
                  </div>
                </div>
              ))}
              {onlineAdmins.length > 5 && (
                <span className="text-xs">+{onlineAdmins.length - 5} more</span>
              )}
            </div>
            {onlineAdmins.length > 1 && (
              <span className="text-xs">
                You are viewing with {onlineAdmins.length - 1} other admin{onlineAdmins.length > 2 ? 's' : ''}
              </span>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Filter */}
          <div className="flex items-center gap-4">
            <div className="space-y-2">
              <Label htmlFor="actionType">Filter by Action</Label>
              <Select
                value={filterActionType}
                onValueChange={(value) => {
                  setFilterActionType(value as BulkActionType | 'all');
                  setPage(0);
                }}
              >
                <SelectTrigger id="actionType" className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="bulk_approve">Bulk Approve</SelectItem>
                  <SelectItem value="bulk_reject">Bulk Reject</SelectItem>
                  <SelectItem value="bulk_undo">Bulk Undo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Action List */}
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading bulk actions...
            </div>
          ) : (
            <div className="space-y-2">
              {actions.map((action) => (
                <div 
                  key={action.id} 
                  className={`border rounded-lg transition-all duration-300 ${
                    newActionIds.has(action.id) 
                      ? 'border-blue-400 bg-blue-50 animate-fade-in' 
                      : ''
                  }`}
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {getInitials(action.admin?.first_name || null, action.admin?.last_name || null)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium">
                              {action.admin?.first_name} {action.admin?.last_name}
                            </span>
                            <Badge className={getActionColor(action.action_type)}>
                              {getActionLabel(action.action_type)}
                            </Badge>
                            {action.rollback_at && (
                              <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                                Rolled Back
                              </Badge>
                            )}
                            <span className="text-sm text-muted-foreground">
                              {action.request_count} request(s)
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            <span className="text-green-600">
                              ✓ {action.success_count} success
                            </span>
                            {action.failed_count > 0 && (
                              <span className="text-red-600">
                                ✗ {action.failed_count} failed
                              </span>
                            )}
                            <span className="text-muted-foreground">
                              {getRelativeTime(action.created_at)}
                            </span>
                          </div>
                          {action.message && (
                            <div className="mt-2 p-2 bg-muted rounded text-sm">
                              <p className="font-medium text-xs mb-1">Message:</p>
                              <p className="text-muted-foreground">{action.message}</p>
                            </div>
                          )}
                          {action.notes && (
                            <div className="mt-2 p-2 bg-muted rounded text-sm">
                              <p className="font-medium text-xs mb-1">Note:</p>
                              <p className="text-muted-foreground">{action.notes}</p>
                            </div>
                          )}
                          {action.rollback_at && (
                            <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded text-sm">
                              <p className="font-medium text-xs mb-1 text-orange-900">Rollback Information:</p>
                              <p className="text-orange-800">
                                Rolled back on {new Date(action.rollback_at).toLocaleString()}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {action.action_type === 'bulk_approve' && !action.rollback_at && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openRollbackDialog(action)}
                            className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                          >
                            <Undo2 className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openNoteDialog(action)}
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleExpand(action.id)}
                        >
                          {expandedActions.has(action.id) ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {expandedActions.has(action.id) && (
                    <div className="border-t p-4 bg-muted/50">
                      <h4 className="font-medium text-sm mb-3">Affected Users</h4>
                      {actionItems[action.id] ? (
                        <div className="space-y-2">
                          {actionItems[action.id].map((item: any) => (
                            <div
                              key={item.id}
                              className="flex items-center justify-between p-2 bg-background rounded"
                            >
                              <div className="flex items-center gap-2">
                                <Avatar className="h-6 w-6">
                                  <AvatarFallback className="text-xs">
                                    {getInitials(
                                      item.user?.first_name || null,
                                      item.user?.last_name || null
                                    )}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-sm">
                                  {item.user?.first_name} {item.user?.last_name}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {item.user?.email}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                {item.status === 'success' ? (
                                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                                    Success
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary" className="bg-red-100 text-red-800">
                                    Failed
                                  </Badge>
                                )}
                                {item.error_message && (
                                  <span className="text-xs text-red-600">
                                    {item.error_message}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-4 text-sm text-muted-foreground">
                          Loading details...
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <p className="text-sm text-muted-foreground">
                Showing {page * pageSize + 1} to {Math.min((page + 1) * pageSize, totalCount)} of {totalCount} actions
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <span className="text-sm">
                  Page {page + 1} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page >= totalPages - 1}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Note Dialog */}
        <Dialog open={isNoteDialogOpen} onOpenChange={setIsNoteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Note to Bulk Action</DialogTitle>
              <DialogDescription>
                Add or edit notes for this bulk action for audit purposes
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {selectedAction && (
                <div className="p-3 bg-muted rounded">
                  <p className="text-sm">
                    <span className="font-medium">
                      {selectedAction.admin?.first_name} {selectedAction.admin?.last_name}
                    </span>
                    {' '}
                    performed {getActionLabel(selectedAction.action_type).toLowerCase()}
                    {' '}
                    on {selectedAction.request_count} request(s)
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(selectedAction.created_at).toLocaleString()}
                  </p>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="note">Note</Label>
                <Textarea
                  id="note"
                  placeholder="Add notes for audit purposes..."
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  rows={4}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleSaveNote}
                  disabled={isSavingNote}
                  className="flex-1"
                >
                  {isSavingNote ? 'Saving...' : 'Save Note'}
                </Button>
                <Button
                  onClick={() => setIsNoteDialogOpen(false)}
                  disabled={isSavingNote}
                  variant="outline"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Rollback Confirmation Dialog */}
        <Dialog open={isRollbackDialogOpen} onOpenChange={setIsRollbackDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                Confirm Rollback
              </DialogTitle>
              <DialogDescription>
                This action will revert all successfully approved requests from this bulk action
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {rollbackAction && (
                <div className="space-y-3">
                  <div className="p-3 bg-muted rounded">
                    <p className="text-sm">
                      <span className="font-medium">
                        {rollbackAction.admin?.first_name} {rollbackAction.admin?.last_name}
                      </span>
                      {' '}
                      performed bulk approve on {rollbackAction.request_count} request(s)
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(rollbackAction.created_at).toLocaleString()}
                    </p>
                  </div>

                  <div className="p-4 bg-orange-50 border border-orange-200 rounded">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
                      <div className="space-y-2 text-sm">
                        <p className="font-medium text-orange-900">Warning: This action cannot be undone</p>
                        <ul className="list-disc list-inside space-y-1 text-orange-800">
                          <li>{rollbackTotal} user(s) will be removed from the organization</li>
                          <li>Their join requests will be reset to pending status</li>
                          <li>Users will need to be re-approved to join again</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {isRollingBack && (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        Rolling back requests...
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={handleRollback}
                  disabled={isRollingBack}
                  variant="destructive"
                  className="flex-1"
                >
                  {isRollingBack ? 'Rolling back...' : 'Confirm Rollback'}
                </Button>
                <Button
                  onClick={() => setIsRollbackDialogOpen(false)}
                  disabled={isRollingBack}
                  variant="outline"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
    </>
  );
}
