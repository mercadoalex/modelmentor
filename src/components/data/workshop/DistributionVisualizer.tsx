import { useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Info, TrendingDown, TrendingUp, Minus, Play, RotateCcw } from 'lucide-react';
import type { DistributionStats, TransformationType } from '@/types/workshop';

interface DistributionVisualizerProps {
  originalData: number[];
  transformedData: number[];
  transformationType: TransformationType;
  featureName?: string;
  showAnimation?: boolean;
  onStatisticHover?: (statistic: string) => void;
}

interface HistogramData {
  bin: string;
  binIndex: number;
  original: number;
  transformed: number;
}

// Statistical explanations for tooltips
const STAT_EXPLANATIONS: Record<string, { title: string; description: string; whyItMatters: string }> = {
  mean: {
    title: 'Mean (Average)',
    description: 'The sum of all values divided by the count of values.',
    whyItMatters: 'Shows the central tendency of your data. Changes in mean after transformation indicate a shift in the data center.',
  },
  median: {
    title: 'Median',
    description: 'The middle value when data is sorted. Half the values are above, half below.',
    whyItMatters: 'More robust to outliers than mean. If median differs significantly from mean, your data may be skewed.',
  },
  std: {
    title: 'Standard Deviation',
    description: 'Measures how spread out values are from the mean.',
    whyItMatters: 'Lower std means data is more concentrated. Standardization sets std to 1, making features comparable.',
  },
  min: {
    title: 'Minimum',
    description: 'The smallest value in the dataset.',
    whyItMatters: 'Important for detecting outliers and understanding data range. Normalization sets min to 0.',
  },
  max: {
    title: 'Maximum',
    description: 'The largest value in the dataset.',
    whyItMatters: 'Important for detecting outliers and understanding data range. Normalization sets max to 1.',
  },
  skewness: {
    title: 'Skewness',
    description: 'Measures asymmetry of the distribution. Positive = right tail, Negative = left tail, Zero = symmetric.',
    whyItMatters: 'Many ML algorithms assume normally distributed data. Log/sqrt transforms reduce positive skewness.',
  },
};

/**
 * Calculate distribution statistics for an array of numbers
 */
function calculateStats(data: number[]): DistributionStats {
  if (data.length === 0) {
    return { mean: 0, median: 0, std: 0, min: 0, max: 0, skewness: 0, kurtosis: 0 };
  }

  const sorted = [...data].sort((a, b) => a - b);
  const n = data.length;
  
  // Mean
  const mean = data.reduce((sum, val) => sum + val, 0) / n;
  
  // Median
  const median = n % 2 === 0
    ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2
    : sorted[Math.floor(n / 2)];
  
  // Standard deviation
  const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / n;
  const std = Math.sqrt(variance);
  
  // Min and Max
  const min = sorted[0];
  const max = sorted[n - 1];
  
  // Skewness (Fisher-Pearson coefficient)
  let skewness = 0;
  if (std > 0) {
    const m3 = data.reduce((sum, val) => sum + Math.pow(val - mean, 3), 0) / n;
    skewness = m3 / Math.pow(std, 3);
  }
  
  // Kurtosis (excess kurtosis)
  let kurtosis = 0;
  if (std > 0) {
    const m4 = data.reduce((sum, val) => sum + Math.pow(val - mean, 4), 0) / n;
    kurtosis = m4 / Math.pow(std, 4) - 3;
  }
  
  return { mean, median, std, min, max, skewness, kurtosis };
}

/**
 * Create histogram bins from data
 */
function createHistogramBins(data: number[], numBins: number = 20): number[] {
  if (data.length === 0) return new Array(numBins).fill(0);
  
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min;
  
  if (range === 0) {
    // All values are the same
    const bins = new Array(numBins).fill(0);
    bins[Math.floor(numBins / 2)] = data.length;
    return bins;
  }
  
  const binSize = range / numBins;
  const bins = new Array(numBins).fill(0);
  
  data.forEach(value => {
    let binIndex = Math.floor((value - min) / binSize);
    // Handle edge case where value equals max
    if (binIndex >= numBins) binIndex = numBins - 1;
    bins[binIndex]++;
  });
  
  return bins;
}

/**
 * Get the change indicator component
 */
function ChangeIndicator({ value, inverse = false }: { value: number; inverse?: boolean }) {
  const isPositive = inverse ? value < 0 : value > 0;
  const isNegative = inverse ? value > 0 : value < 0;
  const absValue = Math.abs(value);
  
  if (absValue < 0.01) {
    return (
      <span className="flex items-center text-muted-foreground">
        <Minus className="h-3 w-3 mr-1" />
        <span className="text-xs">~0%</span>
      </span>
    );
  }
  
  if (isPositive) {
    return (
      <span className="flex items-center text-green-600">
        <TrendingUp className="h-3 w-3 mr-1" />
        <span className="text-xs">+{(absValue * 100).toFixed(1)}%</span>
      </span>
    );
  }
  
  if (isNegative) {
    return (
      <span className="flex items-center text-red-600">
        <TrendingDown className="h-3 w-3 mr-1" />
        <span className="text-xs">-{(absValue * 100).toFixed(1)}%</span>
      </span>
    );
  }
  
  return null;
}

