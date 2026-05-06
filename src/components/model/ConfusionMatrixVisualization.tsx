import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { confusionMatrixService } from '@/services/confusionMatrixService';
import type { ConfusionMatrixData, BinaryMetrics, MultiClassMetrics } from '@/services/confusionMatrixService';
import { Info, CheckCircle2, AlertCircle, TrendingUp } from 'lucide-react';

interface ConfusionMatrixVisualizationProps {
  matrixData: ConfusionMatrixData;
}

export function ConfusionMatrixVisualization({ matrixData }: ConfusionMatrixVisualizationProps) {
  const { matrix, labels } = matrixData;
  const isBinary = matrix.length === 2;

  // Calculate metrics
  const binaryMetrics = isBinary ? confusionMatrixService.calculateBinaryMetrics(matrix) : null;
  const multiClassMetrics = !isBinary ? confusionMatrixService.calculateMultiClassMetrics(matrix, labels) : null;

  // Get improvement suggestions
  const suggestions = confusionMatrixService.getImprovementSuggestions(matrix, labels);

  // Calculate max value for color scaling
  const maxValue = Math.max(...matrix.flat());

  // Get color intensity based on value
  const getColorIntensity = (value: number, isCorrect: boolean): string => {
    const intensity = maxValue > 0 ? value / maxValue : 0;
    
    if (isCorrect) {
      // Green for correct predictions
      if (intensity > 0.8) return 'bg-green-500 text-white';
      if (intensity > 0.6) return 'bg-green-400 text-white';
      if (intensity > 0.4) return 'bg-green-300';
      if (intensity > 0.2) return 'bg-green-200';
      return 'bg-green-100';
    } else {
      // Red for incorrect predictions
      if (intensity > 0.8) return 'bg-red-500 text-white';
      if (intensity > 0.6) return 'bg-red-400 text-white';
      if (intensity > 0.4) return 'bg-red-300';
      if (intensity > 0.2) return 'bg-red-200';
      return 'bg-red-100';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="text-balance flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Confusion Matrix
          </CardTitle>
          <CardDescription className="text-pretty">
            Visualize where your model makes correct predictions and mistakes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              The confusion matrix shows how many predictions were correct (diagonal) and where the model made mistakes (off-diagonal).
              Darker green means more correct predictions, darker red means more errors.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Matrix Visualization */}
      <Card>
        <CardHeader>
          <CardTitle className="text-balance">Prediction Results</CardTitle>
          <CardDescription className="text-pretty">
            Rows represent actual classes, columns represent predicted classes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="w-full overflow-x-auto">
            <div className="inline-block min-w-full">
              <TooltipProvider>
                <div className="space-y-2">
                  {/* Column headers */}
                  <div className="flex items-center gap-2">
                    <div className="w-32 shrink-0" />
                    <div className="flex-1 flex gap-2">
                      <div className="flex-1 text-center font-medium text-sm" style={{ minWidth: '100px' }}>
                        Predicted →
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-32 shrink-0" />
                    {labels.map((label, index) => (
                      <div
                        key={index}
                        className="flex-1 text-center font-medium text-sm p-2 bg-muted rounded"
                        style={{ minWidth: '100px' }}
                      >
                        {label}
                      </div>
                    ))}
                  </div>

                  {/* Matrix rows */}
                  {matrix.map((row, actualIndex) => (
                    <div key={actualIndex} className="flex items-center gap-2">
                      {actualIndex === 0 && (
                        <div className="w-32 shrink-0 text-sm font-medium">Actual ↓</div>
                      )}
                      {actualIndex > 0 && <div className="w-32 shrink-0" />}
                      
                      <div className="flex-1 flex gap-2">
                        {row.map((value, predictedIndex) => {
                          const isCorrect = actualIndex === predictedIndex;
                          const explanation = confusionMatrixService.getCellExplanation(
                            actualIndex,
                            predictedIndex,
                            labels
                          );

                          return (
                            <Tooltip key={predictedIndex}>
                              <TooltipTrigger asChild>
                                <div
                                  className={`flex-1 p-4 rounded text-center font-semibold cursor-help transition-colors ${getColorIntensity(value, isCorrect)}`}
                                  style={{ minWidth: '100px' }}
                                >
                                  {value}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="font-medium">{explanation}</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {value} sample{value !== 1 ? 's' : ''}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          );
                        })}
                      </div>
                    </div>
                  ))}

                  {/* Legend */}
                  <div className="flex items-center justify-center gap-6 pt-4 border-t">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-green-500 rounded" />
                      <span className="text-sm">Correct Predictions</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-red-500 rounded" />
                      <span className="text-sm">Misclassifications</span>
                    </div>
                  </div>
                </div>
              </TooltipProvider>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Binary Metrics */}
      {binaryMetrics && (
        <Card>
          <CardHeader>
            <CardTitle className="text-balance">Binary Classification Metrics</CardTitle>
            <CardDescription className="text-pretty">
              Detailed breakdown of prediction types
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg bg-green-50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">True Positives (TP)</span>
                  <Badge className="bg-green-500">{binaryMetrics.truePositives}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Correctly predicted positive cases
                </p>
              </div>

              <div className="p-4 border rounded-lg bg-red-50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">False Positives (FP)</span>
                  <Badge variant="destructive">{binaryMetrics.falsePositives}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Incorrectly predicted as positive (Type I error)
                </p>
              </div>

              <div className="p-4 border rounded-lg bg-red-50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">False Negatives (FN)</span>
                  <Badge variant="destructive">{binaryMetrics.falseNegatives}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Incorrectly predicted as negative (Type II error)
                </p>
              </div>

              <div className="p-4 border rounded-lg bg-green-50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">True Negatives (TN)</span>
                  <Badge className="bg-green-500">{binaryMetrics.trueNegatives}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Correctly predicted negative cases
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-4 gap-4 mt-4 pt-4 border-t">
              <div>
                <p className="text-sm text-muted-foreground">Precision</p>
                <p className="text-2xl font-semibold">{(binaryMetrics.precision * 100).toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground">TP / (TP + FP)</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Recall</p>
                <p className="text-2xl font-semibold">{(binaryMetrics.recall * 100).toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground">TP / (TP + FN)</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">F1 Score</p>
                <p className="text-2xl font-semibold">{(binaryMetrics.f1Score * 100).toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground">Harmonic mean</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Specificity</p>
                <p className="text-2xl font-semibold">{(binaryMetrics.specificity * 100).toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground">TN / (TN + FP)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Multi-Class Metrics */}
      {multiClassMetrics && (
        <Card>
          <CardHeader>
            <CardTitle className="text-balance">Per-Class Performance</CardTitle>
            <CardDescription className="text-pretty">
              Metrics for each class in your dataset
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4 pb-4 border-b">
                <div>
                  <p className="text-sm text-muted-foreground">Overall Accuracy</p>
                  <p className="text-2xl font-semibold">{(multiClassMetrics.accuracy * 100).toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Macro Avg Precision</p>
                  <p className="text-2xl font-semibold">{(multiClassMetrics.macroAvgPrecision * 100).toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Macro Avg Recall</p>
                  <p className="text-2xl font-semibold">{(multiClassMetrics.macroAvgRecall * 100).toFixed(1)}%</p>
                </div>
              </div>

              <div className="w-full overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="p-2 text-left text-sm font-medium whitespace-nowrap">Class</th>
                      <th className="p-2 text-right text-sm font-medium whitespace-nowrap">Precision</th>
                      <th className="p-2 text-right text-sm font-medium whitespace-nowrap">Recall</th>
                      <th className="p-2 text-right text-sm font-medium whitespace-nowrap">F1 Score</th>
                      <th className="p-2 text-right text-sm font-medium whitespace-nowrap">Support</th>
                    </tr>
                  </thead>
                  <tbody>
                    {multiClassMetrics.perClassMetrics.map((metric, index) => (
                      <tr key={index} className="border-b">
                        <td className="p-2 font-medium whitespace-nowrap">{metric.label}</td>
                        <td className="p-2 text-right whitespace-nowrap">{(metric.precision * 100).toFixed(1)}%</td>
                        <td className="p-2 text-right whitespace-nowrap">{(metric.recall * 100).toFixed(1)}%</td>
                        <td className="p-2 text-right whitespace-nowrap">{(metric.f1Score * 100).toFixed(1)}%</td>
                        <td className="p-2 text-right whitespace-nowrap">{metric.support}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Improvement Suggestions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-balance flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Improvement Suggestions
          </CardTitle>
          <CardDescription className="text-pretty">
            Tips to improve your model based on the confusion matrix
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {suggestions.map((suggestion, index) => (
              <li key={index} className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span className="text-sm">{suggestion}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
