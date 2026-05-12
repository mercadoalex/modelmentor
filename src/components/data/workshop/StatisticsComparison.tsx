import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Info, 
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DistributionStats, TransformationType } from '@/types/workshop';

interface StatisticsComparisonProps {
  originalStats: DistributionStats;
  transformedStats: DistributionStats;
  transformationType: TransformationType;
  featureName?: string;
  showInterpretation?: boolean;
  compact?: boolean;
}

interface StatisticInfo {
  key: keyof DistributionStats;
  label: string;
  description: string;
  whyItMatters: string;
  format: (value: number) => string;
  /** Whether lower absolute value is better (e.g., skewness) */
  lowerIsBetter?: boolean;
  /** Whether this stat should be highlighted for this transformation */
  highlightFor?: TransformationType[];
}

const STATISTICS: StatisticInfo[] = [
  {
    key: 'mean',
    label: 'Mean',
    description: 'The average value of all data points.',
    whyItMatters: 'Standardization centers the mean at 0, which helps many algorithms converge faster.',
    format: (v) => v.toFixed(3),
    highlightFor: ['standardize'],
  },
  {
    key: 'median',
    label: 'Median',
    description: 'The middle value when data is sorted.',
    whyItMatters: 'More robust to outliers than mean. Large difference from mean indicates skewness.',
    format: (v) => v.toFixed(3),
  },
  {
    key: 'std',
    label: 'Std Dev',
    description: 'Measures the spread of data around the mean.',
    whyItMatters: 'Standardization sets std to 1, making features comparable regardless of original scale.',
    format: (v) => v.toFixed(3),
    highlightFor: ['standardize', 'normalize'],
  },
  {
    key: 'min',
    label: 'Minimum',
    description: 'The smallest value in the dataset.',
    whyItMatters: 'Normalization sets min to 0. Log transform requires positive values.',
    format: (v) => v.toFixed(3),
    highlightFor: ['normalize'],
  },
  {
    key: 'max',
    label: 'Maximum',
    description: 'The largest value in the dataset.',
    whyItMatters: 'Normalization sets max to 1. Large max values may dominate distance calculations.',
    format: (v) => v.toFixed(3),
    highlightFor: ['normalize'],
  },
  {
    key: 'skewness',
    label: 'Skewness',
    description: 'Measures asymmetry. 0 = symmetric, >0 = right tail, <0 = left tail.',
    whyItMatters: 'Many algorithms assume normal distribution. Log/sqrt transforms reduce positive skewness.',
    format: (v) => v.toFixed(3),
    lowerIsBetter: true,
    highlightFor: ['log', 'sqrt', 'box_cox', 'yeo_johnson'],
  },
  {
    key: 'kurtosis',
    label: 'Kurtosis',
    description: 'Measures "tailedness". 0 = normal, >0 = heavy tails, <0 = light tails.',
    whyItMatters: 'High kurtosis indicates outliers. Transformations can help normalize the distribution.',
    format: (v) => v.toFixed(3),
    lowerIsBetter: true,
  },
];

/**
 * Calculate percentage change between two values
 */
function calculateChange(original: number, transformed: number): number {
  if (original === 0) {
    return transformed === 0 ? 0 : 1;
  }
  return (transformed - original) / Math.abs(original);
}

/**
 * Determine if a change is an improvement
 */
function isImprovement(
  original: number,
  transformed: number,
  lowerIsBetter: boolean = false
): 'improved' | 'degraded' | 'neutral' {
  const change = calculateChange(original, transformed);
  const threshold = 0.01; // 1% threshold for significance
  
  if (Math.abs(change) < threshold) return 'neutral';
  
  if (lowerIsBetter) {
    // For skewness/kurtosis, closer to 0 is better
    return Math.abs(transformed) < Math.abs(original) ? 'improved' : 'degraded';
  }
  
  // For most stats, we just show the direction of change
  return 'neutral';
}

/**
 * Change indicator with arrow and percentage
 */