/**
 * Statistic row with tooltip explanation
 */
function StatRow({
  label,
  originalValue,
  transformedValue,
  statKey,
  onHover,
  inverse = false,
}: {
  label: string;
  originalValue: number;
  transformedValue: number;
  statKey: string;
  onHover?: (stat: string) => void;
  inverse?: boolean;
}) {
  const explanation = STAT_EXPLANATIONS[statKey];
  const change = originalValue !== 0 
    ? (transformedValue - originalValue) / Math.abs(originalValue)
    : transformedValue !== 0 ? 1 : 0;
  
  return (
    <div 
      className="flex items-center justify-between py-1 hover:bg-muted/50 rounded px-1 transition-colors"
      onMouseEnter={() => onHover?.(statKey)}
      onMouseLeave={() => onHover?.('')}
    >
      <div className="flex items-center gap-1">
        <span className="text-sm text-muted-foreground">{label}</span>
        {explanation && (
          <TooltipProvider>
            <UITooltip>
              <TooltipTrigger asChild>
                <Info className="h-3 w-3 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-xs">
                <div className="space-y-1">
                  <p className="font-semibold">{explanation.title}</p>
                  <p className="text-xs">{explanation.description}</p>
                  <p className="text-xs text-muted-foreground">{explanation.whyItMatters}</p>
                </div>
              </TooltipContent>
            </UITooltip>
          </TooltipProvider>
        )}
      </div>
      <div className="flex items-center gap-3">
        <span className="font-mono text-xs w-16 text-right">{originalValue.toFixed(2)}</span>
        <span className="text-muted-foreground">→</span>
        <span className="font-mono text-xs w-16 text-right">{transformedValue.toFixed(2)}</span>
        <div className="w-16">
          <ChangeIndicator value={change} inverse={inverse} />
        </div>
      </div>
    </div>
  );
}

