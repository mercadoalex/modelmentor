import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { modelPlaygroundService } from '@/services/modelPlaygroundService';
import type { FeatureValue, PredictionResult } from '@/services/modelPlaygroundService';
import { 
  Play, 
  RotateCcw, 
  Download, 
  TrendingUp, 
  TrendingDown,
  Info,
  Lightbulb,
  Zap,
  Activity,
  GitCompare
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
  ScatterChart,
  Scatter,
  ZAxis,
  Cell
} from 'recharts';

interface ModelPlaygroundProps {
  features: string[];
  featureImportance?: number[];
}

export function ModelPlayground({ features, featureImportance }: ModelPlaygroundProps) {
  const [featureValues, setFeatureValues] = useState<FeatureValue[]>([]);
  const [currentPrediction, setCurrentPrediction] = useState<PredictionResult | null>(null);
  const [predictionHistory, setPredictionHistory] = useState<PredictionResult[]>([]);
  const [selectedFeature1, setSelectedFeature1] = useState(0);
  const [selectedFeature2, setSelectedFeature2] = useState(1);
  const [comparisonMode, setComparisonMode] = useState(false);
  const [savedState, setSavedState] = useState<FeatureValue[] | null>(null);

  // Initialize features
  useEffect(() => {
    const initialized = modelPlaygroundService.initializeFeatures(features, featureImportance);
    setFeatureValues(initialized);
    const prediction = modelPlaygroundService.makePrediction(initialized);
    setCurrentPrediction(prediction);
    setPredictionHistory([prediction]);
  }, [features, featureImportance]);

  // Update prediction when features change
  useEffect(() => {
    if (featureValues.length === 0) return;
    
    const prediction = modelPlaygroundService.makePrediction(featureValues);
    setCurrentPrediction(prediction);
    
    // Add to history (limit to last 20)
    setPredictionHistory(prev => [...prev.slice(-19), prediction]);
  }, [featureValues]);

  // Calculate decision boundary
  const decisionBoundary = useMemo(() => {
    if (featureValues.length < 2) return [];
    
    const boundary = modelPlaygroundService.calculateDecisionBoundary(
      selectedFeature1,
      selectedFeature2,
      featureValues,
      15
    );
    
    // Flatten for scatter plot
    const points: Array<{ x: number; y: number; z: number }> = [];
    boundary.forEach(row => {
      row.forEach(point => {
        points.push({
          x: point.x,
          y: point.y,
          z: point.prediction,
        });
      });
    });
    
    return points;
  }, [featureValues, selectedFeature1, selectedFeature2]);

  // Feature interactions
  const featureInteractions = useMemo(() => {
    return modelPlaygroundService.analyzeFeatureInteractions(featureValues);
  }, [featureValues]);

  // Insights
  const insights = useMemo(() => {
    if (!currentPrediction) return [];
    return modelPlaygroundService.getInsights(currentPrediction, featureValues);
  }, [currentPrediction, featureValues]);

  // What-if scenarios
  const scenarios = useMemo(() => {
    return modelPlaygroundService.generateScenarios(featureValues);
  }, [featureValues]);

  const handleFeatureChange = (index: number, value: number[]) => {
    setFeatureValues(prev => 
      prev.map((f, i) => i === index ? { ...f, value: value[0] } : f)
    );
  };

  const handleReset = () => {
    const initialized = modelPlaygroundService.initializeFeatures(features, featureImportance);
    setFeatureValues(initialized);
    toast.success('Features reset to default values');
  };

  const handleSaveState = () => {
    setSavedState([...featureValues]);
    setComparisonMode(true);
    toast.success('Current state saved for comparison');
  };

  const handleExport = () => {
    const state = {
      features: featureValues,
      currentPrediction,
      predictionHistory,
      decisionBoundary: [],
      featureInteractions,
    };
    const json = modelPlaygroundService.exportState(state);
    
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'playground-state.json';
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success('State exported successfully');
  };

  const handleApplyScenario = (scenarioFeatures: FeatureValue[]) => {
    setFeatureValues(scenarioFeatures);
    toast.success('Scenario applied');
  };

  const getColorForPrediction = (value: number) => {
    if (value > 0.7) return 'hsl(var(--primary))';
    if (value > 0.3) return 'hsl(var(--muted-foreground))';
    return 'hsl(var(--destructive))';
  };

  const getFeatureImpact = (index: number) => {
    if (!currentPrediction) return { increase: 0, decrease: 0 };
    return modelPlaygroundService.calculateFeatureImpact(
      index,
      featureValues,
      currentPrediction.prediction
    );
  };

  if (featureValues.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">Loading playground...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="text-balance flex items-center gap-2">
            <Play className="h-6 w-6" />
            Interactive Model Playground
          </CardTitle>
          <CardDescription className="text-pretty">
            Experiment with different input values and see how they affect predictions in real-time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleReset} variant="outline" size="sm">
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
            <Button onClick={handleSaveState} variant="outline" size="sm">
              <GitCompare className="h-4 w-4 mr-2" />
              Save for Comparison
            </Button>
            <Button onClick={handleExport} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export State
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Feature Controls */}
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="text-balance">Feature Controls</CardTitle>
            <CardDescription className="text-pretty">
              Adjust feature values to see how they affect the prediction
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {featureValues.map((feature, index) => {
              const impact = getFeatureImpact(index);
              return (
                <div key={feature.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{feature.name}</span>
                      {feature.importance && feature.importance > 0.7 && (
                        <Badge variant="secondary" className="text-xs">
                          High Impact
                        </Badge>
                      )}
                    </div>
                    <span className="text-sm font-mono">{feature.value.toFixed(2)}</span>
                  </div>
                  
                  <Slider
                    value={[feature.value]}
                    onValueChange={(value) => handleFeatureChange(index, value)}
                    min={feature.min}
                    max={feature.max}
                    step={feature.step}
                    className="w-full"
                  />
                  
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      {impact.increase > 0 ? '+' : ''}{(impact.increase * 100).toFixed(1)}%
                    </span>
                    <span className="flex items-center gap-1">
                      <TrendingDown className="h-3 w-3" />
                      {impact.decrease > 0 ? '+' : ''}{(impact.decrease * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Current Prediction */}
        <Card className="h-full">
          <CardHeader>
            <CardTitle className="text-balance">Current Prediction</CardTitle>
            <CardDescription className="text-pretty">
              Real-time prediction based on current feature values
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {currentPrediction && (
              <>
                {/* Prediction Value */}
                <div className="text-center space-y-2">
                  <div className="text-5xl font-bold" style={{ color: getColorForPrediction(currentPrediction.prediction) }}>
                    {(currentPrediction.prediction * 100).toFixed(1)}%
                  </div>
                  <p className="text-sm text-muted-foreground">Prediction Score</p>
                </div>

                {/* Confidence */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Confidence</span>
                    <span className="font-medium">{(currentPrediction.confidence * 100).toFixed(1)}%</span>
                  </div>
                  <Progress value={currentPrediction.confidence * 100} />
                </div>

                {/* Insights */}
                {insights.length > 0 && (
                  <Alert>
                    <Lightbulb className="h-4 w-4" />
                    <AlertDescription>
                      <ul className="space-y-1 text-sm">
                        {insights.map((insight, index) => (
                          <li key={index}>• {insight}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Comparison */}
                {comparisonMode && savedState && (
                  <div className="p-4 border rounded-lg space-y-2">
                    <h4 className="font-semibold text-sm flex items-center gap-2">
                      <GitCompare className="h-4 w-4" />
                      Comparison with Saved State
                    </h4>
                    <div className="space-y-1 text-sm">
                      {featureValues.map((feature, index) => {
                        const saved = savedState[index];
                        const diff = feature.value - saved.value;
                        if (Math.abs(diff) < 0.01) return null;
                        return (
                          <div key={feature.name} className="flex items-center justify-between">
                            <span>{feature.name}</span>
                            <span className={diff > 0 ? 'text-green-600' : 'text-red-600'}>
                              {diff > 0 ? '+' : ''}{diff.toFixed(2)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Visualizations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-balance">Visualizations</CardTitle>
          <CardDescription className="text-pretty">
            Explore decision boundaries and feature interactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="history">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="history">Prediction History</TabsTrigger>
              <TabsTrigger value="boundary">Decision Boundary</TabsTrigger>
              <TabsTrigger value="interactions">Feature Interactions</TabsTrigger>
            </TabsList>

            {/* Prediction History */}
            <TabsContent value="history" className="space-y-4">
              <Alert>
                <Activity className="h-4 w-4" />
                <AlertDescription>
                  Track how predictions change as you adjust features
                </AlertDescription>
              </Alert>

              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={predictionHistory.map((p, i) => ({ index: i, prediction: p.prediction * 100 }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="index" label={{ value: 'Time', position: 'insideBottom', offset: -5 }} />
                    <YAxis label={{ value: 'Prediction (%)', angle: -90, position: 'insideLeft' }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="prediction" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>

            {/* Decision Boundary */}
            <TabsContent value="boundary" className="space-y-4">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Visualize how the model separates different prediction regions
                </AlertDescription>
              </Alert>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">X-Axis Feature</label>
                  <select
                    value={selectedFeature1}
                    onChange={(e) => setSelectedFeature1(Number(e.target.value))}
                    className="w-full mt-1 p-2 border rounded"
                  >
                    {featureValues.map((f, i) => (
                      <option key={i} value={i}>{f.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Y-Axis Feature</label>
                  <select
                    value={selectedFeature2}
                    onChange={(e) => setSelectedFeature2(Number(e.target.value))}
                    className="w-full mt-1 p-2 border rounded"
                  >
                    {featureValues.map((f, i) => (
                      <option key={i} value={i}>{f.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      type="number" 
                      dataKey="x" 
                      name={featureValues[selectedFeature1]?.name}
                      label={{ value: featureValues[selectedFeature1]?.name, position: 'insideBottom', offset: -5 }}
                    />
                    <YAxis 
                      type="number" 
                      dataKey="y" 
                      name={featureValues[selectedFeature2]?.name}
                      label={{ value: featureValues[selectedFeature2]?.name, angle: -90, position: 'insideLeft' }}
                    />
                    <ZAxis type="number" dataKey="z" range={[50, 200]} />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                    <Scatter data={decisionBoundary} fill="hsl(var(--primary))">
                      {decisionBoundary.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={getColorForPrediction(entry.z)} />
                      ))}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                Each point represents a prediction for different feature combinations. 
                Color indicates prediction strength.
              </p>
            </TabsContent>

            {/* Feature Interactions */}
            <TabsContent value="interactions" className="space-y-4">
              <Alert>
                <Zap className="h-4 w-4" />
                <AlertDescription>
                  Discover how features interact and influence each other
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                {featureInteractions.slice(0, 5).map((interaction, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">
                        {interaction.feature1} ↔ {interaction.feature2}
                      </span>
                      <Badge variant={interaction.impact > 0.3 ? 'default' : 'secondary'}>
                        Impact: {(interaction.impact * 100).toFixed(0)}%
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span>Correlation</span>
                        <span className={interaction.correlation > 0 ? 'text-green-600' : 'text-red-600'}>
                          {interaction.correlation > 0 ? 'Positive' : 'Negative'} ({interaction.correlation.toFixed(2)})
                        </span>
                      </div>
                      <Progress value={Math.abs(interaction.correlation) * 100} />
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* What-If Scenarios */}
      <Card>
        <CardHeader>
          <CardTitle className="text-balance">What-If Scenarios</CardTitle>
          <CardDescription className="text-pretty">
            Explore different scenarios to understand model behavior
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            {scenarios.map((scenario, index) => (
              <div key={index} className="p-4 border rounded-lg space-y-3">
                <div>
                  <h4 className="font-semibold">{scenario.name}</h4>
                  <p className="text-xs text-muted-foreground">{scenario.description}</p>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Prediction:</span>
                  <span className="text-lg font-bold" style={{ color: getColorForPrediction(scenario.prediction.prediction) }}>
                    {(scenario.prediction.prediction * 100).toFixed(1)}%
                  </span>
                </div>
                
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="w-full"
                  onClick={() => handleApplyScenario(scenario.features)}
                >
                  Apply Scenario
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="text-balance">Tips for Exploration</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <Lightbulb className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <span>Adjust one feature at a time to see its individual impact on predictions</span>
            </li>
            <li className="flex items-start gap-2">
              <Lightbulb className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <span>Watch the prediction history to see how changes affect the model over time</span>
            </li>
            <li className="flex items-start gap-2">
              <Lightbulb className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <span>Use the decision boundary visualization to understand how features interact</span>
            </li>
            <li className="flex items-start gap-2">
              <Lightbulb className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <span>Try the what-if scenarios to explore extreme cases and edge conditions</span>
            </li>
            <li className="flex items-start gap-2">
              <Lightbulb className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <span>Save states to compare different configurations and understand model sensitivity</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
