import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { featureImportanceService } from '@/services/featureImportanceService';
import type { FeatureImportance, FeatureImportanceResult } from '@/services/featureImportanceService';
import type { ColumnInfo } from '@/services/dataValidationService';
import { Target, TrendingUp, CheckCircle2, AlertCircle, Info, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

interface FeatureImportancePanelProps {
  data: string[][];
  columnInfo: ColumnInfo[];
  onFeaturesSelected?: (features: string[], target: string) => void;
}

export function FeatureImportancePanel({ data, columnInfo, onFeaturesSelected }: FeatureImportancePanelProps) {
  const [targetColumn, setTargetColumn] = useState<string>('');
  const [importanceResult, setImportanceResult] = useState<FeatureImportanceResult | null>(null);
  const [selectedFeatures, setSelectedFeatures] = useState<Set<string>>(new Set());
  const [isCalculating, setIsCalculating] = useState(false);

  useEffect(() => {
    if (importanceResult) {
      setSelectedFeatures(new Set(importanceResult.selectedFeatures));
    }
  }, [importanceResult]);

  const handleCalculateImportance = () => {
    if (!targetColumn) {
      toast.error('Please select a target column');
      return;
    }

    setIsCalculating(true);
    try {
      const result = featureImportanceService.calculateFeatureImportance(data, columnInfo, targetColumn);
      setImportanceResult(result);
      toast.success('Feature importance calculated successfully');
    } catch (error) {
      toast.error('Failed to calculate feature importance');
      console.error(error);
    } finally {
      setIsCalculating(false);
    }
  };

  const handleFeatureToggle = (feature: string, checked: boolean) => {
    const newSelected = new Set(selectedFeatures);
    if (checked) {
      newSelected.add(feature);
    } else {
      newSelected.delete(feature);
    }
    setSelectedFeatures(newSelected);
  };

  const handleSelectAll = () => {
    if (importanceResult) {
      setSelectedFeatures(new Set(importanceResult.features.map(f => f.feature)));
    }
  };

  const handleSelectRecommended = () => {
    if (importanceResult) {
      const recommended = importanceResult.features
        .filter(f => f.recommendation === 'high' || f.recommendation === 'medium')
        .map(f => f.feature);
      setSelectedFeatures(new Set(recommended));
    }
  };

  const handleClearAll = () => {
    setSelectedFeatures(new Set());
  };

  const handleApplySelection = () => {
    if (selectedFeatures.size === 0) {
      toast.error('Please select at least one feature');
      return;
    }

    if (onFeaturesSelected && targetColumn) {
      onFeaturesSelected(Array.from(selectedFeatures), targetColumn);
      toast.success(`Selected ${selectedFeatures.size} features for training`);
    }
  };

  const getRecommendationColor = (rec: FeatureImportance['recommendation']) => {
    switch (rec) {
      case 'high':
        return 'bg-green-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'low':
        return 'bg-gray-400';
    }
  };

  const getRecommendationBadge = (rec: FeatureImportance['recommendation']) => {
    switch (rec) {
      case 'high':
        return <Badge className="bg-green-500">High</Badge>;
      case 'medium':
        return <Badge variant="secondary">Medium</Badge>;
      case 'low':
        return <Badge variant="outline">Low</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Target Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-balance flex items-center gap-2">
            <Target className="h-5 w-5" />
            Feature Importance Analysis
          </CardTitle>
          <CardDescription className="text-pretty">
            Identify which features are most important for predicting your target variable
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Target Column (What you want to predict)</Label>
            <Select value={targetColumn} onValueChange={setTargetColumn}>
              <SelectTrigger>
                <SelectValue placeholder="Select target column" />
              </SelectTrigger>
              <SelectContent>
                {columnInfo.map(col => (
                  <SelectItem key={col.name} value={col.name}>
                    {col.name} ({col.type})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleCalculateImportance}
            disabled={!targetColumn || isCalculating}
            className="w-full"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            {isCalculating ? 'Calculating...' : 'Calculate Feature Importance'}
          </Button>

          {!importanceResult && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Select the column you want to predict (target variable), then click Calculate to analyze
                which features are most important for your model.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Importance Results */}
      {importanceResult && (
        <>
          {/* Recommendations */}
          {importanceResult.recommendations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-balance flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {importanceResult.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm">{rec}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Importance Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-balance">Feature Importance Scores</CardTitle>
              <CardDescription className="text-pretty">
                Higher scores indicate more important features for predicting {importanceResult.targetColumn}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="w-full min-w-0 overflow-hidden">
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={importanceResult.features} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" domain={[0, 1]} tick={{ fontSize: 12 }} />
                    <YAxis 
                      type="category" 
                      dataKey="feature" 
                      width={120}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload as FeatureImportance;
                          return (
                            <div className="bg-background border rounded-lg p-3 shadow-lg">
                              <p className="font-medium">{data.feature}</p>
                              <p className="text-sm">Importance: {(data.importance * 100).toFixed(1)}%</p>
                              <p className="text-sm">Method: {data.method}</p>
                              <p className="text-sm">Rank: #{data.rank}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="importance">
                      {importanceResult.features.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={`hsl(var(--primary))`} opacity={entry.importance} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Feature Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-balance">Select Features for Training</CardTitle>
              <CardDescription className="text-pretty">
                Choose which features to include in your model
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Button onClick={handleSelectRecommended} variant="outline" size="sm">
                  Select Recommended
                </Button>
                <Button onClick={handleSelectAll} variant="outline" size="sm">
                  Select All
                </Button>
                <Button onClick={handleClearAll} variant="outline" size="sm">
                  Clear All
                </Button>
              </div>

              <div className="space-y-3">
                {importanceResult.features.map((feature) => (
                  <div
                    key={feature.feature}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <Checkbox
                        id={feature.feature}
                        checked={selectedFeatures.has(feature.feature)}
                        onCheckedChange={(checked) => handleFeatureToggle(feature.feature, checked as boolean)}
                      />
                      <Label htmlFor={feature.feature} className="flex-1 cursor-pointer">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{feature.feature}</span>
                          {getRecommendationBadge(feature.recommendation)}
                        </div>
                        <div className="flex items-center gap-4 mt-1">
                          <span className="text-sm text-muted-foreground">
                            Rank #{feature.rank}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {feature.method}
                          </span>
                        </div>
                      </Label>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="w-24">
                        <Progress value={feature.importance * 100} />
                      </div>
                      <span className="text-sm font-medium w-12 text-right">
                        {(feature.importance * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="font-medium">Selected Features</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedFeatures.size} of {importanceResult.features.length} features selected
                    </p>
                  </div>
                  <Button onClick={handleApplySelection} disabled={selectedFeatures.size === 0}>
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Apply Selection
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
