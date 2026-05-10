import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/layouts/AppLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// Import all model comparison components
import { TrainingCurvesOverlay } from '@/components/model-comparison/TrainingCurvesOverlay';
import { ConfusionMatrixComparison } from '@/components/model-comparison/ConfusionMatrixComparison';
import { PredictionAnalysis } from '@/components/model-comparison/PredictionAnalysis';
import { ModelEfficiencyTable } from '@/components/model-comparison/ModelEfficiencyTable';
import { HyperparameterComparisonTable } from '@/components/model-comparison/HyperparameterComparisonTable';
import { StatisticalTests } from '@/components/model-comparison/StatisticalTests';
import { ModelComparisonExport } from '@/components/model-comparison/ModelComparisonExport';
import { ModelRecommendation } from '@/components/model-comparison/ModelRecommendation';
import { ModelLineage } from '@/components/model-comparison/ModelLineage';

/**
 * ModelComparisonDashboard
 * - Compare multiple trained models side-by-side
 * - Includes model selection, metrics table, radar chart, and all advanced comparison features
 */
export default function ModelComparisonDashboard() {
  // List of all available models (fetched from backend)
  const [availableModels, setAvailableModels] = useState<any[]>([]);
  // IDs of selected models for comparison
  const [selectedModels, setSelectedModels] = useState<string[]>([]);

  // Fetch available models on mount (placeholder data)
  useEffect(() => {
    // TODO: Replace with real fetch from Supabase or API
    setAvailableModels([
      { id: 'model1', name: 'ResNet50 v1' },
      { id: 'model2', name: 'EfficientNet B0' },
      { id: 'model3', name: 'Custom CNN' },
    ]);
  }, []);

  // Handle selection change for models
  const handleModelSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const values = Array.from(e.target.selectedOptions, opt => opt.value);
    setSelectedModels(values);
  };

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto py-8 space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Model Comparison Dashboard</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              Select models to compare. This dashboard will show metrics, charts, and analysis for multiple models.
            </p>
            {/* Model Selection UI */}
            <div className="mb-4">
              <label className="font-medium">Select Models:</label>
              <select
                multiple
                className="block w-full mt-2 border rounded p-2"
                value={selectedModels}
                onChange={handleModelSelect}
                size={Math.min(availableModels.length, 5)}
              >
                {availableModels.map(model => (
                  <option key={model.id} value={model.id}>
                    {model.name}
                  </option>
                ))}
              </select>
              <div className="text-xs text-muted-foreground mt-1">
                Hold Ctrl (Windows) or Cmd (Mac) to select multiple models.
              </div>
            </div>
            <Button disabled={selectedModels.length < 2}>
              Compare {selectedModels.length > 0 ? `(${selectedModels.length})` : ''}
            </Button>
          </CardContent>
        </Card>

        {/* Render all comparison features if at least two models are selected */}
        {selectedModels.length > 1 && (
          <div className="space-y-6">
            {/* Training Curves Overlay */}
            <Card>
              <CardHeader>
                <CardTitle>Training Curves Overlay</CardTitle>
              </CardHeader>
              <CardContent>
                <TrainingCurvesOverlay modelIds={selectedModels} />
              </CardContent>
            </Card>

            {/* Confusion Matrix Comparison */}
            <Card>
              <CardHeader>
                <CardTitle>Confusion Matrix Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <ConfusionMatrixComparison modelIds={selectedModels} />
              </CardContent>
            </Card>

            {/* Prediction & Disagreement Analysis */}
            <Card>
              <CardHeader>
                <CardTitle>Prediction & Disagreement Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <PredictionAnalysis modelIds={selectedModels} />
              </CardContent>
            </Card>

            {/* Model Efficiency Table */}
            <Card>
              <CardHeader>
                <CardTitle>Computational Efficiency Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <ModelEfficiencyTable modelIds={selectedModels} />
              </CardContent>
            </Card>

            {/* Hyperparameter Comparison Table */}
            <Card>
              <CardHeader>
                <CardTitle>Hyperparameter Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <HyperparameterComparisonTable modelIds={selectedModels} />
              </CardContent>
            </Card>

            {/* Statistical Significance Testing */}
            <Card>
              <CardHeader>
                <CardTitle>Statistical Significance Testing</CardTitle>
              </CardHeader>
              <CardContent>
                <StatisticalTests modelIds={selectedModels} />
              </CardContent>
            </Card>

            {/* Model Lineage & Experiment Tracking */}
            <Card>
              <CardHeader>
                <CardTitle>Model Lineage & Experiment Tracking</CardTitle>
              </CardHeader>
              <CardContent>
                <ModelLineage modelIds={selectedModels} />
              </CardContent>
            </Card>

            {/* Model Selection Recommendation */}
            <Card>
              <CardHeader>
                <CardTitle>Model Selection Recommendation</CardTitle>
              </CardHeader>
              <CardContent>
                <ModelRecommendation modelIds={selectedModels} />
              </CardContent>
            </Card>

            {/* Export Functionality */}
            <Card>
              <CardHeader>
                <CardTitle>Export Comparison Report</CardTitle>
              </CardHeader>
              <CardContent>
                <ModelComparisonExport exportData={{ models: selectedModels }} disabled={selectedModels.length < 2} />
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AppLayout>
  );
}