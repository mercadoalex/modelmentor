import { useEffect, useState } from 'react';

/**
 * Props for ModelEfficiencyTable
 * @param modelIds - Array of selected model IDs to compare
 */
interface ModelEfficiencyTableProps {
  modelIds: string[];
}

/**
 * Example efficiency data structure for demonstration.
 * In production, fetch real efficiency metrics from backend.
 */
interface ModelEfficiency {
  modelId: string;
  modelName: string;
  trainingTime: number; // in seconds
  inferenceTime: number; // in milliseconds
  modelSizeMB: number;
  flops: number; // in millions
}

/**
 * ModelEfficiencyTable
 * - Shows computational efficiency metrics for selected models
 * - Metrics: training time, inference time, model size, FLOPs
 */
export function ModelEfficiencyTable({ modelIds }: ModelEfficiencyTableProps) {
  const [efficiency, setEfficiency] = useState<ModelEfficiency[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch efficiency metrics for selected models
  useEffect(() => {
    setLoading(true);
    // TODO: Replace with real fetch from backend or Supabase
    const example: ModelEfficiency[] = [
      {
        modelId: 'model1',
        modelName: 'ResNet50 v1',
        trainingTime: 3600,
        inferenceTime: 25,
        modelSizeMB: 98,
        flops: 4100,
      },
      {
        modelId: 'model2',
        modelName: 'EfficientNet B0',
        trainingTime: 2700,
        inferenceTime: 15,
        modelSizeMB: 29,
        flops: 390,
      },
      {
        modelId: 'model3',
        modelName: 'Custom CNN',
        trainingTime: 1800,
        inferenceTime: 10,
        modelSizeMB: 12,
        flops: 120,
      },
    ];
    setEfficiency(example.filter(e => modelIds.includes(e.modelId)));
    setLoading(false);
  }, [modelIds]);

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Computational Efficiency Metrics</h3>
      {loading ? (
        <div>Loading efficiency metrics...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-300">
            <thead>
              <tr>
                <th className="border border-gray-300 bg-gray-100 p-1">Model</th>
                <th className="border border-gray-300 bg-gray-100 p-1">Training Time (h:m:s)</th>
                <th className="border border-gray-300 bg-gray-100 p-1">Inference Time (ms)</th>
                <th className="border border-gray-300 bg-gray-100 p-1">Model Size (MB)</th>
                <th className="border border-gray-300 bg-gray-100 p-1">FLOPs (M)</th>
              </tr>
            </thead>
            <tbody>
              {efficiency.map(e => (
                <tr key={e.modelId}>
                  <td className="border border-gray-300 text-center p-1">{e.modelName}</td>
                  <td className="border border-gray-300 text-center p-1">
                    {`${Math.floor(e.trainingTime / 3600)}:${String(Math.floor((e.trainingTime % 3600) / 60)).padStart(2, '0')}:${String(e.trainingTime % 60).padStart(2, '0')}`}
                  </td>
                  <td className="border border-gray-300 text-center p-1">{e.inferenceTime}</td>
                  <td className="border border-gray-300 text-center p-1">{e.modelSizeMB}</td>
                  <td className="border border-gray-300 text-center p-1">{e.flops}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="text-xs text-muted-foreground mt-2">
            Lower values are generally better for inference time, model size, and FLOPs.
          </div>
        </div>
      )}
    </div>
  );
}