import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/db/supabase';
import { Trash2, Share2, Edit, Search, TrendingUp } from 'lucide-react';
import type { CustomFailureScenario } from '@/types/types';

interface CustomScenarioLibraryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLoadScenario: (scenario: CustomFailureScenario) => void;
  onShareScenario: (scenario: CustomFailureScenario) => void;
  modelType: string;
}

export function CustomScenarioLibrary({
  open,
  onOpenChange,
  onLoadScenario,
  onShareScenario,
  modelType,
}: CustomScenarioLibraryProps) {
  const [scenarios, setScenarios] = useState<CustomFailureScenario[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open) {
      loadScenarios();
    }
  }, [open]);

  const loadScenarios = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('You must be logged in to view custom scenarios');
        return;
      }

      const { data, error } = await supabase
        .from('custom_failure_scenarios')
        .select('*')
        .eq('user_id', user.id)
        .eq('model_type', modelType)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setScenarios(data || []);
    } catch (error) {
      console.error('Error loading custom scenarios:', error);
      toast.error('Failed to load custom scenarios');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (scenarioId: string) => {
    if (!confirm('Are you sure you want to delete this custom scenario?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('custom_failure_scenarios')
        .delete()
        .eq('id', scenarioId);

      if (error) throw error;

      toast.success('Custom scenario deleted');
      loadScenarios();
    } catch (error) {
      console.error('Error deleting custom scenario:', error);
      toast.error('Failed to delete custom scenario');
    }
  };

  const filteredScenarios = scenarios.filter(
    (scenario) =>
      scenario.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (scenario.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Custom Failure Scenarios</DialogTitle>
          <DialogDescription>
            Manage your custom scenarios for this model type
          </DialogDescription>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search scenarios by name or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Scenarios List */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-2">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading scenarios...
            </div>
          ) : filteredScenarios.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground" />
              <div>
                <p className="font-medium">No custom scenarios yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {searchQuery
                    ? 'No scenarios match your search'
                    : 'Create your first custom failure scenario to get started'}
                </p>
              </div>
            </div>
          ) : (
            filteredScenarios.map((scenario) => (
              <Card key={scenario.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base">{scenario.name}</CardTitle>
                      {scenario.description && (
                        <CardDescription className="mt-1">
                          {scenario.description}
                        </CardDescription>
                      )}
                    </div>
                    <Badge variant="secondary" className="shrink-0">
                      Used {scenario.usage_count}x
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Configuration Details */}
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Learning Rate:</span>
                      <span className="font-mono">{scenario.learning_rate.toFixed(4)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Normalization:</span>
                      <span className="font-mono">
                        {scenario.normalization ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Batch Size:</span>
                      <span className="font-mono">{scenario.batch_size}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Epochs:</span>
                      <span className="font-mono">{scenario.epochs}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        onLoadScenario(scenario);
                        onOpenChange(false);
                      }}
                    >
                      Load Scenario
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        onShareScenario(scenario);
                        onOpenChange(false);
                      }}
                    >
                      <Share2 className="h-4 w-4 mr-1" />
                      Share
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(scenario.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
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
