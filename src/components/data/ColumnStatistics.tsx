import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import type { ColumnInfo } from '@/services/dataValidationService';
import { BarChart2, Hash, Tag, Calendar, FileText } from 'lucide-react';

interface ColumnStatisticsProps {
  columnInfo: ColumnInfo[];
}

export function ColumnStatistics({ columnInfo }: ColumnStatisticsProps) {
  const getTypeIcon = (type: ColumnInfo['type']) => {
    switch (type) {
      case 'numeric':
        return <Hash className="h-4 w-4" />;
      case 'categorical':
        return <Tag className="h-4 w-4" />;
      case 'date':
        return <Calendar className="h-4 w-4" />;
      case 'text':
        return <FileText className="h-4 w-4" />;
      default:
        return <BarChart2 className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: ColumnInfo['type']) => {
    switch (type) {
      case 'numeric':
        return 'text-blue-600 dark:text-blue-400';
      case 'categorical':
        return 'text-purple-600 dark:text-purple-400';
      case 'date':
        return 'text-green-600 dark:text-green-400';
      case 'text':
        return 'text-gray-600 dark:text-gray-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-balance">Column Analysis</CardTitle>
        <CardDescription className="text-pretty">
          Detailed statistics for each column
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {columnInfo.map((col, index) => (
            <div key={index} className="space-y-3 pb-6 border-b last:border-b-0 last:pb-0">
              {/* Column Header */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className={getTypeColor(col.type)}>
                    {getTypeIcon(col.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold truncate">{col.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {col.uniqueCount} unique values
                    </p>
                  </div>
                </div>
                <Badge variant="secondary" className="shrink-0">
                  {col.type}
                </Badge>
              </div>

              {/* Missing Values */}
              {col.missingCount > 0 && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Missing Values</span>
                    <span className="font-medium">
                      {col.missingCount} ({col.missingPercentage.toFixed(1)}%)
                    </span>
                  </div>
                  <Progress value={100 - col.missingPercentage} />
                </div>
              )}

              {/* Numeric Statistics */}
              {col.statistics && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="text-xs text-muted-foreground">Min</p>
                    <p className="font-medium">{col.statistics.min?.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Max</p>
                    <p className="font-medium">{col.statistics.max?.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Mean</p>
                    <p className="font-medium">{col.statistics.mean?.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Median</p>
                    <p className="font-medium">{col.statistics.median?.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Std Dev</p>
                    <p className="font-medium">{col.statistics.std?.toFixed(2)}</p>
                  </div>
                </div>
              )}

              {/* Sample Values */}
              {col.sampleValues.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Sample Values</p>
                  <div className="flex flex-wrap gap-2">
                    {col.sampleValues.map((value, i) => (
                      <Badge key={i} variant="outline" className="font-normal">
                        {value}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
