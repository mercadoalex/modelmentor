import { useEffect, useState } from 'react';

/**
 * Props for ConfusionMatrixComparison
 * @param modelIds - Array of selected model IDs to compare
 */
interface ConfusionMatrixComparisonProps {
  modelIds: string[];
}

/**
 * Example confusion matrix data structure for demonstration.
 * In production, fetch real confusion matrices from backend.
 */
interface ConfusionMatrixData {
  modelId: string;
  modelName: string;
  matrix: number[][];
  labels: string[];
}

/**
 * ConfusionMatrixComparison
 * - Displays side-by-side confusion matrices for selected models
 * - Shows a difference heatmap if two models are selected
 */
export function ConfusionMatrixComparison({ modelIds }: ConfusionMatrixComparisonProps) {
  const [matrices, setMatrices] = useState<ConfusionMatrixData[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch confusion matrices for selected models
  useEffect(() => {
    setLoading(true);
    // TODO: Replace with real fetch from backend or Supabase
    const example: ConfusionMatrixData[] = [
      {
        modelId: 'model1',
        modelName: 'ResNet50 v1',
        labels: ['Cat', 'Dog', 'Rabbit'],
        matrix: [
          [30, 2, 1],
          [3, 28, 4],
          [0, 2, 33],
        ],
      },
      {
        modelId: 'model2',
        modelName: 'EfficientNet B0',
        labels: ['Cat', 'Dog', 'Rabbit'],
        matrix: [
          [28, 4, 1],
          [2, 29, 4],
          [1, 3, 31],
        ],
      },
    ];
    setMatrices(example.filter(m => modelIds.includes(m.modelId)));
    setLoading(false);
  }, [modelIds]);

  // Compute difference heatmap if exactly two models are selected
  const getDifferenceMatrix = () => {
    if (matrices.length !== 2) return null;
    const [m1, m2] = matrices;
    return m1.matrix.map((row, i) =>
      row.map((val, j) => val - m2.matrix[i][j])
    );
  };

  // Helper to render a confusion matrix as a table
  const renderMatrixTable = (matrix: number[][], labels: string[], title: string) => (
    <div className="inline-block mr-8 mb-4">
      <div className="font-semibold mb-1 text-center">{title}</div>
      <table className="border-collapse border border-gray-300">
        <thead>
          <tr>
            <th className="border border-gray-300 bg-gray-100 p-1"></th>
            {labels.map(label => (
              <th key={label} className="border border-gray-300 bg-gray-100 p-1">{label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {matrix.map((row, i) => (
            <tr key={i}>
              <th className="border border-gray-300 bg-gray-100 p-1">{labels[i]}</th>
              {row.map((val, j) => (
                <td
                  key={j}
                  className="border border-gray-300 text-center p-1"
                  style={{
                    background: `rgba(0, 123, 255, ${Math.min(val / 35, 1) * 0.5 + 0.1})`,
                    color: val > 20 ? 'white' : 'black',
                  }}
                >
                  {val}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  // Helper to render a difference heatmap
  const renderDifferenceMatrix = (diff: number[][], labels: string[]) => (
    <div className="inline-block mb-4">
      <div className="font-semibold mb-1 text-center">Difference Heatmap</div>
      <table className="border-collapse border border-gray-300">
        <thead>
          <tr>
            <th className="border border-gray-300 bg-gray-100 p-1"></th>
            {labels.map(label => (
              <th key={label} className="border border-gray-300 bg-gray-100 p-1">{label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {diff.map((row, i) => (
            <tr key={i}>
              <th className="border border-gray-300 bg-gray-100 p-1">{labels[i]}</th>
              {row.map((val, j) => (
                <td
                  key={j}
                  className="border border-gray-300 text-center p-1"
                  style={{
                    background: val === 0
                      ? '#f8f9fa'
                      : val > 0
                        ? `rgba(40, 167, 69, ${Math.min(Math.abs(val) / 10, 1) * 0.5 + 0.1})`
                        : `rgba(220, 53, 69, ${Math.min(Math.abs(val) / 10, 1) * 0.5 + 0.1})`,
                    color: Math.abs(val) > 5 ? 'white' : 'black',
                  }}
                >
                  {val > 0 ? `+${val}` : val}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Confusion Matrix Comparison</h3>
      {loading ? (
        <div>Loading matrices...</div>
      ) : (
        <div className="flex flex-wrap gap-8">
          {matrices.map(m =>
            renderMatrixTable(m.matrix, m.labels, m.modelName)
          )}
          {/* Show difference heatmap if exactly two models are selected */}
          {matrices.length === 2 && renderDifferenceMatrix(getDifferenceMatrix()!, matrices[0].labels)}
        </div>
      )}
      <div className="text-xs text-muted-foreground mt-2">
        Each cell shows the count of predictions. Difference heatmap: green = higher, red = lower.
      </div>
    </div>
  );
}