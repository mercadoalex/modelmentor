import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { supabase } from '@/db/supabase';
import { Calendar } from 'lucide-react';
import type { SandboxConfiguration } from '@/types/types';

interface MarkAsAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  configuration: SandboxConfiguration | null;
  onMarked?: () => void;
}

export function MarkAsAssignmentDialog({
  open,
  onOpenChange,
  configuration,
  onMarked,
}: MarkAsAssignmentDialogProps) {
  const [assignmentTitle, setAssignmentTitle] = useState('');
  const [assignmentInstructions, setAssignmentInstructions] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [notifyStudents, setNotifyStudents] = useState(false);
  const [isMarking, setIsMarking] = useState(false);

  if (!configuration) return null;

  const handleMark = async () => {
    if (!assignmentInstructions.trim()) {
      toast.error('Please enter assignment instructions');
      return;
    }

    setIsMarking(true);

    try {
      const { error } = await supabase
        .from('sandbox_configurations')
        .update({
          is_assignment: true,
          assignment_title: assignmentTitle.trim() || configuration.name,
          assignment_instructions: assignmentInstructions.trim(),
          assignment_due_date: dueDate || null,
          notify_students: notifyStudents,
        })
        .eq('id', configuration.id);

      if (error) throw error;

      toast.success('Configuration marked as assignment successfully!');
      
      // Reset form
      setAssignmentTitle('');
      setAssignmentInstructions('');
      setDueDate('');
      setNotifyStudents(false);
      
      onMarked?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Error marking configuration as assignment:', error);
      toast.error('Failed to mark configuration as assignment');
    } finally {
      setIsMarking(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Mark as Assignment</DialogTitle>
          <DialogDescription>
            Create an assignment from this configuration for students to analyze
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Configuration Summary */}
          <div className="space-y-2">
            <Label className="text-base font-semibold">Configuration Details</Label>
            <div className="border rounded-lg p-4 space-y-2 bg-muted/50">
              <div className="font-medium">{configuration.name}</div>
              {configuration.description && (
                <p className="text-sm text-muted-foreground">{configuration.description}</p>
              )}
              <div className="grid grid-cols-2 gap-2 text-sm pt-2 border-t">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Learning Rate:</span>
                  <span className="font-mono">{configuration.learning_rate.toFixed(4)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Normalization:</span>
                  <span className="font-mono">
                    {configuration.normalization ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Batch Size:</span>
                  <span className="font-mono">{configuration.batch_size}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Epochs:</span>
                  <span className="font-mono">{configuration.epochs}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Assignment Title */}
          <div className="space-y-2">
            <Label htmlFor="assignment-title">
              Assignment Title (Optional)
            </Label>
            <Input
              id="assignment-title"
              placeholder={`Defaults to: ${configuration.name}`}
              value={assignmentTitle}
              onChange={(e) => setAssignmentTitle(e.target.value)}
              maxLength={200}
            />
            <p className="text-xs text-muted-foreground">
              Leave blank to use configuration name as assignment title
            </p>
          </div>

          {/* Assignment Instructions */}
          <div className="space-y-2">
            <Label htmlFor="assignment-instructions">
              Assignment Instructions <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="assignment-instructions"
              placeholder="Provide specific instructions for students about what to observe, analyze, or document when working with this configuration..."
              value={assignmentInstructions}
              onChange={(e) => setAssignmentInstructions(e.target.value)}
              rows={5}
              maxLength={2000}
            />
            <p className="text-xs text-muted-foreground">
              {assignmentInstructions.length}/2000 characters
            </p>
          </div>

          {/* Due Date */}
          <div className="space-y-2">
            <Label htmlFor="due-date">
              Due Date (Optional)
            </Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="due-date"
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Notify Students */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Notify Students via Email</Label>
              <p className="text-xs text-muted-foreground">
                Send email notification when assignment is created
              </p>
            </div>
            <Switch
              checked={notifyStudents}
              onCheckedChange={setNotifyStudents}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isMarking}
          >
            Cancel
          </Button>
          <Button onClick={handleMark} disabled={isMarking}>
            {isMarking ? 'Creating Assignment...' : 'Create Assignment'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
