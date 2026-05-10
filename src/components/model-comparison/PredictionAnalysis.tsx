import { useEffect, useState } from 'react';

/**
 * Props for PredictionAnalysis
 * @param modelIds - Array of selected model IDs to compare
 */
interface PredictionAnalysisProps {
  modelIds: string[];
}

/**
 * Example prediction data structure for demonstration.
 * In production, fetch real predictions from backend.
 */
interface PredictionSample {
  sampleId: string;
  trueLabel: string;
  [modelId: string]: string; // modelId: predicted label
}

/**
 * PredictionAnalysis
 * - Shows sample predictions from each model
 * - Highlights where models disagree
 * - Shows ensemble voting results
 */
export function PredictionAnalysis({ modelIds }: PredictionAnalysisProps) {
  const [samples, setSamples] = useState<PredictionSample[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch prediction samples for selected models
  useEffect(() => {
    setLoading(true);
    // TODO: Replace with real fetch from backend or Supabase
    // Example placeholder data
    const example: PredictionSample[] = [
      {
        sampleId: '1',
        trueLabel: 'Cat',
        model1: 'Cat',
        model2: 'Dog',
        model3: 'Cat',
      },
      {
        sampleId: '2',
        trueLabel: 'Dog',
        model1: 'Dog',
        model2: 'Dog',
        model3: 'Rabbit',
      },
      {
        sampleId: '3',
        trueLabel: 'Rabbit',
        model1: 'Rabbit',
        model2: 'Rabbit',
        model3: 'Rabbit',
      },
      {
        sampleId: '4',
        trueLabel: 'Cat',
        model1: 'Dog',
        model2: 'Cat',
        model3: 'Dog',
      },
    ];
    // Only include predictions for selected models
    setSamples(
      example.map(s => {
        const filtered: PredictionSample = {
          sampleId: s.sampleId,
          trueLabel: s.trueLabel,
        };
        modelIds.forEach(id => {
          filtered[id] = s[id];
        });
        return filtered;
      })
    );
    setLoading(false);
  }, [modelIds]);

  // Helper to compute ensemble voting result for a sample
  const getEnsembleVote = (sample: PredictionSample) => {
    const votes: Record<string, number> = {};
    modelIds.forEach(id => {
      const pred = sample[id];
      if (pred) votes[pred] = (votes[pred] || 0) + 1;
    });
    // Return the label with the most votes (majority vote)
    let max = 0;
    let winner = '';
    Object.entries(votes).forEach(([label, count]) => {
      if (count > max) {
        max = count;
        winner = label;
      }
    });
    return winner;
  };

  // Helper to check if models disagree on a sample
  const hasDisagreement = (sample: PredictionSample) => {
    const preds = modelIds.map(id => sample[id]);
    return new Set(preds).size > 1;
  };

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Prediction & Disagreement Analysis</h3>
      {loading ? (
        <div>Loading predictions...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-300">
            <thead>
              <tr>
                <th className="border border-gray-300 bg-gray-100 p-1">Sample</th>
                <th className="border border-gray-300 bg-gray-100 p-1">True Label</th>
                {modelIds.map(id => (
                  <th key={id} className="border border-gray-300 bg-gray-100 p-1">{id}</th>
                ))}
                <th className="border border-gray-300 bg-gray-100 p-1">Ensemble Vote</th>
              </tr>
            </thead>
            <tbody>
              {samples.map(sample => {
                const ensemble = getEnsembleVote(sample);
                const disagreement = hasDisagreement(sample);
                return (
                  <tr
                    key={sample.sampleId}
                    style={{
                      background: disagreement ? 'rgba(255, 193, 7, 0.15)' : undefined,
                    }}
                  >
                    <td className="border border-gray-300 text-center p-1">{sample.sampleId}</td>
                    <td className="border border-gray-300 text-center p-1">{sample.trueLabel}</td>
                    {modelIds.map(id => (
                      <td
                        key={id}
                        className="border border-gray-300 text-center p-1"
                        style={{
                          color:
                            sample[id] === sample.trueLabel
                              ? 'green'
                              : sample[id] === ensemble
                                ? 'blue'
                                : 'red',
                          fontWeight:
                            sample[id] === ensemble ? 'bold' : undefined,
                        }}
                      >
                        {sample[id]}
                      </td>
                    ))}
                    <td
                      className="border border-gray-300 text-center p-1"
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
          <div className="text-xs text-muted-foreground mt-2">
            Rows highlighted in yellow indicate model disagreement. Green = correct, red = incorrect, blue = ensemble vote.
          </div>
        </div>
      )}
    </div>
  );
}