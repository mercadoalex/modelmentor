import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/db/supabase';
import { Search, Calendar, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { SandboxConfiguration, AssignmentCompletion, AssignmentStatus } from '@/types/types';

interface MyAssignmentsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLoadAssignment: (config: SandboxConfiguration, instructions: string) => void;
  modelType: string;
}

interface AssignmentWithCompletion extends SandboxConfiguration {
  completion?: AssignmentCompletion;
  status: AssignmentStatus;
}

export function MyAssignments({
  open,
  onOpenChange,
  onLoadAssignment,
  modelType,
}: MyAssignmentsProps) {
  const [assignments, setAssignments] = useState<AssignmentWithCompletion[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dueDateFilter, setDueDateFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open) {
      loadAssignments();
    }
  }, [open]);

  const loadAssignments = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('You must be logged in to view assignments');
        return;
      }

      // Load all assignments for this model type
      const { data: configs, error: configError } = await supabase
        .from('sandbox_configurations')
        .select('*')
        .eq('is_assignment', true)
        .eq('model_type', modelType)
        .order('created_at', { ascending: false });

      if (configError) throw configError;

      // Load completion status for each assignment
      const { data: completions, error: completionError } = await supabase
        .from('assignment_completions')
        .select('*')
        .eq('student_id', user.id);

      if (completionError) throw completionError;

      // Merge assignments with completion status
      const assignmentsWithStatus: AssignmentWithCompletion[] = (configs || []).map((config) => {
        const completion = completions?.find((c) => c.configuration_id === config.id);
        let status: AssignmentStatus = 'not_started';
        
        if (completion?.completed_at) {
          status = 'completed';
        } else if (completion?.loaded_at) {
          status = 'in_progress';
        }

        return {
          ...config,
          completion,
          status,
        };
      });

      setAssignments(assignmentsWithStatus);
    } catch (error) {
      console.error('Error loading assignments:', error);
      toast.error('Failed to load assignments');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadAssignment = async (assignment: AssignmentWithCompletion) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Track that assignment was loaded
      const now = new Date().toISOString();
      
      if (assignment.completion) {
        // Update existing completion record
        await supabase
          .from('assignment_completions')
          .update({
            loaded_at: assignment.completion.loaded_at || now,
            updated_at: now,
          })
          .eq('id', assignment.completion.id);
      } else {
        // Create new completion record
        await supabase
          .from('assignment_completions')
          .insert({
            configuration_id: assignment.id,
            student_id: user.id,
            loaded_at: now,
          });
      }

      onLoadAssignment(assignment, assignment.assignment_instructions || '');
      onOpenChange(false);
      toast.success('Assignment loaded successfully');
    } catch (error) {
      console.error('Error loading assignment:', error);
      toast.error('Failed to load assignment');
    }
  };

  const handleMarkCompleted = async (assignment: AssignmentWithCompletion) => {
    if (!assignment.completion?.loaded_at) {
      toast.error('Please load the assignment first before marking it as completed');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const now = new Date().toISOString();
      const loadedAt = new Date(assignment.completion.loaded_at);
      const timeSpentSeconds = Math.floor((new Date(now).getTime() - loadedAt.getTime()) / 1000);

      await supabase
        .from('assignment_completions')
        .update({
          completed_at: now,
          time_spent_seconds: timeSpentSeconds,
          updated_at: now,
        })
        .eq('id', assignment.completion.id);

      toast.success('Assignment marked as completed!');
      loadAssignments();
    } catch (error) {
      console.error('Error marking assignment as completed:', error);
      toast.error('Failed to mark assignment as completed');
    }
  };

  const getStatusBadge = (status: AssignmentStatus) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500"><CheckCircle2 className="h-3 w-3 mr-1" />Completed</Badge>;
      case 'in_progress':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />In Progress</Badge>;
      default:
        return <Badge variant="outline">Not Started</Badge>;
    }
  };

  const isOverdue = (dueDate: string | null) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  const filteredAssignments = assignments.filter((assignment) => {
    // Search filter
    const matchesSearch =
      assignment.assignment_title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      assignment.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      assignment.assignment_instructions?.toLowerCase().includes(searchQuery.toLowerCase());

    // Status filter
    const matchesStatus = statusFilter === 'all' || assignment.status === statusFilter;

    // Due date filter
    let matchesDueDate = true;
    if (dueDateFilter === 'upcoming') {
      matchesDueDate = assignment.assignment_due_date !== null && !isOverdue(assignment.assignment_due_date);
    } else if (dueDateFilter === 'overdue') {
      matchesDueDate = assignment.assignment_due_date !== null && isOverdue(assignment.assignment_due_date);
    } else if (dueDateFilter === 'no_due_date') {
      matchesDueDate = assignment.assignment_due_date === null;
    }

    return matchesSearch && matchesStatus && matchesDueDate;
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>My Assignments</DialogTitle>
          <DialogDescription>
            View and complete assignments from your teachers
          </DialogDescription>
        </DialogHeader>

        {/* Filters */}
        <div className="space-y-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search assignments by title or instructions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filter Controls */}
          <div className="flex gap-3">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="not_started">Not Started</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={dueDateFilter} onValueChange={setDueDateFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by due date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Due Dates</SelectItem>
                <SelectItem value="upcoming">Upcoming</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="no_due_date">No Due Date</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Assignments List */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-2">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading assignments...
            </div>
          ) : filteredAssignments.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground" />
              <div>
                <p className="font-medium">No assignments found</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {searchQuery || statusFilter !== 'all' || dueDateFilter !== 'all'
                    ? 'No assignments match your filters'
                    : 'Your teachers haven\'t created any assignments yet'}
                </p>
              </div>
            </div>
          ) : (
            filteredAssignments.map((assignment) => (
              <Card
                key={assignment.id}
                className={isOverdue(assignment.assignment_due_date) && assignment.status !== 'completed' ? 'border-destructive' : ''}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base">
                        {assignment.assignment_title || assignment.name}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        Configuration: {assignment.name}
                      </CardDescription>
                    </div>
                    <div className="flex flex-col gap-2 items-end shrink-0">
                      {getStatusBadge(assignment.status)}
                      {isOverdue(assignment.assignment_due_date) && assignment.status !== 'completed' && (
                        <Badge variant="destructive" className="text-xs">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Overdue
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Assignment Instructions */}
                  {assignment.assignment_instructions && (
                    <div className="text-sm">
                      <span className="font-medium">Instructions: </span>
                      <span className="text-muted-foreground">{assignment.assignment_instructions}</span>
                    </div>
                  )}

                  {/* Due Date */}
                  {assignment.assignment_due_date && (
                    <div className="text-sm flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        Due: {new Date(assignment.assignment_due_date).toLocaleString()}
                      </span>
                    </div>
                  )}

                  {/* Configuration Details */}
                  <div className="grid grid-cols-2 gap-2 text-sm pt-2 border-t">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Learning Rate:</span>
                      <span className="font-mono">{assignment.learning_rate.toFixed(4)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Normalization:</span>
                      <span className="font-mono">
                        {assignment.normalization ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Batch Size:</span>
                      <span className="font-mono">{assignment.batch_size}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Epochs:</span>
                      <span className="font-mono">{assignment.epochs}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      onClick={() => handleLoadAssignment(assignment)}
                      disabled={assignment.status === 'completed'}
                    >
                      Load Assignment
                    </Button>
                    {assignment.status === 'in_progress' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleMarkCompleted(assignment)}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        Mark as Completed
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <div className="flex justify-end pt-3 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
