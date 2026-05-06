import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { regularizationService } from '@/services/regularizationService';
import type { RegularizationParams } from '@/services/regularizationService';
import { 
  Sliders, 
  TrendingDown, 
  AlertTriangle,
  Info,
  Lightbulb,
  CheckCircle2,
  Target,
  Activity
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend,
  Area,
  AreaChart
} from 'recharts';

export function RegularizationTuner() {
  const [params, setParams] = useState<RegularizationParams>({
    l1Strength: 0,
    l2Strength: 0.1,
    dropoutRate: 0.2,
  });

  const [comparisonMode, setComparisonMode] = useState(false);
  const [savedParams, setSavedParams] = useState<RegularizationParams | null>(null);

  const trainingCurves = useMemo(() => {
    return regularizationService.generateTrainingCurves(params);
  }, [params]);

  const comparisonCurves = useMemo(() => {
    if (!savedParams) return null;
    return regularizationService.generateTrainingCurves(savedParams);
  }, [savedParams]);

  const effect = useMemo(() => {
    return regularizationService.calculateEffect(params);
  }, [params]);

  const overfittingAnalysis = useMemo(() => {
    return regularizationService.analyzeOverfitting(trainingCurves);
  }, [trainingCurves]);

  const biasVariance = useMemo(() => {
    return regularizationService.calculateBiasVariance(params);
  }, [params]);

  const recommendations = useMemo(() => {
    return regularizationService.getRecommendations(params);
  }, [params]);

  const explanations = regularizationService.getExplanations();
  const bestPractices = regularizationService.getBestPractices();

  const handleReset = () => {
    setParams({
      l1Strength: 0,
      l2Strength: 0.1,
      dropoutRate: 0.2,
    });
    toast.success('Reset to default values');
  };

  const handleOptimize = () => {
    const optimal = regularizationService.getOptimalParams();
    setParams(optimal);
    toast.success('Applied optimal regularization settings');
  };

  const handleSaveForComparison = () => {
    setSavedParams({ ...params });
    setComparisonMode(true);
    toast.success('Saved current settings for comparison');
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  // Prepare bias-variance data
  const biasVarianceData = [
    { name: 'Bias', value: biasVariance.bias * 100, color: 'hsl(var(--destructive))' },
    { name: 'Variance', value: biasVariance.variance * 100, color: 'hsl(221, 83%, 53%)' },
    { name: 'Total Error', value: biasVariance.totalError * 100, color: 'hsl(var(--muted-foreground))' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="text-balance flex items-center gap-2">
            <Sliders className="h-6 w-6" />
            Interactive Regularization Tuner
          </CardTitle>
          <CardDescription className="text-pretty">
            Adjust regularization parameters to prevent overfitting and improve model generalization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleReset} variant="outline" size="sm">
              Reset
            </Button>
            <Button onClick={handleOptimize} variant="outline" size="sm">
              <Target className="h-4 w-4 mr-2" />
              Apply Optimal Settings
            </Button>
            <Button onClick={handleSaveForComparison} variant="outline" size="sm">
              Save for Comparison
            </Button>
            {biasVariance.optimal && (
              <Badge variant="default">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Optimal Range
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Regularization Controls */}
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="text-balance">Regularization Parameters</CardTitle>
            <CardDescription className="text-pretty">
              Adjust sliders to see real-time impact on training
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* L1 Regularization */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium text-sm">L1 Regularization (Lasso)</span>
                  <p className="text-xs text-muted-foreground">Feature selection</p>
                </div>
                <span className="text-sm font-mono">{params.l1Strength.toFixed(3)}</span>
              </div>
              <Slider
                value={[params.l1Strength]}
                onValueChange={(value) => setParams({ ...params, l1Strength: value[0] })}
                min={0}
                max={1}
                step={0.001}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                {explanations.l1.description}
              </p>
            </div>

            {/* L2 Regularization */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium text-sm">L2 Regularization (Ridge)</span>
                  <p className="text-xs text-muted-foreground">Weight shrinkage</p>
                </div>
                <span className="text-sm font-mono">{params.l2Strength.toFixed(3)}</span>
              </div>
              <Slider
                value={[params.l2Strength]}
                onValueChange={(value) => setParams({ ...params, l2Strength: value[0] })}
                min={0}
                max={1}
                step={0.001}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                {explanations.l2.description}
              </p>
            </div>

            {/* Dropout */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium text-sm">Dropout Rate</span>
                  <p className="text-xs text-muted-foreground">Neural network regularization</p>
                </div>
                <span className="text-sm font-mono">{(params.dropoutRate * 100).toFixed(1)}%</span>
              </div>
              <Slider
                value={[params.dropoutRate]}
                onValueChange={(value) => setParams({ ...params, dropoutRate: value[0] })}
                min={0}
                max={0.5}
                step={0.01}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                {explanations.dropout.description}
              </p>
            </div>

            {/* Effect Summary */}
            <div className="p-4 border rounded-lg space-y-2">
              <h4 className="font-semibold text-sm">Regularization Effect</h4>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span>Bias Change:</span>
                  <span className={effect.biasChange > 0 ? 'text-red-600' : 'text-green-600'}>
                    {effect.biasChange > 0 ? '+' : ''}{(effect.biasChange * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Variance Change:</span>
                  <span className={effect.varianceChange < 0 ? 'text-green-600' : 'text-red-600'}>
                    {(effect.varianceChange * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Overfitting Reduction:</span>
                  <span className="text-green-600">
                    {(effect.overfittingReduction * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Performance Impact:</span>
                  <span className={effect.performanceImpact > 0 ? 'text-green-600' : 'text-red-600'}>
                    {effect.performanceImpact > 0 ? '+' : ''}{(effect.performanceImpact * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Overfitting Analysis */}
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="text-balance">Overfitting Analysis</CardTitle>
            <CardDescription className="text-pretty">
              Monitor training vs validation performance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Overfitting Status */}
            <Alert variant={overfittingAnalysis.isOverfitting ? 'destructive' : 'default'}>
              {overfittingAnalysis.isOverfitting ? (
                <AlertTriangle className="h-4 w-4" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              <AlertDescription>
                {overfittingAnalysis.recommendation}
              </AlertDescription>
            </Alert>

            {/* Overfitting Score */}
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Overfitting Score</span>
                <span className={`text-2xl font-bold ${
                  overfittingAnalysis.overfittingScore > 0.7 ? 'text-red-600' :
                  overfittingAnalysis.overfittingScore > 0.3 ? 'text-yellow-600' :
                  'text-green-600'
                }`}>
                  {(overfittingAnalysis.overfittingScore * 100).toFixed(0)}%
                </span>
              </div>
              <div className="text-xs text-muted-foreground">
                {overfittingAnalysis.overfittingStartEpoch && (
                  <span>Overfitting detected at epoch {overfittingAnalysis.overfittingStartEpoch}</span>
                )}
              </div>
            </div>

            {/* Bias-Variance Tradeoff */}
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Bias-Variance Tradeoff</h4>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span>Bias</span>
                    <span>{(biasVariance.bias * 100).toFixed(1)}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-destructive"
                      style={{ width: `${biasVariance.bias * 100}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span>Variance</span>
                    <span>{(biasVariance.variance * 100).toFixed(1)}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500"
                      style={{ width: `${biasVariance.variance * 100}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span>Total Error</span>
                    <span>{(biasVariance.totalError * 100).toFixed(1)}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-muted-foreground"
                      style={{ width: `${biasVariance.totalError * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription className="text-xs">
                <strong>Goal:</strong> Minimize total error by balancing bias and variance. 
                Regularization increases bias slightly but reduces variance significantly.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>

      {/* Training Curves Visualization */}
      <Card>
        <CardHeader>
          <CardTitle className="text-balance">Training Curves</CardTitle>
          <CardDescription className="text-pretty">
            Real-time visualization of training and validation performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="loss">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="loss">Loss Curves</TabsTrigger>
              <TabsTrigger value="accuracy">Accuracy Curves</TabsTrigger>
            </TabsList>

            {/* Loss Curves */}
            <TabsContent value="loss" className="space-y-4">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trainingCurves}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="epoch" 
                      label={{ value: 'Epoch', position: 'insideBottom', offset: -5 }}
                    />
                    <YAxis 
                      label={{ value: 'Loss', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="trainLoss" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      name="Training Loss"
                      dot={false}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="valLoss" 
                      stroke="hsl(var(--destructive))" 
                      strokeWidth={2}
                      name="Validation Loss"
                      dot={false}
                    />
                    {comparisonMode && comparisonCurves && (
                      <>
                        <Line 
                          type="monotone" 
                          dataKey="valLoss" 
                          data={comparisonCurves}
                          stroke="hsl(var(--muted-foreground))" 
                          strokeWidth={2}
                          strokeDasharray="5 5"
                          name="Previous Validation"
                          dot={false}
                        />
                      </>
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <Alert>
                <Activity className="h-4 w-4" />
                <AlertDescription>
                  <strong>Watch for:</strong> If validation loss increases while training loss decreases, 
                  you're overfitting. Increase regularization to close the gap.
                </AlertDescription>
              </Alert>
            </TabsContent>

            {/* Accuracy Curves */}
            <TabsContent value="accuracy" className="space-y-4">
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trainingCurves}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="epoch" 
                      label={{ value: 'Epoch', position: 'insideBottom', offset: -5 }}
                    />
                    <YAxis 
                      domain={[0, 1]}
                      label={{ value: 'Accuracy', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="trainAccuracy" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      name="Training Accuracy"
                      dot={false}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="valAccuracy" 
                      stroke="hsl(142, 76%, 36%)" 
                      strokeWidth={2}
                      name="Validation Accuracy"
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <Alert>
                <TrendingDown className="h-4 w-4" />
                <AlertDescription>
                  <strong>Goal:</strong> Keep training and validation accuracy close together. 
                  Large gaps indicate overfitting.
                </AlertDescription>
              </Alert>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-balance">Recommendations</CardTitle>
          <CardDescription className="text-pretty">
            Suggestions to improve your regularization settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recommendations.length > 0 ? (
            <div className="space-y-3">
              {recommendations.map((rec, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <span className="font-medium text-sm">{rec.message}</span>
                    <Badge variant={getPriorityColor(rec.priority) as any}>
                      {rec.priority}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Type: {rec.type.toUpperCase()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                Your regularization settings look good! Monitor training curves to ensure they stay optimal.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Explanations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-balance">Understanding Regularization</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">{explanations.l1.name}</h4>
              <p className="text-sm text-muted-foreground mb-2">{explanations.l1.description}</p>
              <p className="text-xs text-muted-foreground">
                <strong>When to use:</strong> {explanations.l1.whenToUse}
              </p>
              <p className="text-xs text-muted-foreground">
                <strong>Effect:</strong> {explanations.l1.effect}
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">{explanations.l2.name}</h4>
              <p className="text-sm text-muted-foreground mb-2">{explanations.l2.description}</p>
              <p className="text-xs text-muted-foreground">
                <strong>When to use:</strong> {explanations.l2.whenToUse}
              </p>
              <p className="text-xs text-muted-foreground">
                <strong>Effect:</strong> {explanations.l2.effect}
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">{explanations.dropout.name}</h4>
              <p className="text-sm text-muted-foreground mb-2">{explanations.dropout.description}</p>
              <p className="text-xs text-muted-foreground">
                <strong>When to use:</strong> {explanations.dropout.whenToUse}
              </p>
              <p className="text-xs text-muted-foreground">
                <strong>Effect:</strong> {explanations.dropout.effect}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Best Practices */}
      <Card>
        <CardHeader>
          <CardTitle className="text-balance flex items-center gap-2">
            <Lightbulb className="h-5 w-5" />
            Best Practices
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {bestPractices.map((practice, index) => (
              <li key={index} className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span>{practice}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
