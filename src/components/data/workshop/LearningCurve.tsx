/**
 * Learning Curve Visualization Component
 * 
 * Displays training and validation scores across sample sizes,
 * comparing curves before and after transformations.
 * 
 * Requirements: 6.3
 */

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
  Area,
  ComposedChart,
} from 'recharts';
import { motion } from 'motion/react';
import {
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Info,
  Lightbulb,
} from 'lucide-react';
import type { LearningCurveData } from '@/types/workshop';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface LearningCurveProps {
  /** Learning curve data for original features */
  originalCurve?: LearningCurveData;
  /** Learning curve data for transformed features */
  transformedCurve?: LearningCurveData;
  /** Title for the chart */
  title?: string;
  /** Whether to show comparison mode */
  showComparison?: boolean;
  /** Whether to show animations */
  showAnimation?: boolean;
  /** Metric name (e.g., "R²", "Accuracy") */
  metricName?: string;
}

type DiagnosisType = 'good_fit' | 'high_variance' | 'high_bias' | 'unknown';

interface Diagnosis {
  type: DiagnosisType;
  title: string;
  description: string;
  suggestions: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper Functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generate sample learning curve data
 */
function generateSampleCurve(
  type: 'good' | 'high_variance' | 'high_bias',
  steps: number = 10
): LearningCurveData {
  const trainingSizes: number[] = [];
  const trainingScores: number[] = [];
  const validationScores: number[] = [];
  
  for (let i = 1; i <= steps; i++) {
    const size = i * 10;
    trainingSizes.push(size);
    
    const progress = i / steps;
    
    switch (type) {
      case 'good':
        // Good fit: both converge to high values
        trainingScores.push(0.7 + 0.25 * progress + (Math.random() - 0.5) * 0.05);
        validationScores.push(0.65 + 0.25 * progress + (Math.random() - 0.5) * 0.05);
        break;
      case 'high_variance':
        // High variance: training high, validation low
        trainingScores.push(0.9 + 0.08 * progress + (Math.random() - 0.5) * 0.02);
        validationScores.push(0.4 + 0.2 * progress + (Math.random() - 0.5) * 0.08);
        break;
      case 'high_bias':
        // High bias: both low
        trainingScores.push(0.3 + 0.15 * progress + (Math.random() - 0.5) * 0.05);
        validationScores.push(0.25 + 0.15 * progress + (Math.random() - 0.5) * 0.05);
        break;
    }
  }
  
  return { trainingSizes, trainingScores, validationScores };
}

/**
 * Diagnose the learning curve
 */
function diagnoseCurve(curve: LearningCurveData): Diagnosis {
  if (curve.trainingSizes.length === 0) {
    return {
      type: 'unknown',
      title: 'Insufficient Data',
      description: 'Not enough data points to diagnose the learning curve.',
      suggestions: ['Run simulation with more data points'],
    };
  }
  
  const lastIdx = curve.trainingSizes.length - 1;
  const trainScore = curve.trainingScores[lastIdx];
  const valScore = curve.validationScores[lastIdx];
  const gap = trainScore - valScore;
  
  if (gap > 0.15 && trainScore > 0.8) {
    return {
      type: 'high_variance',
      title: 'High Variance (Overfitting)',
      description: 'The model performs well on training data but poorly on validation data.',
      suggestions: [
        'Add regularization (L1/L2)',
        'Reduce model complexity',
        'Get more training data',
        'Use feature selection',
        'Apply dropout (for neural networks)',
      ],
    };
  }
  
  if (trainScore < 0.6 && valScore < 0.6) {
    return {
      type: 'high_bias',
      title: 'High Bias (Underfitting)',
      description: 'The model performs poorly on both training and validation data.',
      suggestions: [
        'Add more features',
        'Use polynomial features',
        'Reduce regularization',
        'Use a more complex model',
        'Engineer better features',
      ],
    };
  }
  
  return {
    type: 'good_fit',
    title: 'Good Fit',
    description: 'The model generalizes well with similar training and validation performance.',
    suggestions: [
      'Model is performing well',
      'Consider fine-tuning hyperparameters',
      'Validate on held-out test set',
    ],
  };
}

/**
 * Calculate improvement between two curves
 */
function calculateImprovement(
  original: LearningCurveData,
  transformed: LearningCurveData
): { training: number; validation: number } {
  if (original.trainingSizes.length === 0 || transformed.trainingSizes.length === 0) {
    return { training: 0, validation: 0 };
  }
  
  const origLastIdx = original.trainingSizes.length - 1;
  const transLastIdx = transformed.trainingSizes.length - 1;
  
  const origTrain = original.trainingScores[origLastIdx];
  const origVal = original.validationScores[origLastIdx];
  const transTrain = transformed.trainingScores[transLastIdx];
  const transVal = transformed.validationScores[transLastIdx];
  
  return {
    training: origTrain > 0 ? ((transTrain - origTrain) / origTrain) * 100 : 0,
    validation: origVal > 0 ? ((transVal - origVal) / origVal) * 100 : 0,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export function LearningCurve({
  originalCurve,
  transformedCurve,
  title = 'Learning Curve',
  showComparison = true,
  showAnimation = true,
  metricName = 'R²',
}: LearningCurveProps) {
  // Use provided data or generate samples
  const original = useMemo(() => {
    return originalCurve || generateSampleCurve('high_variance');
  }, [originalCurve]);
  
  const transformed = useMemo(() => {
    return transformedCurve || generateSampleCurve('good');
  }, [transformedCurve]);

  // Prepare chart data
  const chartData = useMemo(() => {
    const maxLen = Math.max(original.trainingSizes.length, transformed.trainingSizes.length);
    const data = [];
    
    for (let i = 0; i < maxLen; i++) {
      data.push({
        size: original.trainingSizes[i] || transformed.trainingSizes[i],
        origTraining: original.trainingScores[i],
        origValidation: original.validationScores[i],
        transTraining: transformed.trainingScores[i],
        transValidation: transformed.validationScores[i],
      });
    }
    
    return data;
  }, [original, transformed]);

  // Diagnose curves
  const originalDiagnosis = useMemo(() => diagnoseCurve(original), [original]);
  const transformedDiagnosis = useMemo(() => diagnoseCurve(transformed), [transformed]);

  // Calculate improvement
  const improvement = useMemo(() => {
    return calculateImprovement(original, transformed);
  }, [original, transformed]);

  // Get diagnosis icon
  const getDiagnosisIcon = (type: DiagnosisType) => {
    switch (type) {
      case 'good_fit':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'high_variance':
      case 'high_bias':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Info className="h-4 w-4 text-muted-foreground" />;
    }
  };

  // Get diagnosis color
  const getDiagnosisColor = (type: DiagnosisType) => {
    switch (type) {
      case 'good_fit':
        return 'border-green-500 bg-green-50 dark:bg-green-950';
      case 'high_variance':
        return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950';
      case 'high_bias':
        return 'border-orange-500 bg-orange-50 dark:bg-orange-950';
      default:
        return '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Main Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-500" />
            {title}
          </CardTitle>
          <CardDescription>
            {showComparison 
              ? 'Compare learning curves before and after transformations'
              : 'Training and validation scores across sample sizes'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <motion.div
            initial={showAnimation ? { opacity: 0 } : false}
            animate={{ opacity: 1 }}
            className="h-[350px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-50" />
                <XAxis 
                  dataKey="size" 
                  label={{ value: 'Training Samples', position: 'bottom', offset: -5 }}
                />
                <YAxis 
                  domain={[0, 1]}
                  tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
                  label={{ value: metricName, angle: -90, position: 'insideLeft' }}
                />
                <RechartsTooltip
                  formatter={(value: number, name: string) => [
                    `${(value * 100).toFixed(1)}%`,
                    name.replace('orig', 'Original ').replace('trans', 'Transformed ')
                      .replace('Training', 'Training').replace('Validation', 'Validation')
                  ]}
                />
                <Legend />
                
                {showComparison && (
                  <>
                    {/* Original curves (dashed) */}
                    <Line
                      type="monotone"
                      dataKey="origTraining"
                      name="Original Training"
                      stroke="hsl(220, 50%, 60%)"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={{ r: 3 }}
                      opacity={0.7}
                    />
                    <Line
                      type="monotone"
                      dataKey="origValidation"
                      name="Original Validation"
                      stroke="hsl(0, 50%, 60%)"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={{ r: 3 }}
                      opacity={0.7}
                    />
                  </>
                )}
                
                {/* Transformed curves (solid) */}
                <Line
                  type="monotone"
                  dataKey="transTraining"
                  name={showComparison ? "Transformed Training" : "Training"}
                  stroke="hsl(220, 70%, 50%)"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="transValidation"
                  name={showComparison ? "Transformed Validation" : "Validation"}
                  stroke="hsl(142, 70%, 45%)"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </motion.div>
          
          {/* Legend explanation */}
          {showComparison && (
            <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-8 h-0.5 border-t-2 border-dashed border-muted-foreground" />
                <span>Original (before transformations)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-0.5 bg-primary" />
                <span>Transformed (after transformations)</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Improvement Summary */}
      {showComparison && (
        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Training Score Improvement</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${improvement.training >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {improvement.training >= 0 ? '+' : ''}{improvement.training.toFixed(1)}%
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Validation Score Improvement</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${improvement.validation >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {improvement.validation >= 0 ? '+' : ''}{improvement.validation.toFixed(1)}%
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Diagnosis Cards */}
      <div className={showComparison ? 'grid md:grid-cols-2 gap-4' : ''}>
        {showComparison && (
          <Card className={`border-2 ${getDiagnosisColor(originalDiagnosis.type)}`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                {getDiagnosisIcon(originalDiagnosis.type)}
                Original: {originalDiagnosis.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                {originalDiagnosis.description}
              </p>
              <div className="space-y-1">
                {originalDiagnosis.suggestions.slice(0, 3).map((suggestion, i) => (
                  <Badge key={i} variant="outline" className="mr-1 mb-1">
                    {suggestion}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
        
        <Card className={`border-2 ${getDiagnosisColor(transformedDiagnosis.type)}`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              {getDiagnosisIcon(transformedDiagnosis.type)}
              {showComparison ? 'Transformed: ' : ''}{transformedDiagnosis.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              {transformedDiagnosis.description}
            </p>
            <div className="space-y-1">
              {transformedDiagnosis.suggestions.slice(0, 3).map((suggestion, i) => (
                <Badge key={i} variant="outline" className="mr-1 mb-1">
                  {suggestion}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Educational Tip */}
      <Alert>
        <Lightbulb className="h-4 w-4" />
        <AlertDescription>
          <strong>Reading Learning Curves:</strong> The gap between training and validation curves 
          indicates variance (overfitting risk). If both curves are low, the model has high bias 
          (underfitting). Ideally, both curves should converge to high values with minimal gap.
        </AlertDescription>
      </Alert>
    </div>
  );
}

export default LearningCurve;
