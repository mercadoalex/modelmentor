import { AppLayout } from '@/components/layouts/AppLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw, WifiOff, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

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
import { ComparisonErrorBoundary } from '@/components/model-comparison/ComparisonErrorBoundary';

// Import the comparison dashboard hook
import { useComparisonDashboard } from '@/hooks/useComparisonDashboard';

/**
 * Empty state component when no models are available
 */
function EmptyModelsState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="rounded-full bg-gray-100 p-4 mb-4">
        <Plus className="h-8 w-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold mb-2">No Trained Models Available</h3>
      <p className="text-muted-foreground mb-4 max-w-md">
        You don't have any trained models yet. Train a model first to start comparing performance across different versions.
      </p>
      <Link to="/training">
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Train a Model
        </Button>
      </Link>
    </div>
  );
}

/**
 * Connection error component when Supabase connection fails
 */
function ConnectionError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="rounded-full bg-red-100 p-4 mb-4">
        <WifiOff className="h-8 w-8 text-red-500" />
      </div>
      <h3 className="text-lg font-semibold mb-2 text-red-600">Connection Error</h3>
      <p className="text-muted-foreground mb-4 max-w-md">
        Unable to connect to the server. Please check your internet connection and try again.
      </p>
      <Button variant="outline" onClick={onRetry}>
        <RefreshCw className="h-4 w-4 mr-2" />
        Retry Connection
      </Button>
    </div>
  );
}

/**
 * Loading skeleton for model selection
 */
function ModelSelectionSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-6 w-32 bg-gray-200 rounded" />
      <div className="h-32 bg-gray-200 rounded" />
      <div className="h-10 w-32 bg-gray-200 rounded" />
    </div>
  );
}

/**
 * New data notification banner
 */
function NewDataNotification({ onRefresh, onDismiss }: { onRefresh: () => void; onDismiss: () => void }) {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <AlertCircle className="h-5 w-5 text-blue-500" />
        <span className="text-blue-700">New model data is available.</span>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={onDismiss}>
          Dismiss
        </Button>
        <Button size="sm" onClick={onRefresh}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>
    </div>
  );
}

/**
 * ModelComparisonDashboard
 * - Compare multiple trained models side-by-side
 * - Includes model selection, metrics table, radar chart, and all advanced comparison features
 * - Fetches real data from Supabase via ComparisonService
 */
