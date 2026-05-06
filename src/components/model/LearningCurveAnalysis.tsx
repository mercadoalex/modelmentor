import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { learningCurveService } from '@/services/learningCurveService';
import type { LearningCurveAnalysis as LearningCurveData } from '@/services/learningCurveService';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { TrendingUp, AlertTriangle, CheckCircle2, Info, Play, Database, Target } from 'lucide-react';
import { toast } from 'sonner';

interface LearningCurveAnalysisProps {
  totalSamples: number;
  features: number;
}

export function LearningCurveAnalysis({ totalSamples, features }: LearningCurveAnalysisProps) {
  const [analysis, setAnalysis] = useState<LearningCurveData | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setProgress(0);

    try {
      // Simulate analysis progress
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 95) {
            clearInterval(progressInterval);
            return 95;
          }
          return prev + 5;
        });
      }, 200);

      // Simulate delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      const result = learningCurveService.generateLearningCurve(totalSamples, features);
      setAnalysis(result);
      setProgress(100);
      clearInterval(progressInterval);

      toast.success('Learning curve analysis completed!');
    } catch (error) {
      console.error('Analysis failed:', error);
      toast.error('Analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const explanations = learningCurveService.getExplanation();

  const getPatternBadge = (pattern: string) => {
    switch (pattern) {
      case 'overfitting':
        return <Badge className="bg-red-500">Overfitting</Badge>;
      case 'underfitting':
        return <Badge className="bg-yellow-500">Underfitting</Badge>;
      case 'high_variance':
        return <Badge className="bg-orange-500">High Variance</Badge>;
      case 'good_fit':
        return <Badge className="bg-green-500">Good Fit</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getPatternIcon = (pattern: string) => {
    switch (pattern) {
      case 'overfitting':
      case 'underfitting':
      case 'high_variance':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'good_fit':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      default:
        return <Info className="h-5 w-5" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="text-balance flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Learning Curve Analysis
          </CardTitle>
          <CardDescription className="text-pretty">
            Understand how your model's performance changes with different amounts of training data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Learning curves help you determine if you need more data, if your model is overfitting,
              or if you should adjust model complexity. This analysis trains your model with different
              data sizes to reveal these patterns.
            </AlertDescription>
          </Alert>

          {!isAnalyzing && !analysis && (
            <Button onClick={handleAnalyze} className="w-full mt-4" size="lg">
              <Play className="h-5 w-5 mr-2" />
              Run Learning Curve Analysis
            </Button>
          )}

          {isAnalyzing && (
            <div className="mt-4 space-y-2">
              <p className="text-sm text-muted-foreground">
                Training with different data sizes...
              </p>
              <Progress value={progress} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* What are Learning Curves */}
      {!analysis && (
        <Card>
          <CardHeader>
            <CardTitle className="text-balance">What are Learning Curves?</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {explanations.map((explanation, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <span>{explanation}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Analysis Results */}
      {analysis && (
        <>
          {/* Pattern Detection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-balance flex items-center gap-2">
                {getPatternIcon(analysis.pattern)}
                Detected Pattern
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Your Model Shows</p>
                  <p className="text-2xl font-bold">{getPatternBadge(analysis.pattern)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Train-Val Gap</p>
                  <p className="text-2xl font-bold">{(analysis.gap * 100).toFixed(1)}%</p>
                </div>
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  {learningCurveService.getPatternExplanation(analysis.pattern)}
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Learning Curve Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-balance">Learning Curves</CardTitle>
              <CardDescription className="text-pretty">
                Training vs validation performance across different data sizes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="w-full min-w-0 overflow-hidden">
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart
                    data={analysis.points.map(p => ({
                      dataSize: p.dataSize,
                      'Training Score': (p.trainScore * 100).toFixed(1),
                      'Validation Score': (p.valScore * 100).toFixed(1),
                    }))}
                    margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="dataSize"
                      stroke="hsl(var(--muted-foreground))"
                      tick={{ fontSize: 12 }}
                      label={{ value: 'Training Samples', position: 'insideBottom', offset: -5, style: { fontSize: 12 } }}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))"
                      tick={{ fontSize: 12 }}
                      label={{ value: 'Accuracy (%)', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
                      domain={[40, 100]}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '6px'
                      }}
                      formatter={(value: number) => [`${value}%`, '']}
                    />
                    <Legend 
                      wrapperStyle={{ paddingTop: 8 }}
                      iconType="line"
                    />
                    <Line
                      type="monotone"
                      dataKey="Training Score"
                      stroke="hsl(var(--chart-1))"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="Validation Score"
                      stroke="hsl(var(--chart-2))"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-4 grid md:grid-cols-2 gap-4">
                <div className="p-3 border rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: 'hsl(var(--chart-1))' }} />
                    <span className="text-sm font-medium">Training Score</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Performance on data the model has seen during training
                  </p>
                </div>
                <div className="p-3 border rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: 'hsl(var(--chart-2))' }} />
                    <span className="text-sm font-medium">Validation Score</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Performance on unseen data (the true test of generalization)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Key Insights */}
          <Card>
            <CardHeader>
              <CardTitle className="text-balance">Key Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {analysis.insights.map((insight, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <Badge variant="secondary">{index + 1}</Badge>
                    <span>{insight}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Recommendation */}
          <Card>
            <CardHeader>
              <CardTitle className="text-balance flex items-center gap-2">
                <Target className="h-5 w-5" />
                Recommendation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                {analysis.needMoreData ? (
                  <Database className="h-4 w-4 text-blue-500" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                )}
                <AlertDescription>
                  <strong>
                    {analysis.needMoreData ? 'More Data Recommended' : 'Sufficient Data'}
                  </strong>
                  <p className="mt-1">{analysis.recommendation}</p>
                </AlertDescription>
              </Alert>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Database className="h-5 w-5 text-blue-500" />
                    <span className="font-semibold">Data Collection</span>
                  </div>
                  {analysis.needMoreData ? (
                    <div className="space-y-1 text-sm">
                      <p className="text-green-600">✓ Collecting more data will help</p>
                      <p className="text-muted-foreground">
                        Your validation score is still improving with more data
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1 text-sm">
                      <p className="text-muted-foreground">✗ More data unlikely to help</p>
                      <p className="text-muted-foreground">
                        Performance has plateaued; focus on model improvements
                      </p>
                    </div>
                  )}
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                    <span className="font-semibold">Convergence</span>
                  </div>
                  <div className="space-y-1 text-sm">
                    <p className="font-semibold">
                      {(analysis.convergence * 100).toFixed(1)}% improvement
                    </p>
                    <p className="text-muted-foreground">
                      Validation score change from small to large datasets
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Next Steps */}
          <Card>
            <CardHeader>
              <CardTitle className="text-balance">Next Steps</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analysis.pattern === 'overfitting' && (
                  <>
                    <div className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <span>Collect more training data if possible</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <span>Add regularization (L1/L2) to reduce overfitting</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <span>Reduce model complexity (fewer layers/neurons)</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <span>Use data augmentation to artificially increase dataset size</span>
                    </div>
                  </>
                )}

                {analysis.pattern === 'underfitting' && (
                  <>
                    <div className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <span>Increase model complexity (more layers/neurons)</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <span>Train for more epochs to allow model to learn</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <span>Engineer better features that capture patterns</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <span>Try a different model architecture</span>
                    </div>
                  </>
                )}

                {analysis.pattern === 'high_variance' && (
                  <>
                    <div className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <span>Use cross-validation for more stable estimates</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <span>Collect more data to reduce variance</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <span>Try ensemble methods to stabilize predictions</span>
                    </div>
                  </>
                )}

                {analysis.pattern === 'good_fit' && (
                  <>
                    <div className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <span>Your model is performing well! Consider deploying it</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <span>Monitor performance on new data over time</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <span>Fine-tune hyperparameters for marginal improvements</span>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
