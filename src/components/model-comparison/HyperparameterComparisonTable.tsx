import { useEffect, useState } from 'react';

/**
 * Props for HyperparameterComparisonTable
 * @param modelIds - Array of selected model IDs to compare
 */
interface HyperparameterComparisonTableProps {
  modelIds: string[];
}

/**
 * Example hyperparameter data structure for demonstration.
 * In production, fetch real hyperparameters from backend.
 */
interface ModelHyperparameters {
  modelId: string;
  modelName: string;
  hyperparameters: Record<string, string | number | boolean>;
}

/**
 * HyperparameterComparisonTable
 * - Shows all hyperparameters for each selected model
 * - Highlights differences between models
 */
export function HyperparameterComparisonTable({ modelIds }: HyperparameterComparisonTableProps) {
  const [hyperparams, setHyperparams] = useState<ModelHyperparameters[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch hyperparameters for selected models
  useEffect(() => {
    setLoading(true);
    // TODO: Replace with real fetch from backend or Supabase
    const example: ModelHyperparameters[] = [
      {
        modelId: 'model1',
        modelName: 'ResNet50 v1',
        hyperparameters: {
          learning_rate: 0.001,
          batch_size: 32,
          optimizer: 'Adam',
          epochs: 10,
          data_augmentation: true,
        },
      },
      {
        modelId: 'model2',
        modelName: 'EfficientNet B0',
        hyperparameters: {
          learning_rate: 0.001,
          batch_size: 32,
          optimizer: 'Adam',
          epochs: 15,
          data_augmentation: false,
        },
      },
      {
        modelId: 'model3',
        modelName: 'Custom CNN',
        hyperparameters: {
          learning_rate: 0.0005,
          batch_size: 64,
          optimizer: 'SGD',
          epochs: 10,
          data_augmentation: true,
        },
      },
    ];
    setHyperparams(example.filter(h => modelIds.includes(h.modelId)));
    setLoading(false);
  }, [modelIds]);

  // Collect all unique hyperparameter keys
  const allKeys = Array.from(
    new Set(hyperparams.flatMap(h => Object.keys(h.hyperparameters)))
  );

  // Helper to check if a value is different from the first model's value
  const isDifferent = (key: string, value: any) => {
    if (hyperparams.length === 0) return false;
    const first = hyperparams[0].hyperparameters[key];
    return hyperparams.some(h => h.hyperparameters[key] !== first);
  };

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Hyperparameter Comparison</h3>
      {loading ? (
        <div>Loading hyperparameters...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-300">
            <thead>
              <tr>
                <th className="border border-gray-300 bg-gray-100 p-1">Hyperparameter</th>
                {hyperparams.map(h => (
                  <th key={h.modelId} className="border border-gray-300 bg-gray-100 p-1">{h.modelName}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {allKeys.map(key => (
                <tr key={key}>
                  <td className="border border-gray-300 text-center p-1 font-medium">{key}</td>
                  {hyperparams.map(h => (
                    <td
                      key={h.modelId}
                      className="border border-gray-300 text-center p-1"
                      style={{
                        background: isDifferent(key, h.hyperparameters[key])
                          ? 'rgba(255, 193, 7, 0.2)'
                          : undefined,
                        fontWeight: isDifferent(key, h.hyperparameters[key]) ? 'bold' : undefined,
                      }}
                    >
                      {String(h.hyperparameters[key])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="text-xs text-muted-foreground mt-2">
            Differences are highlighted in yellow.
          </div>
        </div>
      )}
    </div>
  );
}