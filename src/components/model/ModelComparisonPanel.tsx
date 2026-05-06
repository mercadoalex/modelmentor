import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { modelComparisonService } from '@/services/modelComparisonService';
import type { ModelResult, ComparisonResult, ProblemType } from '@/services/modelComparisonService';
import { Trophy, Clock, TrendingUp, Brain, GitBranch, Network, Activity, CheckCircle2, Info } from 'lucide-react';
import { toast } from 'sonner';

interface ModelComparisonPanelProps {
  featureCount: number;
  sampleCount: number;
  problemType: ProblemType;
}

export function ModelComparisonPanel({ featureCount, sampleCount, problemType }: ModelComparisonPanelProps) {
  const [comparisonResult, setComparisonResult] = useState<ComparisonResult | null>(null);
  const [isTraining, setIsTraining] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState(0);

  const handleCompareModels = async () => {
    setIsTraining(true);
    setTrainingProgress(0);

    try {
      // Simulate training progress
      const progressInterval = setInterval(() => {
        setTrainingProgress(prev => {
          if (prev >= 95) {
            clearInterval(progressInterval);
            return 95;
          }
          return prev + 5;
        });
      }, 200);

      // Simulate training delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      const result = modelComparisonService.compareModels(featureCount, sampleCount, problemType);
      setComparisonResult(result);
      setTrainingProgress(100);
      clearInterval(progressInterval);

      toast.success('Model comparison completed!');
    } catch (error) {
      console.error('Failed to compare models:', error);
      toast.error('Failed to compare models');
    } finally {
      setTimeout(() => setIsTraining(false), 500);
    }
  };

  const getModelIcon = (modelType: string) => {
    switch (modelType) {
      case 'linear_regression':
        return <TrendingUp className="h-5 w-5" />;
      case 'decision_tree':
        return <GitBranch className="h-5 w-5" />;
      case 'random_forest':
        return <Activity className="h-5 w-5" />;
      case 'neural_network':
        return <Network className="h-5 w-5" />;
      default:
        return <Brain className="h-5 w-5" />;
    }
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'low':
        return 'bg-green-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'high':
        return 'bg-orange-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getPrimaryMetric = (model: ModelResult) => {
    if (problemType === 'classification') {
      return {
        name: 'Accuracy',
        value: ((model.metrics.accuracy || 0) * 100).toFixed(1) + '%',
        score: (model.metrics.accuracy || 0) * 100,
      };
    } else {
      return {
        name: 'R² Score',
        value: ((model.metrics.r2Score || 0) * 100).toFixed(1) + '%',
        score: (model.metrics.r2Score || 0) * 100,
      };
    }
  };

  const isRecommended = (modelType: string) => {
    return comparisonResult?.recommendation.bestModel === modelType;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="text-balance flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Model Comparison Tool
          </CardTitle>
          <CardDescription className="text-pretty">
            Compare multiple machine learning algorithms to find the best model for your data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Features</p>
              <p className="text-2xl font-semibold">{featureCount}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Samples</p>
              <p className="text-2xl font-semibold">{sampleCount}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Problem Type</p>
              <p className="text-2xl font-semibold capitalize">{problemType}</p>
            </div>
          </div>

          <Button
            onClick={handleCompareModels}
            disabled={isTraining}
            className="w-full"
            size="lg"
          >
            {isTraining ? 'Training Models...' : 'Compare Models'}
          </Button>

          {isTraining && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Training progress</span>
                <span>{trainingProgress}%</span>
              </div>
              <Progress value={trainingProgress} />
            </div>
          )}

          {!comparisonResult && !isTraining && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Click Compare Models to train and evaluate Linear Regression, Decision Tree, Random Forest,
                and Neural Network on your dataset.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Recommendation */}
      {comparisonResult && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="text-balance flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Recommended Model
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary/10 rounded-lg">
                  {getModelIcon(comparisonResult.recommendation.bestModel)}
                </div>
                <div>
                  <p className="font-semibold text-lg">
                    {comparisonResult.models.find(m => m.modelType === comparisonResult.recommendation.bestModel)?.modelName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Best overall performance for your dataset
                  </p>
                </div>
              </div>

              <div className="space-y-2 pt-3 border-t">
                <p className="text-sm font-medium">Why this model:</p>
                <ul className="space-y-1">
                  {comparisonResult.recommendation.reasoning.map((reason, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Model Comparison Cards */}
      {comparisonResult && (
        <div className="grid md:grid-cols-2 gap-4">
          {comparisonResult.models.map((model) => (
            <Card key={model.modelType} className={isRecommended(model.modelType) ? 'border-primary' : ''}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {getModelIcon(model.modelType)}
                    <CardTitle className="text-balance">{model.modelName}</CardTitle>
                  </div>
                  {isRecommended(model.modelType) && (
                    <Badge className="bg-yellow-500">
                      <Trophy className="h-3 w-3 mr-1" />
                      Best
                    </Badge>
                  )}
                </div>
                <CardDescription className="text-pretty">{model.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Primary Metric */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{getPrimaryMetric(model).name}</span>
                    <span className="text-2xl font-bold">{getPrimaryMetric(model).value}</span>
                  </div>
                  <Progress value={getPrimaryMetric(model).score} />
                </div>

                {/* Additional Metrics */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {problemType === 'classification' ? (
                    <>
                      <div>
                        <p className="text-muted-foreground">Precision</p>
                        <p className="font-medium">{((model.metrics.precision || 0) * 100).toFixed(1)}%</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Recall</p>
                        <p className="font-medium">{((model.metrics.recall || 0) * 100).toFixed(1)}%</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">F1 Score</p>
                        <p className="font-medium">{((model.metrics.f1Score || 0) * 100).toFixed(1)}%</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <p className="text-muted-foreground">RMSE</p>
                        <p className="font-medium">{(model.metrics.rmse || 0).toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">MAE</p>
                        <p className="font-medium">{(model.metrics.mae || 0).toFixed(2)}</p>
                      </div>
                    </>
                  )}
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{model.metrics.trainingTime.toFixed(0)}ms</span>
                  </div>
                </div>

                {/* Complexity & Interpretability */}
                <div className="flex items-center gap-4 pt-3 border-t">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Complexity:</span>
                    <Badge variant="outline" className={getComplexityColor(model.complexity)}>
                      {model.complexity}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Interpretability:</span>
                    <Badge variant="outline">
                      {model.interpretability}
                    </Badge>
                  </div>
                </div>

                {/* Pros & Cons */}
                <div className="space-y-2 pt-3 border-t">
                  <div>
                    <p className="text-xs font-medium mb-1">Pros:</p>
                    <ul className="space-y-0.5">
                      {model.pros.slice(0, 2).map((pro, index) => (
                        <li key={index} className="text-xs text-muted-foreground flex items-start gap-1">
                          <span className="text-green-500">+</span>
                          <span>{pro}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs font-medium mb-1">Cons:</p>
                    <ul className="space-y-0.5">
                      {model.cons.slice(0, 2).map((con, index) => (
                        <li key={index} className="text-xs text-muted-foreground flex items-start gap-1">
                          <span className="text-orange-500">-</span>
                          <span>{con}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
