import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import type { PredictionAnalysisProps, PredictionData } from '@/types/comparison';

/**
 * Loading skeleton for prediction analysis
 */
function PredictionAnalysisSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-6 w-64 bg-gray-200 rounded" />
      <div className="h-64 bg-gray-200 rounded" />
      <div className="h-8 w-48 bg-gray-200 rounded" />
    </div>
  );
}

/**
 * Error display with retry button
 */
function PredictionAnalysisError({ message, onRetry }: { message: string; onRetry?: () => void }) {
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
 * PredictionAnalysis
 * - Shows sample predictions from each model
 * - Highlights where models disagree
 * - Shows ensemble voting results
 * - Accepts data via props from parent dashboard
 */
export function PredictionAnalysis({
  modelIds,
  data,
  loading = false,
  error,
  onRetry,
  onPageChange,
}: PredictionAnalysisProps) {
  // Show loading skeleton
  if (loading) {
    return <PredictionAnalysisSkeleton />;
  }

  // Show error state
  if (error) {
    return <PredictionAnalysisError message={error.message} onRetry={onRetry} />;
  }

  // Show empty state if no data
  if (!data || data.predictions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No prediction data available for the selected models.
      </div>
    );
  }

  const { predictions, total, page, pageSize } = data;
  const totalPages = Math.ceil(total / pageSize);

  // Helper to compute ensemble voting result for a sample (majority vote)
  const getEnsembleVote = (sample: PredictionData): string => {
    const votes: Record<string, number> = {};
    
    modelIds.forEach(id => {
      const pred = sample.predictions[id];
      if (pred) {
        votes[pred] = (votes[pred] || 0) + 1;
      }
    });

    // Return the label with the most votes (majority vote)
    // In case of tie, return alphabetically first
    let maxCount = 0;
    let winners: string[] = [];
    
    Object.entries(votes).forEach(([label, count]) => {
      if (count > maxCount) {
        maxCount = count;
        winners = [label];
      } else if (count === maxCount) {
        winners.push(label);
      }
    });

    // Sort alphabetically and return first in case of tie
    return winners.sort()[0] || '';
  };

  // Helper to check if models disagree on a sample
  const hasDisagreement = (sample: PredictionData): boolean => {
    const preds = modelIds.map(id => sample.predictions[id]).filter(Boolean);
    return new Set(preds).size > 1;
  };

  // Get prediction color based on correctness
  const getPredictionColor = (
    prediction: string,
    trueLabel: string,
    ensembleVote: string
  ): string => {
    if (prediction === trueLabel) {
      return 'green'; // Correct prediction
    } else if (prediction === ensembleVote) {
      return 'blue'; // Matches ensemble but not correct
    }
    return 'red'; // Incorrect prediction
  };

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Prediction & Disagreement Analysis</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-300">
          <thead>
            <tr>
              <th className="border border-gray-300 bg-gray-100 p-2 text-sm">Sample</th>
              <th className="border border-gray-300 bg-gray-100 p-2 text-sm">True Label</th>
              {modelIds.map(id => (
                <th key={id} className="border border-gray-300 bg-gray-100 p-2 text-sm">
                  {id.substring(0, 8)}...
                </th>
              ))}
              <th className="border border-gray-300 bg-gray-100 p-2 text-sm">Ensemble Vote</th>
            </tr>
          </thead>
          <tbody>
            {predictions.map(sample => {
              const ensemble = getEnsembleVote(sample);
              const disagreement = hasDisagreement(sample);
              
              return (
                <tr
                  key={sample.sampleId}
                  style={{
                    background: disagreement ? 'rgba(255, 193, 7, 0.15)' : undefined,
                  }}
                >
                  <td className="border border-gray-300 text-center p-2 text-sm">
                    {sample.sampleId}
                  </td>
                  <td className="border border-gray-300 text-center p-2 text-sm">
                    {sample.trueLabel}
                  </td>
                  {modelIds.map(id => {
                    const pred = sample.predictions[id] || '—';
                    const color = pred !== '—' 
                      ? getPredictionColor(pred, sample.trueLabel, ensemble)
                      : 'gray';
                    
                    return (
                      <td
                        key={id}
                        className="border border-gray-300 text-center p-2 text-sm"
                        style={{
                          color,
                          fontWeight: pred === ensemble ? 'bold' : undefined,
                        }}
                      >
                        {pred}
                      </td>
                    );
                  })}
                  <td
                    className="border border-gray-300 text-center p-2 text-sm"
                    style={{
                      color: ensemble === sample.trueLabel ? 'green' : 'blue',
                      fontWeight: 'bold',
                    }}
                  >
                    {ensemble}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-muted-foreground">
            Showing {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, total)} of {total} samples
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => onPageChange?.(page - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <span className="text-sm">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => onPageChange?.(page + 1)}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <div className="text-xs text-muted-foreground mt-2">
        Rows highlighted in yellow indicate model disagreement. Green = correct, red = incorrect, blue = matches ensemble.
      </div>
    </div>
  );
}
