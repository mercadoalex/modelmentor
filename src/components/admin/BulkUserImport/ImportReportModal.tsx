import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge }   from '@/components/ui/badge';
import { Button }  from '@/components/ui/button';
import { CheckCircle2, XCircle, Download } from 'lucide-react';
import type { ImportReport } from '@/types/bulkImport';

interface Props { report: ImportReport | null; open: boolean; onClose: () => void; }

export function ImportReportModal({ report, open, onClose }: Props) {
  if (!report) return null;

  const downloadReport = () => {
    const rows = [
      ['Row','Email','Status','Error'],
      ...report.results.map(r => [r.rowIndex, r.email, r.success ? 'Success' : 'Failed', r.error ?? '']),
    ];
    const blob = new Blob([rows.map(r => r.join(',')).join('\n')], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `import-report-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Report</DialogTitle>
          <DialogDescription>Completed at {new Date(report.completedAt).toLocaleString()}</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4">
          {[
            { label: 'Total',      value: report.totalRows,     color: 'text-foreground'  },
            { label: 'Imported',   value: report.imported,      color: 'text-green-600'   },
            { label: 'Failed',     value: report.failed,        color: 'text-red-600'     },
            { label: 'Duplicates', value: report.duplicateRows, color: 'text-yellow-600'  },
          ].map(s => (
            <div key={s.label} className="text-center p-3 rounded-lg bg-muted">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {report.results.map(r => (
                <TableRow key={r.rowIndex}>
                  <TableCell className="text-xs text-muted-foreground">{r.rowIndex}</TableCell>
                  <TableCell className="font-mono text-sm">{r.email}</TableCell>
                  <TableCell>
                    {r.success
                      ? <Badge className="bg-green-100 text-green-800"><CheckCircle2 className="h-3 w-3 mr-1" />Success</Badge>
                      : <Badge className="bg-red-100 text-red-800"><XCircle className="h-3 w-3 mr-1" />Failed</Badge>}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{r.error ?? '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={downloadReport}>
            <Download className="h-4 w-4 mr-2" /> Download CSV
          </Button>
          <Button onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}