function ChangeIndicator({ 
  original, 
  transformed, 
  lowerIsBetter = false,
}: { 
  original: number; 
  transformed: number; 
  lowerIsBetter?: boolean;
}) {
  const change = calculateChange(original, transformed);
  const improvement = isImprovement(original, transformed, lowerIsBetter);
  const absChange = Math.abs(change * 100);
  
  if (absChange < 1) {
    return (
      <span className="flex items-center text-muted-foreground text-xs">
        <Minus className="h-3 w-3 mr-1" />
        ~0%
      </span>
    );
  }
  
  const isPositive = change > 0;
  const colorClass = improvement === 'improved' 
    ? 'text-green-600' 
    : improvement === 'degraded' 
      ? 'text-amber-600' 
      : isPositive 
        ? 'text-blue-600' 
        : 'text-orange-600';
  
  return (
    <span className={cn('flex items-center text-xs', colorClass)}>
      {isPositive ? (
        <TrendingUp className="h-3 w-3 mr-1" />
      ) : (
        <TrendingDown className="h-3 w-3 mr-1" />
      )}
      {isPositive ? '+' : '-'}{absChange.toFixed(1)}%
    </span>
  );
}

/**
 * Single statistic row
 */
function StatisticRow({
  stat,
  originalValue,
  transformedValue,
  isHighlighted,
  compact,
}: {
  stat: StatisticInfo;
  originalValue: number;
  transformedValue: number;
  isHighlighted: boolean;
  compact: boolean;
}) {
  return (
    <div 
      className={cn(
        'flex items-center justify-between py-2 px-2 rounded transition-colors',
        isHighlighted && 'bg-primary/5 border-l-2 border-primary',
        !isHighlighted && 'hover:bg-muted/50'
      )}
    >
      <div className="flex items-center gap-1.5">
        <span className={cn(
          'text-sm',
          isHighlighted ? 'font-medium' : 'text-muted-foreground'
        )}>
          {stat.label}
        </span>
        {!compact && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-3 w-3 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-xs">
                <div className="space-y-1">
                  <p className="font-semibold">{stat.label}</p>
                  <p className="text-xs">{stat.description}</p>
                  <p className="text-xs text-muted-foreground">{stat.whyItMatters}</p>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      
      <div className="flex items-center gap-2">
        <span className="font-mono text-xs w-20 text-right text-muted-foreground">
          {stat.format(originalValue)}
        </span>
        <ArrowRight className="h-3 w-3 text-muted-foreground" />
        <span className={cn(
          'font-mono text-xs w-20 text-right',
          isHighlighted && 'font-medium'
        )}>
          {stat.format(transformedValue)}
        </span>
        <div className="w-16">
          <ChangeIndicator 
            original={originalValue} 
            transformed={transformedValue}
            lowerIsBetter={stat.lowerIsBetter}
          />
        </div>
      </div>
    </div>
  );
}

/**
 * Get interpretation messages based on transformation and stats
 */
function getInterpretations(
  originalStats: DistributionStats,
  transformedStats: DistributionStats,
  transformationType: TransformationType
): { type: 'success' | 'warning' | 'info'; message: string }[] {
  const interpretations: { type: 'success' | 'warning' | 'info'; message: string }[] = [];
  
  // Skewness reduction
  const skewnessReduced = Math.abs(transformedStats.skewness) < Math.abs(originalStats.skewness);
  if (skewnessReduced && Math.abs(originalStats.skewness) > 0.5) {
    interpretations.push({
      type: 'success',
      message: `Skewness reduced from ${originalStats.skewness.toFixed(2)} to ${transformedStats.skewness.toFixed(2)}, making the distribution more symmetric.`,
    });
  }
  
  // Standardization check
  if (transformationType === 'standardize') {
    const meanNearZero = Math.abs(transformedStats.mean) < 0.01;
    const stdNearOne = Math.abs(transformedStats.std - 1) < 0.01;
    
    if (meanNearZero && stdNearOne) {
      interpretations.push({
        type: 'success',
        message: 'Data successfully standardized to mean ≈ 0 and std ≈ 1.',
      });
    }
  }
  
  // Normalization check
  if (transformationType === 'normalize') {
    const minNearZero = Math.abs(transformedStats.min) < 0.01;
    const maxNearOne = Math.abs(transformedStats.max - 1) < 0.01;
    
    if (minNearZero && maxNearOne) {
      interpretations.push({
        type: 'success',
        message: 'Data successfully normalized to [0, 1] range.',
      });
    }
  }
  
  // Log transform warnings
  if (transformationType === 'log' && originalStats.min <= 0) {
    interpretations.push({
      type: 'warning',
      message: 'Log transform requires positive values. Consider adding a constant or using Yeo-Johnson.',
    });
  }
  
  // High kurtosis warning
  if (transformedStats.kurtosis > 3) {
    interpretations.push({
      type: 'warning',
      message: `High kurtosis (${transformedStats.kurtosis.toFixed(2)}) indicates heavy tails. Consider additional transformations.`,
    });
  }
  
  // General improvement
  if (interpretations.length === 0) {
    interpretations.push({
      type: 'info',
      message: 'Transformation applied. Review the statistics to assess the impact on your data.',
    });
  }
  
  return interpretations;
}

export function StatisticsComparison({
  originalStats,
  transformedStats,
  transformationType,
  featureName = 'Feature',
  showInterpretation = true,
  compact = false,
}: StatisticsComparisonProps) {
  // Determine which stats to highlight based on transformation
  const highlightedStats = useMemo(() => {
    return new Set(
      STATISTICS
        .filter(stat => stat.highlightFor?.includes(transformationType))
        .map(stat => stat.key)
    );
  }, [transformationType]);
  
  // Get interpretations
  const interpretations = useMemo(() => {
    if (!showInterpretation) return [];
    return getInterpretations(originalStats, transformedStats, transformationType);
  }, [originalStats, transformedStats, transformationType, showInterpretation]);
  
  // Filter stats for compact mode
  const displayStats = compact 
    ? STATISTICS.filter(s => ['mean', 'std', 'skewness'].includes(s.key))
    : STATISTICS;

  return (
    <Card className={cn(compact && 'border-0 shadow-none')}>
      {!compact && (
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Statistics Comparison</CardTitle>
          <CardDescription>
            {featureName} • Before and after transformation
          </CardDescription>
        </CardHeader>
      )}
      <CardContent className={cn(compact && 'p-0')}>
        {/* Header row */}
        <div className="flex items-center justify-between py-1 px-2 text-xs text-muted-foreground border-b mb-1">
          <span>Statistic</span>
          <div className="flex items-center gap-2">
            <span className="w-20 text-right">Original</span>
            <span className="w-4"></span>
            <span className="w-20 text-right">Transformed</span>
            <span className="w-16 text-right">Change</span>
          </div>
        </div>
        
        {/* Statistics rows */}
        <div className="space-y-0.5">
          {displayStats.map(stat => {
            const originalValue = originalStats[stat.key];
            const transformedValue = transformedStats[stat.key];
            // Skip non-numeric values (like quartiles array)
            if (typeof originalValue !== 'number' || typeof transformedValue !== 'number') {
              return null;
            }
            return (
              <StatisticRow
                key={stat.key}
                stat={stat}
                originalValue={originalValue}
                transformedValue={transformedValue}
                isHighlighted={highlightedStats.has(stat.key)}
                compact={compact}
              />
            );
          })}
        </div>
        
        {/* Interpretations */}
        {showInterpretation && interpretations.length > 0 && (
          <div className="mt-4 space-y-2">
            {interpretations.map((interp, index) => (
              <div 
                key={index}
                className={cn(
                  'flex items-start gap-2 p-2 rounded text-xs',
                  interp.type === 'success' && 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300',
                  interp.type === 'warning' && 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
                  interp.type === 'info' && 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                )}
              >
                {interp.type === 'success' && <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />}
                {interp.type === 'warning' && <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />}
                {interp.type === 'info' && <Info className="h-4 w-4 shrink-0 mt-0.5" />}
                <span>{interp.message}</span>
              </div>
            ))}
          </div>
        )}
        
        {/* Legend for highlighted stats */}
        {!compact && highlightedStats.size > 0 && (
          <div className="mt-3 pt-3 border-t">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="w-1 h-4 bg-primary rounded" />
              <span>Highlighted statistics are most relevant for this transformation</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Export utility functions
export { calculateChange, isImprovement, getInterpretations };
