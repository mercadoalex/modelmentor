import { useMemo } from 'react';
import { Trophy, Smartphone, Target, Info } from 'lucide-react';
import type { ModelRecommendationProps, EfficiencyMetrics } from '@/types/comparison';

/**
 * Loading skeleton for model recommendation
 */
function ModelRecommendationSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-6 w-64 bg-gray-200 rounded" />
      <div className="h-24 bg-gray-200 rounded" />
      <div className="h-24 bg-gray-200 rounded" />
      <div className="h-24 bg-gray-200 rounded" />
    </div>
  );
}

interface ModelSummary {
  modelId: string;
  modelName: string;
  accuracy: number | null;
  inferenceTimeMs: number | null;
  modelSizeBytes: number | null;
}

/**
 * Format model size for display
 */
function formatSize(bytes: number | null): string {
  if (bytes === null) return 'N/A';
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  } else if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

/**
 * ModelRecommendation
 * - Provides recommendations for model selection based on accuracy, speed, size, and use case
 * - Explains tradeoffs and suggests best fit for deployment constraints
 * - Accepts data via props from parent dashboard
 */
export function ModelRecommendation({
  modelIds,
  efficiencyData,
  accuracyData,
  loading = false,
}: ModelRecommendationProps) {
  // Show loading skeleton
  if (loading) {
    return <ModelRecommendationSkeleton />;
  }

  // Build model summaries from available data
  const summaries = useMemo((): ModelSummary[] => {
    const modelMap = new Map<string, ModelSummary>();

    // Initialize from efficiency data
    efficiencyData?.forEach(e => {
      if (modelIds.includes(e.modelId)) {
        modelMap.set(e.modelId, {
          modelId: e.modelId,
          modelName: e.modelName,
          accuracy: null,
          inferenceTimeMs: e.inferenceTimeMs,
          modelSizeBytes: e.modelSizeBytes,
        });
      }
    });

    // Add accuracy data
    accuracyData?.forEach(a => {
      if (modelIds.includes(a.modelId)) {
        const existing = modelMap.get(a.modelId);
        if (existing) {
          existing.accuracy = a.accuracy;
        } else {
          modelMap.set(a.modelId, {
            modelId: a.modelId,
            modelName: a.modelId, // Fallback to ID if no name
            accuracy: a.accuracy,
            inferenceTimeMs: null,
            modelSizeBytes: null,
          });
        }
      }
    });

    return Array.from(modelMap.values());
  }, [modelIds, efficiencyData, accuracyData]);

  // Show empty state if no data
  if (summaries.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No model data available for recommendations. Please ensure models have accuracy and efficiency metrics.
      </div>
    );
  }

  // Best Overall: Rank by accuracy, then inference time, then model size
  const getBestOverall = (): ModelSummary | null => {
    const withAccuracy = summaries.filter(s => s.accuracy !== null);
    if (withAccuracy.length === 0) return null;

    return withAccuracy.sort((a, b) => {
      // Higher accuracy is better
      if ((b.accuracy ?? 0) !== (a.accuracy ?? 0)) {
        return (b.accuracy ?? 0) - (a.accuracy ?? 0);
      }
      // Lower inference time is better
      if ((a.inferenceTimeMs ?? Infinity) !== (b.inferenceTimeMs ?? Infinity)) {
        return (a.inferenceTimeMs ?? Infinity) - (b.inferenceTimeMs ?? Infinity);
      }
      // Smaller size is better
      return (a.modelSizeBytes ?? Infinity) - (b.modelSizeBytes ?? Infinity);
    })[0];
  };

  // Best for Edge/Mobile: Rank by model size, then inference time
  const getBestForEdge = (): ModelSummary | null => {
    const withSize = summaries.filter(s => s.modelSizeBytes !== null);
    if (withSize.length === 0) return null;

    return withSize.sort((a, b) => {
      // Smaller size is better
      if ((a.modelSizeBytes ?? Infinity) !== (b.modelSizeBytes ?? Infinity)) {
        return (a.modelSizeBytes ?? Infinity) - (b.modelSizeBytes ?? Infinity);
      }
      // Lower inference time is better
      return (a.inferenceTimeMs ?? Infinity) - (b.inferenceTimeMs ?? Infinity);
    })[0];
  };

  // Best for Accuracy-Critical: Rank by highest accuracy
  const getBestForAccuracy = (): ModelSummary | null => {
    const withAccuracy = summaries.filter(s => s.accuracy !== null);
    if (withAccuracy.length === 0) return null;

    return withAccuracy.sort((a, b) => (b.accuracy ?? 0) - (a.accuracy ?? 0))[0];
  };

  const bestOverall = getBestOverall();
  const bestForEdge = getBestForEdge();
  const bestForAccuracy = getBestForAccuracy();

  // Generate tradeoff explanation
  const getTradeoffExplanation = (model: ModelSummary, category: string): string => {
    const parts: string[] = [];
    
    if (model.accuracy !== null) {
      parts.push(`${(model.accuracy * 100).toFixed(1)}% accuracy`);
    }
    if (model.inferenceTimeMs !== null) {
      parts.push(`${model.inferenceTimeMs.toFixed(2)} ms inference`);
    }
    if (model.modelSizeBytes !== null) {
      parts.push(formatSize(model.modelSizeBytes));
    }

    const metrics = parts.join(', ');

    switch (category) {
      case 'overall':
        return `Best balance of accuracy and efficiency. ${metrics}.`;
      case 'edge':
        return `Optimized for resource-constrained environments. ${metrics}.`;
      case 'accuracy':
        return `Highest accuracy for critical applications. ${metrics}.`;
      default:
        return metrics;
    }
  };

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Model Selection Recommendation</h3>
      
      <div className="space-y-4">
        {/* Best Overall */}
        {bestOverall && (
          <div className="border rounded-lg p-4 bg-gradient-to-r from-yellow-50 to-amber-50">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="h-5 w-5 text-yellow-600" />
              <span className="font-semibold text-yellow-800">Best Overall</span>
            </div>
            <div className="text-lg font-medium">{bestOverall.modelName}</div>
            <div className="text-sm text-muted-foreground mt-1">
              {getTradeoffExplanation(bestOverall, 'overall')}
            </div>
          </div>
        )}

        {/* Best for Edge/Mobile */}
        {bestForEdge && bestForEdge.modelId !== bestOverall?.modelId && (
          <div className="border rounded-lg p-4 bg-gradient-to-r from-blue-50 to-cyan-50">
            <div className="flex items-center gap-2 mb-2">
              <Smartphone className="h-5 w-5 text-blue-600" />
              <span className="font-semibold text-blue-800">Best for Edge/Mobile</span>
            </div>
            <div className="text-lg font-medium">{bestForEdge.modelName}</div>
            <div className="text-sm text-muted-foreground mt-1">
              {getTradeoffExplanation(bestForEdge, 'edge')}
            </div>
          </div>
        )}

        {/* Best for Accuracy-Critical */}
        {bestForAccuracy && 
         bestForAccuracy.modelId !== bestOverall?.modelId && 
         bestForAccuracy.modelId !== bestForEdge?.modelId && (
          <div className="border rounded-lg p-4 bg-gradient-to-r from-green-50 to-emerald-50">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-5 w-5 text-green-600" />
              <span className="font-semibold text-green-800">Best for Accuracy-Critical</span>
            </div>
            <div className="text-lg font-medium">{bestForAccuracy.modelName}</div>
            <div className="text-sm text-muted-foreground mt-1">
              {getTradeoffExplanation(bestForAccuracy, 'accuracy')}
            </div>
          </div>
        )}

        {/* No recommendations available */}
        {!bestOverall && !bestForEdge && !bestForAccuracy && (
          <div className="text-center py-4 text-muted-foreground">
            Insufficient data to generate recommendations. Models need accuracy and/or efficiency metrics.
          </div>
        )}
      </div>

      <div className="flex items-start gap-2 mt-4 text-xs text-muted-foreground">
        <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
        <span>
          Recommendations consider accuracy, inference speed, and model size. 
          Adjust for your specific deployment constraints and use case requirements.
        </span>
      </div>
    </div>
  );
}
