import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, XCircle, AlertCircle, TrendingUp, TrendingDown, Target } from 'lucide-react';

interface ConfusionMatrixDisplayProps {
  matrix: number[][];
  labels: string[];
  accuracy?: number;
}

export function ConfusionMatrixDisplay({ matrix, labels, accuracy }: ConfusionMatrixDisplayProps) {
  // Calculate metrics
  const calculateMetrics = () => {
    const metrics: {
      label: string;
      precision: number;
      recall: number;
      f1Score: number;
      support: number;
    }[] = [];

    labels.forEach((label, i) => {
      const truePositive = matrix[i][i];
      const falsePositive = matrix.reduce((sum, row, idx) => idx !== i ? sum + row[i] : sum, 0);
      const falseNegative = matrix[i].reduce((sum, val, idx) => idx !== i ? sum + val : sum, 0);
      const support = matrix[i].reduce((sum, val) => sum + val, 0);

      const precision = truePositive / (truePositive + falsePositive) || 0;
      const recall = truePositive / (truePositive + falseNegative) || 0;
      const f1Score = 2 * (precision * recall) / (precision + recall) || 0;

      metrics.push({
        label,
        precision,
        recall,
        f1Score,
        support,
      });
    });

    return metrics;
  };

  const metrics = calculateMetrics();
  const totalSamples = matrix.reduce((sum, row) => sum + row.reduce((s, v) => s + v, 0), 0);

  // Calculate overall metrics
  const avgPrecision = metrics.reduce((sum, m) => sum + m.precision, 0) / metrics.length;
  const avgRecall = metrics.reduce((sum, m) => sum + m.recall, 0) / metrics.length;
  const avgF1Score = metrics.reduce((sum, m) => sum + m.f1Score, 0) / metrics.length;

  // Get max value for color scaling
  const maxValue = Math.max(...matrix.flat());

  return (
    <div className="space-y-6">
      {/* Confusion Matrix */}
      <Card>
        <CardHeader>
          <CardTitle>Confusion Matrix</CardTitle>
          <CardDescription>
            Model predictions vs actual labels ({totalSamples} samples)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-max">
              <thead>
                <tr>
                  <th className="border border-border p-3 bg-muted text-left text-sm font-medium">
                    Actual \ Predicted
                  </th>
                  {labels.map((label, i) => (
                    <th key={i} className="border border-border p-3 bg-muted text-center text-sm font-medium">
                      {label}
                    </th>
                  ))}
                  <th className="border border-border p-3 bg-muted text-center text-sm font-medium">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {matrix.map((row, i) => {
                  const rowTotal = row.reduce((sum, val) => sum + val, 0);
                  return (
                    <tr key={i}>
                      <th className="border border-border p-3 bg-muted text-left text-sm font-medium">
                        {labels[i]}
                      </th>
                      {row.map((value, j) => {
                        const isCorrect = i === j;
                        const intensity = maxValue > 0 ? value / maxValue : 0;
                        const bgOpacity = intensity * 0.5;
                        
                        return (
                          <td
                            key={j}
                            className={`border border-border p-3 text-center font-medium ${
                              isCorrect ? 'bg-primary/10' : ''
                            }`}
                            style={{
                              backgroundColor: isCorrect 
                                ? `hsl(var(--primary) / ${bgOpacity})` 
                                : value > 0 
                                ? `hsl(var(--destructive) / ${bgOpacity * 0.3})`
                                : undefined
                            }}
                          >
                            {value}
                          </td>
                        );
                      })}
                      <td className="border border-border p-3 text-center font-medium bg-muted">
                        {rowTotal}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-primary/30 border border-border"></div>
              <span>Correct predictions</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-destructive/10 border border-border"></div>
              <span>Incorrect predictions</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Per-Class Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Per-Class Metrics</CardTitle>
          <CardDescription>
            Detailed performance metrics for each class
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {metrics.map((metric, i) => (
              <div key={i} className="space-y-3 pb-4 border-b last:border-0 last:pb-0">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">{metric.label}</h4>
                  <Badge variant="secondary">{metric.support} samples</Badge>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Precision</span>
                      <span className="font-medium">{(metric.precision * 100).toFixed(1)}%</span>
                    </div>
                    <Progress value={metric.precision * 100} className="h-2" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Recall</span>
                      <span className="font-medium">{(metric.recall * 100).toFixed(1)}%</span>
                    </div>
                    <Progress value={metric.recall * 100} className="h-2" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">F1-Score</span>
                      <span className="font-medium">{(metric.f1Score * 100).toFixed(1)}%</span>
                    </div>
                    <Progress value={metric.f1Score * 100} className="h-2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Overall Metrics Summary */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              Accuracy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              {accuracy ? `${(accuracy * 100).toFixed(1)}%` : 'N/A'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              Avg Precision
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              {(avgPrecision * 100).toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              Avg Recall
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              {(avgRecall * 100).toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
              Avg F1-Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              {(avgF1Score * 100).toFixed(1)}%
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
