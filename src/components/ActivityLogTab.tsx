import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Download, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import { groupActivityService } from '@/services/groupActivityService';
import { toast } from 'sonner';
import type { GroupActivity, GroupActivityType, Profile } from '@/types/types';

interface ActivityLogTabProps {
  groupId: string;
  currentUserId: string;
}

export function ActivityLogTab({ groupId, currentUserId }: ActivityLogTabProps) {
  const [activities, setActivities] = useState<Array<GroupActivity & { actor?: Profile; target?: Profile }>>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [filterActionType, setFilterActionType] = useState<GroupActivityType | 'all'>('all');
  const [selectedActivity, setSelectedActivity] = useState<(GroupActivity & { actor?: Profile; target?: Profile }) | null>(null);
  const [noteText, setNoteText] = useState('');
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false);
  const [isSavingNote, setIsSavingNote] = useState(false);

  const pageSize = 20;

  useEffect(() => {
    loadActivities();
    loadCount();
  }, [groupId, page, filterActionType]);

  const loadActivities = async () => {
    setLoading(true);
    try {
      const data = await groupActivityService.getByGroup(
        groupId,
        pageSize,
        page * pageSize,
        filterActionType === 'all' ? undefined : filterActionType
      );
      setActivities(data);
    } catch (error) {
      console.error('Error loading activities:', error);
      toast.error('Failed to load activity log');
    } finally {
      setLoading(false);
    }
  };

  const loadCount = async () => {
    const count = await groupActivityService.getCount(
      groupId,
      filterActionType === 'all' ? undefined : filterActionType
    );
    setTotalCount(count);
  };

  const handleExportCSV = async () => {
    try {
      const csv = await groupActivityService.exportToCSV(groupId);
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `group-activity-log-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Activity log exported successfully');
    } catch (error) {
      toast.error('Failed to export activity log');
      console.error(error);
    }
  };

  const openNoteDialog = (activity: GroupActivity & { actor?: Profile; target?: Profile }) => {
    setSelectedActivity(activity);
    setNoteText(activity.notes || '');
    setIsNoteDialogOpen(true);
  };

  const handleSaveNote = async () => {
    if (!selectedActivity) return;

    setIsSavingNote(true);
    try {
      const success = await groupActivityService.addNote(selectedActivity.id, noteText.trim());
      if (success) {
        toast.success('Note saved successfully');
        setIsNoteDialogOpen(false);
        await loadActivities();
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

  const getInitials = (firstName: string | null, lastName: string | null) => {
    const first = firstName?.charAt(0) || '';
    const last = lastName?.charAt(0) || '';
    return (first + last).toUpperCase() || '?';
  };

  const getActionLabel = (actionType: GroupActivityType): string => {
    const labels: Record<GroupActivityType, string> = {
      member_added: 'Added Member',
      member_removed: 'Removed Member',
      instructor_assigned: 'Assigned Instructor',
      instructor_removed: 'Removed Instructor'
    };
    return labels[actionType];
  };

  const getActionColor = (actionType: GroupActivityType): string => {
    const colors: Record<GroupActivityType, string> = {
      member_added: 'bg-green-100 text-green-800',
      member_removed: 'bg-red-100 text-red-800',
      instructor_assigned: 'bg-blue-100 text-blue-800',
      instructor_removed: 'bg-gray-100 text-gray-800'
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

  const isRecent = (dateString: string): boolean => {
    const date = new Date(dateString);
    const now = new Date();
    const diffHours = (now.getTime() - date.getTime()) / 3600000;
    return diffHours < 24;
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="space-y-4">
      {/* Header with filters and export */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="space-y-2">
            <Label htmlFor="actionType">Filter by Action</Label>
            <Select
              value={filterActionType}
              onValueChange={(value) => {
                setFilterActionType(value as GroupActivityType | 'all');
                setPage(0);
              }}
            >
              <SelectTrigger id="actionType" className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="member_added">Member Added</SelectItem>
                <SelectItem value="member_removed">Member Removed</SelectItem>
                <SelectItem value="instructor_assigned">Instructor Assigned</SelectItem>
                <SelectItem value="instructor_removed">Instructor Removed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button onClick={handleExportCSV} variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Activity List */}
      {loading ? (
        <div className="text-center py-8 text-muted-foreground">
          Loading activities...
        </div>
      ) : activities.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No activities found
        </div>
      ) : (
        <div className="space-y-2">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className={`p-4 border rounded-lg ${
                isRecent(activity.created_at) ? 'bg-blue-50' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">
                      {getInitials(activity.actor?.first_name || null, activity.actor?.last_name || null)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">
                        {activity.actor?.first_name} {activity.actor?.last_name}
                      </span>
                      <Badge className={getActionColor(activity.action_type)}>
                        {getActionLabel(activity.action_type)}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {activity.target?.first_name} {activity.target?.last_name}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {getRelativeTime(activity.created_at)}
                      {isRecent(activity.created_at) && (
                        <Badge variant="secondary" className="ml-2 text-xs">
                          Recent
                        </Badge>
                      )}
                    </p>
                    {activity.notes && (
                      <div className="mt-2 p-2 bg-muted rounded text-sm">
                        <p className="font-medium text-xs mb-1">Note:</p>
                        <p className="text-muted-foreground">{activity.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openNoteDialog(activity)}
                >
                  <FileText className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4">
          <p className="text-sm text-muted-foreground">
            Showing {page * pageSize + 1} to {Math.min((page + 1) * pageSize, totalCount)} of {totalCount} activities
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

      {/* Note Dialog */}
      <Dialog open={isNoteDialogOpen} onOpenChange={setIsNoteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Note to Activity</DialogTitle>
            <DialogDescription>
              Add or edit notes for this activity entry for audit purposes
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedActivity && (
              <div className="p-3 bg-muted rounded">
                <p className="text-sm">
                  <span className="font-medium">
                    {selectedActivity.actor?.first_name} {selectedActivity.actor?.last_name}
                  </span>
                  {' '}
                  {getActionLabel(selectedActivity.action_type).toLowerCase()}
                  {' '}
                  <span className="font-medium">
                    {selectedActivity.target?.first_name} {selectedActivity.target?.last_name}
                  </span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(selectedActivity.created_at).toLocaleString()}
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
    </div>
  );
}
