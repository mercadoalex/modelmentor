import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { performanceSimulatorService } from '@/services/performanceSimulatorService';
import type { SimulationParameters } from '@/services/performanceSimulatorService';
import { 
  Activity, 
  TrendingUp, 
  AlertTriangle,
  Info,
  Lightbulb,
  Target,
  Database,
  Scale,
  Zap,
  CheckCircle2
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  Legend
} from 'recharts';

export function PerformanceSimulator() {
  const [params, setParams] = useState<SimulationParameters>({
    dataSize: 2000,
    classImbalance: 0.5,
    noiseLevel: 0.1,
  });

  const metrics = useMemo(() => {
    return performanceSimulatorService.simulatePerformance(params);
  }, [params]);

  const learningCurve = useMemo(() => {
    return performanceSimulatorService.generateLearningCurve(
      params.classImbalance,
      params.noiseLevel
    );
  }, [params.classImbalance, params.noiseLevel]);

  const dataSizeAnalysis = useMemo(() => {
    return performanceSimulatorService.analyzeDataSizeImpact(
      params.dataSize,
      params.classImbalance,
      params.noiseLevel
    );
  }, [params]);

  const imbalanceAnalysis = useMemo(() => {
    return performanceSimulatorService.analyzeClassImbalanceImpact(
      params.dataSize,
      params.classImbalance,
      params.noiseLevel
    );
  }, [params]);

  const noiseAnalysis = useMemo(() => {
    return performanceSimulatorService.analyzeNoiseImpact(
      params.dataSize,
      params.classImbalance,
      params.noiseLevel
    );
  }, [params]);

  const insights = useMemo(() => {
    return performanceSimulatorService.getInsights(params);
  }, [params]);

  const recommendations = useMemo(() => {
    return performanceSimulatorService.getRecommendations(params);
  }, [params]);

  const confusionMatrixData = [
    { 
      name: 'True Positive', 
      value: metrics.truePositives,
      color: 'hsl(var(--primary))',
      label: 'TP'
    },
    { 
      name: 'True Negative', 
      value: metrics.trueNegatives,
      color: 'hsl(var(--primary))',
      label: 'TN'
    },
    { 
      name: 'False Positive', 
      value: metrics.falsePositives,
      color: 'hsl(var(--destructive))',
      label: 'FP'
    },
    { 
      name: 'False Negative', 
      value: metrics.falseNegatives,
      color: 'hsl(var(--destructive))',
      label: 'FN'
    },
  ];

  const metricsData = [
    { name: 'Accuracy', value: metrics.accuracy * 100 },
    { name: 'Precision', value: metrics.precision * 100 },
    { name: 'Recall', value: metrics.recall * 100 },
    { name: 'F1-Score', value: metrics.f1Score * 100 },
  ];

  const classDistribution = [
    { name: 'Class 0', value: params.classImbalance * 100, color: 'hsl(var(--primary))' },
    { name: 'Class 1', value: (1 - params.classImbalance) * 100, color: 'hsl(var(--muted-foreground))' },
  ];

  const handleReset = () => {
    setParams({
      dataSize: 2000,
      classImbalance: 0.5,
      noiseLevel: 0.1,
    });
  };

  const handleOptimize = () => {
    const optimal = performanceSimulatorService.findOptimalParameters();
    setParams(optimal);
  };

  const getMetricColor = (value: number) => {
    if (value > 0.85) return 'text-green-600';
    if (value > 0.7) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="text-balance flex items-center gap-2">
            <Activity className="h-6 w-6" />
            Model Performance Simulator
          </CardTitle>
          <CardDescription className="text-pretty">
            Explore how data size, class balance, and noise affect model performance metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleReset} variant="outline" size="sm">
              Reset to Defaults
            </Button>
            <Button onClick={handleOptimize} variant="outline" size="sm">
              <Target className="h-4 w-4 mr-2" />
              Show Optimal Settings
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Controls */}
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="text-balance">Simulation Parameters</CardTitle>
            <CardDescription className="text-pretty">
              Adjust parameters to see their impact on performance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Data Size */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  <span className="font-medium text-sm">Training Data Size</span>
                </div>
                <span className="text-sm font-mono">{params.dataSize.toLocaleString()}</span>
              </div>
              <Slider
                value={[params.dataSize]}
                onValueChange={(value) => setParams({ ...params, dataSize: value[0] })}
                min={100}
                max={10000}
                step={100}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                More data generally improves performance, but with diminishing returns
              </p>
            </div>

            {/* Class Imbalance */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Scale className="h-4 w-4" />
                  <span className="font-medium text-sm">Class Imbalance</span>
                </div>
                <span className="text-sm font-mono">
                  {(params.classImbalance * 100).toFixed(0)}% / {((1 - params.classImbalance) * 100).toFixed(0)}%
                </span>
              </div>
              <Slider
                value={[params.classImbalance]}
                onValueChange={(value) => setParams({ ...params, classImbalance: value[0] })}
                min={0.5}
                max={0.9}
                step={0.05}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Balanced classes (50/50) are ideal. Imbalance can bias the model
              </p>
            </div>

            {/* Noise Level */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  <span className="font-medium text-sm">Noise Level</span>
                </div>
                <span className="text-sm font-mono">{(params.noiseLevel * 100).toFixed(0)}%</span>
              </div>
              <Slider
                value={[params.noiseLevel]}
                onValueChange={(value) => setParams({ ...params, noiseLevel: value[0] })}
                min={0}
                max={0.5}
                step={0.05}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Noise represents errors, outliers, and mislabeled data
              </p>
            </div>

            {/* Class Distribution */}
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold text-sm mb-3">Class Distribution</h4>
              <div className="h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={classDistribution}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis label={{ value: '%', angle: 0, position: 'insideLeft' }} />
                    <Tooltip />
                    <Bar dataKey="value">
                      {classDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Metrics Display */}
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="text-balance">Performance Metrics</CardTitle>
            <CardDescription className="text-pretty">
              Current model performance under selected conditions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Metric Cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg text-center">
                <p className="text-xs text-muted-foreground mb-1">Accuracy</p>
                <p className={`text-2xl font-bold ${getMetricColor(metrics.accuracy)}`}>
                  {(metrics.accuracy * 100).toFixed(1)}%
                </p>
              </div>
              <div className="p-4 border rounded-lg text-center">
                <p className="text-xs text-muted-foreground mb-1">Precision</p>
                <p className={`text-2xl font-bold ${getMetricColor(metrics.precision)}`}>
                  {(metrics.precision * 100).toFixed(1)}%
                </p>
              </div>
              <div className="p-4 border rounded-lg text-center">
                <p className="text-xs text-muted-foreground mb-1">Recall</p>
                <p className={`text-2xl font-bold ${getMetricColor(metrics.recall)}`}>
                  {(metrics.recall * 100).toFixed(1)}%
                </p>
              </div>
              <div className="p-4 border rounded-lg text-center">
                <p className="text-xs text-muted-foreground mb-1">F1-Score</p>
                <p className={`text-2xl font-bold ${getMetricColor(metrics.f1Score)}`}>
                  {(metrics.f1Score * 100).toFixed(1)}%
                </p>
              </div>
            </div>

            {/* Metrics Comparison */}
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metricsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Insights */}
            {insights.length > 0 && (
              <Alert>
                <Lightbulb className="h-4 w-4" />
                <AlertDescription>
                  <ul className="space-y-1 text-sm">
                    {insights.slice(0, 3).map((insight, index) => (
                      <li key={index}>• {insight}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Visualizations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-balance">Performance Analysis</CardTitle>
          <CardDescription className="text-pretty">
            Detailed analysis of how parameters affect performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="learning">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="learning">Learning Curve</TabsTrigger>
              <TabsTrigger value="confusion">Confusion Matrix</TabsTrigger>
              <TabsTrigger value="impact">Impact Analysis</TabsTrigger>
            </TabsList>

            {/* Learning Curve */}
            <TabsContent value="learning" className="space-y-4">
              <Alert>
                <TrendingUp className="h-4 w-4" />
                <AlertDescription>
                  Shows how metrics improve as training data size increases
                </AlertDescription>
              </Alert>

              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={learningCurve}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="dataSize" 
                      label={{ value: 'Training Data Size', position: 'insideBottom', offset: -5 }}
                    />
                    <YAxis 
                      domain={[0, 1]}
                      label={{ value: 'Score', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="accuracy" stroke="hsl(var(--primary))" strokeWidth={2} name="Accuracy" />
                    <Line type="monotone" dataKey="precision" stroke="hsl(142, 76%, 36%)" strokeWidth={2} name="Precision" />
                    <Line type="monotone" dataKey="recall" stroke="hsl(221, 83%, 53%)" strokeWidth={2} name="Recall" />
                    <Line type="monotone" dataKey="f1Score" stroke="hsl(280, 65%, 60%)" strokeWidth={2} name="F1-Score" />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg">
                  <p className="text-sm font-medium mb-1">Current Performance</p>
                  <p className="text-2xl font-bold">{(dataSizeAnalysis.currentPerformance * 100).toFixed(1)}%</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-sm font-medium mb-1">With 2x Data</p>
                  <p className="text-2xl font-bold text-green-600">
                    +{dataSizeAnalysis.doubleDataImprovement.toFixed(1)}%
                  </p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-sm font-medium mb-1">With 10x Data</p>
                  <p className="text-2xl font-bold text-green-600">
                    +{dataSizeAnalysis.tenXDataImprovement.toFixed(1)}%
                  </p>
                </div>
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>{dataSizeAnalysis.recommendation}</AlertDescription>
              </Alert>
            </TabsContent>

            {/* Confusion Matrix */}
            <TabsContent value="confusion" className="space-y-4">
              <Alert>
                <Target className="h-4 w-4" />
                <AlertDescription>
                  Breakdown of correct and incorrect predictions
                </AlertDescription>
              </Alert>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={confusionMatrixData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="label" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value">
                        {confusionMatrixData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-3">
                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">True Positives (TP)</span>
                      <span className="font-bold">{metrics.truePositives}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Correctly predicted positive cases
                    </p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">True Negatives (TN)</span>
                      <span className="font-bold">{metrics.trueNegatives}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Correctly predicted negative cases
                    </p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">False Positives (FP)</span>
                      <span className="font-bold text-red-600">{metrics.falsePositives}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Incorrectly predicted as positive
                    </p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">False Negatives (FN)</span>
                      <span className="font-bold text-red-600">{metrics.falseNegatives}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Incorrectly predicted as negative
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Impact Analysis */}
            <TabsContent value="impact" className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Understand how each parameter affects your model
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                {/* Class Imbalance Impact */}
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Scale className="h-4 w-4" />
                    Class Imbalance Impact
                  </h4>
                  <div className="grid md:grid-cols-2 gap-4 mb-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Current F1-Score</p>
                      <p className="text-xl font-bold">{(imbalanceAnalysis.currentMetrics.f1Score * 100).toFixed(1)}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">With Balanced Classes</p>
                      <p className="text-xl font-bold text-green-600">
                        {(imbalanceAnalysis.balancedMetrics.f1Score * 100).toFixed(1)}%
                        <span className="text-sm ml-2">
                          (+{imbalanceAnalysis.improvement.toFixed(1)}%)
                        </span>
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{imbalanceAnalysis.recommendation}</p>
                </div>

                {/* Noise Impact */}
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Noise Impact
                  </h4>
                  <div className="grid md:grid-cols-2 gap-4 mb-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Current Accuracy</p>
                      <p className="text-xl font-bold">{(noiseAnalysis.currentPerformance * 100).toFixed(1)}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">With Clean Data</p>
                      <p className="text-xl font-bold text-green-600">
                        {(noiseAnalysis.cleanDataPerformance * 100).toFixed(1)}%
                        <span className="text-sm ml-2">
                          (+{noiseAnalysis.degradation.toFixed(1)}%)
                        </span>
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{noiseAnalysis.recommendation}</p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-balance">Recommendations for Improvement</CardTitle>
          <CardDescription className="text-pretty">
            Prioritized actions to improve your model performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recommendations.length > 0 ? (
            <div className="space-y-3">
              {recommendations.map((rec, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <span className="font-medium">{rec.action}</span>
                    </div>
                    <Badge variant={getPriorityColor(rec.priority) as any}>
                      {rec.priority}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground ml-6">
                    Expected impact: {rec.expectedImpact}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                Your parameters are well-optimized! Your model should perform well under these conditions.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Educational Content */}
      <Card>
        <CardHeader>
          <CardTitle className="text-balance">Understanding the Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">Accuracy</h4>
              <p className="text-sm text-muted-foreground">
                Percentage of correct predictions out of all predictions. 
                Can be misleading with imbalanced classes.
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">Precision</h4>
              <p className="text-sm text-muted-foreground">
                Of all positive predictions, how many were actually positive. 
                Important when false positives are costly.
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">Recall</h4>
              <p className="text-sm text-muted-foreground">
                Of all actual positives, how many did we correctly identify. 
                Important when false negatives are costly.
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">F1-Score</h4>
              <p className="text-sm text-muted-foreground">
                Harmonic mean of precision and recall. 
                Best metric for imbalanced datasets.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
