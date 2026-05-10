import { useEffect, useState } from 'react';

/**
 * Props for ModelRecommendation
 * @param modelIds - Array of selected model IDs to compare
 */
interface ModelRecommendationProps {
  modelIds: string[];
}

/**
 * Example model summary data structure for demonstration.
 * In production, fetch real summary/metrics from backend.
 */
interface ModelSummary {
  modelId: string;
  modelName: string;
  accuracy: number;
  inferenceTime: number; // ms
  modelSizeMB: number;
  notes?: string;
}

/**
 * ModelRecommendation
 * - Provides recommendations for model selection based on accuracy, speed, size, and use case
 * - Explains tradeoffs and suggests best fit for deployment constraints
 */
export function ModelRecommendation({ modelIds }: ModelRecommendationProps) {
  const [summaries, setSummaries] = useState<ModelSummary[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch model summaries for selected models
  useEffect(() => {
    setLoading(true);
    // TODO: Replace with real fetch from backend or Supabase
    const example: ModelSummary[] = [
      {
        modelId: 'model1',
        modelName: 'ResNet50 v1',
        accuracy: 0.91,
        inferenceTime: 25,
        modelSizeMB: 98,
        notes: 'High accuracy, slower inference, large size.',
      },
      {
        modelId: 'model2',
        modelName: 'EfficientNet B0',
        accuracy: 0.89,
        inferenceTime: 15,
        modelSizeMB: 29,
        notes: 'Good balance of accuracy and speed.',
      },
      {
        modelId: 'model3',
        modelName: 'Custom CNN',
        accuracy: 0.85,
        inferenceTime: 10,
        modelSizeMB: 12,
        notes: 'Fastest and smallest, but lower accuracy.',
      },
    ];
    setSummaries(example.filter(s => modelIds.includes(s.modelId)));
    setLoading(false);
  }, [modelIds]);

  // Simple recommendation logic: prioritize accuracy, then speed, then size
  const getRecommendation = () => {
    if (summaries.length === 0) return null;
    // Find highest accuracy
    const bestAccuracy = Math.max(...summaries.map(s => s.accuracy));
    const bestAccModels = summaries.filter(s => s.accuracy === bestAccuracy);

    // If tie, pick fastest
    const minInference = Math.min(...bestAccModels.map(s => s.inferenceTime));
    const bestModel = bestAccModels.find(s => s.inferenceTime === minInference) || bestAccModels[0];

    // Also suggest smallest for edge/mobile
    const minSize = Math.min(...summaries.map(s => s.modelSizeMB));
    const smallestModel = summaries.find(s => s.modelSizeMB === minSize);

    return { bestModel, smallestModel };
  };

  const recommendation = getRecommendation();

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Model Selection Recommendation</h3>
      {loading ? (
        <div>Analyzing models...</div>
      ) : summaries.length === 0 ? (
        <div>No models selected for recommendation.</div>
      ) : (
        <div className="space-y-3">
          <div>
            <strong>Best Overall:</strong>{' '}
            <span className="font-medium">{recommendation?.bestModel.modelName}</span>
            {' '}({(recommendation?.bestModel.accuracy * 100).toFixed(1)}% accuracy, {recommendation?.bestModel.inferenceTime} ms inference, {recommendation?.bestModel.modelSizeMB} MB)
            <br />
            <span className="text-xs text-muted-foreground">{recommendation?.bestModel.notes}</span>
          </div>
          {recommendation?.smallestModel &&
            recommendation.smallestModel.modelId !== recommendation.bestModel.modelId && (
              <div>
                <strong>Best for Edge/Mobile:</strong>{' '}
                <span className="font-medium">{recommendation.smallestModel.modelName}</span>
                {' '}({(recommendation.smallestModel.accuracy * 100).toFixed(1)}% accuracy, {recommendation.smallestModel.inferenceTime} ms inference, {recommendation.smallestModel.modelSizeMB} MB)
                <br />
                <span className="text-xs text-muted-foreground">{recommendation.smallestModel.notes}</span>
              </div>
            )}
          <div className="text-xs text-muted-foreground mt-2">
            Recommendation considers accuracy, speed, and model size. Adjust for your deployment constraints and use case.
          </div>
        </div>
      )}
    </div>
  );
}