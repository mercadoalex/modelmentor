import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';
import type { HyperparameterComparisonTableProps, HyperparameterData } from '@/types/comparison';

/**
 * Loading skeleton for hyperparameter table
 */
function HyperparameterTableSkeleton() {
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
function HyperparameterTableError({ message, onRetry }: { message: string; onRetry?: () => void }) {
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
 * Format a hyperparameter value for display
 */
function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'number') {
    // Format numbers nicely
    if (Number.isInteger(value)) return String(value);
    return value.toFixed(6).replace(/\.?0+$/, '');
  }
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  return String(value);
}

/**
 * HyperparameterComparisonTable
 * - Shows all hyperparameters for each selected model
 * - Highlights differences between models
 * - Accepts data via props from parent dashboard
 */
export function HyperparameterComparisonTable({
  modelIds,
  data,
  loading = false,
  error,
  onRetry,
}: HyperparameterComparisonTableProps) {
  // Show loading skeleton
  if (loading) {
    return <HyperparameterTableSkeleton />;
  }

  // Show error state
  if (error) {
    return <HyperparameterTableError message={error.message} onRetry={onRetry} />;
  }

  // Show empty state if no data
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No hyperparameter data available for the selected models.
      </div>
    );
  }

  // Filter data to only include requested model IDs
  const hyperparams = data.filter(d => modelIds.includes(d.modelId));

  if (hyperparams.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No hyperparameter data available for the selected models.
      </div>
    );
  }

  // Standard hyperparameter keys
  const standardKeys = ['learningRate', 'batchSize', 'epochs', 'optimizer'];
  const standardLabels: Record<string, string> = {
    learningRate: 'Learning Rate',
    batchSize: 'Batch Size',
    epochs: 'Epochs',
    optimizer: 'Optimizer',
  };

  // Collect all unique custom hyperparameter keys
  const customKeys = new Set<string>();
  hyperparams.forEach(h => {
    if (h.customParams) {
      Object.keys(h.customParams).forEach(key => customKeys.add(key));
    }
  });
  const sortedCustomKeys = Array.from(customKeys).sort();

  // Helper to get value for a standard key
  const getStandardValue = (h: HyperparameterData, key: string): unknown => {
    switch (key) {
      case 'learningRate': return h.learningRate;
      case 'batchSize': return h.batchSize;
      case 'epochs': return h.epochs;
      case 'optimizer': return h.optimizer;
      default: return null;
    }
  };

  // Helper to check if values differ across models for a given key
  const hasDifference = (key: string, isCustom: boolean): boolean => {
    if (hyperparams.length <= 1) return false;
    
    const values = hyperparams.map(h => {
      if (isCustom) {
        return h.customParams?.[key];
      }
      return getStandardValue(h, key);
    });
    
    const formattedValues = values.map(v => formatValue(v));
    return new Set(formattedValues).size > 1;
  };

  const differenceStyle = {
    background: 'rgba(255, 193, 7, 0.2)',
    fontWeight: 'bold' as const,
  };

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Hyperparameter Comparison</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-300">
          <thead>
            <tr>
              <th className="border border-gray-300 bg-gray-100 p-2">Hyperparameter</th>
              {hyperparams.map(h => (
                <th key={h.modelId} className="border border-gray-300 bg-gray-100 p-2">
                  {h.modelName}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Standard hyperparameters */}
            {standardKeys.map(key => {
              const isDifferent = hasDifference(key, false);
              return (
                <tr key={key}>
                  <td className="border border-gray-300 text-center p-2 font-medium">
                    {standardLabels[key]}
                  </td>
                  {hyperparams.map(h => (
                    <td
                      key={h.modelId}
                      className="border border-gray-300 text-center p-2"
                      style={isDifferent ? differenceStyle : undefined}
                    >
                      {formatValue(getStandardValue(h, key))}
                    </td>
                  ))}
                </tr>
              );
            })}
            
            {/* Custom hyperparameters */}
            {sortedCustomKeys.map(key => {
              const isDifferent = hasDifference(key, true);
              return (
                <tr key={`custom-${key}`}>
                  <td className="border border-gray-300 text-center p-2 font-medium">
                    {key}
                  </td>
                  {hyperparams.map(h => (
                    <td
                      key={h.modelId}
                      className="border border-gray-300 text-center p-2"
                      style={isDifferent ? differenceStyle : undefined}
                    >
                      {formatValue(h.customParams?.[key])}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="text-xs text-muted-foreground mt-2">
          Differences are highlighted in yellow.
        </div>
      </div>
    </div>
  );
}
