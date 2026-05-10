import { useEffect, useState } from 'react';

/**
 * Props for ModelLineage
 * @param modelIds - Array of selected model IDs to compare
 */
interface ModelLineageProps {
  modelIds: string[];
}

/**
 * Example model lineage data structure for demonstration.
 * In production, fetch real lineage/experiment tracking data from backend.
 */
interface ModelLineageInfo {
  modelId: string;
  modelName: string;
  parentModelId?: string;
  parentModelName?: string;
  experimentId: string;
  createdAt: string;
  createdBy: string;
  notes?: string;
}

/**
 * ModelLineage
 * - Shows model lineage, experiment tracking, and reproducibility information
 * - Displays parent-child relationships and experiment metadata
 */
export function ModelLineage({ modelIds }: ModelLineageProps) {
  const [lineage, setLineage] = useState<ModelLineageInfo[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch model lineage info for selected models
  useEffect(() => {
    setLoading(true);
    // TODO: Replace with real fetch from backend or Supabase
    const example: ModelLineageInfo[] = [
      {
        modelId: 'model1',
        modelName: 'ResNet50 v1',
        experimentId: 'exp-001',
        createdAt: '2024-05-01T10:00:00Z',
        createdBy: 'alice@school.edu',
        notes: 'Baseline model, ImageNet pre-trained.',
      },
      {
        modelId: 'model2',
        modelName: 'EfficientNet B0',
        parentModelId: 'model1',
        parentModelName: 'ResNet50 v1',
        experimentId: 'exp-002',
        createdAt: '2024-05-03T14:30:00Z',
        createdBy: 'bob@school.edu',
        notes: 'Fine-tuned on custom dataset.',
      },
      {
        modelId: 'model3',
        modelName: 'Custom CNN',
        experimentId: 'exp-003',
        createdAt: '2024-05-05T09:15:00Z',
        createdBy: 'carol@school.edu',
        notes: 'Designed for speed, fewer layers.',
      },
    ];
    setLineage(example.filter(l => modelIds.includes(l.modelId)));
    setLoading(false);
  }, [modelIds]);

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Model Lineage & Experiment Tracking</h3>
      {loading ? (
        <div>Loading lineage information...</div>
      ) : lineage.length === 0 ? (
        <div>No lineage information available for selected models.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-300">
            <thead>
              <tr>
                <th className="border border-gray-300 bg-gray-100 p-1">Model</th>
                <th className="border border-gray-300 bg-gray-100 p-1">Parent Model</th>
                <th className="border border-gray-300 bg-gray-100 p-1">Experiment ID</th>
                <th className="border border-gray-300 bg-gray-100 p-1">Created At</th>
                <th className="border border-gray-300 bg-gray-100 p-1">Created By</th>
                <th className="border border-gray-300 bg-gray-100 p-1">Notes</th>
              </tr>
            </thead>
            <tbody>
              {lineage.map(l => (
                <tr key={l.modelId}>
                  <td className="border border-gray-300 text-center p-1 font-medium">{l.modelName}</td>
                  <td className="border border-gray-300 text-center p-1">
                    {l.parentModelName || '—'}
                  </td>
                  <td className="border border-gray-300 text-center p-1">{l.experimentId}</td>
                  <td className="border border-gray-300 text-center p-1">
                    {new Date(l.createdAt).toLocaleString()}
                  </td>
                  <td className="border border-gray-300 text-center p-1">{l.createdBy}</td>
                  <td className="border border-gray-300 text-center p-1">{l.notes || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="text-xs text-muted-foreground mt-2">
            Track model lineage and experiment metadata for reproducibility and auditability.
          </div>
        </div>
      )}
    </div>
  );
}