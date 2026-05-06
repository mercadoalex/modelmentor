import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trash2, Upload, Share2, Search, X, ClipboardList } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/db/supabase';
import type { SandboxConfiguration } from '@/types/types';

interface SavedConfigurationsLibraryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLoad: (config: SandboxConfiguration) => void;
  onShare: (config: SandboxConfiguration) => void;
  onMarkAsAssignment?: (config: SandboxConfiguration) => void;
}

export function SavedConfigurationsLibrary({
  open,
  onOpenChange,
  onLoad,
  onShare,
  onMarkAsAssignment
}: SavedConfigurationsLibraryProps) {
  const [configurations, setConfigurations] = useState<SandboxConfiguration[]>([]);
  const [isTeacher, setIsTeacher] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open) {
      loadConfigurations();
      checkUserRole();
    }
  }, [open]);

  const checkUserRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        
        setIsTeacher(profile?.role === 'admin');
      }
    } catch (error) {
      console.error('Error checking user role:', error);
    }
  };

  const loadConfigurations = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('You must be logged in to view configurations');
        return;
      }

      const { data, error } = await supabase
        .from('sandbox_configurations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setConfigurations(data || []);
    } catch (error) {
      console.error('Error loading configurations:', error);
      toast.error('Failed to load configurations');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('sandbox_configurations')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Configuration deleted');
      loadConfigurations();
    } catch (error) {
      console.error('Error deleting configuration:', error);
      toast.error('Failed to delete configuration');
    }
  };

  const handleLoadConfig = (config: SandboxConfiguration) => {
    onLoad(config);
    onOpenChange(false);
    toast.success(`Loaded configuration: ${config.name}`);
  };

  const filteredConfigurations = configurations.filter(config =>
    config.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (config.description?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Saved Configurations</DialogTitle>
          <DialogDescription>
            Load, share, or delete your saved debugging sandbox configurations
          </DialogDescription>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search configurations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Configurations List */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-2">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading configurations...
            </div>
          ) : filteredConfigurations.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-2">
                {searchQuery ? 'No configurations match your search' : 'No saved configurations yet'}
              </p>
              <p className="text-sm text-muted-foreground">
                {!searchQuery && 'Save your first configuration to get started'}
              </p>
            </div>
          ) : (
            filteredConfigurations.map((config) => (
              <Card key={config.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base truncate">{config.name}</CardTitle>
                        {config.is_assignment && (
                          <Badge variant="secondary" className="text-xs">
                            <ClipboardList className="h-3 w-3 mr-1" />
                            Assignment
                          </Badge>
                        )}
                      </div>
                      <CardDescription className="text-xs mt-1">
                        {new Date(config.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </CardDescription>
                    </div>
                  </div>
                  {config.description && (
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                      {config.description}
                    </p>
                  )}
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Settings Summary */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-muted p-2 rounded">
                      <span className="text-muted-foreground">Learning Rate: </span>
                      <span className="font-medium">{config.learning_rate}</span>
                    </div>
                    <div className="bg-muted p-2 rounded">
                      <span className="text-muted-foreground">Normalization: </span>
                      <span className="font-medium">{config.normalization ? 'On' : 'Off'}</span>
                    </div>
                    <div className="bg-muted p-2 rounded">
                      <span className="text-muted-foreground">Batch Size: </span>
                      <span className="font-medium">{config.batch_size}</span>
                    </div>
                    <div className="bg-muted p-2 rounded">
                      <span className="text-muted-foreground">Epochs: </span>
                      <span className="font-medium">{config.epochs}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      size="sm"
                      onClick={() => handleLoadConfig(config)}
                      className="flex-1"
                    >
                      <Upload className="h-3 w-3 mr-1" />
                      Load
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        onShare(config);
                        onOpenChange(false);
                      }}
                    >
                      <Share2 className="h-3 w-3 mr-1" />
                      Share
                    </Button>
                    {isTeacher && !config.is_assignment && onMarkAsAssignment && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          onMarkAsAssignment(config);
                          onOpenChange(false);
                        }}
                      >
                        <ClipboardList className="h-3 w-3 mr-1" />
                        Mark as Assignment
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(config.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Close Button */}
        <div className="flex justify-end pt-3 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4 mr-2" />
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
