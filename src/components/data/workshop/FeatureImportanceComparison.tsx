/**
 * Feature Importance Comparison Component
 * 
 * Displays feature importance changes after transformations with visual indicators,
 * rankings, and cumulative change tracking for the Feature Engineering Workshop.
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6
 */

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import {
  TrendingUp,
  TrendingDown,
  ArrowUp,
  ArrowDown,
  ArrowRight,
  Minus,
  Info,
  Trophy,
  BarChart3,
  Sparkles,
} from 'lucide-react';
import type { 
  FeatureImportanceChange, 
  CumulativeImportanceChange,
  TransformationType,
  AppliedTransformation,
} from '@/types/workshop';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface FeatureImportanceComparisonProps {
  /** List of feature importance changes */
  importanceChanges: FeatureImportanceChange[];
  /** Applied transformations for cumulative tracking */
  appliedTransformations?: AppliedTransformation[];
  /** Whether to show animations */
  showAnimation?: boolean;
  /** Callback when a feature is selected */
  onFeatureSelect?: (featureName: string) => void;
}

interface ChartDataPoint {
  name: string;
  original: number;
  transformed: number;
  change: number;
  percentChange: number;
  transformation: TransformationType;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper Functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calculate percentage change between two values
 */
function calculatePercentageChange(original: number, transformed: number): number {
  if (original === 0) return transformed > 0 ? 100 : 0;
  return ((transformed - original) / original) * 100;
}

/**
 * Get color based on change direction and magnitude
 */
function getChangeColor(percentChange: number): string {
  if (percentChange > 20) return 'hsl(142, 76%, 36%)'; // Strong green
  if (percentChange > 5) return 'hsl(142, 71%, 45%)';  // Green
  if (percentChange > 0) return 'hsl(142, 69%, 58%)';  // Light green
  if (percentChange > -5) return 'hsl(0, 0%, 60%)';    // Gray
  if (percentChange > -20) return 'hsl(0, 72%, 51%)';  // Red
  return 'hsl(0, 84%, 60%)';                           // Strong red
}

/**
 * Get arrow icon based on change
 */
function getChangeIcon(percentChange: number) {
  if (percentChange > 5) return <ArrowUp className="h-4 w-4 text-green-500" />;
  if (percentChange < -5) return <ArrowDown className="h-4 w-4 text-red-500" />;
  return <Minus className="h-4 w-4 text-muted-foreground" />;
}

/**
 * Get explanation for why a transformation might increase importance
 */
function getImportanceExplanation(
  transformation: TransformationType,
  percentChange: number
): string {
  const explanations: Record<TransformationType, { positive: string; negative: string }> = {
    log: {
      positive: 'Log transform reduced skewness, making the feature more informative for the model.',
      negative: 'Log transform may have compressed important variation in the data.',
    },
    sqrt: {
      positive: 'Square root transform moderated extreme values, improving feature utility.',
      negative: 'Square root may have reduced the discriminative power of the feature.',
    },
    square: {
      positive: 'Squaring emphasized important non-linear patterns in the data.',
      negative: 'Squaring may have amplified noise or outliers.',
    },
    normalize: {
      positive: 'Normalization put the feature on a comparable scale with others.',
      negative: 'Normalization may have reduced relative importance compared to other features.',
    },
    standardize: {
      positive: 'Standardization improved the feature\'s contribution to gradient-based models.',
      negative: 'Standardization may have reduced the feature\'s relative variance.',
    },
    one_hot: {
      positive: 'One-hot encoding allowed the model to learn category-specific patterns.',
      negative: 'One-hot encoding may have created sparse features with less predictive power.',
    },
    label_encode: {
      positive: 'Label encoding preserved ordinal relationships in the data.',
      negative: 'Label encoding may have introduced artificial ordering.',
    },
    polynomial_2: {
      positive: 'Quadratic terms captured non-linear relationships with the target.',
      negative: 'Polynomial features may be overfitting to noise.',
    },
    polynomial_3: {
      positive: 'Cubic terms captured complex non-linear patterns.',
      negative: 'High-degree polynomials may be overfitting.',
    },
    interaction: {
      positive: 'The interaction captured synergistic effects between features.',
      negative: 'The interaction may not be meaningful for this dataset.',
    },
    binning: {
      positive: 'Binning captured non-linear thresholds in the data.',
      negative: 'Binning may have lost important continuous information.',
    },
    box_cox: {
      positive: 'Box-Cox found an optimal transformation for normality.',
      negative: 'Box-Cox transformation may not suit this feature\'s distribution.',
    },
    yeo_johnson: {
      positive: 'Yeo-Johnson improved the feature\'s distribution shape.',
      negative: 'The transformation may not have been beneficial for this feature.',
    },
    frequency_encode: {
      positive: 'Frequency encoding captured category popularity patterns.',
      negative: 'Frequency encoding may have lost category-specific information.',
    },
    target_encode: {
      positive: 'Target encoding captured strong category-target relationships.',
      negative: 'Target encoding may be overfitting to training data.',
    },
    binary_encode: {
      positive: 'Binary encoding efficiently represented categorical information.',
      negative: 'Binary encoding may have lost some categorical distinctions.',
    },
    tfidf: {
      positive: 'TF-IDF captured important text patterns.',
      negative: 'TF-IDF may have created too sparse a representation.',
    },
    word_count: {
      positive: 'Word count captured meaningful length patterns.',
      negative: 'Word count alone may not capture content importance.',
    },
    char_count: {
      positive: 'Character count provided useful length information.',
      negative: 'Character count may not be predictive for this task.',
    },
    sentence_count: {
      positive: 'Sentence count captured document structure.',
      negative: 'Sentence count may not be relevant for this prediction task.',
    },
  };

  const explanation = explanations[transformation];
  if (!explanation) {
    return percentChange > 0 
      ? 'The transformation improved the feature\'s predictive power.'
      : 'The transformation may not have been beneficial for this feature.';
  }
  
  return percentChange > 0 ? explanation.positive : explanation.negative;
}

/**
 * Calculate cumulative importance changes
 */
function calculateCumulativeChanges(
  importanceChanges: FeatureImportanceChange[]
): CumulativeImportanceChange[] {
  const featureMap = new Map<string, CumulativeImportanceChange>();
  
  importanceChanges.forEach(change => {
    const existing = featureMap.get(change.featureName);
    
    if (existing) {
      existing.transformations.push({
        type: change.transformation,
        importanceAfter: change.transformedImportance,
        incrementalChange: change.percentageChange,
      });
      existing.finalImportance = change.transformedImportance;
      existing.totalPercentageChange = calculatePercentageChange(
        existing.originalImportance,
        change.transformedImportance
      );
      
      // Update most impactful
      const maxChange = Math.max(
        ...existing.transformations.map(t => Math.abs(t.incrementalChange))
      );
      const mostImpactful = existing.transformations.find(
        t => Math.abs(t.incrementalChange) === maxChange
      );
      if (mostImpactful) {
        existing.mostImpactfulTransformation = mostImpactful.type;
      }
    } else {
      featureMap.set(change.featureName, {
        featureName: change.featureName,
        originalImportance: change.originalImportance,
        finalImportance: change.transformedImportance,
        totalPercentageChange: change.percentageChange,
        transformations: [{
          type: change.transformation,
          importanceAfter: change.transformedImportance,
          incrementalChange: change.percentageChange,
        }],
        mostImpactfulTransformation: change.transformation,
      });
    }
  });
  
  return Array.from(featureMap.values());
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export function FeatureImportanceComparison({
  importanceChanges,
  appliedTransformations,
  showAnimation = true,
  onFeatureSelect,
}: FeatureImportanceComparisonProps) {
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'change' | 'original' | 'transformed'>('change');

  // Prepare chart data
  const chartData = useMemo((): ChartDataPoint[] => {
    return importanceChanges.map(change => ({
      name: change.featureName,
      original: change.originalImportance,
      transformed: change.transformedImportance,
      change: change.transformedImportance - change.originalImportance,
      percentChange: change.percentageChange,
      transformation: change.transformation,
    }));
  }, [importanceChanges]);

  // Sort data
  const sortedData = useMemo(() => {
    const sorted = [...chartData];
    switch (sortBy) {
      case 'change':
        return sorted.sort((a, b) => Math.abs(b.percentChange) - Math.abs(a.percentChange));
      case 'original':
        return sorted.sort((a, b) => b.original - a.original);
      case 'transformed':
        return sorted.sort((a, b) => b.transformed - a.transformed);
      default:
        return sorted;
    }
  }, [chartData, sortBy]);

  // Calculate cumulative changes
  const cumulativeChanges = useMemo(() => {
    return calculateCumulativeChanges(importanceChanges);
  }, [importanceChanges]);

  // Find most impactful transformation overall
  const mostImpactful = useMemo(() => {
    if (importanceChanges.length === 0) return null;
    return importanceChanges.reduce((max, current) => 
      Math.abs(current.percentageChange) > Math.abs(max.percentageChange) ? current : max
    );
  }, [importanceChanges]);

  // Calculate total improvement
  const totalImprovement = useMemo(() => {
    return importanceChanges.reduce((sum, change) => sum + change.percentageChange, 0);
  }, [importanceChanges]);

  // Handle feature click
  const handleFeatureClick = (featureName: string) => {
    setSelectedFeature(featureName === selectedFeature ? null : featureName);
    onFeatureSelect?.(featureName);
  };

  // Get selected feature details
  const selectedDetails = useMemo(() => {
    if (!selectedFeature) return null;
    return importanceChanges.find(c => c.featureName === selectedFeature);
  }, [selectedFeature, importanceChanges]);

  if (importanceChanges.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground py-8">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No importance changes to display yet.</p>
            <p className="text-sm">Apply transformations to see their impact on feature importance.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Summary Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              Feature Importance Changes
            </CardTitle>
            <CardDescription>
              Track how transformations affect feature importance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              {/* Total Improvement */}
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Total Improvement</div>
                <div className={`text-2xl font-bold ${totalImprovement >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {totalImprovement >= 0 ? '+' : ''}{totalImprovement.toFixed(1)}%
                </div>
                <div className="text-xs text-muted-foreground">
                  Across {importanceChanges.length} feature(s)
                </div>
              </div>

              {/* Most Impactful */}
              {mostImpactful && (
                <div className="p-4 bg-muted rounded-lg">
                  <div className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                    <Trophy className="h-4 w-4 text-yellow-500" />
                    Most Impactful
                  </div>
                  <div className="font-semibold truncate">{mostImpactful.featureName}</div>
                  <div className={`text-sm ${mostImpactful.percentageChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {mostImpactful.percentageChange >= 0 ? '+' : ''}{mostImpactful.percentageChange.toFixed(1)}%
                  </div>
                </div>
              )}

              {/* Sort Controls */}
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-sm text-muted-foreground mb-2">Sort By</div>
                <div className="flex gap-1">
                  <Button
                    variant={sortBy === 'change' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSortBy('change')}
                  >
                    Change
                  </Button>
                  <Button
                    variant={sortBy === 'original' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSortBy('original')}
                  >
                    Original
                  </Button>
                  <Button
                    variant={sortBy === 'transformed' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSortBy('transformed')}
                  >
                    New
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Comparison Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Importance Comparison Chart</CardTitle>
            <CardDescription>
              Compare original vs transformed importance for all features
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sortedData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="opacity-50" />
                  <XAxis type="number" domain={[0, 'auto']} />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    width={120}
                    tick={{ fontSize: 12 }}
                  />
                  <RechartsTooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload as ChartDataPoint;
                        return (
                          <div className="bg-background border rounded-lg p-3 shadow-lg">
                            <p className="font-semibold">{data.name}</p>
                            <p className="text-sm">Original: {data.original.toFixed(4)}</p>
                            <p className="text-sm">Transformed: {data.transformed.toFixed(4)}</p>
                            <p className={`text-sm font-medium ${data.percentChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              Change: {data.percentChange >= 0 ? '+' : ''}{data.percentChange.toFixed(1)}%
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="original" name="Original" fill="hsl(220, 70%, 50%)" opacity={0.5} />
                  <Bar dataKey="transformed" name="Transformed">
                    {sortedData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={getChangeColor(entry.percentChange)}
                        cursor="pointer"
                        onClick={() => handleFeatureClick(entry.name)}
                      />
                    ))}
                  </Bar>
                  <ReferenceLine x={0} stroke="hsl(var(--muted-foreground))" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Feature List with Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Feature Rankings</CardTitle>
            <CardDescription>
              Click a feature to see detailed explanation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {sortedData.map((feature, index) => (
                <motion.div
                  key={feature.name}
                  initial={showAnimation ? { opacity: 0, y: 10 } : false}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedFeature === feature.name 
                      ? 'border-primary bg-primary/5' 
                      : 'hover:bg-muted'
                  }`}
                  onClick={() => handleFeatureClick(feature.name)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="w-8 h-8 rounded-full flex items-center justify-center">
                        {index + 1}
                      </Badge>
                      <div>
                        <div className="font-medium">{feature.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {feature.transformation}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">
                          {feature.original.toFixed(4)} → {feature.transformed.toFixed(4)}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 min-w-[80px] justify-end">
                        {getChangeIcon(feature.percentChange)}
                        <span 
                          className={`font-semibold ${
                            feature.percentChange >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {feature.percentChange >= 0 ? '+' : ''}{feature.percentChange.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  <AnimatePresence>
                    {selectedFeature === feature.name && selectedDetails && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-3 pt-3 border-t"
                      >
                        <div className="flex items-start gap-2">
                          <Info className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <p className="text-sm text-muted-foreground">
                            {getImportanceExplanation(
                              selectedDetails.transformation,
                              selectedDetails.percentageChange
                            )}
                          </p>
                        </div>
                        
                        {/* Rank change */}
                        {selectedDetails.originalRank !== undefined && selectedDetails.transformedRank !== undefined && (
                          <div className="mt-2 text-sm">
                            <span className="text-muted-foreground">Rank: </span>
                            <span>#{selectedDetails.originalRank}</span>
                            <span className="mx-2">→</span>
                            <span className={
                              selectedDetails.transformedRank < selectedDetails.originalRank 
                                ? 'text-green-600' 
                                : selectedDetails.transformedRank > selectedDetails.originalRank
                                  ? 'text-red-600'
                                  : ''
                            }>
                              #{selectedDetails.transformedRank}
                            </span>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Cumulative Changes (if multiple transformations) */}
        {cumulativeChanges.some(c => c.transformations.length > 1) && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-500" />
                Cumulative Changes
              </CardTitle>
              <CardDescription>
                Track the combined effect of multiple transformations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {cumulativeChanges
                  .filter(c => c.transformations.length > 1)
                  .map((cumulative, index) => (
                    <div key={cumulative.featureName} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="font-semibold">{cumulative.featureName}</div>
                        <Badge variant={cumulative.totalPercentageChange >= 0 ? 'default' : 'destructive'}>
                          Total: {cumulative.totalPercentageChange >= 0 ? '+' : ''}
                          {cumulative.totalPercentageChange.toFixed(1)}%
                        </Badge>
                      </div>
                      
                      {/* Transformation timeline */}
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">
                          {cumulative.originalImportance.toFixed(4)}
                        </span>
                        {cumulative.transformations.map((t, i) => (
                          <div key={i} className="flex items-center gap-1">
                            <ArrowRight className="h-3 w-3 text-muted-foreground" />
                            <Tooltip>
                              <TooltipTrigger>
                                <Badge variant="outline" className="text-xs">
                                  {t.type}
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Change: {t.incrementalChange >= 0 ? '+' : ''}{t.incrementalChange.toFixed(1)}%</p>
                              </TooltipContent>
                            </Tooltip>
                            <span className={
                              t.incrementalChange >= 0 ? 'text-green-600' : 'text-red-600'
                            }>
                              {t.importanceAfter.toFixed(4)}
                            </span>
                          </div>
                        ))}
                      </div>
                      
                      {/* Most impactful */}
                      <div className="mt-2 text-xs text-muted-foreground">
                        Most impactful: <strong>{cumulative.mostImpactfulTransformation}</strong>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </TooltipProvider>
  );
}

export default FeatureImportanceComparison;
