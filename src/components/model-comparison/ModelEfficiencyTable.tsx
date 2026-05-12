import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';
import type { ModelEfficiencyTableProps, EfficiencyMetrics } from '@/types/comparison';

/**
 * Loading skeleton for efficiency table
 */
function EfficiencyTableSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-6 w-64 bg-gray-200 rounded" />
      <div className="h-48 bg-gray-200 rounded" />
    </div>
  );
}

/**
 * Error display with retry button
 */
function EfficiencyTableError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
      <p className="text-red-600 mb-4">{message}</p>
      {onRetry && (
        <Button variant="outline" onClick={onRetry}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      )}
    </div>
  );
}

/**
 * Format training time in seconds to H:MM:SS format
 */
function formatTrainingTime(seconds: number | null): string {
  if (seconds === null) return 'N/A';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

/**
 * Format model size in bytes to appropriate unit (bytes, KB, MB, GB)
 */
function formatModelSize(bytes: number | null): string {
  if (bytes === null) return 'N/A';
  
  if (bytes < 1024) {
    return `${bytes} bytes`;
  } else if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  } else if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  } else {
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  }
}

/**
 * Format inference time in milliseconds
 */
function formatInferenceTime(ms: number | null): string {
  if (ms === null) return 'N/A';
  return `${ms.toFixed(2)} ms`;
}

/**
 * Format FLOPs count
 */
function formatFlops(flops: number | null): string {
  if (flops === null) return 'N/A';
  
  if (flops < 1000) {
    return `${flops}`;
  } else if (flops < 1000000) {
    return `${(flops / 1000).toFixed(1)}K`;
  } else if (flops < 1000000000) {
    return `${(flops / 1000000).toFixed(1)}M`;
  } else if (flops < 1000000000000) {
    return `${(flops / 1000000000).toFixed(1)}G`;
  } else {
    return `${(flops / 1000000000000).toFixed(2)}T`;
  }
}

/**
 * ModelEfficiencyTable
 * - Shows computational efficiency metrics for selected models
 * - Metrics: training time, inference time, model size, FLOPs
 * - Highlights best (lowest) values in each column
 * - Accepts data via props from parent dashboard
 */
export function ModelEfficiencyTable({
  modelIds,
  data,
  loading = false,
  error,
  onRetry,
}: ModelEfficiencyTableProps) {
  // Show loading skeleton
  if (loading) {
    return <EfficiencyTableSkeleton />;
  }

  // Show error state
  if (error) {
    return <EfficiencyTableError message={error.message} onRetry={onRetry} />;
  }

  // Show empty state if no data
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No efficiency metrics available for the selected models.
      </div>
    );
  }

  // Filter data to only include requested model IDs
  const efficiency = data.filter(d => modelIds.includes(d.modelId));

  if (efficiency.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No efficiency metrics available for the selected models.
      </div>
    );
  }

  // Find best (lowest) values for highlighting
  const validTrainingTimes = efficiency.map(e => e.trainingTimeSeconds).filter((v): v is number => v !== null);
  const validInferenceTimes = efficiency.map(e => e.inferenceTimeMs).filter((v): v is number => v !== null);
  const validSizes = efficiency.map(e => e.modelSizeBytes).filter((v): v is number => v !== null);
  const validFlops = efficiency.map(e => e.flops).filter((v): v is number => v !== null);

  const bestTrainingTime = validTrainingTimes.length > 0 ? Math.min(...validTrainingTimes) : null;
  const bestInferenceTime = validInferenceTimes.length > 0 ? Math.min(...validInferenceTimes) : null;
  const bestSize = validSizes.length > 0 ? Math.min(...validSizes) : null;
  const bestFlops = validFlops.length > 0 ? Math.min(...validFlops) : null;

  const isBest = (value: number | null, best: number | null): boolean => {
    return value !== null && best !== null && value === best;
  };

  const bestStyle = {
    background: 'rgba(40, 167, 69, 0.2)',
    fontWeight: 'bold' as const,
  };

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Computational Efficiency Metrics</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-300">
          <thead>
            <tr>
              <th className="border border-gray-300 bg-gray-100 p-2">Model</th>
              <th className="border border-gray-300 bg-gray-100 p-2">Training Time (H:MM:SS)</th>
              <th className="border border-gray-300 bg-gray-100 p-2">Inference Time (ms)</th>
              <th className="border border-gray-300 bg-gray-100 p-2">Model Size</th>
              <th className="border border-gray-300 bg-gray-100 p-2">FLOPs</th>
            </tr>
          </thead>
          <tbody>
            {efficiency.map(e => (
              <tr key={e.modelId}>
                <td className="border border-gray-300 text-center p-2">{e.modelName}</td>
                <td 
                  className="border border-gray-300 text-center p-2"
                  style={isBest(e.trainingTimeSeconds, bestTrainingTime) ? bestStyle : undefined}
                >
                  {formatTrainingTime(e.trainingTimeSeconds)}
                </td>
                <td 
                  className="border border-gray-300 text-center p-2"
                  style={isBest(e.inferenceTimeMs, bestInferenceTime) ? bestStyle : undefined}
                >
                  {formatInferenceTime(e.inferenceTimeMs)}
                </td>
                <td 
                  className="border border-gray-300 text-center p-2"
                  style={isBest(e.modelSizeBytes, bestSize) ? bestStyle : undefined}
                >
                  {formatModelSize(e.modelSizeBytes)}
                </td>
                <td 
                  className="border border-gray-300 text-center p-2"
                  style={isBest(e.flops, bestFlops) ? bestStyle : undefined}
                >
                  {formatFlops(e.flops)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="text-xs text-muted-foreground mt-2">
          Lower values are generally better for inference time, model size, and FLOPs. Best values are highlighted in green.
        </div>
      </div>
    </div>
  );
}
