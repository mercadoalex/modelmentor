import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, Copy } from 'lucide-react';
import type { ImportUserRow } from '@/types/bulkImport';

interface Props { rows: ImportUserRow[]; }

const statusIcon = (status: ImportUserRow['status']) => {
  if (status === 'valid')     return <CheckCircle2 className="h-4 w-4 text-green-500" />;
  if (status === 'duplicate') return <Copy         className="h-4 w-4 text-yellow-500" />;
  return                             <XCircle      className="h-4 w-4 text-red-500" />;
};

export function ImportPreviewTable({ rows }: Props) {
  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">#</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>First Name</TableHead>
            <TableHead>Last Name</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Organization</TableHead>
            <TableHead>Group</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map(row => (
            <TableRow key={row.rowIndex} className={row.status !== 'valid' ? 'bg-red-50/40' : ''}>
              <TableCell className="text-muted-foreground text-xs">{row.rowIndex}</TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  {statusIcon(row.status)}
                  <Badge variant="outline" className="text-xs capitalize">
                    {row.status.replace(/_/g, ' ')}
                  </Badge>
                </div>
              </TableCell>
              <TableCell className="font-mono text-sm">{row.email || '—'}</TableCell>
              <TableCell>{row.firstName}</TableCell>
              <TableCell>{row.lastName}</TableCell>
              <TableCell>
                {row.role
                  ? <Badge variant="secondary" className="capitalize">{row.role}</Badge>
                  : '—'}
              </TableCell>
              <TableCell className="text-sm">{row.organization || '—'}</TableCell>
              <TableCell className="text-sm">{row.group        || '—'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}