import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { TransformationPreview } from '@/services/transformationAnalysisService';
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle2, Info, Sparkles } from 'lucide-react';

interface TransformationExplanationDialogProps {
  preview: TransformationPreview | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TransformationExplanationDialog({
  preview,
  open,
  onOpenChange,
}: TransformationExplanationDialogProps) {
  if (!preview) return null;

  const { suggestion, distributionComparison, correlationChanges, performanceImpact, sampleValues } = preview;

  // Prepare distribution chart data
  const distributionChartData = distributionComparison.before.slice(0, 5).map((item, index) => ({
    category: item.value.length > 15 ? item.value.substring(0, 15) + '...' : item.value,
    before: item.count,
    after: distributionComparison.after[index]?.count || 0,
  }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            {suggestion.title} - Visual Explanation
          </DialogTitle>
          <DialogDescription>
            Understand how this transformation will improve your model
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Performance Impact */}
          <Card>
            <CardHeader>
              <CardTitle className="text-balance flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                Estimated Performance Impact
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Expected Improvement</span>
                    <span className="text-2xl font-bold text-green-500">
                      +{performanceImpact.estimatedImprovement}%
                    </span>
                  </div>
                  <Progress value={performanceImpact.estimatedImprovement * 6.67} className="h-2" />
                </div>
                <Badge variant={
                  performanceImpact.confidence === 'high' ? 'default' :
                  performanceImpact.confidence === 'medium' ? 'secondary' : 'outline'
                }>
                  {performanceImpact.confidence} confidence
                </Badge>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium mb-2">Why this helps:</p>
                  <ul className="space-y-1">
                    {performanceImpact.reasoning.map((reason, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                        <span>{reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <p className="text-sm font-medium mb-2">Benefits:</p>
                  <ul className="space-y-1">
                    {performanceImpact.benefits.map((benefit, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <span className="text-green-500">+</span>
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {performanceImpact.tradeoffs.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Tradeoffs:</p>
                    <ul className="space-y-1">
                      {performanceImpact.tradeoffs.map((tradeoff, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <span className="text-orange-500">-</span>
                          <span>{tradeoff}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Distribution Comparison */}
          {distributionChartData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-balance">Before vs After Distribution</CardTitle>
                <CardDescription className="text-pretty">
                  How the transformation changes the data distribution
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="w-full min-w-0 overflow-hidden">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={distributionChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="category" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Legend wrapperStyle={{ paddingTop: 8 }} />
                      <Bar dataKey="before" fill="hsl(var(--muted))" name="Before" />
                      <Bar dataKey="after" fill="hsl(var(--primary))" name="After" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {distributionComparison.beforeStats && distributionComparison.afterStats && (
                  <div className="grid md:grid-cols-2 gap-4 mt-4 pt-4 border-t">
                    <div>
                      <p className="text-sm font-medium mb-2">Before Statistics</p>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Mean:</span>
                          <span className="font-medium">{distributionComparison.beforeStats.mean.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Std Dev:</span>
                          <span className="font-medium">{distributionComparison.beforeStats.std.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Range:</span>
                          <span className="font-medium">
                            {distributionComparison.beforeStats.min.toFixed(2)} - {distributionComparison.beforeStats.max.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-2">After Statistics</p>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Mean:</span>
                          <span className="font-medium">{distributionComparison.afterStats.mean.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Std Dev:</span>
                          <span className="font-medium">{distributionComparison.afterStats.std.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Range:</span>
                          <span className="font-medium">
                            {distributionComparison.afterStats.min.toFixed(2)} - {distributionComparison.afterStats.max.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Correlation Changes */}
          {correlationChanges.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-balance">Correlation with Target</CardTitle>
                <CardDescription className="text-pretty">
                  How the new features correlate with your target variable
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {correlationChanges.map((change, index) => (
                    <div key={index} className="flex items-center gap-4 p-3 border rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{change.column}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-muted-foreground">
                            Before: {change.beforeCorrelation.toFixed(3)}
                          </span>
                          <span className="text-xs">→</span>
                          <span className="text-xs text-muted-foreground">
                            After: {change.afterCorrelation.toFixed(3)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {change.improvement ? (
                          <>
                            <TrendingUp className="h-4 w-4 text-green-500" />
                            <span className="text-sm font-medium text-green-500">
                              +{(Math.abs(change.change) * 100).toFixed(1)}%
                            </span>
                          </>
                        ) : (
                          <>
                            <TrendingDown className="h-4 w-4 text-orange-500" />
                            <span className="text-sm font-medium text-orange-500">
                              {(change.change * 100).toFixed(1)}%
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Sample Values */}
          <Card>
            <CardHeader>
              <CardTitle className="text-balance">Sample Transformations</CardTitle>
              <CardDescription className="text-pretty">
                Examples of how values are transformed
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="w-full overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="p-2 text-left text-sm font-medium">Before</th>
                      <th className="p-2 text-center text-sm font-medium">→</th>
                      <th className="p-2 text-left text-sm font-medium">After</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sampleValues.before.map((before, index) => (
                      <tr key={index} className="border-b">
                        <td className="p-2 text-sm font-mono">{before}</td>
                        <td className="p-2 text-center text-sm text-muted-foreground">→</td>
                        <td className="p-2 text-sm font-mono">{sampleValues.after[index]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Summary */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              This transformation will create {suggestion.newFeatureCount} new feature{suggestion.newFeatureCount !== 1 ? 's' : ''}.
              Based on the analysis, we estimate a {performanceImpact.estimatedImprovement}% improvement in model performance
              with {performanceImpact.confidence} confidence.
            </AlertDescription>
          </Alert>
        </div>
      </DialogContent>
    </Dialog>
  );
}
