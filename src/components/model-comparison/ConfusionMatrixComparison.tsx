import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';
import type { ConfusionMatrixComparisonProps, ConfusionMatrixData } from '@/types/comparison';

/**
 * Loading skeleton for confusion matrices
 */
function ConfusionMatrixSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-6 w-64 bg-gray-200 rounded" />
      <div className="flex flex-wrap gap-8">
        <div className="h-48 w-48 bg-gray-200 rounded" />
        <div className="h-48 w-48 bg-gray-200 rounded" />
      </div>
    </div>
  );
}

/**
 * Error display with retry button
 */
function ConfusionMatrixError({ message, onRetry }: { message: string; onRetry?: () => void }) {
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
 * ConfusionMatrixComparison
 * - Displays side-by-side confusion matrices for selected models
 * - Shows a difference heatmap if two models are selected
 * - Accepts data via props from parent dashboard
 */
export function ConfusionMatrixComparison({
  modelIds,
  data,
  loading = false,
  error,
  onRetry,
}: ConfusionMatrixComparisonProps) {
  // Show loading skeleton
  if (loading) {
    return <ConfusionMatrixSkeleton />;
  }

  // Show error state
  if (error) {
    return <ConfusionMatrixError message={error.message} onRetry={onRetry} />;
  }

  // Show empty state if no data
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No confusion matrix data available for the selected models.
      </div>
    );
  }

  // Filter data to only include requested model IDs
  const matrices = data.filter(d => modelIds.includes(d.modelId));

  if (matrices.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No confusion matrix data available for the selected models.
      </div>
    );
  }

  // Get unified labels across all matrices for consistent ordering
  const allLabels = new Set<string>();
  matrices.forEach(m => m.labels.forEach(l => allLabels.add(l)));
  const unifiedLabels = Array.from(allLabels).sort();

  // Compute difference heatmap if exactly two models are selected
  const getDifferenceMatrix = (): number[][] | null => {
    if (matrices.length !== 2) return null;
    const [m1, m2] = matrices;
    
    // Both matrices must have the same dimensions
    if (m1.matrix.length !== m2.matrix.length) return null;
    
    return m1.matrix.map((row, i) =>
      row.map((val, j) => val - m2.matrix[i][j])
    );
  };

  // Helper to get max value for color scaling
  const getMaxValue = (matrix: number[][]): number => {
    return Math.max(...matrix.flat());
  };

  // Helper to render a confusion matrix as a table
  const renderMatrixTable = (matrix: number[][], labels: string[], title: string) => {
    const maxVal = getMaxValue(matrix);
    
    return (
      <div className="inline-block mr-8 mb-4">
        <div className="font-semibold mb-1 text-center">{title}</div>
        <table className="border-collapse border border-gray-300">
          <thead>
            <tr>
              <th className="border border-gray-300 bg-gray-100 p-1 text-xs">Actual \ Pred</th>
              {labels.map(label => (
                <th key={label} className="border border-gray-300 bg-gray-100 p-1 text-xs">{label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrix.map((row, i) => (
              <tr key={i}>
                <th className="border border-gray-300 bg-gray-100 p-1 text-xs">{labels[i]}</th>
                {row.map((val, j) => {
                  const intensity = maxVal > 0 ? val / maxVal : 0;
                  return (
                    <td
                      key={j}
                      className="border border-gray-300 text-center p-1 text-sm"
                      style={{
                        background: `rgba(0, 123, 255, ${intensity * 0.7 + 0.1})`,
                        color: intensity > 0.5 ? 'white' : 'black',
                      }}
                    >
                      {val}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // Helper to render a difference heatmap
  const renderDifferenceMatrix = (diff: number[][], labels: string[]) => {
    const maxAbsVal = Math.max(...diff.flat().map(Math.abs));
    
    return (
      <div className="inline-block mb-4">
        <div className="font-semibold mb-1 text-center">Difference Heatmap</div>
        <table className="border-collapse border border-gray-300">
          <thead>
            <tr>
              <th className="border border-gray-300 bg-gray-100 p-1 text-xs">Actual \ Pred</th>
              {labels.map(label => (
                <th key={label} className="border border-gray-300 bg-gray-100 p-1 text-xs">{label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {diff.map((row, i) => (
              <tr key={i}>
                <th className="border border-gray-300 bg-gray-100 p-1 text-xs">{labels[i]}</th>
                {row.map((val, j) => {
                  const intensity = maxAbsVal > 0 ? Math.abs(val) / maxAbsVal : 0;
                  return (
                    <td
                      key={j}
                      className="border border-gray-300 text-center p-1 text-sm"
                      style={{
                        background: val === 0
                          ? '#f8f9fa'
                          : val > 0
                            ? `rgba(40, 167, 69, ${intensity * 0.7 + 0.1})`
                            : `rgba(220, 53, 69, ${intensity * 0.7 + 0.1})`,
                        color: intensity > 0.5 ? 'white' : 'black',
                      }}
                    >
                      {val > 0 ? `+${val}` : val}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const differenceMatrix = getDifferenceMatrix();

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Confusion Matrix Comparison</h3>
      <div className="flex flex-wrap gap-8">
        {matrices.map(m =>
          renderMatrixTable(m.matrix, m.labels, m.modelName)
        )}
        {/* Show difference heatmap if exactly two models are selected */}
        {differenceMatrix && matrices.length === 2 && 
          renderDifferenceMatrix(differenceMatrix, matrices[0].labels)
        }
      </div>
      <div className="text-xs text-muted-foreground mt-2">
        Each cell shows the count of predictions. Difference heatmap: green = higher in first model, red = lower.
      </div>
    </div>
  );
}
