import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { CorrelationData } from '@/services/dataProfilingService';

interface CorrelationHeatmapProps {
  data: CorrelationData[];
  title: string;
  description?: string;
}

export function CorrelationHeatmap({ data, title, description }: CorrelationHeatmapProps) {
  // Get unique column names
  const columns = Array.from(new Set(data.flatMap(d => [d.column1, d.column2])));

  // Create correlation matrix
  const matrix: Record<string, Record<string, number>> = {};
  columns.forEach(col1 => {
    matrix[col1] = {};
    columns.forEach(col2 => {
      const correlation = data.find(
        d => (d.column1 === col1 && d.column2 === col2) || (d.column1 === col2 && d.column2 === col1)
      );
      matrix[col1][col2] = correlation ? correlation.correlation : 0;
    });
  });

  const getCorrelationColor = (value: number) => {
    const absValue = Math.abs(value);
    if (absValue >= 0.8) return value > 0 ? 'bg-green-500' : 'bg-red-500';
    if (absValue >= 0.6) return value > 0 ? 'bg-green-400' : 'bg-red-400';
    if (absValue >= 0.4) return value > 0 ? 'bg-green-300' : 'bg-red-300';
    if (absValue >= 0.2) return value > 0 ? 'bg-green-200' : 'bg-red-200';
    return 'bg-gray-200 dark:bg-gray-700';
  };

  const getCorrelationStrength = (value: number) => {
    const absValue = Math.abs(value);
    if (absValue >= 0.8) return 'Very Strong';
    if (absValue >= 0.6) return 'Strong';
    if (absValue >= 0.4) return 'Moderate';
    if (absValue >= 0.2) return 'Weak';
    return 'Very Weak';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-balance">{title}</CardTitle>
        {description && <CardDescription className="text-pretty">{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Legend */}
          <div className="flex items-center gap-4 text-sm">
            <span className="text-muted-foreground">Correlation:</span>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded" />
              <span>Strong Negative</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded" />
              <span>Weak</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded" />
              <span>Strong Positive</span>
            </div>
          </div>

          {/* Heatmap */}
          <div className="w-full overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="p-2 text-left text-sm font-medium"></th>
                  {columns.map(col => (
                    <th key={col} className="p-2 text-center text-sm font-medium whitespace-nowrap">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {columns.map(row => (
                  <tr key={row}>
                    <td className="p-2 text-sm font-medium whitespace-nowrap">{row}</td>
                    {columns.map(col => {
                      const value = matrix[row][col];
                      return (
                        <td key={col} className="p-1">
                          <div
                            className={`w-16 h-16 flex items-center justify-center rounded ${getCorrelationColor(value)} transition-colors cursor-pointer hover:opacity-80`}
                            title={`${row} vs ${col}: ${value.toFixed(3)} (${getCorrelationStrength(value)})`}
                          >
                            <span className="text-xs font-medium text-foreground">
                              {value.toFixed(2)}
                            </span>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Strong Correlations */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Strong Correlations (|r| ≥ 0.6):</p>
            <div className="flex flex-wrap gap-2">
              {data
                .filter(d => Math.abs(d.correlation) >= 0.6 && d.column1 !== d.column2)
                .map((d, index) => (
                  <Badge key={index} variant="secondary">
                    {d.column1} ↔ {d.column2}: {d.correlation.toFixed(3)}
                  </Badge>
                ))}
              {data.filter(d => Math.abs(d.correlation) >= 0.6 && d.column1 !== d.column2).length === 0 && (
                <span className="text-sm text-muted-foreground">No strong correlations found</span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
