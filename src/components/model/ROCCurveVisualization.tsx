import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { rocCurveService } from '@/services/rocCurveService';
import type { ModelROC } from '@/services/rocCurveService';
import { 
  TrendingUp, 
  Target,
  Info,
  Lightbulb,
  CheckCircle2,
  AlertTriangle,
  BarChart3
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
  ScatterChart,
  Scatter,
  ReferenceLine
} from 'recharts';

export function ROCCurveVisualization() {
  const [threshold, setThreshold] = useState(0.5);
  const [modelQuality, setModelQuality] = useState<'poor' | 'fair' | 'good' | 'excellent'>('good');
  const [comparisonMode, setComparisonMode] = useState(false);
  const [selectedCriterion, setSelectedCriterion] = useState<'f1' | 'youden' | 'cost'>('f1');

  // Generate sample data
  const { predictions, labels } = useMemo(() => {
    return rocCurveService.generateSamplePredictions(200, modelQuality);
  }, [modelQuality]);

  // Calculate ROC curve
  const rocCurve = useMemo(() => {
    return rocCurveService.calculateROCCurve(predictions, labels);
  }, [predictions, labels]);

  // Calculate Precision-Recall curve
  const prCurve = useMemo(() => {
    return rocCurveService.calculatePrecisionRecallCurve(predictions, labels);
  }, [predictions, labels]);

  // Get current point on ROC curve
  const currentPoint = useMemo(() => {
    return rocCurve.points.find(p => Math.abs(p.threshold - threshold) < 0.01) || rocCurve.points[50];
  }, [rocCurve, threshold]);

  // Get optimal threshold
  const optimalThreshold = useMemo(() => {
    return rocCurveService.findOptimalThreshold(rocCurve, selectedCriterion);
  }, [rocCurve, selectedCriterion]);

  // AUC interpretation
  const aucInterpretation = rocCurveService.interpretAUC(rocCurve.auc);

  // Generate comparison models
  const comparisonModels = useMemo((): ModelROC[] => {
    const qualities: Array<'poor' | 'fair' | 'good' | 'excellent'> = ['poor', 'fair', 'good', 'excellent'];
    return qualities.map((quality, index) => {
      const { predictions: preds, labels: lbls } = rocCurveService.generateSamplePredictions(200, quality);
      const curve = rocCurveService.calculateROCCurve(preds, lbls);
      const colors = ['hsl(var(--destructive))', 'hsl(45, 93%, 47%)', 'hsl(142, 76%, 36%)', 'hsl(221, 83%, 53%)'];
      return {
        modelName: `Model ${quality.charAt(0).toUpperCase() + quality.slice(1)}`,
        curve,
        color: colors[index],
      };
    });
  }, []);

  const modelComparison = useMemo(() => {
    return rocCurveService.compareModels(comparisonModels);
  }, [comparisonModels]);

  const explanations = rocCurveService.getExplanations();
  const bestPractices = rocCurveService.getBestPractices();

  const handleApplyOptimal = () => {
    setThreshold(optimalThreshold.threshold);
    toast.success(`Applied optimal threshold: ${optimalThreshold.threshold.toFixed(2)}`);
  };

  const handleResetThreshold = () => {
    setThreshold(0.5);
    toast.success('Reset threshold to 0.5');
  };

  // Prepare ROC curve data
  const rocData = rocCurve.points.map(p => ({
    fpr: p.fpr,
    tpr: p.tpr,
    threshold: p.threshold,
  }));

  // Prepare PR curve data
  const prData = prCurve.points.map(p => ({
    recall: p.recall,
    precision: p.precision,
    threshold: p.threshold,
  }));

  // Prepare comparison data
  const comparisonData = rocCurve.points.map((p, index) => {
    const result: any = {
      fpr: p.fpr,
      tpr: p.tpr,
    };
    comparisonModels.forEach(model => {
      result[model.modelName] = model.curve.points[index]?.tpr || 0;
    });
    return result;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="text-balance flex items-center gap-2">
            <TrendingUp className="h-6 w-6" />
            ROC Curve Visualization
          </CardTitle>
          <CardDescription className="text-pretty">
            Evaluate classification model performance and optimize decision threshold
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleResetThreshold} variant="outline" size="sm">
              Reset Threshold
            </Button>
            <Button onClick={handleApplyOptimal} variant="outline" size="sm">
              <Target className="h-4 w-4 mr-2" />
              Apply Optimal
            </Button>
            <Button 
              onClick={() => setComparisonMode(!comparisonMode)} 
              variant="outline" 
              size="sm"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              {comparisonMode ? 'Hide' : 'Show'} Comparison
            </Button>
            <Badge variant="default" className={aucInterpretation.color}>
              AUC: {rocCurve.auc.toFixed(3)} ({aucInterpretation.rating})
            </Badge>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Threshold Control */}
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="text-balance">Threshold Selection</CardTitle>
            <CardDescription className="text-pretty">
              Adjust threshold to balance precision and recall
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Threshold Slider */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">Classification Threshold</span>
                <span className="text-sm font-mono">{threshold.toFixed(2)}</span>
              </div>
              <Slider
                value={[threshold]}
                onValueChange={(value) => setThreshold(value[0])}
                min={0}
                max={1}
                step={0.01}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Predictions ≥ threshold are classified as positive
              </p>
            </div>

            {/* Model Quality Selector */}
            <div className="space-y-3">
              <span className="font-medium text-sm">Model Quality (Demo)</span>
              <div className="grid grid-cols-2 gap-2">
                {(['poor', 'fair', 'good', 'excellent'] as const).map((quality) => (
                  <Button
                    key={quality}
                    variant={modelQuality === quality ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setModelQuality(quality)}
                  >
                    {quality.charAt(0).toUpperCase() + quality.slice(1)}
                  </Button>
                ))}
              </div>
            </div>

            {/* Current Metrics */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm">Current Performance</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 border rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">True Positive Rate</p>
                  <p className="text-lg font-bold">{(currentPoint.tpr * 100).toFixed(1)}%</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">False Positive Rate</p>
                  <p className="text-lg font-bold">{(currentPoint.fpr * 100).toFixed(1)}%</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Precision</p>
                  <p className="text-lg font-bold">{(currentPoint.precision * 100).toFixed(1)}%</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Recall</p>
                  <p className="text-lg font-bold">{(currentPoint.recall * 100).toFixed(1)}%</p>
                </div>
              </div>
              <div className="p-3 border rounded-lg">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">F1 Score</p>
                  <p className="text-xl font-bold text-primary">
                    {(currentPoint.f1Score * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Confusion Matrix */}
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="text-balance">Confusion Matrix</CardTitle>
            <CardDescription className="text-pretty">
              Classification results at current threshold
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg bg-green-50 dark:bg-green-950">
                <p className="text-xs text-muted-foreground mb-1">True Positives</p>
                <p className="text-3xl font-bold text-green-600">{currentPoint.truePositives}</p>
                <p className="text-xs text-muted-foreground mt-1">Correctly identified positives</p>
              </div>
              <div className="p-4 border rounded-lg bg-red-50 dark:bg-red-950">
                <p className="text-xs text-muted-foreground mb-1">False Positives</p>
                <p className="text-3xl font-bold text-red-600">{currentPoint.falsePositives}</p>
                <p className="text-xs text-muted-foreground mt-1">Incorrectly identified as positive</p>
              </div>
              <div className="p-4 border rounded-lg bg-red-50 dark:bg-red-950">
                <p className="text-xs text-muted-foreground mb-1">False Negatives</p>
                <p className="text-3xl font-bold text-red-600">{currentPoint.falseNegatives}</p>
                <p className="text-xs text-muted-foreground mt-1">Missed positives</p>
              </div>
              <div className="p-4 border rounded-lg bg-green-50 dark:bg-green-950">
                <p className="text-xs text-muted-foreground mb-1">True Negatives</p>
                <p className="text-3xl font-bold text-green-600">{currentPoint.trueNegatives}</p>
                <p className="text-xs text-muted-foreground mt-1">Correctly identified negatives</p>
              </div>
            </div>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription className="text-xs">
                <strong>Tip:</strong> Adjust threshold to balance false positives and false negatives based on your use case.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>

      {/* ROC Curve Plot */}
      <Card>
        <CardHeader>
          <CardTitle className="text-balance">ROC Curve</CardTitle>
          <CardDescription className="text-pretty">
            True Positive Rate vs False Positive Rate at different thresholds
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="roc">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="roc">ROC Curve</TabsTrigger>
              <TabsTrigger value="pr">Precision-Recall Curve</TabsTrigger>
            </TabsList>

            {/* ROC Curve */}
            <TabsContent value="roc" className="space-y-4">
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={rocData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="fpr" 
                      label={{ value: 'False Positive Rate', position: 'insideBottom', offset: -5 }}
                      domain={[0, 1]}
                    />
                    <YAxis 
                      label={{ value: 'True Positive Rate', angle: -90, position: 'insideLeft' }}
                      domain={[0, 1]}
                    />
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-background border rounded-lg p-3 shadow-lg">
                              <p className="text-sm font-semibold mb-1">Threshold: {data.threshold.toFixed(2)}</p>
                              <p className="text-xs">TPR: {(data.tpr * 100).toFixed(1)}%</p>
                              <p className="text-xs">FPR: {(data.fpr * 100).toFixed(1)}%</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <ReferenceLine 
                      segment={[{ x: 0, y: 0 }, { x: 1, y: 1 }]} 
                      stroke="hsl(var(--muted-foreground))" 
                      strokeDasharray="5 5"
                      label="Random"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="tpr" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={3}
                      dot={false}
                    />
                    <Scatter
                      data={[{ fpr: currentPoint.fpr, tpr: currentPoint.tpr }]}
                      fill="hsl(var(--destructive))"
                      shape="circle"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">AUC Score</p>
                  <p className="text-2xl font-bold">{rocCurve.auc.toFixed(3)}</p>
                  <p className="text-xs text-muted-foreground mt-1">{aucInterpretation.description}</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Current Threshold</p>
                  <p className="text-2xl font-bold">{threshold.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground mt-1">Red dot on curve</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Optimal Threshold</p>
                  <p className="text-2xl font-bold">{optimalThreshold.threshold.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground mt-1">Maximizes F1 score</p>
                </div>
              </div>
            </TabsContent>

            {/* Precision-Recall Curve */}
            <TabsContent value="pr" className="space-y-4">
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={prData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="recall" 
                      label={{ value: 'Recall', position: 'insideBottom', offset: -5 }}
                      domain={[0, 1]}
                    />
                    <YAxis 
                      label={{ value: 'Precision', angle: -90, position: 'insideLeft' }}
                      domain={[0, 1]}
                    />
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-background border rounded-lg p-3 shadow-lg">
                              <p className="text-sm font-semibold mb-1">Threshold: {data.threshold.toFixed(2)}</p>
                              <p className="text-xs">Precision: {(data.precision * 100).toFixed(1)}%</p>
                              <p className="text-xs">Recall: {(data.recall * 100).toFixed(1)}%</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="precision" 
                      stroke="hsl(142, 76%, 36%)" 
                      strokeWidth={3}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Precision-Recall curves</strong> are better for imbalanced datasets where the positive class is rare. 
                  Average Precision: {(prCurve.averagePrecision * 100).toFixed(1)}%
                </AlertDescription>
              </Alert>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Optimal Threshold Finder */}
      <Card>
        <CardHeader>
          <CardTitle className="text-balance">Optimal Threshold Finder</CardTitle>
          <CardDescription className="text-pretty">
            Find the best threshold based on different criteria
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            {(['f1', 'youden', 'cost'] as const).map((criterion) => {
              const optimal = rocCurveService.findOptimalThreshold(rocCurve, criterion);
              return (
                <Button
                  key={criterion}
                  variant={selectedCriterion === criterion ? 'default' : 'outline'}
                  className="h-auto flex-col items-start p-4 text-left"
                  onClick={() => {
                    setSelectedCriterion(criterion);
                    setThreshold(optimal.threshold);
                  }}
                >
                  <span className="font-semibold mb-1">
                    {criterion === 'f1' && 'Maximize F1 Score'}
                    {criterion === 'youden' && "Youden's J Statistic"}
                    {criterion === 'cost' && 'Minimize Cost'}
                  </span>
                  <span className="text-xs text-muted-foreground mb-2">
                    Threshold: {optimal.threshold.toFixed(2)}
                  </span>
                  <span className="text-xs">{optimal.reasoning}</span>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Model Comparison */}
      {comparisonMode && (
        <Card>
          <CardHeader>
            <CardTitle className="text-balance">Model Comparison</CardTitle>
            <CardDescription className="text-pretty">
              Compare ROC curves of different models
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={comparisonData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="fpr" 
                    label={{ value: 'False Positive Rate', position: 'insideBottom', offset: -5 }}
                    domain={[0, 1]}
                  />
                  <YAxis 
                    label={{ value: 'True Positive Rate', angle: -90, position: 'insideLeft' }}
                    domain={[0, 1]}
                  />
                  <Tooltip />
                  <Legend />
                  <ReferenceLine 
                    segment={[{ x: 0, y: 0 }, { x: 1, y: 1 }]} 
                    stroke="hsl(var(--muted-foreground))" 
                    strokeDasharray="5 5"
                  />
                  {comparisonModels.map((model) => (
                    <Line 
                      key={model.modelName}
                      type="monotone" 
                      dataKey={model.modelName}
                      stroke={model.color}
                      strokeWidth={2}
                      dot={false}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold">Model Ranking</h4>
              {modelComparison.ranking.map((model) => (
                <div key={model.modelName} className="p-3 border rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant={model.rank === 1 ? 'default' : 'outline'}>
                      #{model.rank}
                    </Badge>
                    <span className="font-medium">{model.modelName}</span>
                  </div>
                  <span className="font-mono">AUC: {model.auc.toFixed(3)}</span>
                </div>
              ))}
            </div>

            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                {modelComparison.recommendation}
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* Educational Content */}
      <Card>
        <CardHeader>
          <CardTitle className="text-balance">Understanding ROC Curves</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">ROC Curve</h4>
              <p className="text-sm text-muted-foreground">{explanations.roc}</p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">AUC (Area Under Curve)</h4>
              <p className="text-sm text-muted-foreground">{explanations.auc}</p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">True Positive Rate (TPR)</h4>
              <p className="text-sm text-muted-foreground">{explanations.tpr}</p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">False Positive Rate (FPR)</h4>
              <p className="text-sm text-muted-foreground">{explanations.fpr}</p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">Precision</h4>
              <p className="text-sm text-muted-foreground">{explanations.precision}</p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">F1 Score</h4>
              <p className="text-sm text-muted-foreground">{explanations.f1Score}</p>
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
