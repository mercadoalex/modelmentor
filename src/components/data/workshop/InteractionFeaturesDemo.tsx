/**
 * Interaction Features Demo Component
 * 
 * Interactive demonstration of feature interaction generation for the Feature Engineering Workshop.
 * Allows users to create interaction features (multiply, divide, add, subtract),
 * visualize interaction effects, and understand the impact on model performance.
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6
 */

import { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Cell,
  BarChart,
  Bar,
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import {
  Zap,
  Info,
  Play,
  RotateCcw,
  TrendingUp,
  Lightbulb,
  Star,
  ArrowRight,
} from 'lucide-react';
import type { InteractionFeatureResult, InteractionType, SuggestedInteraction } from '@/types/workshop';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface FeatureData {
  name: string;
  values: number[];
}

interface InteractionFeaturesDemoProps {
  /** Available features for interaction */
  features?: FeatureData[];
  /** Target variable data for correlation calculation */
  targetData?: number[];
  /** Callback when interaction feature is created */
  onCreateFeature?: (result: InteractionFeatureResult) => void;
  /** Whether to show animations */
  showAnimation?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper Functions
// ─────────────────────────────────────────────────────────────────────────────

function generateSampleFeatures(): FeatureData[] {
  const size = 50;
  const features: FeatureData[] = [];
  
  // Age feature (20-60)
  const age: number[] = [];
  for (let i = 0; i < size; i++) {
    age.push(20 + Math.random() * 40);
  }
  features.push({ name: 'age', values: age });
  
  // Income feature (30k-150k)
  const income: number[] = [];
  for (let i = 0; i < size; i++) {
    income.push(30000 + Math.random() * 120000);
  }
  features.push({ name: 'income', values: income });
  
  // Experience feature (0-30)
  const experience: number[] = [];
  for (let i = 0; i < size; i++) {
    experience.push(Math.max(0, age[i] - 22 + (Math.random() - 0.5) * 10));
  }
  features.push({ name: 'experience', values: experience });
  
  // Education years (12-22)
  const education: number[] = [];
  for (let i = 0; i < size; i++) {
    education.push(12 + Math.random() * 10);
  }
  features.push({ name: 'education', values: education });
  
  return features;
}

function generateSampleTarget(features: FeatureData[]): number[] {
  const size = features[0]?.values.length || 50;
  const target: number[] = [];
  
  const income = features.find(f => f.name === 'income')?.values || [];
  const experience = features.find(f => f.name === 'experience')?.values || [];
  
  for (let i = 0; i < size; i++) {
    // Target is influenced by income/experience ratio (value for money)
    const incomeVal = income[i] || 50000;
    const expVal = experience[i] || 5;
    const noise = (Math.random() - 0.5) * 20;
    target.push((incomeVal / 10000) * (expVal / 10) + noise);
  }
  
  return target;
}

function applyInteraction(
  values1: number[],
  values2: number[],
  type: InteractionType
): number[] {
  return values1.map((v1, i) => {
    const v2 = values2[i];
    switch (type) {
      case 'multiply':
        return v1 * v2;
      case 'divide':
        return v2 !== 0 ? v1 / v2 : 0;
      case 'add':
        return v1 + v2;
      case 'subtract':
        return v1 - v2;
      default:
        return v1 * v2;
    }
  });
}

function calculateCorrelation(x: number[], y: number[]): number {
  const n = x.length;
  if (n === 0) return 0;
  
  const meanX = x.reduce((a, b) => a + b, 0) / n;
  const meanY = y.reduce((a, b) => a + b, 0) / n;
  
  let numerator = 0;
  let denomX = 0;
  let denomY = 0;
  
  for (let i = 0; i < n; i++) {
    const dx = x[i] - meanX;
    const dy = y[i] - meanY;
    numerator += dx * dy;
    denomX += dx * dx;
    denomY += dy * dy;
  }
  
  const denom = Math.sqrt(denomX * denomY);
  return denom === 0 ? 0 : numerator / denom;
}

function getInteractionSymbol(type: InteractionType): string {
  switch (type) {
    case 'multiply': return '×';
    case 'divide': return '÷';
    case 'add': return '+';
    case 'subtract': return '−';
    default: return '×';
  }
}

function getInteractionExplanation(
  feature1: string,
  feature2: string,
  type: InteractionType
): string {
  const explanations: Record<InteractionType, string> = {
    multiply: `Captures the combined effect of ${feature1} and ${feature2}. High values in both features result in very high interaction values.`,
    divide: `Captures the ratio of ${feature1} to ${feature2}. Useful for "per unit" metrics like income per year of experience.`,
    add: `Captures the total of ${feature1} and ${feature2}. Useful when both features contribute additively to the outcome.`,
    subtract: `Captures the difference between ${feature1} and ${feature2}. Useful for comparing relative values.`,
  };
  return explanations[type];
}

function suggestTopInteractions(
  features: FeatureData[],
  target: number[],
  topN: number = 5
): SuggestedInteraction[] {
  const suggestions: SuggestedInteraction[] = [];
  const types: InteractionType[] = ['multiply', 'divide', 'add', 'subtract'];
  
  for (let i = 0; i < features.length; i++) {
    for (let j = i + 1; j < features.length; j++) {
      for (const type of types) {
        const interactionValues = applyInteraction(
          features[i].values,
          features[j].values,
          type
        );
        const correlation = Math.abs(calculateCorrelation(interactionValues, target));
        
        suggestions.push({
          feature1: features[i].name,
          feature2: features[j].name,
          type,
          expectedCorrelation: correlation,
          rank: 0,
          rationale: getInteractionExplanation(features[i].name, features[j].name, type),
        });
      }
    }
  }
  
  // Sort by correlation and assign ranks
  suggestions.sort((a, b) => b.expectedCorrelation - a.expectedCorrelation);
  suggestions.forEach((s, idx) => { s.rank = idx + 1; });
  
  return suggestions.slice(0, topN);
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export function InteractionFeaturesDemo({
  features: providedFeatures,
  targetData: providedTarget,
  onCreateFeature,
  showAnimation = true,
}: InteractionFeaturesDemoProps) {
  // Generate sample data if not provided
  const features = useMemo(() => {
    return providedFeatures && providedFeatures.length >= 2
      ? providedFeatures
      : generateSampleFeatures();
  }, [providedFeatures]);

  const targetData = useMemo(() => {
    return providedTarget && providedTarget.length === features[0]?.values.length
      ? providedTarget
      : generateSampleTarget(features);
  }, [providedTarget, features]);

  // State
  const [feature1, setFeature1] = useState(features[0]?.name || '');
  const [feature2, setFeature2] = useState(features[1]?.name || '');
  const [interactionType, setInteractionType] = useState<InteractionType>('multiply');
  const [createdFeatures, setCreatedFeatures] = useState<InteractionFeatureResult[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  // Get feature data
  const feature1Data = useMemo(() => 
    features.find(f => f.name === feature1)?.values || [],
    [features, feature1]
  );
  
  const feature2Data = useMemo(() => 
    features.find(f => f.name === feature2)?.values || [],
    [features, feature2]
  );

  // Calculate interaction values
  const interactionValues = useMemo(() => {
    if (feature1Data.length === 0 || feature2Data.length === 0) return [];
    return applyInteraction(feature1Data, feature2Data, interactionType);
  }, [feature1Data, feature2Data, interactionType]);

  // Calculate correlations
  const correlations = useMemo(() => {
    return {
      feature1: calculateCorrelation(feature1Data, targetData),
      feature2: calculateCorrelation(feature2Data, targetData),
      interaction: calculateCorrelation(interactionValues, targetData),
    };
  }, [feature1Data, feature2Data, interactionValues, targetData]);

  // Top suggestions
  const topSuggestions = useMemo(() => {
    return suggestTopInteractions(features, targetData, 5);
  }, [features, targetData]);

  // Heatmap data for visualization
  const heatmapData = useMemo(() => {
    if (feature1Data.length === 0 || feature2Data.length === 0) return [];
    
    return feature1Data.map((v1, i) => ({
      x: v1,
      y: feature2Data[i],
      z: interactionValues[i],
      target: targetData[i],
    }));
  }, [feature1Data, feature2Data, interactionValues, targetData]);

  // Importance comparison data
  const importanceData = useMemo(() => {
    return [
      { name: feature1, correlation: Math.abs(correlations.feature1), fill: 'hsl(220, 70%, 50%)' },
      { name: feature2, correlation: Math.abs(correlations.feature2), fill: 'hsl(280, 70%, 50%)' },
      { name: `${feature1} ${getInteractionSymbol(interactionType)} ${feature2}`, correlation: Math.abs(correlations.interaction), fill: 'hsl(150, 70%, 50%)' },
    ];
  }, [feature1, feature2, interactionType, correlations]);

  // Handle create feature
  const handleCreateFeature = useCallback(() => {
    setIsCreating(true);
    
    setTimeout(() => {
      const result: InteractionFeatureResult = {
        feature1,
        feature2,
        interactionType,
        formula: `${feature1} ${getInteractionSymbol(interactionType)} ${feature2}`,
        values: interactionValues,
        importance: Math.abs(correlations.interaction),
        explanation: getInteractionExplanation(feature1, feature2, interactionType),
        correlation: correlations.interaction,
      };
      
      setCreatedFeatures(prev => [...prev, result]);
      onCreateFeature?.(result);
      setIsCreating(false);
    }, 500);
  }, [feature1, feature2, interactionType, interactionValues, correlations, onCreateFeature]);

  // Handle suggestion click
  const handleSuggestionClick = useCallback((suggestion: SuggestedInteraction) => {
    setFeature1(suggestion.feature1);
    setFeature2(suggestion.feature2);
    setInteractionType(suggestion.type);
  }, []);

  // Handle reset
  const handleReset = useCallback(() => {
    setCreatedFeatures([]);
    setFeature1(features[0]?.name || '');
    setFeature2(features[1]?.name || '');
    setInteractionType('multiply');
  }, [features]);

  // Color scale for heatmap
  const getHeatmapColor = (value: number, min: number, max: number) => {
    const normalized = (value - min) / (max - min || 1);
    const hue = 220 - normalized * 150; // Blue to green
    return `hsl(${hue}, 70%, 50%)`;
  };

  const minZ = Math.min(...interactionValues);
  const maxZ = Math.max(...interactionValues);

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              Feature Interactions
            </CardTitle>
            <CardDescription>
              Combine features to capture relationships between variables
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Feature Selection */}
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Feature 1</Label>
                <Select value={feature1} onValueChange={setFeature1}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {features.map(f => (
                      <SelectItem key={f.name} value={f.name} disabled={f.name === feature2}>
                        {f.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Interaction Type</Label>
                <Select value={interactionType} onValueChange={(v) => setInteractionType(v as InteractionType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="multiply">Multiply (×)</SelectItem>
                    <SelectItem value="divide">Divide (÷)</SelectItem>
                    <SelectItem value="add">Add (+)</SelectItem>
                    <SelectItem value="subtract">Subtract (−)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Feature 2</Label>
                <Select value={feature2} onValueChange={setFeature2}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {features.map(f => (
                      <SelectItem key={f.name} value={f.name} disabled={f.name === feature1}>
                        {f.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Formula Display */}
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium">Interaction Formula</span>
              </div>
              <code className="text-lg font-mono">
                {feature1} {getInteractionSymbol(interactionType)} {feature2}
              </code>
              <p className="text-sm text-muted-foreground mt-2">
                {getInteractionExplanation(feature1, feature2, interactionType)}
              </p>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleReset}>
                <RotateCcw className="h-4 w-4 mr-1" />
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Top Suggestions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              Top 5 Suggested Interactions
            </CardTitle>
            <CardDescription>
              Automatically ranked by correlation with target variable
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {topSuggestions.map((suggestion, index) => (
                <motion.div
                  key={`${suggestion.feature1}-${suggestion.feature2}-${suggestion.type}`}
                  initial={showAnimation ? { opacity: 0, x: -20 } : false}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors hover:bg-muted ${
                    feature1 === suggestion.feature1 && 
                    feature2 === suggestion.feature2 && 
                    interactionType === suggestion.type
                      ? 'border-primary bg-primary/5'
                      : ''
                  }`}
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="w-8 h-8 rounded-full flex items-center justify-center">
                      {suggestion.rank}
                    </Badge>
                    <div>
                      <code className="text-sm font-mono">
                        {suggestion.feature1} {getInteractionSymbol(suggestion.type)} {suggestion.feature2}
                      </code>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={suggestion.expectedCorrelation > 0.5 ? 'default' : 'secondary'}>
                      r = {suggestion.expectedCorrelation.toFixed(3)}
                    </Badge>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Visualization - Scatter Plot as Heatmap */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Interaction Effect Visualization</CardTitle>
            <CardDescription>
              Color intensity shows the interaction value at each point
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-50" />
                  <XAxis 
                    dataKey="x" 
                    name={feature1}
                    label={{ value: feature1, position: 'bottom', offset: -5 }}
                    tickFormatter={(v) => typeof v === 'number' ? v.toFixed(0) : v}
                  />
                  <YAxis 
                    dataKey="y" 
                    name={feature2}
                    label={{ value: feature2, angle: -90, position: 'insideLeft' }}
                    tickFormatter={(v) => typeof v === 'number' ? v.toFixed(0) : v}
                  />
                  <RechartsTooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-background border rounded-lg p-2 shadow-lg">
                            <p className="text-sm"><strong>{feature1}:</strong> {data.x?.toFixed(2)}</p>
                            <p className="text-sm"><strong>{feature2}:</strong> {data.y?.toFixed(2)}</p>
                            <p className="text-sm"><strong>Interaction:</strong> {data.z?.toFixed(2)}</p>
                            <p className="text-sm"><strong>Target:</strong> {data.target?.toFixed(2)}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Scatter name="Data" data={heatmapData}>
                    {heatmapData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={getHeatmapColor(entry.z, minZ, maxZ)}
                        opacity={0.7}
                      />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-center gap-4 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: 'hsl(220, 70%, 50%)' }} />
                <span className="text-sm">Low interaction</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: 'hsl(70, 70%, 50%)' }} />
                <span className="text-sm">High interaction</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Importance Comparison */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              Importance Score Comparison
            </CardTitle>
            <CardDescription>
              Compare correlation with target: individual features vs interaction
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={importanceData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="opacity-50" />
                  <XAxis type="number" domain={[0, 1]} tickFormatter={(v) => v.toFixed(2)} />
                  <YAxis type="category" dataKey="name" width={150} />
                  <RechartsTooltip formatter={(value: number) => value.toFixed(4)} />
                  <Bar dataKey="correlation" name="Correlation">
                    {importanceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <AnimatePresence mode="wait">
              <motion.div
                key={`${feature1}-${feature2}-${interactionType}`}
                initial={showAnimation ? { opacity: 0, y: 10 } : false}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-3 bg-muted rounded-lg"
              >
                {Math.abs(correlations.interaction) > Math.max(Math.abs(correlations.feature1), Math.abs(correlations.feature2)) ? (
                  <p className="text-sm text-green-600 font-medium">
                    ✓ The interaction feature has higher correlation than individual features!
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    The interaction doesn't improve over individual features. Try a different combination.
                  </p>
                )}
              </motion.div>
            </AnimatePresence>
          </CardContent>
        </Card>

        {/* Educational Tip */}
        <Alert>
          <Lightbulb className="h-4 w-4" />
          <AlertTitle>Did you know?</AlertTitle>
          <AlertDescription>
            Feature interactions capture how two features work together to influence the target. 
            For example, "income ÷ experience" creates a "salary per year of experience" metric 
            that might be more predictive than either feature alone. Domain knowledge often 
            suggests which interactions are meaningful.
          </AlertDescription>
        </Alert>

        {/* Create Feature Button */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h4 className="font-semibold">Create Interaction Feature</h4>
                <p className="text-sm text-muted-foreground">
                  Add {feature1} {getInteractionSymbol(interactionType)} {feature2} to your feature set
                </p>
              </div>
              <Button
                onClick={handleCreateFeature}
                disabled={isCreating || createdFeatures.some(
                  f => f.feature1 === feature1 && f.feature2 === feature2 && f.interactionType === interactionType
                )}
              >
                {isCreating ? (
                  <>Creating...</>
                ) : createdFeatures.some(
                  f => f.feature1 === feature1 && f.feature2 === feature2 && f.interactionType === interactionType
                ) ? (
                  <>Already Created</>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Create Feature
                  </>
                )}
              </Button>
            </div>

            {/* Created Features List */}
            {createdFeatures.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <h5 className="text-sm font-medium mb-2">Created Features</h5>
                <div className="space-y-2">
                  {createdFeatures.map((feature, index) => (
                    <motion.div
                      key={index}
                      initial={showAnimation ? { opacity: 0, x: -20 } : false}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center justify-between p-2 bg-muted rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{getInteractionSymbol(feature.interactionType)}</Badge>
                        <code className="text-sm">{feature.formula}</code>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>r = {feature.correlation?.toFixed(3)}</span>
                        <Tooltip>
                          <TooltipTrigger>
                            <Info className="h-4 w-4" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{feature.explanation}</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}

export default InteractionFeaturesDemo;
