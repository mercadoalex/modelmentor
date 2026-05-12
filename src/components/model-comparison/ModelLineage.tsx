import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';
import type { ModelLineageProps, LineageData } from '@/types/comparison';

/**
 * Loading skeleton for model lineage
 */
function ModelLineageSkeleton() {
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
function ModelLineageError({ message, onRetry }: { message: string; onRetry?: () => void }) {
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
 * Format UTC timestamp to user's local timezone
 */
function formatTimestamp(utcTimestamp: string): string {
  try {
    const date = new Date(utcTimestamp);
    return date.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
    });
  } catch {
    return utcTimestamp;
  }
}

/**
 * ModelLineage
 * - Shows model lineage, experiment tracking, and reproducibility information
 * - Displays parent-child relationships and experiment metadata
 * - Accepts data via props from parent dashboard
 */
export function ModelLineage({
  modelIds,
  data,
  loading = false,
  error,
  onRetry,
}: ModelLineageProps) {
  // Show loading skeleton
  if (loading) {
    return <ModelLineageSkeleton />;
  }

  // Show error state
  if (error) {
    return <ModelLineageError message={error.message} onRetry={onRetry} />;
  }

  // Show empty state if no data
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No lineage information available for the selected models.
      </div>
    );
  }

  // Filter data to only include requested model IDs
  const lineage = data.filter(d => modelIds.includes(d.modelId));

  if (lineage.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No lineage information available for the selected models.
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Model Lineage & Experiment Tracking</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-300">
          <thead>
            <tr>
              <th className="border border-gray-300 bg-gray-100 p-2">Model</th>
              <th className="border border-gray-300 bg-gray-100 p-2">Parent Model</th>
              <th className="border border-gray-300 bg-gray-100 p-2">Experiment ID</th>
              <th className="border border-gray-300 bg-gray-100 p-2">Created At</th>
              <th className="border border-gray-300 bg-gray-100 p-2">Created By</th>
              <th className="border border-gray-300 bg-gray-100 p-2">Notes</th>
            </tr>
          </thead>
          <tbody>
            {lineage.map(l => (
              <tr key={l.modelId}>
                <td className="border border-gray-300 text-center p-2 font-medium">
                  {l.modelName}
                </td>
                <td className="border border-gray-300 text-center p-2">
                  {l.parentModelName || '—'}
                </td>
                <td className="border border-gray-300 text-center p-2">
                  {l.experimentId || '—'}
                </td>
                <td className="border border-gray-300 text-center p-2">
                  {formatTimestamp(l.createdAt)}
                </td>
                <td className="border border-gray-300 text-center p-2">
                  {l.createdBy || '—'}
                </td>
                <td className="border border-gray-300 text-center p-2 max-w-xs truncate" title={l.notes || undefined}>
                  {l.notes || '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="text-xs text-muted-foreground mt-2">
          Track model lineage and experiment metadata for reproducibility and auditability.
        </div>
      </div>
    </div>
  );
}
