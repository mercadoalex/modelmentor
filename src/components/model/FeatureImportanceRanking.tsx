import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp, Award, Info, AlertCircle, CheckCircle2 } from 'lucide-react';

export interface FeatureImportanceData {
  feature: string;
  importance: number;
  rank: number;
}

interface FeatureImportanceRankingProps {
  features: FeatureImportanceData[];
  modelAccuracy?: number;
}

export function FeatureImportanceRanking({ features, modelAccuracy }: FeatureImportanceRankingProps) {
  // Sort features by importance
  const sortedFeatures = [...features].sort((a, b) => b.importance - a.importance);
  
  // Get top 3 features
  const topFeatures = sortedFeatures.slice(0, 3);
  
  // Calculate cumulative importance of top features
  const topFeaturesImportance = topFeatures.reduce((sum, f) => sum + f.importance, 0);
  const topFeaturesPercentage = (topFeaturesImportance / sortedFeatures.reduce((sum, f) => sum + f.importance, 0)) * 100;

  // Generate insights
  const insights = generateInsights(sortedFeatures, topFeaturesPercentage);

  // Colors for bars
  const getBarColor = (index: number) => {
    if (index === 0) return 'hsl(var(--chart-1))'; // Top feature
    if (index === 1) return 'hsl(var(--chart-2))'; // Second
    if (index === 2) return 'hsl(var(--chart-3))'; // Third
    return 'hsl(var(--chart-4))'; // Others
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="text-balance flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Feature Importance Ranking
          </CardTitle>
          <CardDescription className="text-pretty">
            Understanding which features contribute most to your model's predictions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Feature importance shows how much each input variable contributes to the model's predictions.
              Higher importance means the feature has more influence on the output.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Top Features Highlight */}
      <Card>
        <CardHeader>
          <CardTitle className="text-balance flex items-center gap-2">
            <Award className="h-5 w-5 text-yellow-500" />
            Most Influential Features
          </CardTitle>
          <CardDescription className="text-pretty">
            The top 3 features that drive your model's predictions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topFeatures.map((feature, index) => (
              <div
                key={feature.feature}
                className={`p-4 border-2 rounded-lg ${
                  index === 0 ? 'border-yellow-500 bg-yellow-50' :
                  index === 1 ? 'border-blue-500 bg-blue-50' :
                  'border-green-500 bg-green-50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge className={
                      index === 0 ? 'bg-yellow-500' :
                      index === 1 ? 'bg-blue-500' :
                      'bg-green-500'
                    }>
                      #{index + 1}
                    </Badge>
                    <span className="font-semibold">{feature.feature}</span>
                  </div>
                  <span className="text-2xl font-bold">
                    {(feature.importance * 100).toFixed(1)}%
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {index === 0 && 'This is the most important feature for your model\'s predictions'}
                  {index === 1 && 'This feature has the second-highest impact on predictions'}
                  {index === 2 && 'This feature significantly influences the model\'s decisions'}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-4 p-3 bg-muted rounded-lg">
            <p className="text-sm">
              <strong>Combined Impact:</strong> These top 3 features account for{' '}
              <span className="font-semibold text-primary">{topFeaturesPercentage.toFixed(1)}%</span>{' '}
              of the model's decision-making process.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Importance Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-balance">Feature Importance Distribution</CardTitle>
          <CardDescription className="text-pretty">
            Visual comparison of all feature contributions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="w-full min-w-0 overflow-hidden">
            <ResponsiveContainer width="100%" height={Math.max(300, sortedFeatures.length * 40)}>
              <BarChart
                data={sortedFeatures.map((f, i) => ({
                  feature: f.feature,
                  importance: (f.importance * 100).toFixed(1),
                  index: i,
                }))}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  type="number"
                  stroke="hsl(var(--muted-foreground))"
                  tick={{ fontSize: 12 }}
                  label={{ value: 'Importance (%)', position: 'insideBottom', offset: -5, style: { fontSize: 12 } }}
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
                  formatter={(value: number) => [`${value}%`, 'Importance']}
                />
                <Bar dataKey="importance" radius={[0, 4, 4, 0]}>
                  {sortedFeatures.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={getBarColor(index)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Rankings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-balance">Complete Feature Rankings</CardTitle>
          <CardDescription className="text-pretty">
            All features ranked by their contribution to predictions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="w-full overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="p-2 text-left text-sm font-medium whitespace-nowrap">Rank</th>
                  <th className="p-2 text-left text-sm font-medium whitespace-nowrap">Feature</th>
                  <th className="p-2 text-right text-sm font-medium whitespace-nowrap">Importance</th>
                  <th className="p-2 text-center text-sm font-medium whitespace-nowrap">Impact</th>
                </tr>
              </thead>
              <tbody>
                {sortedFeatures.map((feature, index) => (
                  <tr key={feature.feature} className="border-b">
                    <td className="p-2 whitespace-nowrap">
                      <Badge variant={index < 3 ? 'default' : 'secondary'}>
                        #{index + 1}
                      </Badge>
                    </td>
                    <td className="p-2 whitespace-nowrap font-medium">{feature.feature}</td>
                    <td className="p-2 text-right whitespace-nowrap">
                      <span className="font-semibold">{(feature.importance * 100).toFixed(2)}%</span>
                    </td>
                    <td className="p-2 text-center whitespace-nowrap">
                      {feature.importance > 0.15 && (
                        <Badge className="bg-green-500">High</Badge>
                      )}
                      {feature.importance > 0.05 && feature.importance <= 0.15 && (
                        <Badge className="bg-blue-500">Medium</Badge>
                      )}
                      {feature.importance <= 0.05 && (
                        <Badge variant="secondary">Low</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Insights & Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-balance">Insights & Recommendations</CardTitle>
          <CardDescription className="text-pretty">
            What these results mean for your model
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {insights.map((insight, index) => (
              <li key={index} className="flex items-start gap-3">
                {insight.type === 'success' && (
                  <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                )}
                {insight.type === 'info' && (
                  <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                )}
                {insight.type === 'warning' && (
                  <AlertCircle className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="text-sm font-medium">{insight.title}</p>
                  <p className="text-sm text-muted-foreground">{insight.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

function generateInsights(
  features: FeatureImportanceData[],
  topFeaturesPercentage: number
): Array<{ type: 'success' | 'info' | 'warning'; title: string; description: string }> {
  const insights: Array<{ type: 'success' | 'info' | 'warning'; title: string; description: string }> = [];

  // Check if top features dominate
  if (topFeaturesPercentage > 70) {
    insights.push({
      type: 'success',
      title: 'Strong Feature Concentration',
      description: `The top 3 features account for ${topFeaturesPercentage.toFixed(1)}% of importance. Your model relies heavily on a few key variables, which makes it easier to interpret and explain.`,
    });
  } else if (topFeaturesPercentage < 40) {
    insights.push({
      type: 'info',
      title: 'Distributed Importance',
      description: `Importance is spread across many features (top 3 only ${topFeaturesPercentage.toFixed(1)}%). Your model considers multiple variables equally, which can be good for robustness but harder to interpret.`,
    });
  }

  // Check for very low importance features
  const lowImportanceCount = features.filter(f => f.importance < 0.02).length;
  if (lowImportanceCount > 0) {
    insights.push({
      type: 'warning',
      title: 'Low-Impact Features Detected',
      description: `${lowImportanceCount} feature(s) have very low importance (<2%). Consider removing these features to simplify your model and potentially improve performance.`,
    });
  }

  // Check for balanced distribution
  const importanceStd = calculateStandardDeviation(features.map(f => f.importance));
  if (importanceStd < 0.05) {
    insights.push({
      type: 'info',
      title: 'Balanced Feature Contributions',
      description: 'All features contribute relatively equally to predictions. This suggests your dataset has well-distributed information across variables.',
    });
  }

  // Top feature insight
  if (features.length > 0) {
    const topFeature = features[0];
    if (topFeature.importance > 0.3) {
      insights.push({
        type: 'warning',
        title: 'Single Feature Dominance',
        description: `"${topFeature.feature}" dominates with ${(topFeature.importance * 100).toFixed(1)}% importance. Ensure this feature will be available during real-world predictions and isn't causing data leakage.`,
      });
    } else {
      insights.push({
        type: 'success',
        title: 'Primary Driver Identified',
        description: `"${topFeature.feature}" is the most important feature at ${(topFeature.importance * 100).toFixed(1)}%. Focus on ensuring this data is accurate and available in production.`,
      });
    }
  }

  // General recommendation
  insights.push({
    type: 'info',
    title: 'Feature Engineering Opportunity',
    description: 'Consider creating new features by combining high-importance variables or transforming them (e.g., ratios, interactions) to potentially improve model performance.',
  });

  return insights;
}

function calculateStandardDeviation(values: number[]): number {
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
  const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
  return Math.sqrt(variance);
}