export default function ModelComparisonDashboard() {
  // Use the comparison dashboard hook for state management
  const {
    // Model selection
    availableModels,
    selectedModelIds,
    isComparing,
    
    // Loading states
    loadingStates,
    
    // Error states
    errorStates,
    
    // Data
    trainingCurves,
    confusionMatrices,
    predictions,
    efficiency,
    hyperparameters,
    statisticalTests,
    lineage,
    
    // Realtime
    hasNewModelData,
    
    // Actions
    selectModels,
    startComparison,
    stopComparison,
    refreshModels,
    retryComponent,
    changePredictionPage,
    dismissNewDataNotification,
  } = useComparisonDashboard({ autoFetchModels: true, enableRealtime: true });

  // Handle selection change for models
  const handleModelSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const values = Array.from(e.target.selectedOptions, opt => opt.value);
    selectModels(values);
    // Reset comparison when selection changes
    if (isComparing) {
      stopComparison();
    }
  };

  // Handle compare button click
  const handleCompare = async () => {
    if (selectedModelIds.length >= 2) {
      await startComparison();
    }
  };

  // Check for connection error (models error with NETWORK_ERROR code)
  const hasConnectionError = errorStates.models?.code === 'NETWORK_ERROR';

  // Build accuracy data for ModelRecommendation from available models
  const accuracyData = availableModels
    .filter(m => m.accuracy !== null && selectedModelIds.includes(m.id))
    .map(m => ({
      modelId: m.id,
      accuracy: m.accuracy!,
    }));

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto py-8 space-y-8">
        {/* New data notification */}
        {hasNewModelData && (
          <NewDataNotification 
            onRefresh={refreshModels} 
            onDismiss={dismissNewDataNotification} 
          />
        )}

        <Card>
          <CardHeader>
            <CardTitle>Model Comparison Dashboard</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Connection error state */}
            {hasConnectionError && (
              <ConnectionError onRetry={() => retryComponent('models')} />
            )}

            {/* Loading state for models */}
            {loadingStates.models && !hasConnectionError && (
              <ModelSelectionSkeleton />
            )}

            {/* Empty state when no models available */}
            {!loadingStates.models && !hasConnectionError && availableModels.length === 0 && (
              <EmptyModelsState />
            )}

            {/* Model selection UI - only show when models are available */}
            {!loadingStates.models && !hasConnectionError && availableModels.length > 0 && (
              <>
                <p className="mb-4">
                  Select models to compare. This dashboard will show metrics, charts, and analysis for multiple models.
                </p>
                
                {/* Model Selection UI */}
                <div className="mb-4">
                  <label className="font-medium">Select Models:</label>
                  <select
                    multiple
                    className="block w-full mt-2 border rounded p-2"
                    value={selectedModelIds}
                    onChange={handleModelSelect}
                    size={Math.min(availableModels.length, 5)}
                  >
                    {availableModels.map(model => (
                      <option key={model.id} value={model.id}>
                        {model.projectTitle} - {model.versionName || `v${model.versionNumber}`} 
                        {model.accuracy !== null ? ` (${(model.accuracy * 100).toFixed(1)}%)` : ''} 
                        - {new Date(model.createdAt).toLocaleDateString()}
                      </option>
                    ))}
                  </select>
                  <div className="text-xs text-muted-foreground mt-1">
                    Hold Ctrl (Windows) or Cmd (Mac) to select multiple models. Select 2-10 models for comparison.
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <Button 
                    disabled={selectedModelIds.length < 2 || selectedModelIds.length > 10} 
                    onClick={handleCompare}
                  >
                    Compare {selectedModelIds.length > 0 ? `(${selectedModelIds.length})` : ''}
                  </Button>
                  
                  {selectedModelIds.length < 2 && selectedModelIds.length > 0 && (
                    <span className="text-sm text-muted-foreground">
                      Select at least 2 models to compare
                    </span>
                  )}
                  
                  {selectedModelIds.length > 10 && (
                    <span className="text-sm text-red-500">
                      Maximum 10 models can be compared at once
                    </span>
                  )}

                  <Button variant="outline" onClick={refreshModels}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh Models
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Render all comparison features if comparing and at least two models are selected */}
        {isComparing && selectedModelIds.length > 1 && (
          <div className="space-y-6">
            {/* Training Curves Overlay */}
            <Card>
              <CardHeader>
                <CardTitle>Training Curves Overlay</CardTitle>
              </CardHeader>
              <CardContent>
                <ComparisonErrorBoundary 
                  componentName="Training Curves" 
                  onRetry={() => retryComponent('trainingCurves')}
                >
                  <TrainingCurvesOverlay 
                    modelIds={selectedModelIds}
                    data={trainingCurves}
                    loading={loadingStates.trainingCurves}
                    error={errorStates.trainingCurves}
                    onRetry={() => retryComponent('trainingCurves')}
                  />
                </ComparisonErrorBoundary>
              </CardContent>
            </Card>

            {/* Confusion Matrix Comparison */}
            <Card>
              <CardHeader>
                <CardTitle>Confusion Matrix Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <ComparisonErrorBoundary 
                  componentName="Confusion Matrix" 
                  onRetry={() => retryComponent('confusionMatrices')}
                >
                  <ConfusionMatrixComparison 
                    modelIds={selectedModelIds}
                    data={confusionMatrices}
                    loading={loadingStates.confusionMatrices}
                    error={errorStates.confusionMatrices}
                    onRetry={() => retryComponent('confusionMatrices')}
                  />
                </ComparisonErrorBoundary>
              </CardContent>
            </Card>

            {/* Prediction & Disagreement Analysis */}
            <Card>
              <CardHeader>
                <CardTitle>Prediction & Disagreement Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <ComparisonErrorBoundary 
                  componentName="Prediction Analysis" 
                  onRetry={() => retryComponent('predictions')}
                >
                  <PredictionAnalysis 
                    modelIds={selectedModelIds}
                    data={predictions}
                    loading={loadingStates.predictions}
                    error={errorStates.predictions}
                    onRetry={() => retryComponent('predictions')}
                    onPageChange={changePredictionPage}
                  />
                </ComparisonErrorBoundary>
              </CardContent>
            </Card>

            {/* Model Efficiency Table */}
            <Card>
              <CardHeader>
                <CardTitle>Computational Efficiency Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <ComparisonErrorBoundary 
                  componentName="Efficiency Metrics" 
                  onRetry={() => retryComponent('efficiency')}
                >
                  <ModelEfficiencyTable 
                    modelIds={selectedModelIds}
                    data={efficiency}
                    loading={loadingStates.efficiency}
                    error={errorStates.efficiency}
                    onRetry={() => retryComponent('efficiency')}
                  />
                </ComparisonErrorBoundary>
              </CardContent>
            </Card>

            {/* Hyperparameter Comparison Table */}
            <Card>
              <CardHeader>
                <CardTitle>Hyperparameter Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <ComparisonErrorBoundary 
                  componentName="Hyperparameter Comparison" 
                  onRetry={() => retryComponent('hyperparameters')}
                >
                  <HyperparameterComparisonTable 
                    modelIds={selectedModelIds}
                    data={hyperparameters}
                    loading={loadingStates.hyperparameters}
                    error={errorStates.hyperparameters}
                    onRetry={() => retryComponent('hyperparameters')}
                  />
                </ComparisonErrorBoundary>
              </CardContent>
            </Card>

            {/* Statistical Significance Testing */}
            <Card>
              <CardHeader>
                <CardTitle>Statistical Significance Testing</CardTitle>
              </CardHeader>
              <CardContent>
                <ComparisonErrorBoundary 
                  componentName="Statistical Tests" 
                  onRetry={() => retryComponent('statisticalTests')}
                >
                  <StatisticalTests 
                    modelIds={selectedModelIds}
                    results={statisticalTests}
                    loading={loadingStates.statisticalTests}
                    error={errorStates.statisticalTests}
                    onRetry={() => retryComponent('statisticalTests')}
                  />
                </ComparisonErrorBoundary>
              </CardContent>
            </Card>

            {/* Model Lineage & Experiment Tracking */}
            <Card>
              <CardHeader>
                <CardTitle>Model Lineage & Experiment Tracking</CardTitle>
              </CardHeader>
              <CardContent>
                <ComparisonErrorBoundary 
                  componentName="Model Lineage" 
                  onRetry={() => retryComponent('lineage')}
                >
                  <ModelLineage 
                    modelIds={selectedModelIds}
                    data={lineage}
                    loading={loadingStates.lineage}
                    error={errorStates.lineage}
                    onRetry={() => retryComponent('lineage')}
                  />
                </ComparisonErrorBoundary>
              </CardContent>
            </Card>

            {/* Model Selection Recommendation */}
            <Card>
              <CardHeader>
                <CardTitle>Model Selection Recommendation</CardTitle>
              </CardHeader>
              <CardContent>
                <ComparisonErrorBoundary 
                  componentName="Model Recommendation" 
                  onRetry={() => retryComponent('efficiency')}
                >
                  <ModelRecommendation 
                    modelIds={selectedModelIds}
                    efficiencyData={efficiency}
                    accuracyData={accuracyData}
                    loading={loadingStates.efficiency}
                  />
                </ComparisonErrorBoundary>
              </CardContent>
            </Card>

            {/* Export Functionality */}
            <Card>
              <CardHeader>
                <CardTitle>Export Comparison Report</CardTitle>
              </CardHeader>
              <CardContent>
                <ComparisonErrorBoundary componentName="Export">
                  <ModelComparisonExport 
                    modelIds={selectedModelIds} 
                    disabled={selectedModelIds.length < 2} 
                  />
                </ComparisonErrorBoundary>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
