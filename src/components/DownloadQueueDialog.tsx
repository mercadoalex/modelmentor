import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  ListOrdered,
  Play,
  Pause,
  Trash2,
  CheckCircle,
  XCircle,
  Loader2,
  Clock,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { downloadQueueService, type DownloadQueue, type QueueStats } from '@/services/downloadQueueService';
import { toast } from 'sonner';

export function DownloadQueueDialog() {
  const [open, setOpen] = useState(false);
  const [queue, setQueue] = useState<DownloadQueue | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const [stats, setStats] = useState<QueueStats | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      loadQueue();
    }
  }, [open]);

  const loadQueue = async () => {
    setLoading(true);
    const defaultQueue = await downloadQueueService.getOrCreateDefaultQueue();
    if (defaultQueue) {
      setQueue(defaultQueue);
      await loadQueueItems(defaultQueue.id);
      await loadStats(defaultQueue.id);
    }
    setLoading(false);
  };

  const loadQueueItems = async (queueId: string) => {
    const queueItems = await downloadQueueService.getQueueItems(queueId);
    setItems(queueItems);
  };

  const loadStats = async (queueId: string) => {
    const queueStats = await downloadQueueService.getQueueStats(queueId);
    setStats(queueStats);
  };

  const handlePauseResume = async () => {
    if (!queue) return;

    if (queue.status === 'active') {
      const success = await downloadQueueService.pauseQueue(queue.id);
      if (success) {
        toast.success('Queue paused');
        loadQueue();
      }
    } else {
      const success = await downloadQueueService.resumeQueue(queue.id);
      if (success) {
        toast.success('Queue resumed');
        loadQueue();
      }
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    const success = await downloadQueueService.removeFromQueue(itemId);
    if (success) {
      toast.success('Removed from queue');
      if (queue) {
        loadQueueItems(queue.id);
        loadStats(queue.id);
      }
    }
  };

  const handleChangePriority = async (itemId: string, currentPriority: number, increase: boolean) => {
    const newPriority = increase ? currentPriority + 1 : currentPriority - 1;
    const success = await downloadQueueService.updateItemPriority(itemId, newPriority);
    if (success) {
      toast.success('Priority updated');
      if (queue) loadQueueItems(queue.id);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'downloading':
        return <Loader2 className="h-4 w-4 text-primary animate-spin" />;
      case 'paused':
        return <Pause className="h-4 w-4 text-orange-500" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/10 text-green-500';
      case 'failed':
        return 'bg-red-500/10 text-red-500';
      case 'downloading':
        return 'bg-primary/10 text-primary';
      case 'paused':
        return 'bg-orange-500/10 text-orange-500';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <ListOrdered className="h-4 w-4 mr-2" />
          Download Queue
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Download Queue</DialogTitle>
          <DialogDescription>
            Manage your dataset downloads
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* Queue Statistics */}
            {stats && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Queue Statistics</CardTitle>
                    {queue && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handlePauseResume}
                      >
                        {queue.status === 'active' ? (
                          <>
                            <Pause className="h-4 w-4 mr-2" />
                            Pause Queue
                          </>
                        ) : (
                          <>
                            <Play className="h-4 w-4 mr-2" />
                            Resume Queue
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                  <CardDescription>
                    {queue?.status === 'active' ? 'Processing downloads' : 'Queue paused'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Total</p>
                      <p className="text-2xl font-semibold">{stats.total}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Pending</p>
                      <p className="text-2xl font-semibold">{stats.pending}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Downloading</p>
                      <p className="text-2xl font-semibold">{stats.downloading}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Completed</p>
                      <p className="text-2xl font-semibold text-green-500">{stats.completed}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Failed</p>
                      <p className="text-2xl font-semibold text-red-500">{stats.failed}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">Paused</p>
                      <p className="text-2xl font-semibold text-orange-500">{stats.paused}</p>
                    </div>
                  </div>

                  {queue && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-sm text-muted-foreground">
                        Max parallel downloads: <span className="font-medium text-foreground">{queue.max_parallel}</span>
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Queue Items */}
            <div className="space-y-3">
              {items.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <ListOrdered className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-muted-foreground">No items in queue</p>
                  </CardContent>
                </Card>
              ) : (
                items.map((item) => {
                  const download = item.dataset_downloads;
                  return (
                    <Card key={item.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-1">
                            {getStatusIcon(item.status)}
                          </div>
                          <div className="flex-1 min-w-0 space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">
                                  {download.dataset_name}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">
                                  {download.dataset_url}
                                </p>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <Badge variant="outline" className="text-xs">
                                  Priority: {item.priority}
                                </Badge>
                                <Badge variant="outline" className={getStatusColor(item.status)}>
                                  {item.status}
                                </Badge>
                              </div>
                            </div>

                            {item.status === 'downloading' && download.progress > 0 && (
                              <Progress value={download.progress} className="h-1" />
                            )}

                            {item.retry_count > 0 && (
                              <p className="text-xs text-orange-500">
                                Retry attempt {item.retry_count}/{item.max_retries}
                              </p>
                            )}

                            <div className="flex items-center gap-2 pt-2">
                              {item.status === 'pending' && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleChangePriority(item.id, item.priority, true)}
                                  >
                                    <ArrowUp className="h-3 w-3 mr-1" />
                                    Increase Priority
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleChangePriority(item.id, item.priority, false)}
                                  >
                                    <ArrowDown className="h-3 w-3 mr-1" />
                                    Decrease Priority
                                  </Button>
                                </>
                              )}
                              {item.status !== 'downloading' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveItem(item.id)}
                                >
                                  <Trash2 className="h-3 w-3 mr-1" />
                                  Remove
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
