import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { errorAnalysisService } from '@/services/errorAnalysisService';
import type { ErrorAnalysisResult, MisclassifiedExample } from '@/services/errorAnalysisService';
import { AlertTriangle, TrendingDown, TrendingUp, Info, XCircle, CheckCircle2, Filter } from 'lucide-react';

interface ErrorAnalysisDashboardProps {
  errorAnalysis: ErrorAnalysisResult;
}

export function ErrorAnalysisDashboard({ errorAnalysis }: ErrorAnalysisDashboardProps) {
  const [filteredExamples, setFilteredExamples] = useState<MisclassifiedExample[]>(
    errorAnalysis.misclassifiedExamples
  );
  const [filterType, setFilterType] = useState<string>('all');

  const handleFilterChange = (value: string) => {
    setFilterType(value);

    if (value === 'all') {
      setFilteredExamples(errorAnalysis.misclassifiedExamples);
    } else if (value === 'high_confidence') {
      setFilteredExamples(
        errorAnalysisService.filterByErrorType(errorAnalysis.misclassifiedExamples, 'high_confidence')
      );
    } else if (value === 'low_confidence') {
      setFilteredExamples(
        errorAnalysisService.filterByErrorType(errorAnalysis.misclassifiedExamples, 'low_confidence')
      );
    } else if (value === 'boundary_case') {
      setFilteredExamples(
        errorAnalysisService.filterByErrorType(errorAnalysis.misclassifiedExamples, 'boundary_case')
      );
    }
  };

  const getErrorTypeBadge = (errorType: MisclassifiedExample['errorType']) => {
    switch (errorType) {
      case 'high_confidence':
        return <Badge variant="destructive">High Confidence Error</Badge>;
      case 'low_confidence':
        return <Badge variant="outline">Low Confidence</Badge>;
      case 'boundary_case':
        return <Badge variant="secondary">Boundary Case</Badge>;
    }
  };

  const getConfidenceColor = (confidence: number): string => {
    if (confidence > 0.8) return 'text-red-500';
    if (confidence > 0.6) return 'text-orange-500';
    return 'text-yellow-500';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="text-balance flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Error Analysis Dashboard
          </CardTitle>
          <CardDescription className="text-pretty">
            Inspect misclassified examples to understand where your model fails
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Total Errors</span>
                <XCircle className="h-4 w-4 text-red-500" />
              </div>
              <p className="text-2xl font-semibold">{errorAnalysis.totalErrors}</p>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">High Confidence Errors</span>
                <TrendingDown className="h-4 w-4 text-red-500" />
              </div>
              <p className="text-2xl font-semibold">{errorAnalysis.highConfidenceErrors}</p>
              <p className="text-xs text-muted-foreground">Most concerning</p>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Low Confidence Errors</span>
                <TrendingUp className="h-4 w-4 text-yellow-500" />
              </div>
              <p className="text-2xl font-semibold">{errorAnalysis.lowConfidenceErrors}</p>
              <p className="text-xs text-muted-foreground">Model uncertain</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="text-balance flex items-center gap-2">
            <Info className="h-5 w-5" />
            Key Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {errorAnalysis.insights.map((insight, index) => (
              <li key={index} className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span className="text-sm">{insight}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Error Patterns */}
      {errorAnalysis.errorPatterns.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-balance">Common Error Patterns</CardTitle>
            <CardDescription className="text-pretty">
              Recurring mistakes your model makes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {errorAnalysis.errorPatterns.map((pattern, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium">{pattern.pattern}</p>
                      <p className="text-sm text-muted-foreground">{pattern.description}</p>
                    </div>
                    <Badge>{pattern.count} cases</Badge>
                  </div>
                  <Alert className="mt-2">
                    <Info className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      {pattern.suggestion}
                    </AlertDescription>
                  </Alert>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Misclassified Examples */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-balance">Misclassified Examples</CardTitle>
              <CardDescription className="text-pretty">
                Detailed view of individual errors
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={filterType} onValueChange={handleFilterChange}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Errors</SelectItem>
                  <SelectItem value="high_confidence">High Confidence</SelectItem>
                  <SelectItem value="low_confidence">Low Confidence</SelectItem>
                  <SelectItem value="boundary_case">Boundary Cases</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredExamples.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No examples match the selected filter
              </div>
            ) : (
              filteredExamples.slice(0, 10).map((example) => (
                <div key={example.id} className="p-4 border rounded-lg space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Example {example.id}</span>
                        {getErrorTypeBadge(example.errorType)}
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">Actual:</span>
                          <Badge variant="outline" className="bg-green-50">
                            {example.actualLabel}
                          </Badge>
                        </div>
                        <span className="text-muted-foreground">→</span>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">Predicted:</span>
                          <Badge variant="outline" className="bg-red-50">
                            {example.predictedLabel}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Confidence</p>
                      <p className={`text-2xl font-semibold ${getConfidenceColor(example.confidence)}`}>
                        {(example.confidence * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Feature Values:</p>
                    <div className="grid md:grid-cols-3 gap-2">
                      {Object.entries(example.features).map(([key, value]) => (
                        <div key={key} className="p-2 bg-muted rounded text-sm">
                          <span className="text-muted-foreground">{key}:</span>{' '}
                          <span className="font-medium">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Explanation */}
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      {example.explanation}
                    </AlertDescription>
                  </Alert>
                </div>
              ))
            )}

            {filteredExamples.length > 10 && (
              <div className="text-center pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Showing 10 of {filteredExamples.length} examples
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-balance">Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                <strong>Review High Confidence Errors:</strong> These are the most critical mistakes.
                Examine the features to understand why the model is confidently wrong.
              </AlertDescription>
            </Alert>
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                <strong>Collect More Data:</strong> For classes with many low-confidence errors,
                collecting more training examples can help the model learn better patterns.
              </AlertDescription>
            </Alert>
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                <strong>Feature Engineering:</strong> If certain class pairs are frequently confused,
                consider adding new features that better distinguish between them.
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
