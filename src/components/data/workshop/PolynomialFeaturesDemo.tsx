/**
 * Polynomial Features Demo Component
 * 
 * Interactive demonstration of polynomial feature generation for the Feature Engineering Workshop.
 * Allows users to create polynomial terms (degree 2 and 3), visualize polynomial fits,
 * and understand the impact on model performance.
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6
 */

import { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Slider } from '@/components/ui/slider';
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
  Line,
  ComposedChart,
  Legend,
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import {
  TrendingUp,
  AlertTriangle,
  Info,
  Play,
  RotateCcw,
  Sparkles,
  Calculator,
  Target,
  Lightbulb,
} from 'lucide-react';
import type { PolynomialFeatureResult } from '@/types/workshop';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface PolynomialFeaturesDemoProps {
  /** Feature data to use for polynomial generation */
  featureData?: number[];
  /** Target variable data for correlation calculation */
  targetData?: number[];
  /** Name of the feature */
  featureName?: string;
  /** Callback when polynomial feature is created */
  onCreateFeature?: (result: PolynomialFeatureResult) => void;
  /** Whether to show animations */
  showAnimation?: boolean;
}

interface DataPoint {
  x: number;
  y: number;
  yPoly2?: number;
  yPoly3?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper Functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generate sample data with a non-linear relationship
 */
function generateSampleData(size: number = 50): { x: number[]; y: number[] } {
  const x: number[] = [];
  const y: number[] = [];
  
  for (let i = 0; i < size; i++) {
    const xVal = (i / size) * 10 - 5; // Range: -5 to 5
    x.push(xVal);
    // Quadratic relationship with noise
    const noise = (Math.random() - 0.5) * 5;
    y.push(0.5 * xVal * xVal + 2 * xVal + 3 + noise);
  }
  
  return { x, y };
}

/**
 * Calculate polynomial coefficients using least squares
 */
function fitPolynomial(x: number[], y: number[], degree: number): number[] {
  const n = x.length;
  
  // Build the Vandermonde matrix
  const X: number[][] = [];
  for (let i = 0; i < n; i++) {
    const row: number[] = [];
    for (let j = 0; j <= degree; j++) {
      row.push(Math.pow(x[i], j));
    }
    X.push(row);
  }
  
  // Solve using normal equations: (X'X)^-1 X'y
  // Simplified implementation for degrees 1-3
  if (degree === 1) {
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    return [intercept, slope];
  }
  
  // For higher degrees, use a simple gradient descent approximation
  const coeffs = new Array(degree + 1).fill(0);
  const learningRate = 0.0001;
  const iterations = 1000;
  
  for (let iter = 0; iter < iterations; iter++) {
    const gradients = new Array(degree + 1).fill(0);
    
    for (let i = 0; i < n; i++) {
      let prediction = 0;
      for (let j = 0; j <= degree; j++) {
        prediction += coeffs[j] * Math.pow(x[i], j);
      }
      const error = prediction - y[i];
      
      for (let j = 0; j <= degree; j++) {
        gradients[j] += (2 / n) * error * Math.pow(x[i], j);
      }
    }
    
    for (let j = 0; j <= degree; j++) {
      coeffs[j] -= learningRate * gradients[j];
    }
  }
  
  return coeffs;
}

/**
 * Evaluate polynomial at a point
 */
function evaluatePolynomial(coeffs: number[], x: number): number {
  return coeffs.reduce((sum, coeff, power) => sum + coeff * Math.pow(x, power), 0);
}

/**
 * Calculate R² (coefficient of determination)
 */
function calculateR2(actual: number[], predicted: number[]): number {
  const n = actual.length;
  const meanActual = actual.reduce((a, b) => a + b, 0) / n;
  
  const ssRes = actual.reduce((sum, yi, i) => sum + Math.pow(yi - predicted[i], 2), 0);
  const ssTot = actual.reduce((sum, yi) => sum + Math.pow(yi - meanActual, 2), 0);
  
  return ssTot === 0 ? 0 : 1 - ssRes / ssTot;
}

/**
 * Calculate Pearson correlation coefficient
 */
function calculateCorrelation(x: number[], y: number[]): number {
  const n = x.length;
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

/**
 * Assess overfitting risk based on degree and data size
 */
function assessOverfittingRisk(
  degree: number,
  dataSize: number,
  r2Train: number
): 'low' | 'medium' | 'high' {
  // Rule of thumb: need at least 10-20 samples per parameter
  const parametersPerSample = (degree + 1) / dataSize;
  
  if (parametersPerSample > 0.2 || (degree >= 3 && r2Train > 0.95)) {
    return 'high';
  }
  if (parametersPerSample > 0.1 || (degree >= 2 && r2Train > 0.98)) {
    return 'medium';
  }
  return 'low';
}

/**
 * Format polynomial formula as a string
 */
function formatPolynomialFormula(featureName: string, degree: number, coeffs?: number[]): string {
  if (!coeffs) {
    if (degree === 2) {
      return `${featureName}² = ${featureName} × ${featureName}`;
    }
    return `${featureName}³ = ${featureName} × ${featureName} × ${featureName}`;
  }
  
  const terms: string[] = [];
  for (let i = coeffs.length - 1; i >= 0; i--) {
    const coeff = coeffs[i];
    if (Math.abs(coeff) < 0.001) continue;
    
    let term = '';
    if (i === 0) {
      term = coeff.toFixed(2);
    } else if (i === 1) {
      term = `${coeff.toFixed(2)}${featureName}`;
    } else {
      term = `${coeff.toFixed(2)}${featureName}^${i}`;
    }
    
    if (terms.length > 0 && coeff > 0) {
      term = '+ ' + term;
    }
    terms.push(term);
  }
  
  return `y = ${terms.join(' ')}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export function PolynomialFeaturesDemo({
  featureData,
  targetData,
  featureName = 'x',
  onCreateFeature,
  showAnimation = true,
}: PolynomialFeaturesDemoProps) {
  // State
  const [selectedDegree, setSelectedDegree] = useState<2 | 3>(2);
  const [showFit, setShowFit] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [createdFeatures, setCreatedFeatures] = useState<PolynomialFeatureResult[]>([]);

  // Generate or use provided data
  const { xData, yData } = useMemo(() => {
    if (featureData && targetData && featureData.length === targetData.length) {
      return { xData: featureData, yData: targetData };
    }
    const sample = generateSampleData(50);
    return { xData: sample.x, yData: sample.y };
  }, [featureData, targetData]);

  // Fit polynomials
  const { linearCoeffs, poly2Coeffs, poly3Coeffs } = useMemo(() => {
    return {
      linearCoeffs: fitPolynomial(xData, yData, 1),
      poly2Coeffs: fitPolynomial(xData, yData, 2),
      poly3Coeffs: fitPolynomial(xData, yData, 3),
    };
  }, [xData, yData]);

  // Calculate R² values
  const r2Values = useMemo(() => {
    const linearPred = xData.map(x => evaluatePolynomial(linearCoeffs, x));
    const poly2Pred = xData.map(x => evaluatePolynomial(poly2Coeffs, x));
    const poly3Pred = xData.map(x => evaluatePolynomial(poly3Coeffs, x));

    return {
      linear: calculateR2(yData, linearPred),
      poly2: calculateR2(yData, poly2Pred),
      poly3: calculateR2(yData, poly3Pred),
    };
  }, [xData, yData, linearCoeffs, poly2Coeffs, poly3Coeffs]);

  // Calculate correlations with polynomial terms
  const correlations = useMemo(() => {
    const x2 = xData.map(x => x * x);
    const x3 = xData.map(x => x * x * x);

    return {
      linear: calculateCorrelation(xData, yData),
      poly2: calculateCorrelation(x2, yData),
      poly3: calculateCorrelation(x3, yData),
    };
  }, [xData, yData]);

  // Prepare chart data
  const chartData = useMemo(() => {
    const minX = Math.min(...xData);
    const maxX = Math.max(...xData);
    const range = maxX - minX;
    
    // Data points
    const points: DataPoint[] = xData.map((x, i) => ({
      x,
      y: yData[i],
    }));

    // Fit lines (more points for smooth curves)
    const fitPoints: DataPoint[] = [];
    for (let i = 0; i <= 100; i++) {
      const x = minX + (i / 100) * range;
      fitPoints.push({
        x,
        y: evaluatePolynomial(linearCoeffs, x),
        yPoly2: evaluatePolynomial(poly2Coeffs, x),
        yPoly3: evaluatePolynomial(poly3Coeffs, x),
      });
    }

    return { points, fitPoints };
  }, [xData, yData, linearCoeffs, poly2Coeffs, poly3Coeffs]);

  // Overfitting risk assessment
  const overfittingRisk = useMemo(() => {
    return assessOverfittingRisk(
      selectedDegree,
      xData.length,
      selectedDegree === 2 ? r2Values.poly2 : r2Values.poly3
    );
  }, [selectedDegree, xData.length, r2Values]);

  // R² improvement
  const r2Improvement = useMemo(() => {
    const currentR2 = selectedDegree === 2 ? r2Values.poly2 : r2Values.poly3;
    return ((currentR2 - r2Values.linear) / r2Values.linear) * 100;
  }, [selectedDegree, r2Values]);

  // Handle create feature
  const handleCreateFeature = useCallback(() => {
    setIsCreating(true);
    
    // Simulate async operation
    setTimeout(() => {
      const polynomialValues = xData.map(x => Math.pow(x, selectedDegree));
      const correlation = selectedDegree === 2 ? correlations.poly2 : correlations.poly3;
      const r2Imp = selectedDegree === 2 
        ? r2Values.poly2 - r2Values.linear 
        : r2Values.poly3 - r2Values.linear;

      const result: PolynomialFeatureResult = {
        originalFeature: featureName,
        degree: selectedDegree,
        formula: formatPolynomialFormula(featureName, selectedDegree),
        values: polynomialValues,
        correlation,
        r2Improvement: r2Imp,
        overfittingRisk,
        sampleValues: polynomialValues.slice(0, 5),
      };

      setCreatedFeatures(prev => [...prev, result]);
      onCreateFeature?.(result);
      setIsCreating(false);
    }, 500);
  }, [xData, selectedDegree, featureName, correlations, r2Values, overfittingRisk, onCreateFeature]);

  // Handle reset
  const handleReset = useCallback(() => {
    setCreatedFeatures([]);
    setSelectedDegree(2);
    setShowFit(true);
  }, []);

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-500" />
              Polynomial Features
            </CardTitle>
            <CardDescription>
              Create polynomial terms to capture non-linear relationships in your data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Degree Selection */}
            <div className="flex flex-wrap items-center gap-4">
              <div className="space-y-2">
                <Label>Polynomial Degree</Label>
                <Select
                  value={selectedDegree.toString()}
                  onValueChange={(v) => setSelectedDegree(parseInt(v) as 2 | 3)}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2">Degree 2 (Quadratic)</SelectItem>
                    <SelectItem value="3">Degree 3 (Cubic)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFit(!showFit)}
                >
                  {showFit ? 'Hide Fit' : 'Show Fit'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReset}
                >
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Reset
                </Button>
              </div>
            </div>

            {/* Formula Display */}
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Calculator className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Mathematical Formula</span>
              </div>
              <code className="text-lg font-mono">
                {formatPolynomialFormula(featureName, selectedDegree)}
              </code>
            </div>
          </CardContent>
        </Card>

        {/* Visualization Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Polynomial Fit Visualization</CardTitle>
            <CardDescription>
              See how polynomial terms capture the relationship between {featureName} and the target
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData.fitPoints}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-50" />
                  <XAxis 
                    dataKey="x" 
                    label={{ value: featureName, position: 'bottom', offset: -5 }}
                    tickFormatter={(v) => v.toFixed(1)}
                  />
                  <YAxis 
                    label={{ value: 'Target', angle: -90, position: 'insideLeft' }}
                    tickFormatter={(v) => v.toFixed(1)}
                  />
                  <RechartsTooltip
                    formatter={(value: number) => value.toFixed(3)}
                    labelFormatter={(label) => `${featureName} = ${Number(label).toFixed(2)}`}
                  />
                  <Legend />
                  
                  {/* Scatter points */}
                  <Scatter
                    name="Data Points"
                    data={chartData.points}
                    fill="hsl(var(--primary))"
                    opacity={0.6}
                  />
                  
                  {/* Linear fit */}
                  {showFit && (
                    <Line
                      name="Linear (degree 1)"
                      type="monotone"
                      dataKey="y"
                      stroke="hsl(var(--muted-foreground))"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={false}
                    />
                  )}
                  
                  {/* Polynomial fits */}
                  {showFit && selectedDegree >= 2 && (
                    <Line
                      name="Quadratic (degree 2)"
                      type="monotone"
                      dataKey="yPoly2"
                      stroke="hsl(220, 70%, 50%)"
                      strokeWidth={selectedDegree === 2 ? 3 : 2}
                      dot={false}
                      opacity={selectedDegree === 2 ? 1 : 0.5}
                    />
                  )}
                  
                  {showFit && selectedDegree === 3 && (
                    <Line
                      name="Cubic (degree 3)"
                      type="monotone"
                      dataKey="yPoly3"
                      stroke="hsl(280, 70%, 50%)"
                      strokeWidth={3}
                      dot={false}
                    />
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Metrics Grid */}
        <div className="grid md:grid-cols-3 gap-4">
          {/* R² Improvement */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                R² Improvement
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedDegree}
                  initial={showAnimation ? { opacity: 0, y: 10 } : false}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-2"
                >
                  <div className="text-3xl font-bold text-green-600">
                    +{r2Improvement.toFixed(1)}%
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <div>Linear R²: {(r2Values.linear * 100).toFixed(1)}%</div>
                    <div>
                      Degree {selectedDegree} R²:{' '}
                      {((selectedDegree === 2 ? r2Values.poly2 : r2Values.poly3) * 100).toFixed(1)}%
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </CardContent>
          </Card>

          {/* Correlation with Target */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Target className="h-4 w-4 text-blue-500" />
                Correlation with Target
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedDegree}
                  initial={showAnimation ? { opacity: 0, y: 10 } : false}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-2"
                >
                  <div className="text-3xl font-bold text-blue-600">
                    {(selectedDegree === 2 ? correlations.poly2 : correlations.poly3).toFixed(3)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <div>Linear: {correlations.linear.toFixed(3)}</div>
                    <div>
                      {featureName}^{selectedDegree}:{' '}
                      {(selectedDegree === 2 ? correlations.poly2 : correlations.poly3).toFixed(3)}
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </CardContent>
          </Card>

          {/* Overfitting Risk */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                Overfitting Risk
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${selectedDegree}-${overfittingRisk}`}
                  initial={showAnimation ? { opacity: 0, y: 10 } : false}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-2"
                >
                  <Badge
                    variant={
                      overfittingRisk === 'low' ? 'default' :
                      overfittingRisk === 'medium' ? 'secondary' : 'destructive'
                    }
                    className="text-lg px-3 py-1"
                  >
                    {overfittingRisk.toUpperCase()}
                  </Badge>
                  <div className="text-sm text-muted-foreground">
                    {overfittingRisk === 'low' && 'Safe to use with your data size'}
                    {overfittingRisk === 'medium' && 'Consider cross-validation'}
                    {overfittingRisk === 'high' && 'High risk - use regularization'}
                  </div>
                </motion.div>
              </AnimatePresence>
            </CardContent>
          </Card>
        </div>

        {/* Overfitting Warning */}
        {overfittingRisk !== 'low' && (
          <Alert variant={overfittingRisk === 'high' ? 'destructive' : 'default'}>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Overfitting Warning</AlertTitle>
            <AlertDescription>
              {overfittingRisk === 'high' ? (
                <>
                  <strong>High overfitting risk detected!</strong> With degree {selectedDegree} polynomials 
                  and {xData.length} data points, your model may memorize the training data rather than 
                  learning general patterns. Consider:
                  <ul className="list-disc list-inside mt-2">
                    <li>Using a lower degree polynomial</li>
                    <li>Collecting more training data</li>
                    <li>Applying regularization (Ridge or Lasso)</li>
                    <li>Using cross-validation to assess generalization</li>
                  </ul>
                </>
              ) : (
                <>
                  <strong>Moderate overfitting risk.</strong> The polynomial fit looks good, but validate 
                  with cross-validation to ensure it generalizes well to new data.
                </>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Educational Tip */}
        <Alert>
          <Lightbulb className="h-4 w-4" />
          <AlertTitle>Did you know?</AlertTitle>
          <AlertDescription>
            Polynomial features allow linear models to learn curved relationships. A degree-2 polynomial 
            can capture U-shaped patterns, while degree-3 can capture S-shaped curves. However, higher 
            degrees increase the risk of overfitting - the model may fit the noise in your training data 
            rather than the true underlying pattern.
          </AlertDescription>
        </Alert>

        {/* Create Feature Button */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h4 className="font-semibold">Create Polynomial Feature</h4>
                <p className="text-sm text-muted-foreground">
                  Add {featureName}^{selectedDegree} to your feature set
                </p>
              </div>
              <Button
                onClick={handleCreateFeature}
                disabled={isCreating || createdFeatures.some(f => f.degree === selectedDegree)}
              >
                {isCreating ? (
                  <>Creating...</>
                ) : createdFeatures.some(f => f.degree === selectedDegree) ? (
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
                        <Badge variant="outline">Degree {feature.degree}</Badge>
                        <code className="text-sm">{feature.formula}</code>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>r = {feature.correlation.toFixed(3)}</span>
                        <Tooltip>
                          <TooltipTrigger>
                            <Info className="h-4 w-4" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>R² improvement: +{(feature.r2Improvement * 100).toFixed(1)}%</p>
                            <p>Overfitting risk: {feature.overfittingRisk}</p>
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

export default PolynomialFeaturesDemo;
