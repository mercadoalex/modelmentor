import { useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

export interface TrainingLog {
  timestamp: Date;
  level: 'info' | 'success' | 'warning' | 'error';
  message: string;
  details?: string;
}

interface TrainingLogsProps {
  logs: TrainingLog[];
  maxHeight?: string;
  autoScroll?: boolean;
}

export function TrainingLogs({ logs, maxHeight = '300px', autoScroll = true }: TrainingLogsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const getLevelColor = (level: TrainingLog['level']) => {
    switch (level) {
      case 'success':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'error':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Training Logs</CardTitle>
          <Badge variant="secondary" className="text-xs">
            {logs.length} entries
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea 
          className="rounded-md border bg-muted/50" 
          style={{ height: maxHeight }}
          ref={scrollRef}
        >
          <div className="p-4 space-y-2">
            {logs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No logs yet. Start training to see progress.
              </p>
            ) : (
              logs.map((log, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 text-sm font-mono"
                >
                  <span className="text-xs text-muted-foreground shrink-0 mt-0.5">
                    {formatTime(log.timestamp)}
                  </span>
                  <Badge 
                    variant="secondary" 
                    className={`shrink-0 text-xs ${getLevelColor(log.level)}`}
                  >
                    {log.level.toUpperCase()}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <p className="text-foreground break-words">{log.message}</p>
                    {log.details && (
                      <p className="text-muted-foreground text-xs mt-1 break-words">
                        {log.details}
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
