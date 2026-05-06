import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { biasVarianceService } from '@/services/biasVarianceService';
import type { BiasVarianceAnalysis } from '@/services/biasVarianceService';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, Dot } from 'recharts';
import { Target, TrendingUp, TrendingDown, Info, AlertTriangle, CheckCircle2, Lightbulb } from 'lucide-react';

interface BiasVarianceTradeoffProps {
  currentLayers?: number;
  currentNeurons?: number;
}

export function BiasVarianceTradeoff({ currentLayers = 2, currentNeurons = 64 }: BiasVarianceTradeoffProps) {
  const [analysis] = useState<BiasVarianceAnalysis>(
    biasVarianceService.generateBiasVarianceCurve(currentLayers, currentNeurons)
  );

  const explanations = biasVarianceService.getExplanation();
  const adjustmentTips = biasVarianceService.getComplexityAdjustmentTips();

  const isNearOptimal = Math.abs(analysis.currentComplexity - analysis.optimalComplexity) < 1;
  const isTooSimple = analysis.currentComplexity < analysis.optimalComplexity - 1;
  const isTooComplex = analysis.currentComplexity > analysis.optimalComplexity + 1;

  // Custom dot for optimal point
  const renderOptimalDot = (props: any) => {
    const { cx, cy, payload } = props;
    if (Math.abs(payload.complexity - analysis.optimalComplexity) < 0.1) {
      return (
        <g>
          <circle cx={cx} cy={cy} r={8} fill="hsl(var(--chart-1))" stroke="white" strokeWidth={2} />
          <circle cx={cx} cy={cy} r={4} fill="white" />
        </g>
      );
    }
    return null;
  };

  // Custom dot for current point
  const renderCurrentDot = (props: any) => {
    const { cx, cy, payload } = props;
    if (Math.abs(payload.complexity - analysis.currentComplexity) < 0.1) {
      return (
        <g>
          <circle cx={cx} cy={cy} r={8} fill="hsl(var(--chart-2))" stroke="white" strokeWidth={2} />
          <Target x={cx - 6} y={cy - 6} className="h-3 w-3 text-white" />
        </g>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="text-balance flex items-center gap-2">
            <Target className="h-5 w-5" />
            Bias-Variance Tradeoff
          </CardTitle>
          <CardDescription className="text-pretty">
            Understanding how model complexity affects bias, variance, and total error
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              The bias-variance tradeoff is fundamental to machine learning. Simple models have high bias
              (underfitting), complex models have high variance (overfitting). The optimal model balances both.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Current Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-balance">Your Model's Position</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-5 w-5 text-red-500" />
                <span className="text-sm font-medium">Bias</span>
              </div>
              <p className="text-2xl font-bold">{(analysis.currentBias * 100).toFixed(1)}%</p>
              <p className="text-xs text-muted-foreground">Underfitting error</p>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="h-5 w-5 text-blue-500" />
                <span className="text-sm font-medium">Variance</span>
              </div>
              <p className="text-2xl font-bold">{(analysis.currentVariance * 100).toFixed(1)}%</p>
              <p className="text-xs text-muted-foreground">Overfitting error</p>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-5 w-5 text-purple-500" />
                <span className="text-sm font-medium">Total Error</span>
              </div>
              <p className="text-2xl font-bold">{(analysis.currentError * 100).toFixed(1)}%</p>
              <p className="text-xs text-muted-foreground">Combined error</p>
            </div>
          </div>

          <div className="p-4 border-2 rounded-lg" style={{
            borderColor: isNearOptimal ? 'hsl(var(--chart-1))' : isTooSimple ? 'hsl(var(--chart-3))' : 'hsl(var(--chart-4))',
            backgroundColor: isNearOptimal ? 'hsl(var(--chart-1) / 0.1)' : isTooSimple ? 'hsl(var(--chart-3) / 0.1)' : 'hsl(var(--chart-4) / 0.1)',
          }}>
            <div className="flex items-start gap-3">
              {isNearOptimal && <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />}
              {!isNearOptimal && <AlertTriangle className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />}
              <div>
                <p className="font-semibold mb-1">
                  Current Complexity: {analysis.currentComplexity.toFixed(1)} ({analysis.points.find(p => Math.abs(p.complexity - analysis.currentComplexity) < 0.5)?.label || 'Moderate'})
                </p>
                <p className="text-sm text-muted-foreground">
                  Optimal Complexity: {analysis.optimalComplexity.toFixed(1)} ({analysis.points.find(p => Math.abs(p.complexity - analysis.optimalComplexity) < 0.5)?.label || 'Moderate'})
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bias-Variance Curve */}
      <Card>
        <CardHeader>
          <CardTitle className="text-balance">Bias-Variance Tradeoff Curve</CardTitle>
          <CardDescription className="text-pretty">
            How bias, variance, and total error change with model complexity
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="w-full min-w-0 overflow-hidden">
            <ResponsiveContainer width="100%" height={400}>
              <LineChart
                data={analysis.points.map(p => ({
                  complexity: p.complexity,
                  Bias: (p.bias * 100).toFixed(1),
                  Variance: (p.variance * 100).toFixed(1),
                  'Total Error': (p.totalError * 100).toFixed(1),
                  label: p.label,
                }))}
                margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="complexity"
                  stroke="hsl(var(--muted-foreground))"
                  tick={{ fontSize: 12 }}
                  label={{ value: 'Model Complexity →', position: 'insideBottom', offset: -5, style: { fontSize: 12 } }}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  tick={{ fontSize: 12 }}
                  label={{ value: 'Error (%)', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px'
                  }}
                  formatter={(value: number) => [`${value}%`, '']}
                  labelFormatter={(label) => `Complexity: ${label}`}
                />
                <Legend 
                  wrapperStyle={{ paddingTop: 8 }}
                  iconType="line"
                />
                <ReferenceLine
                  x={analysis.optimalComplexity}
                  stroke="hsl(var(--chart-1))"
                  strokeDasharray="3 3"
                  label={{ value: 'Optimal', position: 'top', style: { fontSize: 12 } }}
                />
                <ReferenceLine
                  x={analysis.currentComplexity}
                  stroke="hsl(var(--chart-2))"
                  strokeDasharray="3 3"
                  label={{ value: 'Current', position: 'top', style: { fontSize: 12 } }}
                />
                <Line
                  type="monotone"
                  dataKey="Bias"
                  stroke="hsl(var(--chart-3))"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="Variance"
                  stroke="hsl(var(--chart-4))"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="Total Error"
                  stroke="hsl(var(--chart-1))"
                  strokeWidth={3}
                  dot={<Dot r={0} />}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 grid md:grid-cols-3 gap-4">
            <div className="p-3 border rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: 'hsl(var(--chart-3))' }} />
                <span className="text-sm font-medium">Bias (Red)</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {biasVarianceService.getBiasExplanation()}
              </p>
            </div>
            <div className="p-3 border rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: 'hsl(var(--chart-4))' }} />
                <span className="text-sm font-medium">Variance (Blue)</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {biasVarianceService.getVarianceExplanation()}
              </p>
            </div>
            <div className="p-3 border rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: 'hsl(var(--chart-1))' }} />
                <span className="text-sm font-medium">Total Error (Green)</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {biasVarianceService.getTotalErrorExplanation()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="text-balance">Key Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {analysis.insights.map((insight, index) => (
              <li key={index} className="flex items-start gap-2 text-sm">
                <Badge variant="secondary">{index + 1}</Badge>
                <span>{insight}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Recommendation */}
      <Card>
        <CardHeader>
          <CardTitle className="text-balance flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            Recommendation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            {isNearOptimal && <CheckCircle2 className="h-4 w-4 text-green-500" />}
            {!isNearOptimal && <AlertTriangle className="h-4 w-4 text-yellow-500" />}
            <AlertDescription>
              {analysis.recommendation}
            </AlertDescription>
          </Alert>

          {isTooSimple && (
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                How to Increase Model Complexity
              </h4>
              <ul className="space-y-1">
                {adjustmentTips.increase.map((tip, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {isTooComplex && (
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <TrendingDown className="h-4 w-4" />
                How to Decrease Model Complexity
              </h4>
              <ul className="space-y-1">
                {adjustmentTips.decrease.map((tip, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Understanding the Tradeoff */}
      <Card>
        <CardHeader>
          <CardTitle className="text-balance">Understanding the Bias-Variance Tradeoff</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {explanations.map((explanation, index) => (
              <li key={index} className="flex items-start gap-2 text-sm">
                <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <span>{explanation}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
