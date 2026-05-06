import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { ColumnInfo } from '@/services/dataValidationService';

interface DataPreviewTableProps {
  headers: string[];
  rows: string[][];
  columnInfo?: ColumnInfo[];
  maxRows?: number;
}

export function DataPreviewTable({ headers, rows, columnInfo, maxRows = 10 }: DataPreviewTableProps) {
  const previewRows = rows.slice(0, maxRows);

  const getColumnBadge = (colIndex: number) => {
    if (!columnInfo || !columnInfo[colIndex]) return null;
    
    const col = columnInfo[colIndex];
    const typeColors: Record<string, string> = {
      numeric: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      categorical: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      date: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      text: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
      unknown: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
    };

    return (
      <Badge variant="secondary" className={`text-xs ${typeColors[col.type]}`}>
        {col.type}
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-balance">Data Preview</CardTitle>
        <CardDescription className="text-pretty">
          Showing first {Math.min(maxRows, rows.length)} of {rows.length} rows
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="w-full overflow-x-auto bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12 whitespace-nowrap">#</TableHead>
                {headers.map((header, index) => (
                  <TableHead key={index} className="whitespace-nowrap">
                    <div className="space-y-1">
                      <div className="font-semibold">{header}</div>
                      {getColumnBadge(index)}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {previewRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={headers.length + 1} className="text-center text-muted-foreground">
                    No data to display
                  </TableCell>
                </TableRow>
              ) : (
                previewRows.map((row, rowIndex) => (
                  <TableRow key={rowIndex}>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {rowIndex + 1}
                    </TableCell>
                    {row.map((cell, cellIndex) => (
                      <TableCell key={cellIndex} className="whitespace-nowrap">
                        {cell || <span className="text-muted-foreground italic">empty</span>}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        {rows.length > maxRows && (
          <p className="text-sm text-muted-foreground mt-4 text-center">
            ... and {rows.length - maxRows} more rows
          </p>
        )}
      </CardContent>
    </Card>
  );
}
