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
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { History, Download, Trash2, CheckCircle, XCircle, Loader2, Clock, Eye } from 'lucide-react';
import { datasetDownloadService, type DatasetDownload } from '@/services/datasetDownloadService';
import { DatasetPreviewDialog } from './DatasetPreviewDialog';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface DownloadHistoryDialogProps {
  onSelectDownload?: (download: DatasetDownload) => void;
}

export function DownloadHistoryDialog({ onSelectDownload }: DownloadHistoryDialogProps) {
  const [open, setOpen] = useState(false);
  const [downloads, setDownloads] = useState<DatasetDownload[]>([]);
  const [loading, setLoading] = useState(false);
  const [previewDownload, setPreviewDownload] = useState<DatasetDownload | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    if (open) {
      loadDownloads();
    }
  }, [open]);

  const loadDownloads = async () => {
    setLoading(true);
    const data = await datasetDownloadService.getUserDownloads();
    setDownloads(data);
    setLoading(false);
  };

  const handleDelete = async (downloadId: string) => {
    const success = await datasetDownloadService.deleteDownload(downloadId);
    if (success) {
      toast.success('Download deleted');
      loadDownloads();
    } else {
      toast.error('Failed to delete download');
    }
  };

  const handleUseDownload = (download: DatasetDownload) => {
    if (onSelectDownload) {
      onSelectDownload(download);
      setOpen(false);
      toast.success('Dataset selected from history');
    }
  };

  const handlePreview = (download: DatasetDownload) => {
    setPreviewDownload(download);
    setPreviewOpen(true);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'downloading':
        return <Loader2 className="h-4 w-4 text-primary animate-spin" />;
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
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'Unknown';
    const mb = bytes / (1024 * 1024);
    if (mb < 1) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${mb.toFixed(1)} MB`;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <History className="h-4 w-4 mr-2" />
          Download History
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Download History</DialogTitle>
          <DialogDescription>
            View and manage your dataset downloads
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : downloads.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Download className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">No downloads yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {downloads.map((download) => (
              <Card key={download.id}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {getStatusIcon(download.status)}
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
                        <Badge variant="outline" className={getStatusColor(download.status)}>
                          {download.status}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="capitalize">{download.platform}</span>
                        {download.file_size && (
                          <span>{formatFileSize(download.file_size)}</span>
                        )}
                        {download.format && (
                          <span className="uppercase">{download.format}</span>
                        )}
                        {download.downloaded_at && (
                          <span>
                            {formatDistanceToNow(new Date(download.downloaded_at), { addSuffix: true })}
                          </span>
                        )}
                      </div>

                      {download.status === 'downloading' && (
                        <Progress value={download.progress} className="h-1" />
                      )}

                      {download.status === 'failed' && download.error_message && (
                        <p className="text-xs text-red-500">{download.error_message}</p>
                      )}

                      {download.status === 'completed' && download.expires_at && (
                        <p className="text-xs text-muted-foreground">
                          Expires {formatDistanceToNow(new Date(download.expires_at), { addSuffix: true })}
                        </p>
                      )}

                      <div className="flex items-center gap-2 pt-2">
                        {download.status === 'completed' && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePreview(download)}
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              Preview
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUseDownload(download)}
                            >
                              <Download className="h-3 w-3 mr-1" />
                              Use Dataset
                            </Button>
                          </>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(download.id)}
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {previewDownload && (
          <DatasetPreviewDialog
            open={previewOpen}
            onOpenChange={setPreviewOpen}
            download={previewDownload}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
