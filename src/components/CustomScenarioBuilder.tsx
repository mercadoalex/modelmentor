import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { supabase } from '@/db/supabase';

interface CustomScenarioBuilderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScenarioCreated: () => void;
  modelType: string;
}

export function CustomScenarioBuilder({
  open,
  onOpenChange,
  onScenarioCreated,
  modelType,
}: CustomScenarioBuilderProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [learningRate, setLearningRate] = useState(0.001);
  const [normalization, setNormalization] = useState(true);
  const [batchSize, setBatchSize] = useState('32');
  const [epochs, setEpochs] = useState('50');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Please enter a scenario name');
      return;
    }

    setIsSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('You must be logged in to create custom scenarios');
        return;
      }

      const { error } = await supabase
        .from('custom_failure_scenarios')
        .insert({
          user_id: user.id,
          name: name.trim(),
          description: description.trim() || null,
          model_type: modelType,
          learning_rate: learningRate,
          normalization,
          batch_size: parseInt(batchSize),
          epochs: parseInt(epochs),
        });

      if (error) {
        if (error.code === '23505') {
          toast.error('A scenario with this name already exists');
        } else {
          throw error;
        }
        return;
      }

      toast.success('Custom scenario created successfully');
      
      // Reset form
      setName('');
      setDescription('');
      setLearningRate(0.001);
      setNormalization(true);
      setBatchSize('32');
      setEpochs('50');
      
      onScenarioCreated();
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating custom scenario:', error);
      toast.error('Failed to create custom scenario');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Custom Failure Scenario</DialogTitle>
          <DialogDescription>
            Design a custom hyperparameter configuration for students to explore
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Scenario Name */}
          <div className="space-y-2">
            <Label htmlFor="scenario-name">
              Scenario Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="scenario-name"
              placeholder="e.g., Moderate Learning Rate Oscillation"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
            />
          </div>

          {/* Scenario Description */}
          <div className="space-y-2">
            <Label htmlFor="scenario-description">Description (Optional)</Label>
            <Textarea
              id="scenario-description"
              placeholder="Explain what this scenario demonstrates and what students should observe..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={500}
            />
          </div>

          {/* Divider */}
          <div className="border-t pt-4">
            <Label className="text-base font-semibold">Hyperparameter Configuration</Label>
            <p className="text-sm text-muted-foreground mt-1">
              Select the problematic configuration you want students to explore
            </p>
          </div>

          {/* Learning Rate */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Learning Rate</Label>
              <span className="text-sm font-mono bg-muted px-2 py-1 rounded">
                {learningRate.toFixed(4)}
              </span>
            </div>
            <Slider
              value={[learningRate]}
              onValueChange={(value) => setLearningRate(value[0])}
              min={0.0001}
              max={1}
              step={0.0001}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Optimal: 0.001 | Problematic: &gt;0.5 (divergence), &lt;0.0001 (slow)
            </p>
          </div>

          {/* Normalization */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Data Normalization</Label>
              <p className="text-xs text-muted-foreground">
                Optimal: Enabled | Problematic: Disabled (poor convergence)
              </p>
            </div>
            <Switch
              checked={normalization}
              onCheckedChange={setNormalization}
            />
          </div>

          {/* Batch Size */}
          <div className="space-y-2">
            <Label>Batch Size</Label>
            <Select value={batchSize} onValueChange={setBatchSize}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 (Very Small - Erratic)</SelectItem>
                <SelectItem value="2">2 (Small - Noisy)</SelectItem>
                <SelectItem value="4">4 (Small)</SelectItem>
                <SelectItem value="8">8</SelectItem>
                <SelectItem value="16">16</SelectItem>
                <SelectItem value="32">32 (Optimal)</SelectItem>
                <SelectItem value="64">64</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Epochs */}
          <div className="space-y-2">
            <Label>Training Epochs</Label>
            <Select value={epochs} onValueChange={setEpochs}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 (Insufficient - Underfitting)</SelectItem>
                <SelectItem value="10">10 (Low)</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50 (Optimal)</SelectItem>
                <SelectItem value="100">100 (High)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Preview */}
          <div className="border rounded-lg p-4 bg-muted/50 space-y-2">
            <Label className="text-sm font-semibold">Configuration Preview</Label>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Learning Rate:</span>
                <span className="font-mono">{learningRate.toFixed(4)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Normalization:</span>
                <span className="font-mono">{normalization ? 'Enabled' : 'Disabled'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Batch Size:</span>
                <span className="font-mono">{batchSize}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Epochs:</span>
                <span className="font-mono">{epochs}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Creating...' : 'Create Scenario'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
