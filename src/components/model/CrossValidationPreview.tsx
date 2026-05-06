import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { crossValidationService } from '@/services/crossValidationService';
import type { CrossValidationResult, SplitRecommendation } from '@/services/crossValidationService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Play, AlertTriangle, CheckCircle2, Info, TrendingUp, Target } from 'lucide-react';

interface CrossValidationPreviewProps {
  datasetSize: number;
  numClasses: number;
  onRecommendationApply?: (splitRatio: number) => void;
}

export function CrossValidationPreview({ 
  datasetSize, 
  numClasses,
  onRecommendationApply 
}: CrossValidationPreviewProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 5 });
  const [result, setResult] = useState<CrossValidationResult | null>(null);
  const [splitRecommendations] = useState<SplitRecommendation[]>(
    crossValidationService.getSplitRecommendations(datasetSize)
  );

  const handleRunValidation = async () => {
    setIsRunning(true);
    setResult(null);

    const cvResult = await crossValidationService.performCrossValidation(
      datasetSize,
      numClasses,
      5,
      (current, total) => setProgress({ current, total })
    );

    setResult(cvResult);
    setIsRunning(false);
  };

  const getRiskColor = (risk: 'low' | 'medium' | 'high') => {
    switch (risk) {
      case 'low':
        return 'text-green-600';
      case 'medium':
        return 'text-yellow-600';
      case 'high':
        return 'text-red-600';
    }
  };

  const getRiskBadge = (risk: 'low' | 'medium' | 'high') => {
    switch (risk) {
      case 'low':
        return <Badge className="bg-green-500">Low Risk</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-500">Medium Risk</Badge>;
      case 'high':
        return <Badge variant="destructive">High Risk</Badge>;
    }
  };

  const progressPercentage = progress.total > 0 ? (progress.current / progress.total) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="text-balance flex items-center gap-2">
            <Target className="h-5 w-5" />
            Cross-Validation Preview
          </CardTitle>
          <CardDescription className="text-pretty">
            Estimate model performance before full training
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Cross-validation splits your data into multiple folds and trains on each fold to estimate
              how well your model will generalize to unseen data. This helps identify overfitting risks
              before committing to full training.
            </AlertDescription>
          </Alert>

          {!isRunning && !result && (
            <Button onClick={handleRunValidation} className="w-full mt-4" size="lg">
              <Play className="h-5 w-5 mr-2" />
              Run Quick Validation (5-Fold)
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Progress */}
      {isRunning && (
        <Card>
          <CardHeader>
            <CardTitle className="text-balance">Running Cross-Validation</CardTitle>
            <CardDescription className="text-pretty">
              Testing model on different data splits
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Progress</span>
                <span className="font-medium">
                  Fold {progress.current} / {progress.total}
                </span>
              </div>
              <Progress value={progressPercentage} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {result && (
        <>
          {/* Performance Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-balance">Expected Performance</CardTitle>
              <CardDescription className="text-pretty">
                Estimated accuracy range based on cross-validation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">Mean Validation Accuracy</p>
                  <p className="text-3xl font-semibold">{(result.meanValAccuracy * 100).toFixed(2)}%</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    ± {(result.stdValAccuracy * 100).toFixed(2)}%
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">Accuracy Range</p>
                  <p className="text-xl font-semibold">
                    {(result.accuracyRange.min * 100).toFixed(1)}% - {(result.accuracyRange.max * 100).toFixed(1)}%
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Across all folds
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">Overfitting Risk</p>
                  <div className="mt-2">
                    {getRiskBadge(result.overfittingRisk)}
                  </div>
                  <p className={`text-xs mt-1 ${getRiskColor(result.overfittingRisk)}`}>
                    Gap: {((result.meanTrainAccuracy - result.meanValAccuracy) * 100).toFixed(2)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Fold Comparison */}
          <Card>
            <CardHeader>
              <CardTitle className="text-balance">Performance Across Folds</CardTitle>
              <CardDescription className="text-pretty">
                Consistency check across different data splits
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="w-full min-w-0 overflow-hidden">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={result.folds.map(fold => ({
                      fold: `Fold ${fold.fold}`,
                      'Training': (fold.trainAccuracy * 100).toFixed(1),
                      'Validation': (fold.valAccuracy * 100).toFixed(1),
                    }))}
                    margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="fold" 
                      stroke="hsl(var(--muted-foreground))"
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))"
                      tick={{ fontSize: 12 }}
                      label={{ value: 'Accuracy (%)', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '6px'
                      }}
                    />
                    <Legend 
                      wrapperStyle={{ paddingTop: 8 }}
                    />
                    <Bar dataKey="Training" fill="hsl(var(--chart-1))" />
                    <Bar dataKey="Validation" fill="hsl(var(--chart-3))" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="text-sm text-muted-foreground text-center mt-4">
                Consistent performance across folds indicates good generalization
              </p>
            </CardContent>
          </Card>

          {/* Overfitting Indicators */}
          <Card>
            <CardHeader>
              <CardTitle className="text-balance flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Overfitting Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {result.overfittingIndicators.map((indicator, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    {result.overfittingRisk === 'low' ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className={`h-4 w-4 shrink-0 mt-0.5 ${getRiskColor(result.overfittingRisk)}`} />
                    )}
                    <span>{indicator}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle className="text-balance flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {result.recommendations.map((recommendation, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>{recommendation}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </>
      )}

      {/* Split Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-balance">Train-Test Split Recommendations</CardTitle>
          <CardDescription className="text-pretty">
            Optimal data split ratios for your dataset size ({datasetSize} samples)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {splitRecommendations.map((rec, index) => (
              <div
                key={index}
                className={`p-4 border rounded-lg ${rec.recommended ? 'border-primary bg-primary/5' : ''}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold flex items-center gap-2">
                      {rec.description}
                      {rec.recommended && (
                        <Badge className="bg-green-500">Recommended</Badge>
                      )}
                    </h3>
                  </div>
                  {onRecommendationApply && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onRecommendationApply(rec.ratio)}
                    >
                      Apply
                    </Button>
                  )}
                </div>

                <div className="grid md:grid-cols-2 gap-3 mt-3">
                  <div>
                    <p className="text-xs font-medium text-green-600 mb-1">Pros:</p>
                    <ul className="space-y-1">
                      {rec.pros.map((pro, i) => (
                        <li key={i} className="text-xs text-muted-foreground">• {pro}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-red-600 mb-1">Cons:</p>
                    <ul className="space-y-1">
                      {rec.cons.map((con, i) => (
                        <li key={i} className="text-xs text-muted-foreground">• {con}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
