/**
 * Impact Simulator Component
 * 
 * Simulates the impact of feature transformations on model performance.
 * Trains simple models on original and transformed data to show improvement.
 * 
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6
 */

import { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
  Cell,
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import {
  Play,
  TrendingUp,
  TrendingDown,
  Target,
  Lightbulb,
  BarChart3,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Zap,
} from 'lucide-react';
import type { 
  ModelMetrics, 
  LearningCurveData, 
  ImpactSimulationResult,
  AppliedTransformation,
} from '@/types/workshop';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface ImpactSimulatorProps {
  /** Original feature data */
  originalData?: number[][];
  /** Transformed feature data */
  transformedData?: number[][];
  /** Target variable */
  targetData?: number[];
  /** Applied transformations for tracking */
  appliedTransformations?: AppliedTransformation[];
  /** Model type to simulate */
  modelType?: 'regression' | 'classification';
  /** Whether to show animations */
  showAnimation?: boolean;
  /** Callback when simulation completes */
  onSimulationComplete?: (result: ImpactSimulationResult) => void;
}

type SimulationStatus = 'idle' | 'running' | 'complete' | 'error';

// ─────────────────────────────────────────────────────────────────────────────
// Simple ML Implementations (for demonstration)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Simple linear regression using gradient descent
 */
function trainLinearRegression(
  X: number[][],
  y: number[],
  learningRate: number = 0.01,
  iterations: number = 100
): { weights: number[]; bias: number } {
  const n = X.length;
  const features = X[0]?.length || 1;
  
  let weights = new Array(features).fill(0);
  let bias = 0;
  
  for (let iter = 0; iter < iterations; iter++) {
    let biasGradient = 0;
    const weightGradients = new Array(features).fill(0);
    
    for (let i = 0; i < n; i++) {
      let prediction = bias;
      for (let j = 0; j < features; j++) {
        prediction += weights[j] * (X[i][j] || 0);
      }
      const error = prediction - y[i];
      
      biasGradient += error;
      for (let j = 0; j < features; j++) {
        weightGradients[j] += error * (X[i][j] || 0);
      }
    }
    
    bias -= (learningRate * biasGradient) / n;
    for (let j = 0; j < features; j++) {
      weights[j] -= (learningRate * weightGradients[j]) / n;
    }
  }
  
  return { weights, bias };
}

/**
 * Predict using linear regression model
 */
function predictLinearRegression(
  X: number[][],
  weights: number[],
  bias: number
): number[] {
  return X.map(row => {
    let prediction = bias;
    for (let j = 0; j < weights.length; j++) {
      prediction += weights[j] * (row[j] || 0);
    }
    return prediction;
  });
}

/**
 * Calculate R² score
 */
function calculateR2(actual: number[], predicted: number[]): number {
  const n = actual.length;
  const meanActual = actual.reduce((a, b) => a + b, 0) / n;
  
  const ssRes = actual.reduce((sum, yi, i) => sum + Math.pow(yi - predicted[i], 2), 0);
  const ssTot = actual.reduce((sum, yi) => sum + Math.pow(yi - meanActual, 2), 0);
  
  return ssTot === 0 ? 0 : Math.max(0, 1 - ssRes / ssTot);
}

/**
 * Calculate MSE
 */
function calculateMSE(actual: number[], predicted: number[]): number {
  const n = actual.length;
  return actual.reduce((sum, yi, i) => sum + Math.pow(yi - predicted[i], 2), 0) / n;
}

/**
 * Calculate MAE
 */
function calculateMAE(actual: number[], predicted: number[]): number {
  const n = actual.length;
  return actual.reduce((sum, yi, i) => sum + Math.abs(yi - predicted[i]), 0) / n;
}

/**
 * Perform k-fold cross-validation
 */
function crossValidate(
  X: number[][],
  y: number[],
  k: number = 5
): number[] {
  const n = X.length;
  const foldSize = Math.floor(n / k);
  const scores: number[] = [];
  
  for (let fold = 0; fold < k; fold++) {
    const testStart = fold * foldSize;
    const testEnd = fold === k - 1 ? n : (fold + 1) * foldSize;
    
    const XTrain: number[][] = [];
    const yTrain: number[] = [];
    const XTest: number[][] = [];
    const yTest: number[] = [];
    
    for (let i = 0; i < n; i++) {
      if (i >= testStart && i < testEnd) {
        XTest.push(X[i]);
        yTest.push(y[i]);
      } else {
        XTrain.push(X[i]);
        yTrain.push(y[i]);
      }
    }
    
    if (XTrain.length > 0 && XTest.length > 0) {
      const model = trainLinearRegression(XTrain, yTrain);
      const predictions = predictLinearRegression(XTest, model.weights, model.bias);
      scores.push(calculateR2(yTest, predictions));
    }
  }
  
  return scores;
}

/**
 * Generate learning curve data
 */
function generateLearningCurve(
  X: number[][],
  y: number[],
  steps: number = 10
): LearningCurveData {
  const n = X.length;
  const trainingSizes: number[] = [];
  const trainingScores: number[] = [];
  const validationScores: number[] = [];
  
  // Split into train/validation (80/20)
  const splitIdx = Math.floor(n * 0.8);
  const XVal = X.slice(splitIdx);
  const yVal = y.slice(splitIdx);
  
  for (let step = 1; step <= steps; step++) {
    const size = Math.floor((step / steps) * splitIdx);
    if (size < 5) continue;
    
    const XTrain = X.slice(0, size);
    const yTrain = y.slice(0, size);
    
    const model = trainLinearRegression(XTrain, yTrain);
    
    const trainPred = predictLinearRegression(XTrain, model.weights, model.bias);
    const valPred = predictLinearRegression(XVal, model.weights, model.bias);
    
    trainingSizes.push(size);
    trainingScores.push(calculateR2(yTrain, trainPred));
    validationScores.push(calculateR2(yVal, valPred));
  }
  
  return { trainingSizes, trainingScores, validationScores };
}

// ─────────────────────────────────────────────────────────────────────────────
// Sample Data Generation
// ─────────────────────────────────────────────────────────────────────────────

function generateSampleData(size: number = 100): {
  original: number[][];
  transformed: number[][];
  target: number[];
} {
  const original: number[][] = [];
  const transformed: number[][] = [];
  const target: number[] = [];
  
  for (let i = 0; i < size; i++) {
    // Original features (with some noise and skewness)
    const x1 = Math.pow(Math.random(), 0.5) * 100; // Right-skewed
    const x2 = Math.random() * 50 + 10;
    const x3 = Math.random() * 30;
    
    original.push([x1, x2, x3]);
    
    // Transformed features (log, standardized, polynomial)
    const t1 = Math.log(x1 + 1); // Log transform
    const t2 = (x2 - 35) / 15;   // Standardized
    const t3 = x3 * x3 / 900;    // Polynomial (normalized)
    
    transformed.push([t1, t2, t3]);
    
    // Target with non-linear relationship
    const noise = (Math.random() - 0.5) * 10;
    target.push(0.5 * Math.log(x1 + 1) + 0.3 * x2 + 0.01 * x3 * x3 + noise);
  }
  
  return { original, transformed, target };
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export function ImpactSimulator({
  originalData,
  transformedData,
  targetData,
  appliedTransformations = [],
  modelType = 'regression',
  showAnimation = true,
  onSimulationComplete,
}: ImpactSimulatorProps) {
  const [status, setStatus] = useState<SimulationStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ImpactSimulationResult | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<'r2' | 'mse' | 'mae'>('r2');

  // Use provided data or generate sample
  const { original, transformed, target } = useMemo(() => {
    if (originalData && transformedData && targetData) {
      return {
        original: originalData,
        transformed: transformedData,
        target: targetData,
      };
    }
    return generateSampleData(100);
  }, [originalData, transformedData, targetData]);

  // Run simulation
  const runSimulation = useCallback(async () => {
    setStatus('running');
    setProgress(0);
    
    try {
      // Simulate async processing with progress updates
      await new Promise(resolve => setTimeout(resolve, 200));
      setProgress(20);
      
      // Train on original data
      const originalModel = trainLinearRegression(original, target);
      const originalPred = predictLinearRegression(original, originalModel.weights, originalModel.bias);
      
      await new Promise(resolve => setTimeout(resolve, 200));
      setProgress(40);
      
      // Train on transformed data
      const transformedModel = trainLinearRegression(transformed, target);
      const transformedPred = predictLinearRegression(transformed, transformedModel.weights, transformedModel.bias);
      
      await new Promise(resolve => setTimeout(resolve, 200));
      setProgress(60);
      
      // Calculate metrics
      const originalMetrics: ModelMetrics = {
        r2: calculateR2(target, originalPred),
        mse: calculateMSE(target, originalPred),
        mae: calculateMAE(target, originalPred),
      };
      
      const transformedMetrics: ModelMetrics = {
        r2: calculateR2(target, transformedPred),
        mse: calculateMSE(target, transformedPred),
        mae: calculateMAE(target, transformedPred),
      };
      
      await new Promise(resolve => setTimeout(resolve, 200));
      setProgress(80);
      
      // Cross-validation
      const cvScores = crossValidate(transformed, target, 5);
      
      // Learning curves
      const learningCurve = generateLearningCurve(transformed, target);
      
      await new Promise(resolve => setTimeout(resolve, 200));
      setProgress(100);
      
      // Calculate improvements
      const r2Improvement = originalMetrics.r2 
        ? ((transformedMetrics.r2! - originalMetrics.r2) / originalMetrics.r2) * 100 
        : 0;
      
      // Generate recommendation
      let recommendation = '';
      if (r2Improvement > 10) {
        recommendation = 'Excellent! The transformations significantly improved model performance. Consider applying these to your production pipeline.';
      } else if (r2Improvement > 5) {
        recommendation = 'Good improvement! The transformations are beneficial. You might explore additional transformations for further gains.';
      } else if (r2Improvement > 0) {
        recommendation = 'Modest improvement. The transformations help slightly. Consider trying different transformation combinations.';
      } else {
        recommendation = 'The transformations did not improve performance. Try different approaches or the original features may already be well-suited for this task.';
      }
      
      const simulationResult: ImpactSimulationResult = {
        originalMetrics,
        transformedMetrics,
        improvement: {
          r2: r2Improvement,
          mse: originalMetrics.mse 
            ? ((originalMetrics.mse - transformedMetrics.mse!) / originalMetrics.mse) * 100 
            : 0,
        },
        learningCurve,
        crossValidationScores: cvScores,
        recommendation,
      };
      
      setResult(simulationResult);
      setStatus('complete');
      onSimulationComplete?.(simulationResult);
      
    } catch (error) {
      setStatus('error');
      console.error('Simulation error:', error);
    }
  }, [original, transformed, target, onSimulationComplete]);

  // Prepare learning curve chart data
  const learningCurveData = useMemo(() => {
    if (!result?.learningCurve) return [];
    
    return result.learningCurve.trainingSizes.map((size, i) => ({
      size,
      training: result.learningCurve.trainingScores[i],
      validation: result.learningCurve.validationScores[i],
    }));
  }, [result]);

  // Prepare CV scores chart data
  const cvData = useMemo(() => {
    if (!result?.crossValidationScores) return [];
    
    return result.crossValidationScores.map((score, i) => ({
      fold: `Fold ${i + 1}`,
      score,
    }));
  }, [result]);

  // Prepare metrics comparison data
  const metricsComparisonData = useMemo(() => {
    if (!result) return [];
    
    return [
      {
        metric: 'R²',
        original: result.originalMetrics.r2 || 0,
        transformed: result.transformedMetrics.r2 || 0,
      },
      {
        metric: 'MSE',
        original: result.originalMetrics.mse || 0,
        transformed: result.transformedMetrics.mse || 0,
      },
      {
        metric: 'MAE',
        original: result.originalMetrics.mae || 0,
        transformed: result.transformedMetrics.mae || 0,
      },
    ];
  }, [result]);

  // Get improvement color
  const getImprovementColor = (value: number) => {
    if (value > 10) return 'text-green-600';
    if (value > 0) return 'text-green-500';
    if (value > -5) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-500" />
            Impact Simulator
          </CardTitle>
          <CardDescription>
            Simulate how your transformations affect model performance
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-4">
            <Button
              onClick={runSimulation}
              disabled={status === 'running'}
            >
              {status === 'running' ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Simulating...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Run Simulation
                </>
              )}
            </Button>
            
            {appliedTransformations.length > 0 && (
              <Badge variant="secondary">
                {appliedTransformations.length} transformation(s) applied
              </Badge>
            )}
          </div>
          
          {status === 'running' && (
            <div className="space-y-2">
              <Progress value={progress} />
              <p className="text-sm text-muted-foreground">
                {progress < 40 && 'Training on original data...'}
                {progress >= 40 && progress < 60 && 'Training on transformed data...'}
                {progress >= 60 && progress < 80 && 'Calculating metrics...'}
                {progress >= 80 && 'Running cross-validation...'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      <AnimatePresence>
        {status === 'complete' && result && (
          <motion.div
            initial={showAnimation ? { opacity: 0, y: 20 } : false}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Summary Cards */}
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
                  <div className={`text-3xl font-bold ${getImprovementColor(result.improvement.r2 || 0)}`}>
                    {(result.improvement.r2 || 0) >= 0 ? '+' : ''}
                    {(result.improvement.r2 || 0).toFixed(1)}%
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {(result.originalMetrics.r2! * 100).toFixed(1)}% → {(result.transformedMetrics.r2! * 100).toFixed(1)}%
                  </div>
                </CardContent>
              </Card>

              {/* MSE Reduction */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <TrendingDown className="h-4 w-4 text-blue-500" />
                    MSE Reduction
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-3xl font-bold ${getImprovementColor(result.improvement.mse || 0)}`}>
                    {(result.improvement.mse || 0) >= 0 ? '+' : ''}
                    {(result.improvement.mse || 0).toFixed(1)}%
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {result.originalMetrics.mse!.toFixed(2)} → {result.transformedMetrics.mse!.toFixed(2)}
                  </div>
                </CardContent>
              </Card>

              {/* CV Score */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-purple-500" />
                    Cross-Validation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-600">
                    {(result.crossValidationScores.reduce((a, b) => a + b, 0) / result.crossValidationScores.length * 100).toFixed(1)}%
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    Mean R² across {result.crossValidationScores.length} folds
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Learning Curve */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Learning Curve</CardTitle>
                <CardDescription>
                  How model performance changes with training data size
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={learningCurveData}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-50" />
                      <XAxis 
                        dataKey="size" 
                        label={{ value: 'Training Samples', position: 'bottom', offset: -5 }}
                      />
                      <YAxis 
                        domain={[0, 1]}
                        tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
                        label={{ value: 'R² Score', angle: -90, position: 'insideLeft' }}
                      />
                      <RechartsTooltip
                        formatter={(value: number) => `${(value * 100).toFixed(1)}%`}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="training"
                        name="Training Score"
                        stroke="hsl(220, 70%, 50%)"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="validation"
                        name="Validation Score"
                        stroke="hsl(142, 70%, 45%)"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                
                {/* Learning curve interpretation */}
                <Alert className="mt-4">
                  <Lightbulb className="h-4 w-4" />
                  <AlertDescription>
                    {learningCurveData.length > 0 && (
                      <>
                        {learningCurveData[learningCurveData.length - 1]?.training - 
                         learningCurveData[learningCurveData.length - 1]?.validation > 0.1 ? (
                          <span>
                            <strong>High variance detected:</strong> The gap between training and validation 
                            suggests overfitting. Consider regularization or more training data.
                          </span>
                        ) : learningCurveData[learningCurveData.length - 1]?.validation < 0.5 ? (
                          <span>
                            <strong>High bias detected:</strong> Both scores are low, suggesting the model 
                            is underfitting. Consider more complex features or models.
                          </span>
                        ) : (
                          <span>
                            <strong>Good fit:</strong> Training and validation scores are close and reasonably 
                            high, indicating the model generalizes well.
                          </span>
                        )}
                      </>
                    )}
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            {/* Cross-Validation Scores */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Cross-Validation Scores</CardTitle>
                <CardDescription>
                  R² score for each fold in 5-fold cross-validation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={cvData}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-50" />
                      <XAxis dataKey="fold" />
                      <YAxis 
                        domain={[0, 1]}
                        tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
                      />
                      <RechartsTooltip
                        formatter={(value: number) => `${(value * 100).toFixed(1)}%`}
                      />
                      <Bar dataKey="score" name="R² Score">
                        {cvData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={entry.score > 0.7 ? 'hsl(142, 70%, 45%)' : 
                                  entry.score > 0.5 ? 'hsl(45, 70%, 50%)' : 
                                  'hsl(0, 70%, 50%)'}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="mt-4 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    Std Dev: ±{(
                      Math.sqrt(
                        result.crossValidationScores.reduce((sum, s) => {
                          const mean = result.crossValidationScores.reduce((a, b) => a + b, 0) / result.crossValidationScores.length;
                          return sum + Math.pow(s - mean, 2);
                        }, 0) / result.crossValidationScores.length
                      ) * 100
                    ).toFixed(1)}%
                  </span>
                  <Badge variant={
                    result.crossValidationScores.every(s => s > 0.6) ? 'default' : 'secondary'
                  }>
                    {result.crossValidationScores.every(s => s > 0.6) ? 'Stable' : 'Variable'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Recommendation */}
            <Alert variant={result.improvement.r2! > 5 ? 'default' : 'destructive'}>
              {result.improvement.r2! > 5 ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <AlertTriangle className="h-4 w-4" />
              )}
              <AlertTitle>Recommendation</AlertTitle>
              <AlertDescription>{result.recommendation}</AlertDescription>
            </Alert>

            {/* Incremental Improvements */}
            {appliedTransformations.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Zap className="h-5 w-5 text-yellow-500" />
                    Transformation Impact Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {appliedTransformations.map((t, index) => (
                      <div key={t.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline">{index + 1}</Badge>
                          <div>
                            <div className="font-medium">{t.type}</div>
                            <div className="text-sm text-muted-foreground">{t.feature}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`font-semibold ${t.performanceImpact > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {t.performanceImpact > 0 ? '+' : ''}{(t.performanceImpact * 100).toFixed(1)}%
                          </div>
                          <div className="text-xs text-muted-foreground">performance</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error State */}
      {status === 'error' && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Simulation Error</AlertTitle>
          <AlertDescription>
            An error occurred during simulation. Please try again.
          </AlertDescription>
        </Alert>
      )}

      {/* Idle State Info */}
      {status === 'idle' && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground py-8">
              <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="font-semibold mb-2">Ready to Simulate</h3>
              <p className="text-sm max-w-md mx-auto">
                Click "Run Simulation" to train models on your original and transformed data, 
                then compare their performance using R², MSE, and cross-validation.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default ImpactSimulator;
