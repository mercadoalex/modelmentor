import { useEffect, useState } from 'react';

/**
 * Props for StatisticalTests
 * @param modelIds - Array of selected model IDs to compare
 */
interface StatisticalTestsProps {
  modelIds: string[];
}

/**
 * Example test data structure for demonstration.
 * In production, fetch real test results from backend.
 */
interface StatisticalTestResult {
  testName: string;
  modelA: string;
  modelB: string;
  pValue: number;
  significant: boolean;
  confidenceInterval?: [number, number];
}

/**
 * StatisticalTests
 * - Shows results of paired t-tests, McNemar test, and confidence intervals
 * - Indicates statistical significance between model pairs
 */
export function StatisticalTests({ modelIds }: StatisticalTestsProps) {
  const [results, setResults] = useState<StatisticalTestResult[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch statistical test results for selected models
  useEffect(() => {
    setLoading(true);
    // TODO: Replace with real fetch from backend or Supabase
    // Example placeholder data
    const example: StatisticalTestResult[] = [
      {
        testName: 'Paired t-test',
        modelA: 'ResNet50 v1',
        modelB: 'EfficientNet B0',
        pValue: 0.03,
        significant: true,
        confidenceInterval: [0.01, 0.12],
      },
      {
        testName: 'McNemar test',
        modelA: 'ResNet50 v1',
        modelB: 'EfficientNet B0',
        pValue: 0.21,
        significant: false,
      },
      {
        testName: 'Paired t-test',
        modelA: 'ResNet50 v1',
        modelB: 'Custom CNN',
        pValue: 0.001,
        significant: true,
        confidenceInterval: [0.05, 0.18],
      },
    ];
    // Only show tests for selected models
    setResults(
      example.filter(
        r =>
          modelIds.includes(
            example.find(e => e.modelA === r.modelA)?.modelA || ''
          ) &&
          modelIds.includes(
            example.find(e => e.modelB === r.modelB)?.modelB || ''
          )
      )
    );
    setLoading(false);
  }, [modelIds]);

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Statistical Significance Testing</h3>
      {loading ? (
        <div>Loading statistical test results...</div>
      ) : results.length === 0 ? (
        <div>No statistical tests available for selected models.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-300">
            <thead>
              <tr>
                <th className="border border-gray-300 bg-gray-100 p-1">Test</th>
                <th className="border border-gray-300 bg-gray-100 p-1">Model A</th>
                <th className="border border-gray-300 bg-gray-100 p-1">Model B</th>
                <th className="border border-gray-300 bg-gray-100 p-1">p-value</th>
                <th className="border border-gray-300 bg-gray-100 p-1">Significant?</th>
                <th className="border border-gray-300 bg-gray-100 p-1">Confidence Interval</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r, idx) => (
                <tr key={idx}>
                  <td className="border border-gray-300 text-center p-1">{r.testName}</td>
                  <td className="border border-gray-300 text-center p-1">{r.modelA}</td>
                  <td className="border border-gray-300 text-center p-1">{r.modelB}</td>
                  <td className="border border-gray-300 text-center p-1">{r.pValue.toFixed(3)}</td>
                  <td
                    className="border border-gray-300 text-center p-1"
                    style={{
                      color: r.significant ? 'green' : 'gray',
                      fontWeight: r.significant ? 'bold' : undefined,
                    }}
                  >
                    {r.significant ? 'Yes' : 'No'}
                  </td>
                  <td className="border border-gray-300 text-center p-1">
                    {r.confidenceInterval
                      ? `[${r.confidenceInterval[0].toFixed(2)}, ${r.confidenceInterval[1].toFixed(2)}]`
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="text-xs text-muted-foreground mt-2">
            p-value &lt; 0.05 is considered statistically significant. Confidence intervals shown where available.
          </div>
        </div>
      )}
    </div>
  );
}