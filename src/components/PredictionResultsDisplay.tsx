import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, XCircle, AlertTriangle, TrendingUp } from 'lucide-react';

export interface PredictionResult {
  input: string | number[];
  actualLabel?: string;
  predictedLabel: string;
  confidence: number;
  isCorrect?: boolean;
  allPredictions?: { label: string; confidence: number }[];
}

interface PredictionResultsDisplayProps {
  results: PredictionResult[];
  showActual?: boolean;
}

export function PredictionResultsDisplay({ results, showActual = false }: PredictionResultsDisplayProps) {
  const correctCount = results.filter(r => r.isCorrect).length;
  const incorrectCount = results.filter(r => r.isCorrect === false).length;
  const accuracy = results.length > 0 ? correctCount / results.length : 0;

  const avgConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / results.length;
  const highConfidence = results.filter(r => r.confidence >= 0.8).length;
  const lowConfidence = results.filter(r => r.confidence < 0.5).length;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Predictions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{results.length}</p>
          </CardContent>
        </Card>

        {showActual && (
          <>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Correct
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold text-green-600 dark:text-green-400">
                  {correctCount}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {(accuracy * 100).toFixed(1)}% accuracy
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-500" />
                  Incorrect
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold text-red-600 dark:text-red-400">
                  {incorrectCount}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {((incorrectCount / results.length) * 100).toFixed(1)}% error rate
                </p>
              </CardContent>
            </Card>
          </>
        )}

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              Avg Confidence
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              {(avgConfidence * 100).toFixed(1)}%
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {highConfidence} high, {lowConfidence} low
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Results Table */}
      <Card>
        <CardHeader>
          <CardTitle>Prediction Results</CardTitle>
          <CardDescription>
            Detailed results for each prediction
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-3 text-sm font-medium text-muted-foreground">
                    #
                  </th>
                  <th className="text-left p-3 text-sm font-medium text-muted-foreground">
                    Input
                  </th>
                  {showActual && (
                    <th className="text-left p-3 text-sm font-medium text-muted-foreground">
                      Actual
                    </th>
                  )}
                  <th className="text-left p-3 text-sm font-medium text-muted-foreground">
                    Predicted
                  </th>
                  <th className="text-left p-3 text-sm font-medium text-muted-foreground">
                    Confidence
                  </th>
                  {showActual && (
                    <th className="text-center p-3 text-sm font-medium text-muted-foreground">
                      Status
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {results.map((result, index) => (
                  <tr key={index} className="border-b border-border last:border-0 hover:bg-muted/50">
                    <td className="p-3 text-sm text-muted-foreground">
                      {index + 1}
                    </td>
                    <td className="p-3 text-sm max-w-xs">
                      <div className="truncate" title={typeof result.input === 'string' ? result.input : result.input.join(', ')}>
                        {typeof result.input === 'string' 
                          ? result.input 
                          : result.input.join(', ')}
                      </div>
                    </td>
                    {showActual && (
                      <td className="p-3">
                        <Badge variant="outline">{result.actualLabel}</Badge>
                      </td>
                    )}
                    <td className="p-3">
                      <Badge variant={result.isCorrect === false ? "destructive" : "default"}>
                        {result.predictedLabel}
                      </Badge>
                    </td>
                    <td className="p-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Progress 
                            value={result.confidence * 100} 
                            className="h-2 w-20" 
                          />
                          <span className="text-sm font-medium">
                            {(result.confidence * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </td>
                    {showActual && (
                      <td className="p-3 text-center">
                        {result.isCorrect === true && (
                          <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" />
                        )}
                        {result.isCorrect === false && (
                          <XCircle className="h-5 w-5 text-red-500 mx-auto" />
                        )}
                        {result.isCorrect === undefined && (
                          <AlertTriangle className="h-5 w-5 text-yellow-500 mx-auto" />
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {results.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <p>No predictions yet</p>
              <p className="text-sm mt-2">Run predictions to see results here</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confidence Distribution */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Confidence Distribution</CardTitle>
            <CardDescription>
              Distribution of prediction confidence scores
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">High Confidence (≥80%)</span>
                  <span className="font-medium">{highConfidence} predictions</span>
                </div>
                <Progress 
                  value={(highConfidence / results.length) * 100} 
                  className="h-2"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Medium Confidence (50-80%)</span>
                  <span className="font-medium">
                    {results.length - highConfidence - lowConfidence} predictions
                  </span>
                </div>
                <Progress 
                  value={((results.length - highConfidence - lowConfidence) / results.length) * 100} 
                  className="h-2"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Low Confidence (&lt;50%)</span>
                  <span className="font-medium">{lowConfidence} predictions</span>
                </div>
                <Progress 
                  value={(lowConfidence / results.length) * 100} 
                  className="h-2"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
