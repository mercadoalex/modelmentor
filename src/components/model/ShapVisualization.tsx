import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { shapService } from '@/services/shapService';
import type { ShapExplanation, ShapSummary } from '@/services/shapService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import { Lightbulb, Info, TrendingUp, TrendingDown, Target, Eye } from 'lucide-react';

interface ShapVisualizationProps {
  features: string[];
  labels: string[];
}

export function ShapVisualization({ features, labels }: ShapVisualizationProps) {
  const [selectedExample, setSelectedExample] = useState(1);
  const [activeTab, setActiveTab] = useState('waterfall');

  // Generate examples
  const examples = shapService.generateExamples(features, labels, 5);
  const currentExample = examples.find(e => e.id === selectedExample) || examples[0];

  // Generate SHAP explanation for selected example
  const explanation = shapService.generateShapExplanation(
    features,
    currentExample.prediction,
    currentExample.label
  );

  // Generate visualizations
  const waterfallData = shapService.generateWaterfallData(explanation);
  const forcePlotData = shapService.generateForcePlotData(explanation);
  const summaryData = shapService.generateShapSummary(features);
  const insights = shapService.generateInsights(explanation);

  const shapExplanations = shapService.getShapExplanation();

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="text-balance flex items-center gap-2">
            <Eye className="h-5 w-5" />
            SHAP Value Explanations
          </CardTitle>
          <CardDescription className="text-pretty">
            Understanding how features contribute to individual predictions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              SHAP (SHapley Additive exPlanations) values explain individual predictions by showing
              how much each feature contributed. This helps you understand why the model made a specific decision.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* What are SHAP Values */}
      <Card>
        <CardHeader>
          <CardTitle className="text-balance">What are SHAP Values?</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {shapExplanations.map((explanation, index) => (
              <li key={index} className="flex items-start gap-2 text-sm">
                <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span>{explanation}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Example Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="text-balance">Select a Prediction to Explain</CardTitle>
          <CardDescription className="text-pretty">
            Choose an example to see how features contributed to its prediction
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select value={selectedExample.toString()} onValueChange={(v) => setSelectedExample(parseInt(v))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {examples.map(example => (
                <SelectItem key={example.id} value={example.id.toString()}>
                  Example #{example.id}: Predicted "{example.label}" ({(example.confidence * 100).toFixed(1)}% confidence)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="p-4 border rounded-lg bg-muted">
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Prediction</p>
                <p className="text-lg font-semibold">{currentExample.label}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Confidence</p>
                <p className="text-lg font-semibold">{(currentExample.confidence * 100).toFixed(1)}%</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Prediction Score</p>
                <p className="text-lg font-semibold">{explanation.prediction.toFixed(3)}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Visualizations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-balance">Feature Contribution Analysis</CardTitle>
          <CardDescription className="text-pretty">
            Three ways to visualize how features influenced this prediction
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="waterfall">Waterfall Chart</TabsTrigger>
              <TabsTrigger value="force">Force Plot</TabsTrigger>
              <TabsTrigger value="summary">Summary Plot</TabsTrigger>
            </TabsList>

            {/* Waterfall Chart */}
            <TabsContent value="waterfall" className="space-y-4">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  {shapService.getWaterfallExplanation()}
                </AlertDescription>
              </Alert>

              <div className="w-full min-w-0 overflow-hidden">
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart
                    data={waterfallData.map((d, i) => ({
                      feature: d.feature,
                      value: d.value,
                      cumulative: d.cumulative,
                      isPositive: d.direction === 'positive',
                      index: i,
                    }))}
                    margin={{ top: 20, right: 30, left: 100, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="feature"
                      stroke="hsl(var(--muted-foreground))"
                      tick={{ fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={100}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))"
                      tick={{ fontSize: 12 }}
                      label={{ value: 'Contribution', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '6px'
                      }}
                      formatter={(value: number) => [value.toFixed(3), 'Value']}
                    />
                    <ReferenceLine y={explanation.baseValue} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {waterfallData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.direction === 'positive' ? 'hsl(var(--chart-1))' : 'hsl(var(--chart-3))'} 
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>

            {/* Force Plot */}
            <TabsContent value="force" className="space-y-4">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  {shapService.getForcePlotExplanation()}
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                {/* Positive Features */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-red-500" />
                    <span className="text-sm font-medium">Features Increasing Prediction</span>
                  </div>
                  {forcePlotData.positiveFeatures.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No features increase the prediction</p>
                  ) : (
                    <div className="space-y-2">
                      {forcePlotData.positiveFeatures.map(feature => (
                        <div key={feature.feature} className="flex items-center gap-2">
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium">{feature.feature}</span>
                              <span className="text-sm text-muted-foreground">
                                Value: {feature.featureValue}
                              </span>
                            </div>
                            <div className="h-8 bg-red-100 rounded overflow-hidden">
                              <div
                                className="h-full bg-red-500 flex items-center justify-end pr-2"
                                style={{ width: `${(feature.value / 0.3) * 100}%` }}
                              >
                                <span className="text-xs text-white font-medium">
                                  +{(feature.value * 100).toFixed(1)}%
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Base Value */}
                <div className="flex items-center justify-center py-2 border-y">
                  <Target className="h-4 w-4 mr-2" />
                  <span className="text-sm font-medium">
                    Base Value: {forcePlotData.baseValue.toFixed(3)} → Final Prediction: {forcePlotData.prediction.toFixed(3)}
                  </span>
                </div>

                {/* Negative Features */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingDown className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium">Features Decreasing Prediction</span>
                  </div>
                  {forcePlotData.negativeFeatures.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No features decrease the prediction</p>
                  ) : (
                    <div className="space-y-2">
                      {forcePlotData.negativeFeatures.map(feature => (
                        <div key={feature.feature} className="flex items-center gap-2">
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium">{feature.feature}</span>
                              <span className="text-sm text-muted-foreground">
                                Value: {feature.featureValue}
                              </span>
                            </div>
                            <div className="h-8 bg-blue-100 rounded overflow-hidden">
                              <div
                                className="h-full bg-blue-500 flex items-center justify-end pr-2"
                                style={{ width: `${(Math.abs(feature.value) / 0.3) * 100}%` }}
                              >
                                <span className="text-xs text-white font-medium">
                                  {(feature.value * 100).toFixed(1)}%
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Summary Plot */}
            <TabsContent value="summary" className="space-y-4">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  {shapService.getSummaryPlotExplanation()}
                </AlertDescription>
              </Alert>

              <div className="w-full min-w-0 overflow-hidden">
                <ResponsiveContainer width="100%" height={Math.max(300, summaryData.length * 40)}>
                  <BarChart
                    data={summaryData.map(s => ({
                      feature: s.feature,
                      importance: (s.meanAbsShap * 100).toFixed(1),
                    }))}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      type="number"
                      stroke="hsl(var(--muted-foreground))"
                      tick={{ fontSize: 12 }}
                      label={{ value: 'Mean |SHAP value| (%)', position: 'insideBottom', offset: -5, style: { fontSize: 12 } }}
                    />
                    <YAxis 
                      type="category"
                      dataKey="feature"
                      stroke="hsl(var(--muted-foreground))"
                      tick={{ fontSize: 12 }}
                      width={90}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '6px'
                      }}
                      formatter={(value: number) => [`${value}%`, 'Avg Impact']}
                    />
                    <Bar dataKey="importance" fill="hsl(var(--chart-1))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="text-balance flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            Key Insights for This Prediction
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {insights.map((insight, index) => (
              <li key={index} className="flex items-start gap-2 text-sm">
                <Badge variant="secondary">{index + 1}</Badge>
                <span>{insight}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
