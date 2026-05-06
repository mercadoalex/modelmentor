import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { History, RotateCcw, Trash2, Clock } from 'lucide-react';

interface ScenarioHistoryItem {
  id: string;
  timestamp: Date;
  scenarioName: string;
  scenarioType: 'pre-loaded' | 'custom';
  configuration: {
    learningRate: number;
    normalization: boolean;
    batchSize: string;
    epochs: string;
  };
}

interface ScenarioHistoryPanelProps {
  history: ScenarioHistoryItem[];
  onReapply: (item: ScenarioHistoryItem) => void;
  onClear: () => void;
}

export function ScenarioHistoryPanel({
  history,
  onReapply,
  onClear,
}: ScenarioHistoryPanelProps) {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffSecs = Math.floor(diffMs / 1000);

    if (diffMins === 0) {
      return `${diffSecs}s ago`;
    } else if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else {
      const diffHours = Math.floor(diffMins / 60);
      return `${diffHours}h ago`;
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <History className="h-4 w-4" />
              Scenario History
            </CardTitle>
            <CardDescription className="text-xs mt-1">
              Track your experimentation journey
            </CardDescription>
          </div>
          {history.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClear}
              className="h-8 text-xs"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Clear
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {history.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No scenarios explored yet</p>
            <p className="text-xs mt-1">
              Click a failure scenario button to start tracking
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-3">
              {/* Timeline */}
              <div className="relative">
                {history.map((item, index) => (
                  <div key={item.id} className="relative pb-6 last:pb-0">
                    {/* Timeline line */}
                    {index < history.length - 1 && (
                      <div className="absolute left-[11px] top-6 bottom-0 w-[2px] bg-border" />
                    )}

                    {/* Timeline dot */}
                    <div className="absolute left-0 top-1 h-6 w-6 rounded-full border-2 border-primary bg-background flex items-center justify-center">
                      <div className="h-2 w-2 rounded-full bg-primary" />
                    </div>

                    {/* Content */}
                    <div className="ml-10 space-y-2">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-sm truncate">
                              {item.scenarioName}
                            </span>
                            <Badge
                              variant={item.scenarioType === 'pre-loaded' ? 'default' : 'secondary'}
                              className="text-xs shrink-0"
                            >
                              {item.scenarioType === 'pre-loaded' ? 'Pre-loaded' : 'Custom'}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                            <Clock className="h-3 w-3" />
                            <span>{formatTime(item.timestamp)}</span>
                            <span>•</span>
                            <span>{formatRelativeTime(item.timestamp)}</span>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onReapply(item)}
                          className="h-7 text-xs shrink-0"
                        >
                          <RotateCcw className="h-3 w-3 mr-1" />
                          Re-apply
                        </Button>
                      </div>

                      {/* Configuration Details */}
                      <div className="grid grid-cols-2 gap-2 text-xs bg-muted/50 p-2 rounded">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">LR:</span>
                          <span className="font-mono">{item.configuration.learningRate.toFixed(4)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Norm:</span>
                          <span className="font-mono">
                            {item.configuration.normalization ? 'On' : 'Off'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Batch:</span>
                          <span className="font-mono">{item.configuration.batchSize}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Epochs:</span>
                          <span className="font-mono">{item.configuration.epochs}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
