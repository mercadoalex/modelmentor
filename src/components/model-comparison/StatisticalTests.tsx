import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import type { StatisticalTestsProps, StatisticalTestResult } from '@/types/comparison';

/**
 * Loading skeleton for statistical tests
 */
function StatisticalTestsSkeleton() {
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
function StatisticalTestsError({ message, onRetry }: { message: string; onRetry?: () => void }) {
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
 * Format test name for display
 */
function formatTestName(testName: string): string {
  switch (testName) {
    case 'paired_t_test': return 'Paired t-test';
    case 'mcnemar_test': return 'McNemar test';
    default: return testName;
  }
}

/**
 * StatisticalTests
 * - Shows results of paired t-tests, McNemar test, and confidence intervals
 * - Indicates statistical significance between model pairs
 * - Accepts data via props from parent dashboard
 */
export function StatisticalTests({
  modelIds,
  results,
  loading = false,
  error,
  onRetry,
}: StatisticalTestsProps) {
  // Show loading skeleton
  if (loading) {
    return <StatisticalTestsSkeleton />;
  }

  // Show error state
  if (error) {
    return <StatisticalTestsError message={error.message} onRetry={onRetry} />;
  }

  // Show empty state if no results
  if (!results || results.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No statistical tests available. Statistical tests require at least 2 models with prediction data.
      </div>
    );
  }

  // Filter results to only include tests for requested model IDs
  const filteredResults = results.filter(
    r => modelIds.includes(r.modelAId) && modelIds.includes(r.modelBId)
  );

  if (filteredResults.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No statistical tests available for the selected models.
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Statistical Significance Testing</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-300">
          <thead>
            <tr>
              <th className="border border-gray-300 bg-gray-100 p-2">Test</th>
              <th className="border border-gray-300 bg-gray-100 p-2">Model A</th>
              <th className="border border-gray-300 bg-gray-100 p-2">Model B</th>
              <th className="border border-gray-300 bg-gray-100 p-2">p-value</th>
              <th className="border border-gray-300 bg-gray-100 p-2">Significant?</th>
              <th className="border border-gray-300 bg-gray-100 p-2">95% CI</th>
              <th className="border border-gray-300 bg-gray-100 p-2">Effect Size</th>
            </tr>
          </thead>
          <tbody>
            {filteredResults.map((r, idx) => (
              <tr key={`${r.testName}-${r.modelAId}-${r.modelBId}-${idx}`}>
                <td className="border border-gray-300 text-center p-2">
                  {formatTestName(r.testName)}
                </td>
                <td className="border border-gray-300 text-center p-2">{r.modelAName}</td>
                <td className="border border-gray-300 text-center p-2">{r.modelBName}</td>
                <td className="border border-gray-300 text-center p-2">
                  {r.pValue.toFixed(3)}
                </td>
                <td className="border border-gray-300 text-center p-2">
                  {r.significant ? (
                    <span className="inline-flex items-center text-green-600 font-bold">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Yes
                    </span>
                  ) : (
                    <span className="inline-flex items-center text-gray-500">
                      <XCircle className="h-4 w-4 mr-1" />
                      No
                    </span>
                  )}
                </td>
                <td className="border border-gray-300 text-center p-2">
                  {r.confidenceInterval
                    ? `[${r.confidenceInterval[0].toFixed(3)}, ${r.confidenceInterval[1].toFixed(3)}]`
                    : '—'}
                </td>
                <td className="border border-gray-300 text-center p-2">
                  {r.effectSize !== undefined ? r.effectSize.toFixed(3) : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="text-xs text-muted-foreground mt-2">
          p-value &lt; 0.05 is considered statistically significant. Confidence intervals and effect sizes shown where available.
        </div>
      </div>
    </div>
  );
}