export function DistributionVisualizer({
  originalData,
  transformedData,
  transformationType,
  featureName = 'Feature',
  showAnimation = true,
  onStatisticHover,
}: DistributionVisualizerProps) {
  const [showTransformed, setShowTransformed] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Calculate statistics
  const originalStats = useMemo(() => calculateStats(originalData), [originalData]);
  const transformedStats = useMemo(() => calculateStats(transformedData), [transformedData]);
  
  // Create histogram data
  const histogramData = useMemo((): HistogramData[] => {
    const numBins = 20;
    const originalBins = createHistogramBins(originalData, numBins);
    const transformedBins = createHistogramBins(transformedData, numBins);
    
    return originalBins.map((count, index) => ({
      bin: `${index + 1}`,
      binIndex: index,
      original: count,
      transformed: transformedBins[index],
    }));
  }, [originalData, transformedData]);
  
  // Calculate skewness change for highlighting
  const skewnessReduced = Math.abs(transformedStats.skewness) < Math.abs(originalStats.skewness);
  
  // Animation handler
  const handleAnimate = () => {
    if (!showAnimation) return;
    
    setIsAnimating(true);
    setShowTransformed(false);
    
    setTimeout(() => {
      setShowTransformed(true);
      setTimeout(() => setIsAnimating(false), 500);
    }, 500);
  };
  
  // Get transformation display name
  const getTransformationName = (type: TransformationType): string => {
    const names: Record<TransformationType, string> = {
      log: 'Log Transform',
      sqrt: 'Square Root',
      square: 'Square',
      normalize: 'Normalization',
      standardize: 'Standardization',
      binning: 'Binning',
      box_cox: 'Box-Cox',
      yeo_johnson: 'Yeo-Johnson',
      one_hot: 'One-Hot Encoding',
      label_encode: 'Label Encoding',
      frequency_encode: 'Frequency Encoding',
      target_encode: 'Target Encoding',
      binary_encode: 'Binary Encoding',
      tfidf: 'TF-IDF',
      word_count: 'Word Count',
      char_count: 'Character Count',
      sentence_count: 'Sentence Count',
      polynomial_2: 'Polynomial (degree 2)',
      polynomial_3: 'Polynomial (degree 3)',
      interaction: 'Interaction',
    };
    return names[type] || type;
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              Distribution Comparison
              {skewnessReduced && (
                <Badge variant="default" className="text-xs">
                  Skewness Reduced
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              {featureName} • {getTransformationName(transformationType)}
            </CardDescription>
          </div>
          {showAnimation && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleAnimate}
                disabled={isAnimating}
              >
                <Play className="h-4 w-4 mr-1" />
                Animate
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowTransformed(!showTransformed)}
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                Toggle
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Histogram Chart */}
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={histogramData} barGap={0}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-50" />
              <XAxis 
                dataKey="bin" 
                tick={{ fontSize: 10 }}
                label={{ value: 'Value Range (Bins)', position: 'insideBottom', offset: -5, fontSize: 11 }}
              />
              <YAxis 
                tick={{ fontSize: 10 }}
                label={{ value: 'Frequency', angle: -90, position: 'insideLeft', fontSize: 11 }}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  return (
                    <div className="bg-background border rounded-lg shadow-lg p-2 text-xs">
                      <p className="font-semibold mb-1">Bin {payload[0]?.payload?.bin}</p>
                      <p className="text-muted-foreground">
                        Original: <span className="font-mono">{payload[0]?.value}</span>
                      </p>
                      {showTransformed && (
                        <p className="text-primary">
                          Transformed: <span className="font-mono">{payload[1]?.value}</span>
                        </p>
                      )}
                    </div>
                  );
                }}
              />
              <Legend />
              <Bar 
                dataKey="original" 
                fill="hsl(var(--muted-foreground))" 
                name="Original"
                opacity={0.7}
              />
              {showTransformed && (
                <Bar 
                  dataKey="transformed" 
                  fill="hsl(var(--primary))" 
                  name="Transformed"
                  opacity={0.8}
                  animationDuration={showAnimation ? 500 : 0}
                />
              )}
              {/* Reference line for mean */}
              <ReferenceLine 
                x={Math.round(histogramData.length / 2).toString()} 
                stroke="hsl(var(--destructive))" 
                strokeDasharray="5 5"
                label={{ value: 'Center', position: 'top', fontSize: 10 }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        {/* Statistics Comparison */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
              Statistics Comparison
              <TooltipProvider>
                <UITooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Hover over each statistic for an explanation</p>
                  </TooltipContent>
                </UITooltip>
              </TooltipProvider>
            </h4>
            <div className="text-xs text-muted-foreground mb-2 flex justify-between px-1">
              <span>Statistic</span>
              <span className="flex gap-3">
                <span className="w-16 text-right">Original</span>
                <span className="w-4"></span>
                <span className="w-16 text-right">Transformed</span>
                <span className="w-16 text-right">Change</span>
              </span>
            </div>
            <StatRow 
              label="Mean" 
              originalValue={originalStats.mean} 
              transformedValue={transformedStats.mean}
              statKey="mean"
              onHover={onStatisticHover}
            />
            <StatRow 
              label="Median" 
              originalValue={originalStats.median} 
              transformedValue={transformedStats.median}
              statKey="median"
              onHover={onStatisticHover}
            />
            <StatRow 
              label="Std Dev" 
              originalValue={originalStats.std} 
              transformedValue={transformedStats.std}
              statKey="std"
              onHover={onStatisticHover}
            />
            <StatRow 
              label="Min" 
              originalValue={originalStats.min} 
              transformedValue={transformedStats.min}
              statKey="min"
              onHover={onStatisticHover}
            />
            <StatRow 
              label="Max" 
              originalValue={originalStats.max} 
              transformedValue={transformedStats.max}
              statKey="max"
              onHover={onStatisticHover}
            />
            <StatRow 
              label="Skewness" 
              originalValue={originalStats.skewness} 
              transformedValue={transformedStats.skewness}
              statKey="skewness"
              onHover={onStatisticHover}
              inverse={true} // Lower absolute skewness is better
            />
          </div>
          
          {/* Interpretation Panel */}
          <div className="bg-muted/30 rounded-lg p-3 space-y-2">
            <h4 className="font-semibold text-sm">Interpretation</h4>
            <div className="space-y-2 text-xs">
              {skewnessReduced ? (
                <p className="text-green-600">
                  ✓ Skewness reduced from {originalStats.skewness.toFixed(2)} to {transformedStats.skewness.toFixed(2)}, 
                  making the distribution more symmetric.
                </p>
              ) : (
                <p className="text-muted-foreground">
                  Skewness changed from {originalStats.skewness.toFixed(2)} to {transformedStats.skewness.toFixed(2)}.
                </p>
              )}
              
              {transformationType === 'standardize' && (
                <p className="text-blue-600">
                  ✓ Data standardized to mean ≈ 0 and std ≈ 1, ideal for many ML algorithms.
                </p>
              )}
              
              {transformationType === 'normalize' && (
                <p className="text-blue-600">
                  ✓ Data normalized to [0, 1] range, useful for neural networks and distance-based algorithms.
                </p>
              )}
              
              {(transformationType === 'log' || transformationType === 'sqrt') && (
                <p className="text-blue-600">
                  ✓ {transformationType === 'log' ? 'Log' : 'Square root'} transform applied to compress large values 
                  and expand small values.
                </p>
              )}
              
              <p className="text-muted-foreground mt-2">
                <strong>Tip:</strong> Compare the shape of the distributions. A more bell-shaped (normal) 
                distribution often leads to better model performance.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Export utility functions for use in other components
export { calculateStats, createHistogramBins };
