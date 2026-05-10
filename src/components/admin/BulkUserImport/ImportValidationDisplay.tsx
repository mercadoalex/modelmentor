import { Badge }  from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, XCircle, Copy } from 'lucide-react';
import type { ImportUserRow } from '@/types/bulkImport';

interface Props { rows: ImportUserRow[]; }

export function ImportValidationDisplay({ rows }: Props) {
  const valid      = rows.filter(r => r.status === 'valid').length;
  const duplicates = rows.filter(r => r.status === 'duplicate').length;
  const invalid    = rows.filter(r => !['valid','duplicate'].includes(r.status)).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          <CheckCircle2 className="h-3 w-3 mr-1" /> {valid} Valid
        </Badge>
        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
          <Copy className="h-3 w-3 mr-1" /> {duplicates} Duplicates
        </Badge>
        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
          <XCircle className="h-3 w-3 mr-1" /> {invalid} Invalid
        </Badge>
      </div>

      {rows.filter(r => r.errors.length > 0).map(row => (
        <Alert key={row.rowIndex} className="border-l-4 border-l-red-400">
          <XCircle className="h-4 w-4" />
          <AlertDescription>
            <span className="font-medium">Row {row.rowIndex}</span>
            {row.email && <span className="text-muted-foreground ml-2">({row.email})</span>}
            <ul className="mt-1 list-disc list-inside text-sm text-muted-foreground">
              {row.errors.map((e, i) => <li key={i}>{e}</li>)}
            </ul>
          </AlertDescription>
        </Alert>
      ))}
    </div>
  );
}