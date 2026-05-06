import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Save, X } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/db/supabase';

interface SaveConfigurationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  configuration: {
    learningRate: number;
    normalization: boolean;
    batchSize: string;
    epochs: string;
    failureMode: string;
  };
  onSaved?: () => void;
}

export function SaveConfigurationDialog({
  open,
  onOpenChange,
  configuration,
  onSaved
}: SaveConfigurationDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Please enter a configuration name');
      return;
    }

    setIsSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('You must be logged in to save configurations');
        setIsSaving(false);
        return;
      }

      const { error } = await supabase
        .from('sandbox_configurations')
        .insert({
          user_id: user.id,
          name: name.trim(),
          description: description.trim() || null,
          model_type: 'image_classification', // Default for now
          learning_rate: configuration.learningRate,
          normalization: configuration.normalization,
          batch_size: parseInt(configuration.batchSize),
          epochs: parseInt(configuration.epochs),
          failure_mode: configuration.failureMode
        });

      if (error) throw error;

      toast.success('Configuration saved successfully!');
      setName('');
      setDescription('');
      onOpenChange(false);
      onSaved?.();
    } catch (error) {
      console.error('Error saving configuration:', error);
      toast.error('Failed to save configuration');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Save Configuration</DialogTitle>
          <DialogDescription>
            Save your current hyperparameter configuration for future reference
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Configuration Name */}
          <div className="space-y-2">
            <Label htmlFor="config-name">
              Configuration Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="config-name"
              placeholder="e.g., High Learning Rate Divergence"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
            />
          </div>

          {/* Configuration Description */}
          <div className="space-y-2">
            <Label htmlFor="config-description">Description (Optional)</Label>
            <Textarea
              id="config-description"
              placeholder="Describe what this configuration demonstrates..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={500}
            />
          </div>

          {/* Current Settings Summary */}
          <div className="space-y-2">
            <Label>Current Settings</Label>
            <div className="bg-muted p-3 rounded-lg space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Learning Rate:</span>
                <span className="font-medium">{configuration.learningRate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Normalization:</span>
                <span className="font-medium">{configuration.normalization ? 'Enabled' : 'Disabled'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Batch Size:</span>
                <span className="font-medium">{configuration.batchSize}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Epochs:</span>
                <span className="font-medium">{configuration.epochs}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save Configuration'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
